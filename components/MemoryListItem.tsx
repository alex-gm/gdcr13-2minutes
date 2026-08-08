import { format } from 'date-fns';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { MemoryRow } from '../lib/database.types';
import { colors, radii, spacing } from '../lib/theme';

export function MemoryListItem({ memory }: { memory: MemoryRow }) {
  const icon = memory.kind === 'photo' ? '🖼️' : '🎙️';
  const snippet = transcriptSnippet(memory);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => router.push(`/(app)/child/${memory.child_id}/memory/${memory.id}`)}
    >
      <Text style={styles.icon}>{icon}</Text>
      <View style={styles.body}>
        <Text style={styles.date}>{format(new Date(memory.occurred_at), 'MMM d, yyyy · h:mm a')}</Text>
        <Text style={styles.snippet} numberOfLines={2}>
          {snippet}
        </Text>
      </View>
    </Pressable>
  );
}

function transcriptSnippet(memory: MemoryRow): string {
  if (memory.transcript_status === 'completed' && memory.transcript) return memory.transcript;
  if (memory.transcript_status === 'failed') return 'Transcription failed — audio is still saved.';
  return 'Transcribing…';
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing(1.5),
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing(2),
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.8 },
  icon: { fontSize: 22 },
  body: { flex: 1, gap: 4 },
  date: { fontSize: 12, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase' },
  snippet: { fontSize: 15, color: colors.text },
});
