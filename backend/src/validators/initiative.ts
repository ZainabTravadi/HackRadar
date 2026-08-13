import { sql } from 'drizzle-orm';

export type RawApplication = Record<string, any>;

export type CleanApplication = {
  name: string;
  email: string;
  githubUsername?: string | null;
  linkedinUrl?: string | null;
  websiteUrl?: string | null;
  interests: string[];
  contributionAreas: string[];
  experienceLevel?: string | null;
  availability?: string | null;
  contributionTypes: string[];
  motivation?: string | null;
};

const allowedAreas = ['engineering','frontend','backend','crawler','data','design','documentation','testing','accessibility','community','outreach','translation','partnerships','other'];
const allowedExperience = ['Beginner','Intermediate','Advanced','Professional','beginner','intermediate','advanced','professional',''];
const allowedAvailability = ['1-3 hours/week','3-5 hours/week','5-10 hours/week','10+ hours/week','Flexible / varies',''];

export function validateApplicationPayload(body: RawApplication): CleanApplication {
  if (!body || typeof body !== 'object') throw new Error('Invalid payload');
  if ('status' in body) throw new Error('Client may not set status');

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name || name.length < 2) throw new Error('Name is required');
  if (name.length > 200) throw new Error('Name too long');

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) throw new Error('Valid email is required');

  const githubUsername = body.githubUsername ? String(body.githubUsername).trim() : null;
  if (githubUsername && githubUsername.length > 39) throw new Error('GitHub username too long');

  const linkedinUrl = body.linkedinUrl ? String(body.linkedinUrl).trim() : null;
  const websiteUrl = body.websiteUrl ? String(body.websiteUrl).trim() : null;
  const urlOk = (u: string | null | undefined) => {
    if (!u) return true;
    if (typeof u !== 'string') return false;
    return /^https?:\/\//i.test(u) && u.length <= 2000;
  };
  if (!urlOk(linkedinUrl) || !urlOk(websiteUrl)) throw new Error('Invalid URL');

  const interests = Array.isArray(body.interests) ? body.interests.map(String).slice(0, 20) : [];

  const contributionAreas = Array.isArray(body.contributionAreas) ? body.contributionAreas.map(String) : [];
  if (contributionAreas.length === 0) throw new Error('At least one contribution area is required');
  if (contributionAreas.length > 10) throw new Error('Too many contribution areas');
  for (const a of contributionAreas) if (!allowedAreas.includes(a)) throw new Error('Invalid contribution area');

  const experienceLevel = body.experienceLevel ? String(body.experienceLevel) : null;
  if (experienceLevel && !allowedExperience.includes(experienceLevel)) throw new Error('Invalid experience level');

  const availability = body.availability ? String(body.availability) : null;
  if (availability && !allowedAvailability.includes(availability)) throw new Error('Invalid availability');

  const contributionTypes = Array.isArray(body.contributionTypes) ? body.contributionTypes.map(String).slice(0, 20) : [];

  const motivation = body.motivation ? String(body.motivation).trim() : null;
  if (motivation && motivation.length > 2000) throw new Error('Motivation too long');

  return {
    name,
    email,
    githubUsername,
    linkedinUrl,
    websiteUrl,
    interests,
    contributionAreas,
    experienceLevel,
    availability,
    contributionTypes,
    motivation,
  };
}

// Simple process-local rate limiter utilities for testing and server use
const SUBMISSION_MAP_KEY = '__submission_map';

export function checkAndRecordSubmission(ip: string, now = Date.now(), windowMs = 60 * 60 * 1000, maxPerWindow = 5) {
  const glob = global as any;
  if (!glob[SUBMISSION_MAP_KEY]) glob[SUBMISSION_MAP_KEY] = new Map<string, number[]>();
  const map: Map<string, number[]> = glob[SUBMISSION_MAP_KEY];
  const times = map.get(ip) ?? [];
  const recent = times.filter((t) => now - t < windowMs);
  if (recent.length >= maxPerWindow) {
    throw new Error('Too many requests');
  }
  recent.push(now);
  map.set(ip, recent);
}

export function resetSubmissionMap() {
  const glob = global as any;
  glob[SUBMISSION_MAP_KEY] = new Map<string, number[]>();
}
