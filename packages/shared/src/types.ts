
export type SupportedLanguage = 'en' | 'hi' | 'ta';

// --- Patient ---
export interface Patient {
  id: string;
  name: string;
  phone: string;
  language_preference: SupportedLanguage;
  created_at: string;
  updated_at: string;
}

export interface DoctorSlot {
  day: number;   
  start: string;  
  end: string;   
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  available_slots: DoctorSlot[];
  created_at: string;
}

export type AppointmentStatus = 'confirmed' | 'cancelled' | 'rescheduled' | 'completed' | 'no_show';

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  slot_start: string;
  slot_end: string;
  status: AppointmentStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

export interface ConversationMessage {
  id?: string;
  patient_id: string;
  session_id: string;
  role: MessageRole;
  content: string;
  language?: SupportedLanguage;
  metadata?: Record<string, any>;
  created_at?: string;
}

export type ConversationState =
  | 'idle'
  | 'collecting_intent'
  | 'confirming'
  | 'executing'
  | 'campaign_active';

export interface SessionState {
  sessionId: string;
  patientId?: string;
  patientName?: string;
  language: SupportedLanguage;
  conversationState: ConversationState;
  currentIntent?: string;
  pendingConfirmation?: Record<string, any>;
  isCampaign: boolean;
  campaignId?: string;
  campaignType?: string;
  createdAt: number;
  lastActiveAt: number;
}

export type CampaignType = 'reminder' | 'followup' | 'checkup';
export type CampaignStatus = 'pending' | 'running' | 'completed' | 'failed';
export type CampaignTargetStatus = 'pending' | 'calling' | 'completed' | 'failed' | 'declined';

export interface Campaign {
  id: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  scheduled_at: string;
  completed_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface CampaignTarget {
  id: string;
  campaign_id: string;
  patient_id: string;
  appointment_id?: string;
  status: CampaignTargetStatus;
  outcome?: Record<string, any>;
  attempted_at?: string;
  created_at: string;
}

export interface LatencyTrace {
  sessionId: string;
  turnId: string;
  speechEndTs: number;      // t0: speech end detected
  transcriptTs: number;     // t1: final transcript received
  llmFirstTokenTs: number;  // t2: LLM first token
  ttsFirstByteTs: number;   // t3: TTS first audio byte sent
  totalLatencyMs: number;   // t3 - t0
  breakdown: {
    sttMs: number;          // t1 - t0
    llmMs: number;          // t2 - t1
    ttsMs: number;          // t3 - t2
  };
}

// --- WebSocket Messages ---
export type WSClientMessage =
  | { type: 'audio'; data: string }     
  | { type: 'start_session'; patientId?: string; phone?: string; language?: SupportedLanguage }
  | { type: 'end_session' }
  | { type: 'text_input'; text: string }

export type WSServerMessage =
  | { type: 'audio'; data: string }     
  | { type: 'transcript'; text: string; isFinal: boolean; language?: string }
  | { type: 'agent_text'; text: string; isFinal: boolean }
  | { type: 'tool_call'; name: string; args: Record<string, any> }
  | { type: 'tool_result'; name: string; result: any }
  | { type: 'latency'; trace: LatencyTrace }
  | { type: 'session_started'; sessionId: string; patientId?: string }
  | { type: 'error'; message: string }
  | { type: 'state_change'; state: ConversationState }
  | { type: 'tts_start' }
  | { type: 'tts_end' }
