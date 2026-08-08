import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/Button';
import { useAuth } from '../../lib/auth-context';
import { useChildren } from '../../lib/hooks/useChildren';
import { formatAge } from '../../lib/age';
import { colors, radii, spacing } from '../../lib/theme';
import type { ChildRow } from '../../lib/database.types';

export default function ChildPickerScreen() {
  const { signOut } = useAuth();
  const { children, loading, error, refresh } = useChildren();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🐹 Gerbil</Text>
        <Pressable onPress={signOut}>
          <Text style={styles.signOut}>Sign out</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {children.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No children yet</Text>
          <Text style={styles.emptyBody}>
            Add a profile for your child to start capturing memories, one recording at a time.
          </Text>
          <Button title="Add a child" onPress={() => router.push('/(app)/children/new')} />
        </View>
      ) : (
        <FlatList
          data={children}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <ChildCard child={item} />}
          ListFooterComponent={
            <Button
              title="+ Add another child"
              variant="secondary"
              onPress={() => router.push('/(app)/children/new')}
            />
          }
          ListFooterComponentStyle={styles.footer}
        />
      )}
    </View>
  );
}

function ChildCard({ child }: { child: ChildRow }) {
  const age = formatAge(child.birth_date);
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => router.push(`/(app)/child/${child.id}`)}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{child.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.cardText}>
        <Text style={styles.cardName}>{child.name}</Text>
        {age ? <Text style={styles.cardAge}>{age} old</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing(3) },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing(3),
  },
  title: { fontSize: 28, fontWeight: '700', color: colors.text },
  signOut: { color: colors.textMuted, fontWeight: '500' },
  error: { color: colors.danger, marginBottom: spacing(2) },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(2),
    paddingBottom: spacing(10),
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  emptyBody: { fontSize: 15, color: colors.textMuted, textAlign: 'center', paddingHorizontal: spacing(3) },
  list: { gap: spacing(2) },
  footer: { marginTop: spacing(1) },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing(2),
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardPressed: { opacity: 0.8 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  cardText: { gap: 2 },
  cardName: { fontSize: 18, fontWeight: '600', color: colors.text },
  cardAge: { fontSize: 14, color: colors.textMuted },
});
