/**
 * Utility to parse, diagnose, and stream Google Drive and external audio URLs.
 * Implements multi-candidate URL failover, proxy support, and embed player options.
 */

export interface GoogleDriveAnalysis {
  isGoogleDrive: boolean;
  isValid: boolean;
  isFolder: boolean;
  fileId?: string;
  errorMessage?: string;
  candidateUrls: string[];
  previewEmbedUrl?: string;
  directWebUrl?: string;
}

export interface ResolvedAudioSource {
  streamUrl: string;
  candidateUrls: string[];
  isGoogleDrive: boolean;
  driveFileId?: string;
  originalUrl: string;
  previewEmbedUrl?: string;
  directWebUrl?: string;
  isFolder?: boolean;
}

// Fallback high quality royalty-free training narration audio tracks
export const SAMPLE_AUDIO_FALLBACKS = [
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
];

/**
 * Deeply analyzes an input URL to detect Google Drive formats, folders, or direct audio.
 */
export function analyzeAudioUrl(inputUrl: string): GoogleDriveAnalysis {
  if (!inputUrl || inputUrl.trim() === '') {
    return {
      isGoogleDrive: false,
      isValid: false,
      isFolder: false,
      errorMessage: 'Nenhum link fornecido.',
      candidateUrls: [],
    };
  }

  const url = inputUrl.trim();

  // Check if it's a Google Drive folder link
  if (url.includes('/folders/') || url.includes('drive.google.com/drive/folders')) {
    return {
      isGoogleDrive: true,
      isValid: false,
      isFolder: true,
      errorMessage: 'Atenção: Este é o link de uma PASTA do Google Drive. Entre na pasta, clique com o botão direito no arquivo MP3/áudio específico e copie o link de compartilhamento daquele arquivo.',
      candidateUrls: [],
    };
  }

  // Extract Google Drive ID
  let fileId: string | null = null;

  // Format 1: /file/d/FILE_ID or /d/FILE_ID (handles /file/u/0/d/FILE_ID too)
  const matchD = url.match(/\/d\/([a-zA-Z0-9_-]{15,})/);
  if (matchD && matchD[1]) {
    fileId = matchD[1];
  }

  // Format 2: ?id=FILE_ID or &id=FILE_ID
  if (!fileId) {
    const matchId = url.match(/[?&]id=([a-zA-Z0-9_-]{15,})/);
    if (matchId && matchId[1]) {
      fileId = matchId[1];
    }
  }

  // Format 3: Raw File ID
  if (!fileId && /^[a-zA-Z0-9_-]{20,50}$/.test(url)) {
    fileId = url;
  }

  if (fileId) {
    const previewEmbedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
    const directWebUrl = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;

    // Candidate stream URLs in priority order
    const candidateUrls = [
      // 1. Local/Server-side Audio Proxy (Bypasses CORS, virus warning pages, handles Range header)
      `/api/audio-proxy?id=${fileId}`,
      // 2. Google Direct User Content CDN
      `https://drive.usercontent.google.com/download?id=${fileId}&export=download&authuser=0`,
      // 3. Drive UC with confirm parameter
      `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`,
      // 4. Docs UC with confirm parameter
      `https://docs.google.com/uc?export=download&id=${fileId}&confirm=t`,
      // 5. Docs UC export open
      `https://docs.google.com/uc?id=${fileId}&export=open`,
      // 6. Drive UC export download
      `https://drive.google.com/uc?id=${fileId}&export=download`,
    ];

    return {
      isGoogleDrive: true,
      isValid: true,
      isFolder: false,
      fileId,
      candidateUrls,
      previewEmbedUrl,
      directWebUrl,
    };
  }

  const isHttp = /^https?:\/\//i.test(url);
  return {
    isGoogleDrive: false,
    isValid: isHttp,
    isFolder: false,
    errorMessage: isHttp ? undefined : 'URL com formato desconhecido. Utilize um link válido do Google Drive ou endereço HTTP de áudio.',
    candidateUrls: isHttp ? [url] : [],
  };
}

export function extractGoogleDriveId(url: string): string | null {
  const analysis = analyzeAudioUrl(url);
  return analysis.fileId || null;
}

export function resolveAudioUrl(inputUrl: string): ResolvedAudioSource {
  const analysis = analyzeAudioUrl(inputUrl);

  if (!inputUrl || inputUrl.trim() === '') {
    return {
      streamUrl: SAMPLE_AUDIO_FALLBACKS[0],
      candidateUrls: SAMPLE_AUDIO_FALLBACKS,
      isGoogleDrive: false,
      originalUrl: inputUrl,
    };
  }

  if (analysis.isGoogleDrive && analysis.fileId) {
    return {
      streamUrl: analysis.candidateUrls[0],
      candidateUrls: analysis.candidateUrls,
      isGoogleDrive: true,
      driveFileId: analysis.fileId,
      originalUrl: inputUrl,
      previewEmbedUrl: analysis.previewEmbedUrl,
      directWebUrl: analysis.directWebUrl,
      isFolder: false,
    };
  }

  if (analysis.isFolder) {
    return {
      streamUrl: SAMPLE_AUDIO_FALLBACKS[0],
      candidateUrls: SAMPLE_AUDIO_FALLBACKS,
      isGoogleDrive: true,
      originalUrl: inputUrl,
      isFolder: true,
    };
  }

  // Regular audio URL (e.g. Supabase Storage, CDN, public mp3)
  const trimmed = inputUrl.trim();
  return {
    streamUrl: trimmed,
    candidateUrls: [trimmed, ...SAMPLE_AUDIO_FALLBACKS],
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
