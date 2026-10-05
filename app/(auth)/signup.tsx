import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { useAuth } from '../../lib/auth-context';
import { colors, spacing } from '../../lib/theme';

export default function SignupScreen() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setConfirmMessage(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await signUp(email.trim(), password);
      // If the Supabase project requires email confirmation, no session exists
      // yet and the auth listener won't redirect us — tell the parent to check
      // their inbox. Otherwise the (auth) layout's Redirect handles it.
      setConfirmMessage('Account created! Check your email to confirm, then sign in.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create account');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>🧸 Lil' Mems</Text>
        <Text style={styles.subtitle}>Create an account to start recording memories.</Text>

        <View style={styles.form}>
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholder="you@example.com"
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password-new"
            placeholder="At least 8 characters"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {confirmMessage ? <Text style={styles.success}>{confirmMessage}</Text> : null}
          <Button title="Create account" onPress={handleSubmit} loading={loading} />
        </View>

        <Link href="/(auth)/login" style={styles.link} replace>
          <Text style={styles.linkText}>Already have an account? Sign in</Text>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing(3),
    gap: spacing(3),
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: colors.textMuted,
  },
  form: {
    gap: spacing(2),
  },
  error: {
    color: colors.danger,
    textAlign: 'center',
  },
  success: {
    color: colors.success,
    textAlign: 'center',
  },
  link: {
    alignSelf: 'center',
    marginTop: spacing(1),
  },
  linkText: {
    color: colors.primary,
    fontWeight: '600',
  },
});
