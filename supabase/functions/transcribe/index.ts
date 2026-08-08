// Supabase Edge Function: transcribes a memory's audio with OpenAI Whisper
// and writes the transcript back onto the memories row.
//
// Deploy: supabase functions deploy transcribe
// Secrets: supabase secrets set OPENAI_API_KEY=sk-...
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AUDIO_BUCKET = 'memory-audio';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { memoryId } = await req.json();
    if (!memoryId || typeof memoryId !== 'string') {
      return json({ error: 'memoryId is required' }, 400);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Missing Authorization header' }, 401);
    }

    // Scoped to the calling user's JWT so RLS decides what they can read/write.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: memory, error: fetchError } = await supabase
      .from('memories')
      .select('id, audio_path')
      .eq('id', memoryId)
      .single();
    if (fetchError || !memory || !memory.audio_path) {
      return json({ error: 'Memory not found' }, 404);
    }

    await supabase
      .from('memories')
      .update({ transcript_status: 'processing', transcript_error: null })
      .eq('id', memoryId);

    const { data: audioFile, error: downloadError } = await supabase.storage
      .from(AUDIO_BUCKET)
      .download(memory.audio_path);
    if (downloadError || !audioFile) {
      await markFailed(supabase, memoryId, `Could not read audio file: ${downloadError?.message ?? 'unknown error'}`);
      return json({ error: 'Could not read audio file' }, 500);
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      await markFailed(supabase, memoryId, 'Server is missing OPENAI_API_KEY');
      return json({ error: 'Server misconfigured' }, 500);
    }

    const form = new FormData();
    form.append('file', audioFile, 'memory.m4a');
    form.append('model', 'whisper-1');

    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${openaiKey}` },
      body: form,
    });

    if (!whisperResponse.ok) {
      const errText = await whisperResponse.text();
      await markFailed(supabase, memoryId, `Whisper API error: ${errText.slice(0, 500)}`);
      return json({ error: 'Transcription failed' }, 502);
    }

    const { text } = (await whisperResponse.json()) as { text: string };

    const { error: updateError } = await supabase
      .from('memories')
      .update({ transcript: text, transcript_status: 'completed', transcript_error: null })
      .eq('id', memoryId);
    if (updateError) {
      return json({ error: updateError.message }, 500);
    }

    return json({ ok: true, transcript: text });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function markFailed(
  supabase: ReturnType<typeof createClient>,
  memoryId: string,
  message: string
) {
  await supabase
    .from('memories')
    .update({ transcript_status: 'failed', transcript_error: message.slice(0, 500) })
    .eq('id', memoryId);
}
