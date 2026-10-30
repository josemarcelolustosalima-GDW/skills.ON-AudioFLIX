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
  likes?: number;
  unlikes?: number;
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

export interface UserAccessLog {
  id: string;
  userId: string;
  userName: string;
  userLogin: string;
  userRole?: string;
  userAvatar?: string;
  loginAt: string; // Data e Hora do início da sessão (ISO)
  lastActiveAt: string; // Data e Hora da última interação / heartbeat (ISO)
  durationMinutes: number; // Tempo ativo conectado em minutos
  status: 'online' | 'idle' | 'closed'; // online (<5m), idle (5-30m), closed (>30m ou logout)
  deviceInfo: string; // Ex: "Computador Windows • Chrome" ou "Smartphone Android"
  episodesHeard?: string[]; // Títulos de episódios ouvidos durante esta sessão
}

export type SuggestionSourceType = 'youtube' | 'book' | 'podcast' | 'topic' | 'article' | 'other';
export type SuggestionStatus = 'pending' | 'in_analysis' | 'approved' | 'in_production' | 'rejected';

export interface SeriesSuggestion {
  id: string;
  userId: string;
  userName: string;
  userLogin: string;
  userAvatar?: string;
  themeTitle: string; // Título ou Tema foco sugerido
  sourceType: SuggestionSourceType; // 'youtube' | 'book' | 'podcast' | 'topic' | 'article' | 'other'
  sourceReference: string; // Link do YouTube, Título do Livro/Autor, Link do Podcast ou Referência
  category?: string; // Categoria / Área de aplicação (ex: Liderança, Negociação, Soft Skills)
  notes?: string; // Por que essa série agregaria valor à mentoria?
  status: SuggestionStatus; // 'pending' | 'in_analysis' | 'approved' | 'in_production' | 'rejected'
  adminNotes?: string; // Avaliação e feedback do Administrador
  createdAt: string; // ISO date
  updatedAt?: string;
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
  listenProgress: Record<string, {
    episodeId: string;
    currentTime: number;
    duration: number;
    completed: boolean;
    lastPlayed: string;
  }>;
  createdAt?: string;
  lastLoginAt?: string; // Data e hora do último acesso registrado
  lastActiveAt?: string; // Data e hora da última atividade registrada
  totalAccessCount?: number; // Total acumulado de acessos/sessões
}

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  useLiveSupabase: boolean;
  status: 'idle' | 'connected' | 'error';
  errorMessage?: string;
}
