import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AudioPlaybackButton } from '../../../../components/AudioPlaybackButton';
import { Button } from '../../../../components/Button';
import { createPhotoMemory } from '../../../../lib/api/memories';
import { useAuth } from '../../../../lib/auth-context';
import { colors, radii, spacing } from '../../../../lib/theme';

type RecordingPhase = 'idle' | 'requesting' | 'recording' | 'review';

export default function PhotoMemoryScreen() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const { user } = useAuth();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [phase, setPhase] = useState<RecordingPhase>('idle');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [reviewUri, setReviewUri] = useState<string | null>(null);
  const [reviewDuration, setReviewDuration] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
  }, []);

  async function pickPhoto() {
    setPickerError(null);
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      setPickerError('Photo library access is required to add a photo memory.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function startRecording() {
    setPermissionError(null);
    setPhase('requesting');
    const { granted } = await requestRecordingPermissionsAsync();
    if (!granted) {
      setPermissionError('Microphone access is required to add a voiceover.');
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
    if (!user || !photoUri || !reviewUri) return;
    setSaveError(null);
    setSaving(true);
    try {
      await createPhotoMemory({
        parentId: user.id,
        childId,
        localPhotoUri: photoUri,
        localAudioUri: reviewUri,
        audioDurationSeconds: reviewDuration,
        occurredAt: new Date(),
      });
      router.back();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save memory');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Text style={styles.stepLabel}>1. Choose a photo</Text>
        {photoUri ? (
          <Pressable onPress={pickPhoto}>
            <Image source={{ uri: photoUri }} style={styles.photo} contentFit="cover" />
          </Pressable>
        ) : (
          <Pressable style={styles.pickerButton} onPress={pickPhoto}>
            <Text style={styles.pickerButtonIcon}>🖼️</Text>
            <Text style={styles.pickerButtonText}>Select a photo</Text>
          </Pressable>
        )}
        {pickerError ? <Text style={styles.error}>{pickerError}</Text> : null}

        {photoUri ? (
          <>
            <Text style={styles.stepLabel}>2. Add a voiceover</Text>

            {phase === 'review' && reviewUri ? (
              <View style={styles.reviewBlock}>
                <AudioPlaybackButton uri={reviewUri} />
                <View style={styles.reviewActions}>
                  <View style={styles.reviewActionItem}>
                    <Button title="Re-record" variant="secondary" onPress={discardAndRetry} />
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.recordBlock}>
                <Text style={styles.timer}>{formatSeconds(recorderState.durationMillis / 1000)}</Text>
                <Pressable
                  style={[styles.recordButton, phase === 'recording' && styles.recordButtonActive]}
                  onPress={phase === 'recording' ? stopRecording : startRecording}
                  disabled={phase === 'requesting'}
                >
                  {phase !== 'recording' && <Text style={styles.micEmoji}>🎙️</Text>}
                </Pressable>
                {permissionError ? <Text style={styles.error}>{permissionError}</Text> : null}
              </View>
            )}
          </>
        ) : null}

        {saveError ? <Text style={styles.error}>{saveError}</Text> : null}

        {photoUri && reviewUri ? (
          <Button title="Save memory" onPress={save} loading={saving} />
        ) : null}
      </View>
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
  content: { flex: 1, padding: spacing(3), gap: spacing(2.5) },
  stepLabel: { fontSize: 14, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
  photo: { width: '100%', aspectRatio: 1, borderRadius: radii.lg, backgroundColor: colors.border },
  pickerButton: {
    aspectRatio: 1,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(1),
    backgroundColor: colors.surface,
  },
  pickerButtonIcon: { fontSize: 36 },
  pickerButtonText: { fontSize: 16, fontWeight: '600', color: colors.primary },
  recordBlock: { alignItems: 'center', gap: spacing(2) },
  reviewBlock: { gap: spacing(1.5) },
  reviewActions: { flexDirection: 'row', gap: spacing(2) },
  reviewActionItem: { flex: 1 },
  timer: { fontSize: 28, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
  recordButton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonActive: { backgroundColor: colors.danger },
  micEmoji: { fontSize: 30 },
  error: { color: colors.danger },
});
