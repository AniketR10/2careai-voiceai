/**
 * Context Builder — Constructs the LLM context from session + long-term memory
 *
 * Combines:
 *   - System prompt (with patient context injected)
 *   - Session conversation history (from Redis)
 *   - Relevant long-term context (from PostgreSQL)
 *
 * Produces the messages array for the groq api call.
 */

import type { ChatCompletionMessageParam } from 'groq-sdk/resources/chat/completions';
import type { SessionState, SupportedLanguage } from '@voiceai/shared';
import { getSessionMessages } from './sessionMemory.js';
import { getPatientContext, type PatientContext } from './longTermMemory.js';
import { getSystemPrompt } from '../prompts/system.js';
import { getCampaignPrompt } from '../prompts/campaign.js';

export interface BuiltContext {
  messages: ChatCompletionMessageParam[];
  patientContext: PatientContext | null;
}

/**
 * Build the full message context for an LLM call.
 */
export async function buildContext(sessionState: SessionState): Promise<BuiltContext> {
  const messages: ChatCompletionMessageParam[] = [];

  let patientContext: PatientContext | null = null;
  if (sessionState.patientId) {
    patientContext = await getPatientContext(sessionState.patientId);
  }

  // 2. Build system prompt
  let systemPrompt: string;
  if (sessionState.isCampaign && sessionState.campaignType) {
    systemPrompt = getCampaignPrompt(
      sessionState.campaignType as any,
      sessionState.language,
      patientContext
    );
  } else {
    systemPrompt = getSystemPrompt(sessionState.language, patientContext);
  }

  messages.push({ role: 'system', content: systemPrompt });

  // 3. Add session conversation history from Redis
  const sessionMessages = await getSessionMessages(sessionState.sessionId);

  for (const msg of sessionMessages) {
    if (msg.role === 'tool' && msg.tool_call_id) {
      messages.push({
        role: 'tool',
        content: msg.content,
        tool_call_id: msg.tool_call_id,
      });
    } else if (msg.role === 'user' || msg.role === 'assistant') {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }
  }

  return { messages, patientContext };
}
