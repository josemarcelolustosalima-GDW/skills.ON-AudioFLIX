/**
 * Utility to parse and transform Google Drive sharing links
 * into direct playable audio streaming URLs.
 */

export interface ResolvedAudioSource {
  streamUrl: string;
  isGoogleDrive: boolean;
  driveFileId?: string;
  originalUrl: string;
}

// Fallback high quality royalty-free training narration audio tracks
export const SAMPLE_AUDIO_FALLBACKS = [
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
];

export function extractGoogleDriveId(url: string): string | null {
  if (!url) return null;
  
  // Format: drive.google.com/file/d/FILE_ID/view...
  const matchFileD = url.match(/\/file\/d\/([a-zA-Z0-9_-]{20,})/);
  if (matchFileD && matchFileD[1]) {
    return matchFileD[1];
  }

  // Format: drive.google.com/open?id=FILE_ID or uc?id=FILE_ID
  const matchIdParam = url.match(/[?&]id=([a-zA-Z0-9_-]{20,})/);
  if (matchIdParam && matchIdParam[1]) {
    return matchIdParam[1];
  }

  // If the user pasted just the ID (around 25-45 characters alphanumeric with dashes/underscores)
  if (/^[a-zA-Z0-9_-]{25,45}$/.test(url.trim())) {
    return url.trim();
  }

  return null;
}

export function resolveAudioUrl(inputUrl: string): ResolvedAudioSource {
  if (!inputUrl || inputUrl.trim() === '') {
    return {
      streamUrl: SAMPLE_AUDIO_FALLBACKS[0],
      isGoogleDrive: false,
      originalUrl: inputUrl,
    };
  }

  const driveId = extractGoogleDriveId(inputUrl);

  if (driveId) {
    // Google Drive direct stream URL format
    const streamUrl = `https://docs.google.com/uc?export=download&id=${driveId}`;
    return {
      streamUrl,
      isGoogleDrive: true,
      driveFileId: driveId,
      originalUrl: inputUrl,
    };
  }

  // Regular audio URL (e.g. Supabase Storage, CDN, public mp3)
  return {
    streamUrl: inputUrl.trim(),
    isGoogleDrive: false,
    originalUrl: inputUrl,
  };
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
