import * as Crypto from 'expo-crypto';

import { supabase } from '../supabase';
import type { MemoryRow } from '../database.types';

const AUDIO_BUCKET = 'memory-audio';
const PHOTO_BUCKET = 'memory-photos';

async function uploadFile(bucket: string, path: string, localUri: string, contentType: string) {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    contentType,
    upsert: true,
  });
  if (error) throw error;
  return path;
}

export async function createVoiceMemory(params: {
  parentId: string;
  childId: string;
  localAudioUri: string;
  audioDurationSeconds: number;
  occurredAt: Date;
}): Promise<MemoryRow> {
  const memoryId = Crypto.randomUUID();
  const audioPath = `${params.parentId}/${params.childId}/${memoryId}.m4a`;
  await uploadFile(AUDIO_BUCKET, audioPath, params.localAudioUri, 'audio/m4a');

  const { data, error } = await supabase
    .from('memories')
    .insert({
      id: memoryId,
      child_id: params.childId,
      parent_id: params.parentId,
      kind: 'voice',
      audio_path: audioPath,
      audio_duration_seconds: params.audioDurationSeconds,
      occurred_at: params.occurredAt.toISOString(),
    })
    .select('*')
    .single();
  if (error) throw error;

  triggerTranscription(memoryId);
  return data;
}

export async function createPhotoMemory(params: {
  parentId: string;
  childId: string;
  localPhotoUri: string;
  localAudioUri: string;
  audioDurationSeconds: number;
  occurredAt: Date;
}): Promise<MemoryRow> {
  const memoryId = Crypto.randomUUID();
  const audioPath = `${params.parentId}/${params.childId}/${memoryId}.m4a`;
  const photoPath = `${params.parentId}/${params.childId}/${memoryId}.jpg`;

  await Promise.all([
    uploadFile(AUDIO_BUCKET, audioPath, params.localAudioUri, 'audio/m4a'),
    uploadFile(PHOTO_BUCKET, photoPath, params.localPhotoUri, 'image/jpeg'),
  ]);

  const { data, error } = await supabase
    .from('memories')
    .insert({
      id: memoryId,
      child_id: params.childId,
      parent_id: params.parentId,
      kind: 'photo',
      audio_path: audioPath,
      audio_duration_seconds: params.audioDurationSeconds,
      photo_path: photoPath,
      occurred_at: params.occurredAt.toISOString(),
    })
    .select('*')
    .single();
  if (error) throw error;

  triggerTranscription(memoryId);
  return data;
}

/** Fire-and-forget: kicks off the transcribe edge function without blocking the caller's UI. */
export function triggerTranscription(memoryId: string) {
  supabase.functions.invoke('transcribe', { body: { memoryId } }).catch((err) => {
    console.warn('Failed to trigger transcription', err);
  });
}

export async function listMemories(childId: string): Promise<MemoryRow[]> {
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .eq('child_id', childId)
    .order('occurred_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getMemory(memoryId: string): Promise<MemoryRow> {
  const { data, error } = await supabase.from('memories').select('*').eq('id', memoryId).single();
  if (error) throw error;
  return data;
}

export function subscribeToMemory(memoryId: string, onChange: (row: MemoryRow) => void) {
  const channel = supabase
    .channel(`memory-${memoryId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'memories', filter: `id=eq.${memoryId}` },
      (payload) => onChange(payload.new as MemoryRow)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function getSignedAudioUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(AUDIO_BUCKET).createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}

export async function getSignedPhotoUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}
