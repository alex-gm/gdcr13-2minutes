import { AudioQuality, IOSOutputFormat, type RecordingOptions } from 'expo-audio';

/**
 * Speech stays perfectly intelligible — and transcribes just as well through
 * Whisper — well below music-quality settings. Mono at 48kbps/22.05kHz cuts
 * file size roughly 5x versus expo-audio's HIGH_QUALITY preset (128kbps
 * stereo at 44.1kHz), which matters once users are recording thousands of
 * these over many years.
 */
export const SPEECH_RECORDING_OPTIONS: RecordingOptions = {
  extension: '.m4a',
  sampleRate: 22050,
  numberOfChannels: 1,
  bitRate: 48000,
  android: {
    outputFormat: 'mpeg4',
    audioEncoder: 'aac',
  },
  ios: {
    outputFormat: IOSOutputFormat.MPEG4AAC,
    audioQuality: AudioQuality.MEDIUM,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 48000,
  },
};
