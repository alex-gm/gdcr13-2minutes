import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MemoryListItem } from '../../../../components/MemoryListItem';
import { useChild } from '../../../../lib/child-context';
import { useMemories } from '../../../../lib/hooks/useMemories';
import { colors, radii, spacing } from '../../../../lib/theme';

export default function ChildHomeScreen() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const { child, loading: childLoading } = useChild();
  const { memories, loading: memoriesLoading, refresh } = useMemories(childId);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  if (childLoading || !child) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  const recent = memories.slice(0, 3);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.push('/(app)')}>
          <Text style={styles.back}>‹ All children</Text>
        </Pressable>
        <Text style={styles.name}>{child.name}</Text>
      </View>

      <View style={styles.prompt}>
        <Text style={styles.promptTitle}>Capture a memory of {child.name}</Text>
        <Text style={styles.promptBody}>
          Say what happened today, or share a photo with a voice note. Everything is timestamped
          and saved for {child.name} to look back on one day.
        </Text>

        <View style={styles.actions}>
          <Pressable
            style={[styles.actionButton, styles.actionPrimary]}
            onPress={() => router.push(`/(app)/child/${child.id}/record`)}
          >
            <Text style={styles.actionIcon}>🎙️</Text>
            <Text style={styles.actionLabelPrimary}>Record a memory</Text>
          </Pressable>
          <Pressable
            style={[styles.actionButton, styles.actionSecondary]}
            onPress={() => router.push(`/(app)/child/${child.id}/photo`)}
          >
            <Text style={styles.actionIcon}>🖼️</Text>
            <Text style={styles.actionLabelSecondary}>Add a photo memory</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.recentHeader}>
        <Text style={styles.recentTitle}>Recent memories</Text>
        <Pressable onPress={() => router.push(`/(app)/child/${child.id}/timeline`)}>
          <Text style={styles.viewAll}>View timeline</Text>
        </Pressable>
      </View>

      {memoriesLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing(2) }} />
      ) : recent.length === 0 ? (
        <Text style={styles.empty}>No memories yet. Record the first one above.</Text>
      ) : (
        <View style={styles.list}>
          {recent.map((memory) => (
            <MemoryListItem key={memory.id} memory={memory} />
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing(3), gap: spacing(2.5) },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  header: { gap: spacing(0.5) },
  back: { color: colors.primary, fontWeight: '600' },
  name: { fontSize: 28, fontWeight: '700', color: colors.text },
  prompt: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing(2.5),
    gap: spacing(1.5),
    borderWidth: 1,
    borderColor: colors.border,
  },
  promptTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  promptBody: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  actions: { gap: spacing(1.5), marginTop: spacing(1) },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5),
    borderRadius: radii.pill,
    paddingVertical: spacing(1.75),
    paddingHorizontal: spacing(2.5),
  },
  actionPrimary: { backgroundColor: colors.primary },
  actionSecondary: { backgroundColor: colors.background, borderWidth: 1.5, borderColor: colors.primary },
  actionIcon: { fontSize: 20 },
  actionLabelPrimary: { color: '#fff', fontSize: 16, fontWeight: '700' },
  actionLabelSecondary: { color: colors.primary, fontSize: 16, fontWeight: '700' },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recentTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  viewAll: { color: colors.primary, fontWeight: '600' },
  list: { gap: spacing(1.5) },
  empty: { color: colors.textMuted, fontSize: 14 },
});
