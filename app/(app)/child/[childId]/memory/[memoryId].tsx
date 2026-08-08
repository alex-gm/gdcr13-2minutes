import { format } from 'date-fns';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AudioPlaybackButton } from '../../../../../components/AudioPlaybackButton';
import { triggerTranscription } from '../../../../../lib/api/memories';
import { Button } from '../../../../../components/Button';
import { useMemory } from '../../../../../lib/hooks/useMemory';
import { colors, radii, spacing } from '../../../../../lib/theme';

export default function MemoryDetailScreen() {
  const { memoryId } = useLocalSearchParams<{ memoryId: string }>();
  const { memory, audioUrl, photoUrl, loading, error } = useMemory(memoryId);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error || !memory) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error ?? 'Memory not found'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.date}>{format(new Date(memory.occurred_at), 'EEEE, MMMM d, yyyy · h:mm a')}</Text>

      {photoUrl ? (
        <Image source={{ uri: photoUrl }} style={styles.photo} contentFit="cover" />
      ) : null}

      {audioUrl ? <AudioPlaybackButton uri={audioUrl} key={audioUrl} /> : null}

      <View style={styles.transcriptBlock}>
        <Text style={styles.transcriptLabel}>Transcript</Text>
        {memory.transcript_status === 'completed' && memory.transcript ? (
          <Text style={styles.transcript}>{memory.transcript}</Text>
        ) : memory.transcript_status === 'failed' ? (
          <View style={styles.gap}>
            <Text style={styles.transcriptMuted}>
              Transcription failed. The audio is safely saved — you can try again.
            </Text>
            <Button
              title="Retry transcription"
              variant="secondary"
              onPress={() => triggerTranscription(memory.id)}
            />
          </View>
        ) : (
          <Text style={styles.transcriptMuted}>Transcribing…</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing(3), gap: spacing(2.5) },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  date: { fontSize: 14, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
  photo: { width: '100%', aspectRatio: 1, borderRadius: radii.lg, backgroundColor: colors.border },
  transcriptBlock: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing(2.5),
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing(1),
  },
  transcriptLabel: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
  transcript: { fontSize: 17, lineHeight: 25, color: colors.text },
  transcriptMuted: { fontSize: 15, color: colors.textMuted, fontStyle: 'italic' },
  gap: { gap: spacing(1.5) },
  error: { color: colors.danger },
});
