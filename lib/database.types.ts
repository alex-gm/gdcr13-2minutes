// Hand-written mirror of supabase/migrations/0001_init.sql.
// Regenerate with `supabase gen types typescript` once the project is live
// and swap this file out if you want fully generated types.

export type MemoryKind = 'voice' | 'photo';
export type TranscriptStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ChildRow {
  id: string;
  parent_id: string;
  name: string;
  birth_date: string | null;
  created_at: string;
}

export interface MemoryRow {
  id: string;
  child_id: string;
  parent_id: string;
  kind: MemoryKind;
  title: string | null;
  occurred_at: string;
  created_at: string;
  audio_path: string | null;
  audio_duration_seconds: number | null;
  photo_path: string | null;
  transcript: string | null;
  transcript_status: TranscriptStatus;
  transcript_error: string | null;
}

