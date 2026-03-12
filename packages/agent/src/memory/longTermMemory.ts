

import { query } from '../db/client.js';
import { MAX_PAST_INTERACTIONS } from '@voiceai/shared';
import type { SupportedLanguage } from '@voiceai/shared';

export interface PatientContext {
  patient: {
    id: string;
    name: string;
    phone: string;
    language_preference: SupportedLanguage;
  };
  upcomingAppointments: Array<{
    id: string;
    doctor_name: string;
    specialization: string;
    slot_start: string;
    status: string;
  }>;
  pastInteractions: Array<{
    session_id: string;
    summary: string;
    language: string;
    created_at: string;
  }>;
  recentAppointmentHistory: Array<{
    doctor_name: string;
    specialization: string;
    slot_start: string;
    status: string;
  }>;
}


export async function getPatientContext(patientId: string): Promise<PatientContext | null> {
  // patient info
  const patResult = await query(
    'SELECT id, name, phone, language_preference FROM patients WHERE id = $1',
    [patientId]
  );

  if (patResult.rows.length === 0) return null;
  const patient = patResult.rows[0];

  // upcoming appointments
  const upcomingResult = await query(
    `SELECT a.id, d.name as doctor_name, d.specialization, a.slot_start, a.status
     FROM appointments a
     JOIN doctors d ON a.doctor_id = d.id
     WHERE a.patient_id = $1 AND a.slot_start >= NOW()
       AND a.status IN ('confirmed', 'rescheduled')
     ORDER BY a.slot_start ASC LIMIT 5`,
    [patientId]
  );

  // past interaction summaries (last N sessions)
  const interactionsResult = await query(
    `SELECT DISTINCT ON (session_id) session_id, content as summary, language, created_at
     FROM conversation_history
     WHERE patient_id = $1 AND role = 'assistant'
     ORDER BY session_id, created_at DESC
     LIMIT $2`,
    [patientId, MAX_PAST_INTERACTIONS]
  );

  // recent appointment history
  const historyResult = await query(
    `SELECT d.name as doctor_name, d.specialization, a.slot_start, a.status
     FROM appointments a
     JOIN doctors d ON a.doctor_id = d.id
     WHERE a.patient_id = $1 AND a.status IN ('completed', 'cancelled', 'no_show')
     ORDER BY a.slot_start DESC LIMIT 5`,
    [patientId]
  );

  return {
    patient: {
      id: patient.id,
      name: patient.name,
      phone: patient.phone,
      language_preference: patient.language_preference,
    },
    upcomingAppointments: upcomingResult.rows,
    pastInteractions: interactionsResult.rows,
    recentAppointmentHistory: historyResult.rows,
  };
}


export async function saveConversationTurn(
  patientId: string,
  sessionId: string,
  role: string,
  content: string,
  language?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await query(
    `INSERT INTO conversation_history (patient_id, session_id, role, content, language, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [patientId, sessionId, role, content, language || null, metadata ? JSON.stringify(metadata) : '{}']
  );
}

export async function updatePatientLanguage(
  patientId: string,
  language: SupportedLanguage
): Promise<void> {
  await query(
    'UPDATE patients SET language_preference = $1, updated_at = NOW() WHERE id = $2',
    [language, patientId]
  );
}


export async function saveSessionSummary(
  patientId: string,
  sessionId: string,
  summary: string,
  language: string
): Promise<void> {
  await query(
    `INSERT INTO conversation_history (patient_id, session_id, role, content, language, metadata)
     VALUES ($1, $2, 'system', $3, $4, '{"type": "session_summary"}')`,
    [patientId, sessionId, summary, language]
  );
}
