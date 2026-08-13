import crypto from 'node:crypto';
import net from 'node:net';
import tls from 'node:tls';
import { once } from 'node:events';

import { getOptionalEnv, getRequiredEnv } from '../config/env';

type MailPayload = {
  from: string;
  to?: string;
  subject: string;
  text: string;
  replyTo?: string;
};

type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  to: string;
  secure: boolean;
  requireTls: boolean;
  timeoutMs: number;
};

type SmtpResponse = {
  code: number;
  lines: string[];
};

function parseBooleanEnv(value: string | undefined, fallback: boolean): boolean {
  if (value == null) {
    return fallback;
  }

  return !['false', '0', 'no'].includes(value.trim().toLowerCase());
}

function parsePort(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getSmtpConfig(): SmtpConfig {
  const host = getRequiredEnv('SMTP_HOST');
  const port = parsePort(getOptionalEnv('SMTP_PORT'), 465);
  const user = getRequiredEnv('SMTP_USER');
  const pass = getRequiredEnv('SMTP_PASS');
  const from = getOptionalEnv('SMTP_FROM') ?? user;
  const to = getOptionalEnv('RECEIVE_EMAIL')
    ?? getOptionalEnv('SMTP_TO')
    ?? getOptionalEnv('INITIATIVE_APPLICATION_TO')
    ?? getOptionalEnv('NOTIFICATION_EMAIL')
    ?? user;

  return {
    host,
    port,
    user,
    pass,
    from,
    to,
    secure: parseBooleanEnv(getOptionalEnv('SMTP_SECURE'), port === 465),
    requireTls: parseBooleanEnv(getOptionalEnv('SMTP_REQUIRE_TLS'), true),
    timeoutMs: parsePort(getOptionalEnv('SMTP_TIMEOUT_MS'), 15_000),
  };
}

function encodeMimeWord(value: string): string {
  return `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`;
}

function wrapBase64(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64').replace(/.{1,76}/g, '$&\r\n').trimEnd();
}

function escapeBodyLine(line: string): string {
  return line.startsWith('.') ? `.${line}` : line;
}

async function readResponse(socket: net.Socket | tls.TLSSocket, timeoutMs: number): Promise<SmtpResponse> {
  return new Promise((resolve, reject) => {
    let buffer = '';
    const lines: string[] = [];
    let code: number | null = null;
    let settled = false;

    const cleanup = () => {
      if (settled) {
        return;
      }
      settled = true;
      socket.off('data', onData);
      socket.off('error', onError);
      socket.off('timeout', onTimeout);
    };

    const finish = (response: SmtpResponse) => {
      cleanup();
      resolve(response);
    };

    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };

    const onTimeout = () => {
      cleanup();
      reject(new Error('SMTP request timed out.'));
    };

    const onData = (chunk: Buffer) => {
      buffer += chunk.toString('utf8');

      while (true) {
        const newlineIndex = buffer.indexOf('\n');
        if (newlineIndex === -1) {
          break;
        }

        const line = buffer.slice(0, newlineIndex).replace(/\r$/, '');
        buffer = buffer.slice(newlineIndex + 1);
        if (!line) {
          continue;
        }

        const match = line.match(/^(\d{3})([- ])(.*)$/);
        if (!match) {
          continue;
        }

        code = Number(match[1]);
        lines.push(match[3]);

        if (match[2] === ' ') {
          finish({ code, lines: [...lines] });
          return;
        }
      }
    };

    socket.on('data', onData);
    socket.once('error', onError);
    socket.once('timeout', onTimeout);
    socket.setTimeout(timeoutMs);
  });
}

async function sendCommand(
  socket: net.Socket | tls.TLSSocket,
  command: string,
  expectedCodes: number | number[],
  timeoutMs: number,
): Promise<SmtpResponse> {
  socket.write(`${command}\r\n`);
  const response = await readResponse(socket, timeoutMs);
  const acceptedCodes = Array.isArray(expectedCodes) ? expectedCodes : [expectedCodes];

  if (!acceptedCodes.includes(response.code)) {
    throw new Error(`SMTP command failed (${response.code}): ${response.lines.join(' ')}`);
  }

  return response;
}

