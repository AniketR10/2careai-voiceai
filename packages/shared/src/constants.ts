
export const SUPPORTED_LANGUAGES = ['en', 'hi', 'ta'] as const;

export const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  hi: 'Hindi',
  ta: 'Tamil',
};

export const DEEPGRAM_LANGUAGE_CODES: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi',
  ta: 'ta',
};

export const TTS_VOICES: Record<string, string> = {
  en: 'aura-asteria-en',
  hi: 'aura-asteria-en',  
  ta: 'aura-asteria-en',   
};

export const SESSION_TTL = 1800;

export const SLOT_DURATION_MINUTES = 30;

export const MAX_CONTEXT_TURNS = 20;

export const MAX_PAST_INTERACTIONS = 3;

export const SENTENCE_TERMINATORS = /[.!?।]\s*/;

export const REDIS_KEYS = {
  session: (id: string) => `session:${id}`,
  sessionMessages: (id: string) => `session:${id}:messages`,
  sessionState: (id: string) => `session:${id}:state`,
} as const;
