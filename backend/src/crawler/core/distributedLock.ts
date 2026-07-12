import { db } from '../../db';
import { distributedLock } from '../../db/schema';
import { eq, and, lt, gte } from 'drizzle-orm';
import crypto from 'crypto';

export interface LockResult {
  acquired: boolean;
  lockId?: string;
  expiresAt?: Date;
  error?: string;
}

export class DistributedLockService {
  private readonly ownerId: string;
  private readonly defaultTtlMs: number;

  constructor(ownerId?: string, defaultTtlMs = 300000) {
    this.ownerId = ownerId || `crawler-${process.env.HOSTNAME || 'local'}-${process.pid}-${crypto.randomUUID().slice(0, 8)}`;
    this.defaultTtlMs = defaultTtlMs;
  }

  async acquire(lockKey: string, lockType: 'scheduler' | 'crawl' = 'scheduler', ttlMs?: number): Promise<LockResult> {
    const expiresAt = new Date(Date.now() + (ttlMs || this.defaultTtlMs));
    const lockId = crypto.randomUUID();

    try {
      await db.insert(distributedLock).values({
        id: lockId,
        lockType,
        lockKey,
        ownerId: this.ownerId,
        expiresAt,
        metadata: JSON.stringify({ acquiredAt: new Date().toISOString(), pid: process.pid }),
      });

      return { acquired: true, lockId, expiresAt };
    } catch (error: any) {
      if (error.code === '23505') {
        const existing = await db.select().from(distributedLock).where(and(
          eq(distributedLock.lockType, lockType),
          eq(distributedLock.lockKey, lockKey)
        )).limit(1);

        if (existing.length > 0) {
          const lock = existing[0];
          if (lock.expiresAt < new Date()) {
            await this.forceRelease(lockKey, lockType);
            return this.acquire(lockKey, lockType, ttlMs);
          }
          return {
            acquired: false,
            error: `Lock held by ${lock.ownerId} until ${lock.expiresAt.toISOString()}`,
          };
        }
        return { acquired: false, error: 'Lock conflict' };
      }
      return { acquired: false, error: error.message };
    }
  }

  async release(lockKey: string, lockType: 'scheduler' | 'crawl' = 'scheduler', lockId?: string): Promise<boolean> {
    try {
      const conditions = [
        eq(distributedLock.lockType, lockType),
        eq(distributedLock.lockKey, lockKey),
        eq(distributedLock.ownerId, this.ownerId),
      ];
      if (lockId) conditions.push(eq(distributedLock.id, lockId));

      const result = await db.delete(distributedLock).where(and(...conditions));
      return (result.rowCount ?? 0) > 0;
    } catch {
      return false;
    }
  }

  async forceRelease(lockKey: string, lockType: 'scheduler' | 'crawl' = 'scheduler'): Promise<boolean> {
    try {
      const result = await db.delete(distributedLock).where(and(
        eq(distributedLock.lockType, lockType),
        eq(distributedLock.lockKey, lockKey)
      ));
      return (result.rowCount ?? 0) > 0;
    } catch {
      return false;
    }
  }

  async extend(lockKey: string, lockType: 'scheduler' | 'crawl' = 'scheduler', additionalTtlMs?: number): Promise<boolean> {
    try {
      const newExpiresAt = new Date(Date.now() + (additionalTtlMs || this.defaultTtlMs));
      const result = await db.update(distributedLock)
        .set({ expiresAt: newExpiresAt })
        .where(and(
          eq(distributedLock.lockType, lockType),
          eq(distributedLock.lockKey, lockKey),
          eq(distributedLock.ownerId, this.ownerId)
        ));
      return (result.rowCount ?? 0) > 0;
    } catch {
      return false;
    }
  }

  async isLocked(lockKey: string, lockType: 'scheduler' | 'crawl' = 'scheduler'): Promise<{ locked: boolean; ownerId?: string; expiresAt?: Date }> {
    const result = await db.select().from(distributedLock).where(and(
      eq(distributedLock.lockType, lockType),
      eq(distributedLock.lockKey, lockKey),
      gte(distributedLock.expiresAt, new Date())
    )).limit(1);

    if (result.length === 0) return { locked: false };
    return { locked: true, ownerId: result[0].ownerId, expiresAt: result[0].expiresAt };
  }

  async cleanupExpired(): Promise<number> {
    try {
      const result = await db.delete(distributedLock).where(lt(distributedLock.expiresAt, new Date()));
      return result.rowCount ?? 0;
    } catch {
      return 0;
    }
  }

  getOwnerId(): string {
    return this.ownerId;
  }
}

export const distributedLockService = new DistributedLockService();