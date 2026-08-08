import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '../lib/theme';

/** Mounts a fresh `AudioPlayer` for a given local/remote uri. Re-mount (via `key`) to change source. */
export function AudioPlaybackButton({ uri }: { uri: string }) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);

  return (
    <Pressable
      style={styles.container}
      onPress={() => (status.playing ? player.pause() : player.play())}
    >
      <Text style={styles.icon}>{status.playing ? '⏸' : '▶️'}</Text>
      <View style={styles.track}>
        <View
          style={[
            styles.progress,
            { width: `${status.duration ? (status.currentTime / status.duration) * 100 : 0}%` },
          ]}
        />
      </View>
      <Text style={styles.time}>
        {formatSeconds(status.currentTime)} / {formatSeconds(status.duration)}
      </Text>
    </Pressable>
  );
}

function formatSeconds(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5),
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    paddingVertical: spacing(1.5),
    paddingHorizontal: spacing(2),
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: { fontSize: 18 },
  track: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  time: { fontSize: 12, color: colors.textMuted, minWidth: 72, textAlign: 'right' },
});
