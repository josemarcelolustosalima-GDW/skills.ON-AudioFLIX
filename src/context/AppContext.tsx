import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AudioSeries, AudioEpisode, UserProfile, ReactionType, SupabaseConfig } from '../types';
import { INITIAL_SERIES, INITIAL_EPISODES, INITIAL_USERS } from '../data/initialData';
import { resolveAudioUrl } from '../utils/audioResolver';
import { encryptPassword, decryptPassword } from '../utils/crypto';
import {
  decodeCatalogFromUrl,
  encodeCatalogForUrl,
  downloadCatalogFile,
  testSupabaseConnection,
  pushCatalogToSupabase,
  pullCatalogFromSupabase,
  pushSingleEpisodeToSupabase,
  deleteEpisodeFromSupabase,
  pushSingleSeriesToSupabase,
  deleteSeriesFromSupabase,
} from '../utils/syncManager';

interface AppContextType {
  series: AudioSeries[];
  episodes: AudioEpisode[];
  currentUser: UserProfile;
  allUsers: UserProfile[];
  currentPlayingEpisode: AudioEpisode | null;
  currentPlayingSeries: AudioSeries | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  volume: number;
  isMuted: boolean;
  audioSourceInfo: { isGoogleDrive: boolean; streamUrl: string };
  audioCandidateUrls: string[];
  currentCandidateIndex: number;
  isUsingEmbedPlayer: boolean;
  audioError: string | null;
  audioLoading: boolean;
  drivePreviewEmbedUrl: string | null;
  driveDirectWebUrl: string | null;
  isPlayerExpanded: boolean;
  setIsPlayerExpanded: (expanded: boolean) => void;
  selectedSeriesForModal: AudioSeries | null;
  currentView: 'home' | 'series_catalog' | 'my_list' | 'top_rated' | 'admin';
  searchQuery: string;
  activeCategory: string;
  supabaseConfig: SupabaseConfig;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isLoggedIn: boolean;
  isMobilePreview: boolean;
  toggleMobilePreview: () => void;
  
  // Multi-Device Sync & Cloud
  syncNotification: string | null;
  clearSyncNotification: () => void;
  exportCatalog: () => void;
  importCatalog: (jsonText: string) => { success: boolean; message: string };
  generateSyncUrl: () => string;
  testSupabase: (url: string, key: string) => Promise<{ ok: boolean; message: string }>;
  pushToSupabaseCloud: () => Promise<{ ok: boolean; message: string }>;
  pullFromSupabaseCloud: () => Promise<{ ok: boolean; message: string }>;

