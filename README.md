# Gerbil 🐹

Gerbil is a voice-first family journal. A parent creates a private profile for
their child, and the app prompts them to record short spoken memories — or a
photo with a voiceover — that get transcribed and timestamped automatically.
Everything is stored so that, years down the line, the child can look back at
a complete, searchable timeline of their childhood.

## Stack

- **App:** Expo (React Native) + TypeScript + Expo Router
- **Backend:** Supabase (Postgres, Auth, Storage, Edge Functions)
- **Transcription:** OpenAI Whisper, called from a Supabase Edge Function

## How it fits together

- A parent signs up/logs in with Supabase Auth (email + password).
- Each parent can create one or more **child profiles** (`children` table).
- A **memory** (`memories` table) belongs to a child and is either:
  - `kind: 'voice'` — a spoken recording, or
  - `kind: 'photo'` — a photo from the parent's library plus a spoken
    voiceover.
- Audio and photo files are uploaded to private Supabase Storage buckets
  (`memory-audio`, `memory-photos`), scoped per-user by path
  (`${parentId}/${childId}/${memoryId}.ext`), enforced by Storage RLS
  policies — nobody can read another family's files.
- After a memory is created, the app calls the `transcribe` Edge Function
  (fire-and-forget), which downloads the audio, sends it to OpenAI Whisper,
  and writes the transcript back onto the memory row. The memory detail
  screen subscribes to Realtime updates so the transcript appears as soon as
  it's ready.
- The **timeline** screen lists every memory for a child, grouped by year,
  with search over transcripts — this is the view a grown child would use to
  browse their own history.

Row Level Security ensures a parent can only ever see their own children and
memories; there's no separate "child login" in this MVP — handing over access
at 18 is a product/process decision layered on top of this same data model
(e.g. a future invite flow that transfers or shares `parent_id` ownership).

## Project layout

```
app/                        Expo Router screens
  (auth)/                   login, signup — redirects to (app) if signed in
  (app)/                    everything behind auth — redirects to login if not
    index.tsx               child picker / "add a child"
    children/new.tsx         create a child profile
    child/[childId]/
      index.tsx              per-child dashboard: record / photo prompts
      record.tsx              voice memory recording flow
      photo.tsx                photo + voiceover memory flow
      timeline.tsx             full chronological timeline + search
      memory/[memoryId].tsx    memory detail (playback, transcript)
lib/                        Supabase client, auth/child context, API calls, hooks
components/                 Shared UI (Button, TextField, MemoryListItem, ...)
supabase/
  migrations/0001_init.sql  Schema + RLS policies + storage buckets
  functions/transcribe/     Edge Function that calls OpenAI Whisper
```

## Setup

### 1. Create a Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run `supabase/migrations/0001_init.sql`. It creates the
   `children` and `memories` tables, enables RLS, and creates the
   `memory-audio` / `memory-photos` storage buckets with per-user policies.
3. In **Settings → API**, grab the Project URL and anon public key.

### 2. Configure the app

```
cp .env.example .env
# then fill in EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
```

### 3. Deploy the transcription Edge Function

Requires the [Supabase CLI](https://supabase.com/docs/guides/cli).

```
supabase login
supabase link --project-ref <your-project-ref>
supabase secrets set OPENAI_API_KEY=sk-...
supabase functions deploy transcribe
```

The function uses `SUPABASE_URL` / `SUPABASE_ANON_KEY`, which Supabase
injects into Edge Functions automatically — no need to set those secrets
yourself.

### 4. Run the app

```
npm install
npm run start
```

Then open in Expo Go, an iOS simulator, or an Android emulator. Voice
recording and the photo library picker need a real device or simulator with
microphone/photo permissions — they won't work in a web browser preview.

## Notes / next steps

- Email confirmation is controlled by your Supabase project's Auth settings
  (Settings → Authentication). If it's on, new users see a "check your email"
  message after signing up instead of being dropped straight into the app.
- `lib/database.types.ts` is hand-written to mirror the SQL schema. If you
  evolve the schema, either update it by hand or swap in
  `supabase gen types typescript` output.
- There's no in-app way yet to hand the vault over to the child at 18 — that
  would be a natural next feature (e.g. an invite/export flow).
