import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../../components/Button';
import { TextField } from '../../../components/TextField';
import { createChild } from '../../../lib/api/children';
import { useAuth } from '../../../lib/auth-context';
import { colors, radii, spacing } from '../../../lib/theme';

export default function NewChildScreen() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!user) return;
    setError(null);
    if (!name.trim()) {
      setError('Please enter a name.');
      return;
    }
    setSaving(true);
    try {
      const child = await createChild({
        parentId: user.id,
        name: name.trim(),
        birthDate: birthDate ? toDateOnly(birthDate) : null,
      });
      router.replace(`/(app)/child/${child.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create profile');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>
        This creates your child's private memory vault. Only you can add to it.
      </Text>

      <TextField
        label="Child's name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Wren"
        autoFocus
      />

      <View style={styles.dateField}>
        <Text style={styles.label}>Date of birth (optional)</Text>
        <Pressable style={styles.dateButton} onPress={() => setShowPicker(true)}>
          <Text style={birthDate ? styles.dateText : styles.datePlaceholder}>
            {birthDate ? birthDate.toDateString() : 'Select a date'}
          </Text>
        </Pressable>
        {showPicker ? (
          <DateTimePicker
            value={birthDate ?? new Date()}
            mode="date"
            maximumDate={new Date()}
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={(_event, selected) => {
              setShowPicker(Platform.OS === 'ios');
              if (selected) setBirthDate(selected);
            }}
          />
        ) : null}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button title="Create profile" onPress={handleSave} loading={saving} />
    </View>
  );
}

function toDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing(3), gap: spacing(2.5) },
  subtitle: { fontSize: 15, color: colors.textMuted, marginBottom: spacing(1) },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  dateField: { gap: spacing(0.75) },
  dateButton: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1.5),
    backgroundColor: colors.surface,
  },
  dateText: { fontSize: 16, color: colors.text },
  datePlaceholder: { fontSize: 16, color: colors.textMuted },
  error: { color: colors.danger },
});
