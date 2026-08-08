import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors, radii, spacing } from '../lib/theme';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string | null;
}

export function TextField({ label, error, style, ...rest }: TextFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[styles.input, error && styles.inputError, style]}
        {...rest}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing(0.75),
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1.5),
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
  },
});
