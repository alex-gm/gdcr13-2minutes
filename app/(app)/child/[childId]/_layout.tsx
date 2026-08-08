import { Stack, useLocalSearchParams } from 'expo-router';

import { ChildProvider } from '../../../../lib/child-context';
import { colors } from '../../../../lib/theme';

export default function ChildLayout() {
  const { childId } = useLocalSearchParams<{ childId: string }>();

  return (
    <ChildProvider childId={childId}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="record" options={{ title: 'Record a memory', presentation: 'modal' }} />
        <Stack.Screen name="photo" options={{ title: 'Photo memory', presentation: 'modal' }} />
        <Stack.Screen name="timeline" options={{ title: 'Timeline' }} />
        <Stack.Screen name="memory/[memoryId]" options={{ title: 'Memory' }} />
      </Stack>
    </ChildProvider>
  );
}
