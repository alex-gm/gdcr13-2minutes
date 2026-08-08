import { Redirect, Stack } from 'expo-router';

import { useAuth } from '../../lib/auth-context';

export default function AppLayout() {
  const { session, initializing } = useAuth();

  if (initializing) return null;
  if (!session) return <Redirect href="/(auth)/login" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="children/new" options={{ headerShown: true, title: 'Add a child' }} />
      <Stack.Screen name="child/[childId]" />
    </Stack>
  );
}