async function openConnection(config: SmtpConfig): Promise<net.Socket | tls.TLSSocket> {
  if (config.secure) {
    const socket = tls.connect({
      host: config.host,
      port: config.port,
      servername: config.host,
      rejectUnauthorized: true,
    });

    await Promise.race([
      once(socket, 'secureConnect'),
      once(socket, 'error').then(([error]) => Promise.reject(error)),
    ]);

    return socket;
  }

  const socket = net.connect({
    host: config.host,
    port: config.port,
  });

  await Promise.race([
    once(socket, 'connect'),
    once(socket, 'error').then(([error]) => Promise.reject(error)),
  ]);

  return socket;
}

async function upgradeToTls(socket: net.Socket, config: SmtpConfig): Promise<tls.TLSSocket> {
  const secureSocket = tls.connect({
    socket,
    servername: config.host,
    rejectUnauthorized: true,
  });

  await Promise.race([
    once(secureSocket, 'secureConnect'),
    once(secureSocket, 'error').then(([error]) => Promise.reject(error)),
  ]);

  return secureSocket;
}

export async function sendSmtpMail(payload: MailPayload): Promise<void> {
  const config = getSmtpConfig();
  let socket: net.Socket | tls.TLSSocket | null = null;

  try {
    socket = await openConnection(config);
    const greeting = await readResponse(socket, config.timeoutMs);
    if (greeting.code !== 220) {
      throw new Error(`SMTP server rejected connection: ${greeting.lines.join(' ')}`);
    }

    const ehloName = process.env.HOSTNAME || 'localhost';
    const ehlo = await sendCommand(socket, `EHLO ${ehloName}`, 250, config.timeoutMs);
    const supportsStartTls = ehlo.lines.some((line) => /STARTTLS/i.test(line));

    if (!config.secure) {
      if (!supportsStartTls) {
        if (config.requireTls) {
          throw new Error('SMTP server does not advertise STARTTLS.');
        }
      } else {
        await sendCommand(socket, 'STARTTLS', 220, config.timeoutMs);
        socket = await upgradeToTls(socket as net.Socket, config);
        await sendCommand(socket, `EHLO ${ehloName}`, 250, config.timeoutMs);
      }
    }

    await sendCommand(socket, 'AUTH LOGIN', 334, config.timeoutMs);
    await sendCommand(socket, Buffer.from(config.user, 'utf8').toString('base64'), 334, config.timeoutMs);
    await sendCommand(socket, Buffer.from(config.pass, 'utf8').toString('base64'), 235, config.timeoutMs);
    const recipient = payload.to || config.to;

    await sendCommand(socket, `MAIL FROM:<${config.from}>`, 250, config.timeoutMs);
    await sendCommand(socket, `RCPT TO:<${recipient}>`, [250, 251], config.timeoutMs);
    await sendCommand(socket, 'DATA', 354, config.timeoutMs);

    const headers = [
      `From: HackRadar <${config.from}>`,
      `To: ${recipient}`,
      `X-Applicant-Email: ${payload.from}`,
      `Subject: ${encodeMimeWord(payload.subject)}`,
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: <${crypto.randomUUID()}@hackradar>`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=utf-8',
      'Content-Transfer-Encoding: base64',
    ];

    if (payload.replyTo) {
      headers.push(`Reply-To: ${payload.replyTo}`);
    }

    const body = wrapBase64(
      payload.text
        .split('\n')
        .map((line) => escapeBodyLine(line))
        .join('\n'),
    );

    socket.write(`${headers.join('\r\n')}\r\n\r\n${body}\r\n.\r\n`);
    const finalResponse = await readResponse(socket, config.timeoutMs);

    if (finalResponse.code !== 250) {
      throw new Error(`SMTP message was rejected: ${finalResponse.lines.join(' ')}`);
    }

    await sendCommand(socket, 'QUIT', 221, config.timeoutMs);
  } finally {
    socket?.destroy();
  }
}
