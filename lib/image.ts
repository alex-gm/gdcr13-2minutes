import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const MAX_DIMENSION = 2048;
const JPEG_QUALITY = 0.8;

/**
 * Downscales to a max 2048px edge and normalizes to JPEG before upload.
 * Modern phone cameras shoot 12+MP (4000px+) originals, which is far more
 * resolution than a memory photo ever needs to be viewed at and multiplies
 * storage costs at scale for no visible benefit. Never upscales.
 */
export async function prepareMemoryPhoto(
  uri: string,
  originalWidth: number,
  originalHeight: number
): Promise<string> {
  const longestEdge = Math.max(originalWidth, originalHeight);
  const actions =
    longestEdge > MAX_DIMENSION
      ? [
          {
            resize:
              originalWidth >= originalHeight
                ? { width: MAX_DIMENSION }
                : { height: MAX_DIMENSION },
          },
        ]
      : [];

  const result = await manipulateAsync(uri, actions, {
    compress: JPEG_QUALITY,
    format: SaveFormat.JPEG,
  });
  return result.uri;
}
