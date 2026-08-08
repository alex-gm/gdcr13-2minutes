import { supabase } from '../supabase';
import type { ChildRow } from '../database.types';

export async function listChildren(): Promise<ChildRow[]> {
  const { data, error } = await supabase
    .from('children')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function getChild(childId: string): Promise<ChildRow> {
  const { data, error } = await supabase.from('children').select('*').eq('id', childId).single();
  if (error) throw error;
  return data;
}

export async function createChild(params: {
  parentId: string;
  name: string;
  birthDate: string | null;
}): Promise<ChildRow> {
  const { data, error } = await supabase
    .from('children')
    .insert({ parent_id: params.parentId, name: params.name, birth_date: params.birthDate })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}
