
import { Redis } from 'ioredis';
import { REDIS_KEYS, SESSION_TTL, MAX_CONTEXT_TURNS } from '@voiceai/shared';
import type { SessionState, SupportedLanguage } from '@voiceai/shared';

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
    redis.on('error', (err: Error) => console.error('redis Error:', err.message));
    redis.on('connect', () => console.log('redis Connected'));
  }
  return redis;
}

export async function connectRedis(): Promise<void> {
  const r = getRedis();
  if (r.status !== 'ready') {
    await r.connect();
  }
}


export async function createSession(sessionId: string, opts?: {
  patientId?: string;
  patientName?: string;
  language?: SupportedLanguage;
  isCampaign?: boolean;
  campaignId?: string;
  campaignType?: string;
}): Promise<SessionState> {
  const state: SessionState = {
    sessionId,
    patientId: opts?.patientId,
    patientName: opts?.patientName,
    language: opts?.language || 'en',
    conversationState: 'idle',
    isCampaign: opts?.isCampaign || false,
    campaignId: opts?.campaignId,
    campaignType: opts?.campaignType,
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
  };

  const r = getRedis();
  await r.set(REDIS_KEYS.sessionState(sessionId), JSON.stringify(state), 'EX', SESSION_TTL);
  return state;
}

export async function getSessionState(sessionId: string): Promise<SessionState | null> {
  const r = getRedis();
  const data = await r.get(REDIS_KEYS.sessionState(sessionId));
  if (!data) return null;
  return JSON.parse(data) as SessionState;
}

export async function updateSessionState(
  sessionId: string,
  updates: Partial<SessionState>
): Promise<SessionState | null> {
  const state = await getSessionState(sessionId);
  if (!state) return null;

  const updated = { ...state, ...updates, lastActiveAt: Date.now() };
  const r = getRedis();
  await r.set(REDIS_KEYS.sessionState(sessionId), JSON.stringify(updated), 'EX', SESSION_TTL);
  return updated;
}


export interface SessionMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  name?: string;      // tool name for tool messages
  tool_call_id?: string;
  timestamp: number;
}

export async function addSessionMessage(
  sessionId: string,
  message: SessionMessage
): Promise<void> {
  const r = getRedis();
  const key = REDIS_KEYS.sessionMessages(sessionId);
  await r.rpush(key, JSON.stringify(message));
  await r.expire(key, SESSION_TTL);

  // trim to max context turns (keep recent)
  const len = await r.llen(key);
  if (len > MAX_CONTEXT_TURNS * 2) {
    await r.ltrim(key, len - MAX_CONTEXT_TURNS * 2, -1);
  }
}

export async function getSessionMessages(sessionId: string): Promise<SessionMessage[]> {
  const r = getRedis();
  const key = REDIS_KEYS.sessionMessages(sessionId);
  const data = await r.lrange(key, 0, -1);
  return data.map((d: string) => JSON.parse(d) as SessionMessage);
}

export async function clearSession(sessionId: string): Promise<void> {
  const r = getRedis();
  await r.del(REDIS_KEYS.sessionState(sessionId));
  await r.del(REDIS_KEYS.sessionMessages(sessionId));
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
