import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AudioSeries, AudioEpisode, UserProfile, ReactionType, SupabaseConfig } from '../types';
import { INITIAL_SERIES, INITIAL_EPISODES, INITIAL_USERS } from '../data/initialData';
import { resolveAudioUrl } from '../utils/audioResolver';

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
  selectedSeriesForModal: AudioSeries | null;
  currentView: 'home' | 'series_catalog' | 'my_list' | 'top_rated' | 'admin';
  searchQuery: string;
  activeCategory: string;
  supabaseConfig: SupabaseConfig;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isLoggedIn: boolean;
  
  // Actions
  playEpisode: (episode: AudioEpisode, series?: AudioSeries) => void;
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
  loginWithCredentials: (loginOrEmail: string, password: string) => { success: boolean; message?: string };
  logout: () => void;
  loginAs: (userId: string) => void;
  switchUserRole: (role: 'admin' | 'user') => void;
  createUser: (userData: { name: string; login: string; password: string; role: 'admin' | 'user'; email?: string }) => UserProfile;
  updateUser: (user: UserProfile) => void;
  deleteUser: (userId: string) => void;
  addOrUpdateSeries: (seriesData: AudioSeries) => void;
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
      return saved ? JSON.parse(saved) : INITIAL_EPISODES;
    } catch {
      return INITIAL_EPISODES;
    }
  });

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

  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  // Audio element events binding
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

    const onEnded = () => {
      setIsPlaying(false);
      nextEpisode();
    };

    const onError = () => {
      console.warn('Audio playback error on stream URL:', audio.src);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [currentPlayingEpisode, currentUser.id]);

  // Play episode action
  const playEpisode = (episode: AudioEpisode, targetSeries?: AudioSeries) => {
    const parentSeries = targetSeries || series.find(s => s.id === episode.seriesId) || null;
    setCurrentPlayingEpisode(episode);
    setCurrentPlayingSeries(parentSeries);

    const resolved = resolveAudioUrl(episode.audioUrl);
    setAudioSourceInfo({
      isGoogleDrive: resolved.isGoogleDrive,
      streamUrl: resolved.streamUrl,
    });

    if (audioRef.current) {
      audioRef.current.src = resolved.streamUrl;
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(err => {
          console.warn('Autoplay error', err);
          setIsPlaying(false);
        });
    }

    if (parentSeries) {
      setSeries(prev =>
        prev.map(s => (s.id === parentSeries.id ? { ...s, totalListens: s.totalListens + 1 } : s))
      );
    }
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
    const seriesEpisodes = episodes.filter(e => e.seriesId === currentPlayingEpisode.seriesId);
    const currentIndex = seriesEpisodes.findIndex(e => e.id === currentPlayingEpisode.id);
    if (currentIndex >= 0 && currentIndex < seriesEpisodes.length - 1) {
      playEpisode(seriesEpisodes[currentIndex + 1], currentPlayingSeries || undefined);
    }
  };

  const prevEpisode = () => {
    if (!currentPlayingEpisode) return;
    const seriesEpisodes = episodes.filter(e => e.seriesId === currentPlayingEpisode.seriesId);
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

  // Login with Credentials: supports Login or Email + Password
  const loginWithCredentials = (loginOrEmail: string, pass: string): { success: boolean; message?: string } => {
    const cleanLogin = loginOrEmail.trim().toLowerCase();
    const matched = allUsers.find(
      u => (u.login?.toLowerCase() === cleanLogin || u.email?.toLowerCase() === cleanLogin) && u.password === pass
    );

    if (matched) {
      setCurrentUserId(matched.id);
      setIsLoggedIn(true);
      if (matched.role === 'admin') {
        setCurrentView('admin');
      } else {
        setCurrentView('home');
      }
      return { success: true };
    }

    // Check specific admin credentials fallback
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

  // User Management Methods (For Admin)
  const createUser = (userData: { name: string; login: string; password: string; role: 'admin' | 'user'; email?: string }): UserProfile => {
    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      name: userData.name.trim(),
      login: userData.login.trim(),
      password: userData.password,
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

  const updateUser = (updatedUser: UserProfile) => {
    setAllUsers(prev => prev.map(u => (u.id === updatedUser.id ? updatedUser : u)));
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
      const exists = prev.some(s => s.id === seriesData.id);
      if (exists) {
        return prev.map(s => (s.id === seriesData.id ? seriesData : s));
      }
      return [seriesData, ...prev];
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
  };

  const addOrUpdateEpisode = (episodeData: AudioEpisode) => {
    setEpisodes(prev => {
      const exists = prev.some(e => e.id === episodeData.id);
      if (exists) {
        return prev.map(e => (e.id === episodeData.id ? episodeData : e));
      }
      return [...prev, episodeData];
    });
  };

  const deleteEpisode = (episodeId: string) => {
    setEpisodes(prev => prev.filter(e => e.id !== episodeId));
    if (currentPlayingEpisode?.id === episodeId) {
      setCurrentPlayingEpisode(null);
      setIsPlaying(false);
    }
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
        selectedSeriesForModal,
        currentView,
        searchQuery,
        activeCategory,
        supabaseConfig,
        audioRef,
        isLoggedIn,
        playEpisode,
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
