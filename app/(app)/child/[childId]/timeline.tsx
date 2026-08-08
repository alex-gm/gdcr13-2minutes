import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, SectionList, StyleSheet, Text, TextInput, View } from 'react-native';

import { MemoryListItem } from '../../../../components/MemoryListItem';
import { useMemories } from '../../../../lib/hooks/useMemories';
import { colors, radii, spacing } from '../../../../lib/theme';
import type { MemoryRow } from '../../../../lib/database.types';

export default function TimelineScreen() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const { memories, loading, error } = useMemories(childId);
  const [query, setQuery] = useState('');

  const sections = useMemo(() => buildSections(memories, query), [memories, query]);

  return (
    <View style={styles.container}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search memories…"
        placeholderTextColor={colors.textMuted}
        style={styles.search}
      />

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing(3) }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : sections.length === 0 ? (
        <Text style={styles.empty}>
          {query ? 'No memories match your search.' : 'No memories yet.'}
        </Text>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MemoryListItem memory={item} />}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing(1.5) }} />}
          stickySectionHeadersEnabled
        />
      )}
    </View>
  );
}

function buildSections(memories: MemoryRow[], query: string) {
  const q = query.trim().toLowerCase();
  const filtered = q
    ? memories.filter((m) => (m.transcript ?? '').toLowerCase().includes(q))
    : memories;

  const byYear = new Map<string, MemoryRow[]>();
  for (const memory of filtered) {
    const year = new Date(memory.occurred_at).getFullYear().toString();
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year)!.push(memory);
  }

  return Array.from(byYear.entries())
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .map(([year, data]) => ({ title: year, data }));
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing(2) },
  search: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1.25),
    fontSize: 15,
    color: colors.text,
    marginBottom: spacing(1.5),
  },
  list: { paddingBottom: spacing(4) },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    backgroundColor: colors.background,
    paddingVertical: spacing(1),
  },
  error: { color: colors.danger, padding: spacing(2) },
  empty: { color: colors.textMuted, padding: spacing(2), textAlign: 'center' },
});
