import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AudioPlaybackButton } from '../../../../components/AudioPlaybackButton';
import { Button } from '../../../../components/Button';
import { createVoiceMemory } from '../../../../lib/api/memories';
import { useAuth } from '../../../../lib/auth-context';
import { colors, radii, spacing } from '../../../../lib/theme';

type Phase = 'idle' | 'requesting' | 'recording' | 'review' | 'saving';

export default function RecordScreen() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const { user } = useAuth();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);

  const [phase, setPhase] = useState<Phase>('idle');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [reviewUri, setReviewUri] = useState<string | null>(null);
  const [reviewDuration, setReviewDuration] = useState(0);

  useEffect(() => {
    setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
  }, []);

  async function startRecording() {
    setPermissionError(null);
    setPhase('requesting');
    const { granted } = await requestRecordingPermissionsAsync();
    if (!granted) {
      setPermissionError('Microphone access is required to record a memory.');
      setPhase('idle');
      return;
    }
    await recorder.prepareToRecordAsync();
    recorder.record();
    setPhase('recording');
  }

  async function stopRecording() {
    await recorder.stop();
    setReviewUri(recorder.uri);
    setReviewDuration(recorder.currentTime);
    setPhase('review');
  }

  function discardAndRetry() {
    setReviewUri(null);
    setReviewDuration(0);
    setPhase('idle');
  }

  async function save() {
    if (!user || !reviewUri) return;
    setSaveError(null);
    setPhase('saving');
    try {
      await createVoiceMemory({
        parentId: user.id,
        childId,
        localAudioUri: reviewUri,
        audioDurationSeconds: reviewDuration,
        occurredAt: new Date(),
      });
      router.back();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save memory');
      setPhase('review');
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {(phase === 'review' || phase === 'saving') && reviewUri ? (
        <View style={styles.reviewContainer}>
          <Text style={styles.reviewTitle}>Listen back before saving</Text>
          <AudioPlaybackButton uri={reviewUri} />
          {saveError ? <Text style={styles.error}>{saveError}</Text> : null}
          <View style={styles.reviewActions}>
            <View style={styles.reviewActionItem}>
              <Button
                title="Re-record"
                variant="secondary"
                onPress={discardAndRetry}
                disabled={phase === 'saving'}
              />
            </View>
            <View style={styles.reviewActionItem}>
              <Button title="Save memory" onPress={save} loading={phase === 'saving'} />
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.recordContainer}>
          <Text style={styles.prompt}>
            {phase === 'recording' ? 'Recording…' : 'Tap to start recording a memory'}
          </Text>
          <Text style={styles.timer}>{formatSeconds(recorderState.durationMillis / 1000)}</Text>

          <Pressable
            style={[styles.recordButton, phase === 'recording' && styles.recordButtonActive]}
            onPress={phase === 'recording' ? stopRecording : startRecording}
            disabled={phase === 'requesting'}
          >
            <View style={phase === 'recording' ? styles.stopIcon : styles.micIcon}>
              {phase !== 'recording' && <Text style={styles.micEmoji}>🎙️</Text>}
            </View>
          </Pressable>

          {permissionError ? <Text style={styles.error}>{permissionError}</Text> : null}
        </View>
      )}
    </SafeAreaView>
  );
}

function formatSeconds(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  recordContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(3),
    padding: spacing(3),
  },
  prompt: { fontSize: 18, fontWeight: '600', color: colors.text, textAlign: 'center' },
  timer: { fontSize: 40, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonActive: {
    backgroundColor: colors.danger,
  },
  micIcon: { alignItems: 'center', justifyContent: 'center' },
  micEmoji: { fontSize: 40 },
  stopIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  error: { color: colors.danger, textAlign: 'center' },
  reviewContainer: { flex: 1, padding: spacing(3), justifyContent: 'center', gap: spacing(3) },
  reviewTitle: { fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'center' },
  reviewActions: { flexDirection: 'row', gap: spacing(2), justifyContent: 'center' },
  reviewActionItem: { flex: 1 },
});
