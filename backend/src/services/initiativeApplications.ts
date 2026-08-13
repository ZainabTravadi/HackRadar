import { db } from '../db';
import { initiativeApplications, type InitiativeApplication, type NewInitiativeApplication } from '../db/schema';
import { checkAndRecordSubmission, validateApplicationPayload } from '../validators/initiative';
import { sendSmtpMail } from './smtp';

export class InitiativeSubmissionError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'InitiativeSubmissionError';
    this.statusCode = statusCode;
  }
}

export type InitiativeSubmissionResult = {
  application: InitiativeApplication;
  emailSent: boolean;
};

type InitiativeSubmissionDeps = {
  insertApplication: (values: NewInitiativeApplication) => Promise<InitiativeApplication>;
  sendNotification: (application: InitiativeApplication) => Promise<void>;
};

function formatField(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : 'Not provided';
}

function formatList(values: string[] | null | undefined): string {
  if (!values || values.length === 0) {
    return 'Not provided';
  }

  return values.join(', ');
}

export function buildInitiativeApplicationEmail(application: InitiativeApplication): { subject: string; text: string } {
  const submittedAt = application.createdAt ?? new Date();
  const subject = `New HackRadar initiative application from ${application.name}`;
  const text = [
    'A new HackRadar initiative application was submitted.',
    '',
    `Application ID: ${application.id}`,
    `Submitted at: ${submittedAt.toISOString()}`,
    '',
    `Name: ${application.name}`,
    `Email: ${application.email}`,
    `GitHub username: ${formatField(application.githubUsername)}`,
    `LinkedIn URL: ${formatField(application.linkedinUrl)}`,
    `Website URL: ${formatField(application.websiteUrl)}`,
    `Contribution areas: ${formatList(application.contributionAreas)}`,
    `Interests: ${formatList(application.interests)}`,
    `Experience level: ${formatField(application.experienceLevel)}`,
    `Availability: ${formatField(application.availability)}`,
    `Contribution types: ${formatList(application.contributionTypes)}`,
    '',
    'Motivation:',
    application.motivation?.trim() ? application.motivation.trim() : 'Not provided',
    '',
    'This message was generated automatically by HackRadar.',
  ].join('\n');

  return { subject, text };
}

function buildApplicationInsertValues(clean: ReturnType<typeof validateApplicationPayload>): NewInitiativeApplication {
  return {
    name: clean.name,
    email: clean.email,
    githubUsername: clean.githubUsername ?? null,
    linkedinUrl: clean.linkedinUrl ?? null,
    websiteUrl: clean.websiteUrl ?? null,
    interests: clean.interests,
    contributionAreas: clean.contributionAreas,
    experienceLevel: clean.experienceLevel ?? null,
    availability: clean.availability ?? null,
    contributionTypes: clean.contributionTypes,
    motivation: clean.motivation ?? null,
    status: 'pending',
  };
}

async function submitWithDeps(
  body: unknown,
  ip: string,
  deps: InitiativeSubmissionDeps,
): Promise<InitiativeSubmissionResult> {
  try {
    checkAndRecordSubmission(ip);
  } catch {
    throw new InitiativeSubmissionError('Too many requests', 429);
  }

  let clean;
  try {
    clean = validateApplicationPayload(body as Record<string, unknown>);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid submission';
    throw new InitiativeSubmissionError(message, 400);
  }

  const application = await deps.insertApplication(buildApplicationInsertValues(clean));

  let emailSent = false;
  try {
    await deps.sendNotification(application);
    emailSent = true;
  } catch (error) {
    console.error('[Initiative] Notification email failed:', error);
  }

  return { application, emailSent };
}

export async function submitInitiativeApplication(body: unknown, ip: string): Promise<InitiativeSubmissionResult> {
  return submitWithDeps(body, ip, {
    insertApplication: async (values) => {
      const [application] = await db.insert(initiativeApplications).values(values).returning();
      return application;
    },
    sendNotification: async (application) => {
      const { subject, text } = buildInitiativeApplicationEmail(application);
      await sendSmtpMail({
        from: application.email,
        subject,
        text,
        replyTo: application.email,
      });
    },
  });
}

export async function submitInitiativeApplicationForTest(
  body: unknown,
  ip: string,
  deps: InitiativeSubmissionDeps,
): Promise<InitiativeSubmissionResult> {
  return submitWithDeps(body, ip, deps);
}