  // Actions
  playEpisode: (episode: AudioEpisode, series?: AudioSeries) => void;
  stopAudio: () => void;
  closePlayerAndGoHome: () => void;
  toggleEmbedPlayer: (useEmbed?: boolean) => void;
  retryPlayback: () => void;
  togglePlayPause: () => void;
  seekTo: (time: number) => void;
  skipSeconds: (seconds: number) => void;
  setSpeed: (rate: number) => void;
  setAudioVolume: (vol: number) => void;
  toggleMute: () => void;
  nextEpisode: () => void;
  prevEpisode: () => void;
  toggleReaction: (seriesId: string, reaction: ReactionType) => void;
  toggleMyList: (seriesId: string) => void;
  openSeriesModal: (series: AudioSeries) => void;
  closeSeriesModal: () => void;
  setCurrentView: (view: 'home' | 'series_catalog' | 'my_list' | 'top_rated' | 'admin') => void;
  setSearchQuery: (query: string) => void;
  setActiveCategory: (cat: string) => void;
  loginWithCredentials: (loginOrEmail: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  loginAs: (userId: string) => void;
  switchUserRole: (role: 'admin' | 'user') => void;
  createUser: (userData: { name: string; login: string; password: string; role: 'admin' | 'user'; email?: string }) => Promise<UserProfile>;
  updateUser: (user: UserProfile) => Promise<void>;
  deleteUser: (userId: string) => void;
  addOrUpdateSeries: (seriesData: AudioSeries) => void;
  setFeaturedSeries: (seriesId: string) => void;
  deleteSeries: (seriesId: string) => void;
  addOrUpdateEpisode: (episodeData: AudioEpisode) => void;
  deleteEpisode: (episodeId: string) => void;
  updateSupabaseConfig: (config: Partial<SupabaseConfig>) => void;
  resetAllData: () => void;
}

const STORAGE_KEY_SERIES = 'skills_on_series_v2';
const STORAGE_KEY_EPISODES = 'skills_on_episodes_v2';
const STORAGE_KEY_USERS = 'skills_on_users_v2';
const STORAGE_KEY_CURRENT_USER_ID = 'skills_on_active_user_v2';
const STORAGE_KEY_LOGGED_IN = 'skills_on_logged_in_v2';
const STORAGE_KEY_SUPABASE = 'skills_on_supabase_v2';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load from localStorage or defaults
  const [series, setSeries] = useState<AudioSeries[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SERIES);
      return saved ? JSON.parse(saved) : INITIAL_SERIES;
    } catch {
      return INITIAL_SERIES;
    }
  });

  const [episodes, setEpisodes] = useState<AudioEpisode[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EPISODES);
      if (saved) {
        let loaded: AudioEpisode[] = JSON.parse(saved);
        const savedSeriesRaw = localStorage.getItem(STORAGE_KEY_SERIES);
        const currentSeriesList: AudioSeries[] = savedSeriesRaw ? JSON.parse(savedSeriesRaw) : INITIAL_SERIES;
        const currentSeriesIds = new Set(currentSeriesList.map(s => s.id.trim().toLowerCase()));

        // Ensure initial synopsis audios (episode 0) are present only for series that actually exist in catalog
        const missingZeros = INITIAL_EPISODES.filter(
          ie => (ie.episodeNumber === 0 || ie.isSynopsis) &&
            currentSeriesIds.has(ie.seriesId.trim().toLowerCase()) &&
            !loaded.some(le => le.seriesId.trim().toLowerCase() === ie.seriesId.trim().toLowerCase() && (le.episodeNumber === 0 || le.isSynopsis))
        );
        if (missingZeros.length > 0) {
          loaded = [...missingZeros, ...loaded];
          localStorage.setItem(STORAGE_KEY_EPISODES, JSON.stringify(loaded));
        }
        return loaded;
      }
      return INITIAL_EPISODES;
    } catch {
      return INITIAL_EPISODES;
    }
  });

  const [syncNotification, setSyncNotification] = useState<string | null>(null);
  const clearSyncNotification = () => setSyncNotification(null);

  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USERS);
      let users: UserProfile[] = saved ? JSON.parse(saved) : INITIAL_USERS;
      // Always guarantee the default admin credentials specified by user:
      const adminIdx = users.findIndex(u => u.role === 'admin' || u.id === 'user-admin' || u.login === 'skills.on.admin');
      if (adminIdx !== -1) {
        users[adminIdx] = {
          ...users[adminIdx],
          login: 'skills.on.admin',
          password: 'jmlustosa.skills.on!',
          name: users[adminIdx].name || 'skills.ON! Administrador',
          role: 'admin',
          avatar: '/assets/aistudio/skillsON__INSTAGRAM_6edfb550.jpg',
        };
      } else {
        users = [INITIAL_USERS[0], ...users];
      }
      return users;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CURRENT_USER_ID);
      return saved || 'user-admin';
    } catch {
      return 'user-admin';
    }
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOGGED_IN);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SUPABASE);
      return saved
        ? JSON.parse(saved)
        : {
            supabaseUrl: '',
            supabaseAnonKey: '',
            useLiveSupabase: false,
            status: 'idle',
          };
    } catch {
      return {
        supabaseUrl: '',
        supabaseAnonKey: '',
        useLiveSupabase: false,
        status: 'idle',
      };
    }
  });

  // UI state
  const [currentView, setCurrentView] = useState<'home' | 'series_catalog' | 'my_list' | 'top_rated' | 'admin'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todas');
  const [selectedSeriesForModal, setSelectedSeriesForModal] = useState<AudioSeries | null>(null);

  // Audio Player State
  const [currentPlayingEpisode, setCurrentPlayingEpisode] = useState<AudioEpisode | null>(null);
  const [currentPlayingSeries, setCurrentPlayingSeries] = useState<AudioSeries | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [audioSourceInfo, setAudioSourceInfo] = useState<{ isGoogleDrive: boolean; streamUrl: string }>({
    isGoogleDrive: false,
    streamUrl: '',
  });

  // Multi-candidate stream and failover state
  const [audioCandidateUrls, setAudioCandidateUrls] = useState<string[]>([]);
  const [currentCandidateIndex, setCurrentCandidateIndex] = useState<number>(0);
  const [isUsingEmbedPlayer, setIsUsingEmbedPlayer] = useState<boolean>(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState<boolean>(false);
  const [drivePreviewEmbedUrl, setDrivePreviewEmbedUrl] = useState<string | null>(null);
  const [driveDirectWebUrl, setDriveDirectWebUrl] = useState<string | null>(null);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState<boolean>(false);
  const [isMobilePreview, setIsMobilePreview] = useState<boolean>(false);
  const toggleMobilePreview = () => setIsMobilePreview(prev => !prev);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const candidateUrlsRef = useRef<string[]>([]);
  const candidateIdxRef = useRef<number>(0);
  const isGoogleDriveRef = useRef<boolean>(false);

  // Current user derived
  const currentUser = allUsers.find(u => u.id === currentUserId) || allUsers[0];

  // Persist state to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SERIES, JSON.stringify(series));
    } catch (e) {
      console.warn('Failed to save series', e);
    }
  }, [series]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_EPISODES, JSON.stringify(episodes));
    } catch (e) {
      console.warn('Failed to save episodes', e);
    }
  }, [episodes]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(allUsers));
    } catch (e) {
      console.warn('Failed to save users', e);
    }
  }, [allUsers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CURRENT_USER_ID, currentUserId);
    } catch (e) {
      console.warn('Failed to save active user', e);
    }
  }, [currentUserId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LOGGED_IN, JSON.stringify(isLoggedIn));
    } catch (e) {
      console.warn('Failed to save login status', e);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SUPABASE, JSON.stringify(supabaseConfig));
    } catch (e) {
      console.warn('Failed to save supabase config', e);
    }
  }, [supabaseConfig]);

  // 1. Startup Effect: Check URL for sync data (?sync=... or #sync=...) or reset parameter (?limpar=true)
  useEffect(() => {
    try {
      const hash = window.location.hash;
      const search = window.location.search;
      const params = new URLSearchParams(search);

      // Support instant cache clear via URL: ?limpar=true or ?reset=true or #limpar
      if (params.get('limpar') || params.get('reset') || hash === '#limpar' || hash === '#reset') {
        localStorage.removeItem(STORAGE_KEY_SERIES);
        localStorage.removeItem(STORAGE_KEY_EPISODES);
        localStorage.removeItem(STORAGE_KEY_USERS);
        localStorage.removeItem(STORAGE_KEY_CURRENT_USER_ID);
        localStorage.removeItem(STORAGE_KEY_LOGGED_IN);
        localStorage.removeItem(STORAGE_KEY_SUPABASE);
        window.history.replaceState(null, '', window.location.pathname);
        window.location.reload();
        return;
      }

      let syncPayload: string | null = null;

      if (hash.startsWith('#sync=')) {
        syncPayload = hash.substring(6);
      } else if (params.get('sync')) {
        syncPayload = params.get('sync');
      }

      if (syncPayload) {
        const decoded = decodeCatalogFromUrl(syncPayload);
        if (decoded && Array.isArray(decoded.series) && Array.isArray(decoded.episodes)) {
          setSeries(decoded.series);
          setEpisodes(decoded.episodes);
          if (Array.isArray(decoded.users) && decoded.users.length > 0) {
            setAllUsers(decoded.users);
            localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(decoded.users));
          }
          if ((decoded as any).supabaseConfig) {
            setSupabaseConfig((decoded as any).supabaseConfig);
            localStorage.setItem(STORAGE_KEY_SUPABASE, JSON.stringify((decoded as any).supabaseConfig));
          }
          localStorage.setItem(STORAGE_KEY_SERIES, JSON.stringify(decoded.series));
          localStorage.setItem(STORAGE_KEY_EPISODES, JSON.stringify(decoded.episodes));
          window.history.replaceState(null, '', window.location.pathname);
          setSyncNotification(`🎉 Sincronização Concluída! ${decoded.series.length} séries e ${decoded.episodes.length} episódios importados com sucesso para este dispositivo!`);
        }
      }
    } catch (e) {
      console.warn('Sync URL check error', e);
    }
  }, []);

  // 2. Startup Effect: Check for public /catalog.json if local storage is clean (new device/clean browser)
  useEffect(() => {
    try {
      const savedSeries = localStorage.getItem(STORAGE_KEY_SERIES);
      if (!savedSeries) {
        fetch('/catalog.json')
          .then(res => (res.ok ? res.json() : null))
          .then(data => {
            if (data && Array.isArray(data.series) && data.series.length > 0) {
              setSeries(data.series);
              localStorage.setItem(STORAGE_KEY_SERIES, JSON.stringify(data.series));
              if (Array.isArray(data.episodes) && data.episodes.length > 0) {
                setEpisodes(data.episodes);
                localStorage.setItem(STORAGE_KEY_EPISODES, JSON.stringify(data.episodes));
              }
              if (Array.isArray(data.users) && data.users.length > 0) {
                setAllUsers(data.users);
                localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(data.users));
              }
            }
          })
          .catch(() => {});
      }
    } catch {}
  }, []);

  // 3. Startup Effect: Pull from Supabase if configured and active (NON-DESTRUCTIVE MERGE)
  useEffect(() => {
    if (supabaseConfig.useLiveSupabase && supabaseConfig.supabaseUrl && supabaseConfig.supabaseAnonKey) {
      pullCatalogFromSupabase(supabaseConfig.supabaseUrl, supabaseConfig.supabaseAnonKey)
        .then(res => {
          if (res.ok && res.series && res.episodes) {
            // 1. Safe non-destructive merge for series
            setSeries(currentSeries => {
              const seriesMap = new Map<string, AudioSeries>();
              // Keep all local series first
              currentSeries.forEach(s => seriesMap.set(s.id, s));
              // Merge or update from Supabase
              res.series!.forEach(s => seriesMap.set(s.id, s));
              const merged = Array.from(seriesMap.values());
              try {
                localStorage.setItem(STORAGE_KEY_SERIES, JSON.stringify(merged));
              } catch (e) {}
              return merged;
            });

            // 2. Safe non-destructive merge for episodes (NEVER deletes newly added local episodes!)
            setEpisodes(currentEpisodes => {
              const epMap = new Map<string, AudioEpisode>();
              // Keep all current local episodes first
              currentEpisodes.forEach(e => epMap.set(e.id, e));
              // Merge or update from Supabase
              res.episodes!.forEach(e => epMap.set(e.id, e));
              const merged = Array.from(epMap.values());
              try {
                localStorage.setItem(STORAGE_KEY_EPISODES, JSON.stringify(merged));
              } catch (e) {}

              // Auto-push any local episodes that aren't yet in Supabase
              const supabaseEpIds = new Set(res.episodes!.map(e => e.id));
              const localOnlyEps = currentEpisodes.filter(e => !supabaseEpIds.has(e.id));
              if (localOnlyEps.length > 0) {
                localOnlyEps.forEach(le => {
                  pushSingleEpisodeToSupabase(supabaseConfig.supabaseUrl, supabaseConfig.supabaseAnonKey, le);
                });
              }

              return merged;
            });

            setSupabaseConfig(prev => ({ ...prev, status: 'connected', errorMessage: undefined }));
          }
        })
        .catch(err => {
          console.warn('Supabase initial pull error:', err);
        });
    }
  }, [supabaseConfig.useLiveSupabase, supabaseConfig.supabaseUrl, supabaseConfig.supabaseAnonKey]);

  // Audio element events binding with smart failover
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (currentPlayingEpisode && audio.duration > 0) {
        setAllUsers(prevUsers =>
          prevUsers.map(user => {
            if (user.id === currentUser.id) {
              return {
                ...user,
                listenProgress: {
                  ...user.listenProgress,
                  [currentPlayingEpisode.id]: {
                    episodeId: currentPlayingEpisode.id,
                    currentTime: audio.currentTime,
                    duration: audio.duration,
                    completed: audio.currentTime / audio.duration > 0.9,
                    lastPlayed: new Date().toISOString(),
                  },
                },
              };
            }
            return user;
          })
        );
      }
    };

    const onLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const onCanPlay = () => {
      setAudioLoading(false);
      setAudioError(null);
    };

    const onPlaying = () => {
      setAudioLoading(false);
      setIsPlaying(true);
      setAudioError(null);
    };

    const onWaiting = () => {
      setAudioLoading(true);
    };

    const onEnded = () => {
      setIsPlaying(false);
      nextEpisode();
    };

    const onError = () => {
      console.warn('[Audio] Playback error on candidate stream:', audio.src);
      const nextIdx = candidateIdxRef.current + 1;
      const candidates = candidateUrlsRef.current;

      if (nextIdx < candidates.length) {
        console.log(`[Audio] Auto-failing over to stream candidate #${nextIdx}: ${candidates[nextIdx]}`);
        candidateIdxRef.current = nextIdx;
        setCurrentCandidateIndex(nextIdx);
        setAudioSourceInfo(prev => ({ ...prev, streamUrl: candidates[nextIdx] }));
        audio.src = candidates[nextIdx];
        audio.load();
        audio.play().catch(e => console.warn('[Audio] Failover retry error:', e));
      } else {
        console.warn('[Audio] All direct stream candidates exhausted');
        setAudioLoading(false);
        setIsPlaying(false);
        if (isGoogleDriveRef.current) {
          setAudioError('O Google Drive bloqueou o streaming direto HTML5 para este arquivo (bloqueio de antivírus/CORS). Ativando o Player Seguro Integrado do Google Drive...');
          setIsUsingEmbedPlayer(true);
        } else {
          setAudioError('Não foi possível carregar este áudio. Verifique se o link está acessível.');
        }
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [currentPlayingEpisode, currentUser.id]);

  // Play episode action with multi-candidate generation
  const playEpisode = (episode: AudioEpisode, targetSeries?: AudioSeries) => {
    const parentSeries = targetSeries || series.find(s => s.id === episode.seriesId) || null;
    setCurrentPlayingEpisode(episode);
    setCurrentPlayingSeries(parentSeries);
    setIsPlayerExpanded(true);

    const resolved = resolveAudioUrl(episode.audioUrl);
    setAudioSourceInfo({
      isGoogleDrive: resolved.isGoogleDrive,
      streamUrl: resolved.streamUrl,
    });
    setAudioCandidateUrls(resolved.candidateUrls);
    candidateUrlsRef.current = resolved.candidateUrls;
    candidateIdxRef.current = 0;
    isGoogleDriveRef.current = resolved.isGoogleDrive;
    setCurrentCandidateIndex(0);
    setDrivePreviewEmbedUrl(resolved.previewEmbedUrl || null);
    setDriveDirectWebUrl(resolved.directWebUrl || null);
    setIsUsingEmbedPlayer(false);
    setAudioError(null);
    setAudioLoading(true);

    if (audioRef.current) {
      const initialSrc = resolved.candidateUrls[0] || resolved.streamUrl;
      audioRef.current.src = initialSrc;
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.load();
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setAudioLoading(false);
        })
        .catch(err => {
          console.warn('[Audio] Initial play request pending or interaction required:', err);
        });
    }

    if (parentSeries) {
      setSeries(prev =>
        prev.map(s => (s.id === parentSeries.id ? { ...s, totalListens: s.totalListens + 1 } : s))
      );
    }
  };

  const toggleEmbedPlayer = (useEmbed?: boolean) => {
    setIsUsingEmbedPlayer(prev => {
      const nextVal = useEmbed !== undefined ? useEmbed : !prev;
      if (nextVal && audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      return nextVal;
    });
  };

  const retryPlayback = () => {
    if (!audioRef.current || !currentPlayingEpisode) return;
    const resolved = resolveAudioUrl(currentPlayingEpisode.audioUrl);
    setAudioCandidateUrls(resolved.candidateUrls);
    candidateUrlsRef.current = resolved.candidateUrls;
    candidateIdxRef.current = 0;
    setCurrentCandidateIndex(0);
    setAudioError(null);
    setAudioLoading(true);
    setIsUsingEmbedPlayer(false);
    audioRef.current.src = resolved.candidateUrls[0];
    audioRef.current.load();
    audioRef.current
      .play()
      .then(() => {
        setIsPlaying(true);
        setAudioLoading(false);
      })
      .catch(console.warn);
  };

  const stopAudio = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const closePlayerAndGoHome = () => {
    stopAudio();
    setIsPlayerExpanded(false);
    setCurrentPlayingEpisode(null);
    setCurrentPlayingSeries(null);
    setSelectedSeriesForModal(null);
    setCurrentView('home');
    setSearchQuery('');
  };

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(console.warn);
    }
  };

  const seekTo = (time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const skipSeconds = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const target = Math.max(0, Math.min(audio.currentTime + seconds, audio.duration || 999999));
    audio.currentTime = target;
    setCurrentTime(target);
  };

  const setSpeed = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const setAudioVolume = (vol: number) => {
    setVolume(vol);
    setIsMuted(false);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (audioRef.current) {
      audioRef.current.volume = newMuted ? 0 : volume;
    }
  };

  const nextEpisode = () => {
    if (!currentPlayingEpisode) return;
    const seriesEpisodes = episodes
      .filter(e => e.seriesId.trim().toLowerCase() === currentPlayingEpisode.seriesId.trim().toLowerCase())
      .sort((a, b) => (Number(a.episodeNumber) || 0) - (Number(b.episodeNumber) || 0));
    const currentIndex = seriesEpisodes.findIndex(e => e.id === currentPlayingEpisode.id);
    if (currentIndex >= 0 && currentIndex < seriesEpisodes.length - 1) {
      playEpisode(seriesEpisodes[currentIndex + 1], currentPlayingSeries || undefined);
    }
  };

  const prevEpisode = () => {
    if (!currentPlayingEpisode) return;
    const seriesEpisodes = episodes
      .filter(e => e.seriesId.trim().toLowerCase() === currentPlayingEpisode.seriesId.trim().toLowerCase())
      .sort((a, b) => (Number(a.episodeNumber) || 0) - (Number(b.episodeNumber) || 0));
    const currentIndex = seriesEpisodes.findIndex(e => e.id === currentPlayingEpisode.id);
    if (currentIndex > 0) {
      playEpisode(seriesEpisodes[currentIndex - 1], currentPlayingSeries || undefined);
    }
  };

  // Like / Unlike Netflix style
  const toggleReaction = (seriesId: string, reaction: ReactionType) => {
    const previousReaction = currentUser.reactions[seriesId] || null;
    const nextReaction = previousReaction === reaction ? null : reaction;

    setAllUsers(prevUsers =>
      prevUsers.map(user => {
        if (user.id === currentUser.id) {
          const updated = { ...user.reactions };
          if (nextReaction === null) {
            delete updated[seriesId];
          } else {
            updated[seriesId] = nextReaction;
          }
          return { ...user, reactions: updated };
        }
        return user;
      })
    );

    setSeries(prevSeries =>
      prevSeries.map(s => {
        if (s.id !== seriesId) return s;
        let likesDelta = 0;
        let unlikesDelta = 0;

        if (previousReaction === 'like' || previousReaction === 'double_like') {
          likesDelta -= previousReaction === 'double_like' ? 2 : 1;
        } else if (previousReaction === 'dislike') {
          unlikesDelta -= 1;
        }

        if (nextReaction === 'like' || nextReaction === 'double_like') {
          likesDelta += nextReaction === 'double_like' ? 2 : 1;
        } else if (nextReaction === 'dislike') {
          unlikesDelta += 1;
        }

        return {
          ...s,
          likes: Math.max(0, s.likes + likesDelta),
          unlikes: Math.max(0, s.unlikes + unlikesDelta),
        };
      })
    );
  };

  const toggleMyList = (seriesId: string) => {
    setAllUsers(prevUsers =>
      prevUsers.map(user => {
        if (user.id === currentUser.id) {
          const inList = user.myList.includes(seriesId);
          return {
            ...user,
            myList: inList ? user.myList.filter(id => id !== seriesId) : [...user.myList, seriesId],
          };
        }
        return user;
      })
    );
  };

  const openSeriesModal = (targetSeries: AudioSeries) => {
    setSelectedSeriesForModal(targetSeries);
  };

  const closeSeriesModal = () => {
    setSelectedSeriesForModal(null);
  };

  // Background migration: encrypt any plain text passwords with AES-GCM
  useEffect(() => {
    const encryptUnprotectedPasswords = async () => {
      let changed = false;
      const securedUsers = await Promise.all(
        allUsers.map(async u => {
          if (!u.password.startsWith('enc:') && !u.password.startsWith('enc_b64:')) {
            changed = true;
            const encrypted = await encryptPassword(u.password);
            return { ...u, password: encrypted };
          }
          return u;
        })
      );
      if (changed) {
        setAllUsers(securedUsers);
      }
    };
    encryptUnprotectedPasswords();
  }, []);

  // Login with Credentials: supports Login or Email + Password with cryptographic verification
  const loginWithCredentials = async (loginOrEmail: string, pass: string): Promise<{ success: boolean; message?: string }> => {
    const cleanLogin = loginOrEmail.trim().toLowerCase();

    for (const u of allUsers) {
      const matchLogin = u.login?.toLowerCase() === cleanLogin || u.email?.toLowerCase() === cleanLogin;
      if (!matchLogin) continue;

      let actualPassword = u.password;
      if (u.password.startsWith('enc:') || u.password.startsWith('enc_b64:')) {
        actualPassword = await decryptPassword(u.password);
      }

      if (actualPassword === pass || u.password === pass) {
        setCurrentUserId(u.id);
        setIsLoggedIn(true);
        if (u.role === 'admin') {
          setCurrentView('admin');
        } else {
          setCurrentView('home');
        }
        return { success: true };
      }
    }

    // Specific admin credentials fallback
    if (cleanLogin === 'skills.on.admin' && pass === 'jmlustosa.skills.on!') {
      const admin = allUsers.find(u => u.role === 'admin') || allUsers[0];
      setCurrentUserId(admin.id);
      setIsLoggedIn(true);
      setCurrentView('admin');
      return { success: true };
    }

    return {
      success: false,
      message: 'Credenciais inválidas. Verifique seu login e senha.',
    };
  };

  const logout = () => {
    setIsLoggedIn(false);
    setCurrentView('home');
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const loginAs = (userId: string) => {
    const target = allUsers.find(u => u.id === userId);
    if (target) {
      setCurrentUserId(target.id);
      setIsLoggedIn(true);
      if (target.role === 'admin') {
        setCurrentView('admin');
      } else {
        setCurrentView('home');
      }
    }
  };

  const switchUserRole = (role: 'admin' | 'user') => {
    const userToSwitch = allUsers.find(u => u.role === role);
    if (userToSwitch) {
      setCurrentUserId(userToSwitch.id);
    } else {
      setAllUsers(prev =>
        prev.map(u => (u.id === currentUser.id ? { ...u, role } : u))
      );
    }
  };

  // User Management Methods (For Admin) with AES-GCM Encryption
  const createUser = async (userData: { name: string; login: string; password: string; role: 'admin' | 'user'; email?: string }): Promise<UserProfile> => {
    const encrypted = await encryptPassword(userData.password);
    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      name: userData.name.trim(),
      login: userData.login.trim(),
      password: encrypted,
      email: userData.email?.trim() || `${userData.login.trim()}@skillson.com`,
      role: userData.role,
      avatar: '/assets/aistudio/skillsON__INSTAGRAM_6edfb550.jpg',
      myList: [],
      reactions: {},
      listenProgress: {},
      createdAt: new Date().toISOString(),
    };

    setAllUsers(prev => [...prev, newUser]);
    return newUser;
  };

  const updateUser = async (updatedUser: UserProfile): Promise<void> => {
    let encrypted = updatedUser.password;
    if (!encrypted.startsWith('enc:') && !encrypted.startsWith('enc_b64:')) {
      encrypted = await encryptPassword(updatedUser.password);
    }
    setAllUsers(prev => prev.map(u => (u.id === updatedUser.id ? { ...updatedUser, password: encrypted } : u)));
  };

  const deleteUser = (userId: string) => {
    // Prevent deleting the main admin user
    if (userId === 'user-admin' || currentUser.id === userId) {
      return;
    }
    setAllUsers(prev => prev.filter(u => u.id !== userId));
  };

  const addOrUpdateSeries = (seriesData: AudioSeries) => {
    setSeries(prev => {
      let updated: AudioSeries[];
      const exists = prev.some(s => s.id === seriesData.id);
      if (exists) {
        updated = prev.map(s => (s.id === seriesData.id ? seriesData : s));
      } else {
        updated = [seriesData, ...prev];
      }
      if (seriesData.featured) {
        updated = updated.map(s => ({
          ...s,
          featured: s.id === seriesData.id,
        }));
      }
      try {
        localStorage.setItem(STORAGE_KEY_SERIES, JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });

    // Real-time Supabase live sync
    if (supabaseConfig.useLiveSupabase && supabaseConfig.supabaseUrl && supabaseConfig.supabaseAnonKey) {
      pushSingleSeriesToSupabase(supabaseConfig.supabaseUrl, supabaseConfig.supabaseAnonKey, seriesData);
    }
  };

  const setFeaturedSeries = (seriesId: string) => {
    setSeries(prev => {
      const updated = prev.map(s => ({
        ...s,
        featured: s.id === seriesId,
      }));
      try {
        localStorage.setItem(STORAGE_KEY_SERIES, JSON.stringify(updated));
      } catch (err) {
        console.warn(err);
      }
      return updated;
    });
  };

  const deleteSeries = (seriesId: string) => {
    setSeries(prev => prev.filter(s => s.id !== seriesId));
    setEpisodes(prev => prev.filter(e => e.seriesId !== seriesId));
    if (selectedSeriesForModal?.id === seriesId) {
      setSelectedSeriesForModal(null);
    }
    if (currentPlayingSeries?.id === seriesId) {
      setCurrentPlayingEpisode(null);
      setCurrentPlayingSeries(null);
      setIsPlaying(false);
    }

    // Real-time Supabase live sync
    if (supabaseConfig.useLiveSupabase && supabaseConfig.supabaseUrl && supabaseConfig.supabaseAnonKey) {
      deleteSeriesFromSupabase(supabaseConfig.supabaseUrl, supabaseConfig.supabaseAnonKey, seriesId);
    }
  };

  const addOrUpdateEpisode = (episodeData: AudioEpisode) => {
    const cleanEpisode: AudioEpisode = {
      ...episodeData,
      seriesId: episodeData.seriesId.trim(),
      id: episodeData.id.trim(),
    };
    setEpisodes(prev => {
      const exists = prev.some(e => e.id.trim() === cleanEpisode.id);
      let updated: AudioEpisode[];
      if (exists) {
        updated = prev.map(e => (e.id.trim() === cleanEpisode.id ? cleanEpisode : e));
      } else {
        updated = [...prev, cleanEpisode];
      }
      try {
        localStorage.setItem(STORAGE_KEY_EPISODES, JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to save episodes to localStorage', err);
      }
      return updated;
    });

    // Real-time Supabase live sync (guarantees episode is never lost on refresh or device exit!)
    if (supabaseConfig.useLiveSupabase && supabaseConfig.supabaseUrl && supabaseConfig.supabaseAnonKey) {
      pushSingleEpisodeToSupabase(supabaseConfig.supabaseUrl, supabaseConfig.supabaseAnonKey, cleanEpisode);
    }
  };

  const deleteEpisode = (episodeId: string) => {
    setEpisodes(prev => {
      const updated = prev.filter(e => e.id.trim() !== episodeId.trim());
      try {
        localStorage.setItem(STORAGE_KEY_EPISODES, JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to update episodes in localStorage', err);
      }
      return updated;
    });
    if (currentPlayingEpisode?.id.trim() === episodeId.trim()) {
      setCurrentPlayingEpisode(null);
      setIsPlaying(false);
    }

    // Real-time Supabase live sync
    if (supabaseConfig.useLiveSupabase && supabaseConfig.supabaseUrl && supabaseConfig.supabaseAnonKey) {
      deleteEpisodeFromSupabase(supabaseConfig.supabaseUrl, supabaseConfig.supabaseAnonKey, episodeId);
    }
  };

  const exportCatalog = () => {
    downloadCatalogFile(series, episodes, allUsers);
  };

  const importCatalog = (jsonText: string): { success: boolean; message: string } => {
    try {
      const data = JSON.parse(jsonText);
      const parsedSeries: AudioSeries[] = Array.isArray(data.series) ? data.series : (Array.isArray(data) ? data : []);
      const parsedEpisodes: AudioEpisode[] = Array.isArray(data.episodes) ? data.episodes : [];
      const parsedUsers: UserProfile[] = Array.isArray(data.users) ? data.users : [];

      if (parsedSeries.length === 0 && parsedEpisodes.length === 0) {
        return { success: false, message: 'Nenhuma série ou episódio válido encontrado no arquivo JSON.' };
      }

      if (parsedSeries.length > 0) {
        setSeries(parsedSeries);
        localStorage.setItem(STORAGE_KEY_SERIES, JSON.stringify(parsedSeries));
      }
      if (parsedEpisodes.length > 0) {
        setEpisodes(parsedEpisodes);
        localStorage.setItem(STORAGE_KEY_EPISODES, JSON.stringify(parsedEpisodes));
      }
      if (parsedUsers.length > 0) {
        setAllUsers(parsedUsers);
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(parsedUsers));
      }

      setSyncNotification(`✅ Catálogo importado com sucesso! (${parsedSeries.length} séries, ${parsedEpisodes.length} episódios)`);
      return {
        success: true,
        message: `Sucesso: ${parsedSeries.length} séries e ${parsedEpisodes.length} episódios importados!`,
      };
    } catch (e: any) {
      return { success: false, message: `Erro ao processar arquivo JSON: ${e?.message || 'Formato inválido'}` };
    }
  };

  const generateSyncUrl = (): string => {
    const encoded = encodeCatalogForUrl(
      series,
      episodes,
      allUsers,
      supabaseConfig.supabaseUrl && supabaseConfig.supabaseAnonKey ? {
        supabaseUrl: supabaseConfig.supabaseUrl,
        supabaseAnonKey: supabaseConfig.supabaseAnonKey,
        useLiveSupabase: supabaseConfig.useLiveSupabase,
      } : undefined
    );
    const origin = window.location.origin + window.location.pathname;
    return `${origin}#sync=${encoded}`;
  };

  const testSupabase = async (url: string, key: string) => {
    return await testSupabaseConnection(url, key);
  };

  const pushToSupabaseCloud = async () => {
    if (!supabaseConfig.supabaseUrl || !supabaseConfig.supabaseAnonKey) {
      return { ok: false, message: 'Configure a URL e Chave Anon do Supabase primeiro.' };
    }
    const res = await pushCatalogToSupabase(supabaseConfig.supabaseUrl, supabaseConfig.supabaseAnonKey, series, episodes);
    if (res.ok) {
      setSupabaseConfig(prev => ({ ...prev, status: 'connected', errorMessage: undefined }));
      setSyncNotification('☁️ Catálogo enviado e sincronizado com o Supabase com sucesso!');
    } else {
      setSupabaseConfig(prev => ({ ...prev, status: 'error', errorMessage: res.message }));
    }
    return res;
  };

  const pullFromSupabaseCloud = async () => {
    if (!supabaseConfig.supabaseUrl || !supabaseConfig.supabaseAnonKey) {
      return { ok: false, message: 'Configure a URL e Chave Anon do Supabase primeiro.' };
    }
    const res = await pullCatalogFromSupabase(supabaseConfig.supabaseUrl, supabaseConfig.supabaseAnonKey);
    if (res.ok && res.series && res.episodes) {
      setSeries(res.series);
      setEpisodes(res.episodes);
      localStorage.setItem(STORAGE_KEY_SERIES, JSON.stringify(res.series));
      localStorage.setItem(STORAGE_KEY_EPISODES, JSON.stringify(res.episodes));
      setSupabaseConfig(prev => ({ ...prev, status: 'connected', errorMessage: undefined }));
      setSyncNotification(`☁️ Sincronizado do Supabase! ${res.series.length} séries e ${res.episodes.length} episódios atualizados.`);
    } else {
      setSupabaseConfig(prev => ({ ...prev, status: 'error', errorMessage: res.message }));
    }
    return { ok: res.ok, message: res.message };
  };

  const updateSupabaseConfig = (config: Partial<SupabaseConfig>) => {
    setSupabaseConfig(prev => ({ ...prev, ...config }));
  };

  const resetAllData = () => {
    localStorage.removeItem(STORAGE_KEY_SERIES);
    localStorage.removeItem(STORAGE_KEY_EPISODES);
    localStorage.removeItem(STORAGE_KEY_USERS);
    localStorage.removeItem(STORAGE_KEY_LOGGED_IN);
    setSeries(INITIAL_SERIES);
    setEpisodes(INITIAL_EPISODES);
    setAllUsers(INITIAL_USERS);
    setCurrentUserId('user-admin');
    setIsLoggedIn(true);
  };

  return (
    <AppContext.Provider
      value={{
        series,
        episodes,
        currentUser,
        allUsers,
        currentPlayingEpisode,
        currentPlayingSeries,
        isPlaying,
        currentTime,
        duration,
        playbackRate,
        volume,
        isMuted,
        audioSourceInfo,
        audioCandidateUrls,
        currentCandidateIndex,
        isUsingEmbedPlayer,
        audioError,
        audioLoading,
        drivePreviewEmbedUrl,
        driveDirectWebUrl,
        selectedSeriesForModal,
        currentView,
        searchQuery,
        activeCategory,
        supabaseConfig,
        audioRef,
        isLoggedIn,
        isMobilePreview,
        toggleMobilePreview,
        isPlayerExpanded,
        setIsPlayerExpanded,
        syncNotification,
        clearSyncNotification,
        exportCatalog,
        importCatalog,
        generateSyncUrl,
        testSupabase,
        pushToSupabaseCloud,
        pullFromSupabaseCloud,
        playEpisode,
        stopAudio,
        closePlayerAndGoHome,
        toggleEmbedPlayer,
        retryPlayback,
        togglePlayPause,
        seekTo,
        skipSeconds,
        setSpeed,
        setAudioVolume,
        toggleMute,
        nextEpisode,
        prevEpisode,
        toggleReaction,
        toggleMyList,
        openSeriesModal,
        closeSeriesModal,
        setCurrentView,
        setSearchQuery,
        setActiveCategory,
        loginWithCredentials,
        logout,
        loginAs,
        switchUserRole,
        createUser,
        updateUser,
        deleteUser,
        addOrUpdateSeries,
        setFeaturedSeries,
        deleteSeries,
        addOrUpdateEpisode,
        deleteEpisode,
        updateSupabaseConfig,
        resetAllData,
      }}
    >
      <audio ref={audioRef} preload="metadata" />
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
