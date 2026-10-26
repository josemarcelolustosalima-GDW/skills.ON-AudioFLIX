export interface AudioEpisode {
  id: string;
  seriesId: string;
  episodeNumber: number;
  season: number;
  title: string;
  synopsis: string;
  durationMinutes: number;
  durationFormatted: string;
  audioUrl: string; // Google Drive share link or direct audio link
  imageUrl: string; // External image link or generated image
  isSynopsis?: boolean; // True if this episode is the introduction/synopsis (Episode 0)
  createdAt: string;
}

export interface AudioSeries {
  id: string;
  title: string;
  subtitle?: string;
  synopsis: string;
  category: string;
  heroImage: string; // 16:9 banner
  posterImage: string; // Card cover
  matchScore: number; // e.g. 98%
  releaseYear: number;
  ratingBadge: string; // e.g. "14+", "Livre", "16+"
  audioQuality: string; // e.g. "Áudio HD Imersivo", "Dolby Atmos"
  mentor: string;
  mentorRole: string;
  tags: string[];
  featured?: boolean;
  likes: number;
  unlikes: number;
  totalListens: number;
  episodeDurationEstimate?: string; // e.g. "18 a 25 min por episódio"
  createdAt: string;
}

export type ReactionType = 'like' | 'double_like' | 'dislike' | null;

export interface UserReaction {
  seriesId: string;
  reaction: ReactionType;
  timestamp: string;
}

export interface UserProfile {
  id: string;
  name: string;
  login: string; // LOGIN do usuário (ex: skills.on.admin)
  password: string; // SENHA visível e editável pelo admin
  email: string;
  role: 'admin' | 'user';
  avatar: string;
  myList: string[]; // series IDs
  reactions: Record<string, ReactionType>; // seriesId -> reaction
  listenProgress: Record<string, { episodeId: string; currentTime: number; duration: number; completed: boolean; lastPlayed: string }>;
  createdAt?: string;
}

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  useLiveSupabase: boolean;
  status: 'idle' | 'connected' | 'error';
  errorMessage?: string;
}
