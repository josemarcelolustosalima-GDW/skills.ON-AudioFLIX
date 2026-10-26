import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Shield,
  BarChart3,
  Layers,
  Film,
  Database,
  Users,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  HardDrive,
  Copy,
  Check,
  RefreshCw,
  Play,
  TrendingUp,
  Eye,
  EyeOff,
  Lock,
  Key,
  Clock,
  UserCheck,
  ShieldCheck,
  AlertTriangle,
  Star,
  Sparkles,
  Radio,
  Download,
  Upload,
  Share2,
  Smartphone,
  Globe,
  Cloud,
  FileCode,
} from 'lucide-react';
import { AudioSeries, AudioEpisode, UserProfile } from '../types';
import { SUPABASE_SQL_SCHEMA, SUPABASE_RLS_FIX_SQL } from '../data/initialData';
import { extractGoogleDriveId, analyzeAudioUrl } from '../utils/audioResolver';
import { decryptPassword, generateSecurePassword } from '../utils/crypto';
import { generateInitialDataTsCode, downloadCatalogFile } from '../utils/syncManager';

export const AdminDashboard: React.FC = () => {
  const {
    series,
    episodes,
    addOrUpdateSeries,
    setFeaturedSeries,
    deleteSeries,
    addOrUpdateEpisode,
    deleteEpisode,
    currentUser,
    allUsers,
    createUser,
    updateUser,
    deleteUser,
    supabaseConfig,
    updateSupabaseConfig,
    resetAllData,
    setCurrentView,
    openSeriesModal,
    playEpisode,
    exportCatalog,
    importCatalog,
    generateSyncUrl,
    testSupabase,
    pushToSupabaseCloud,
    pullFromSupabaseCloud,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'analytics' | 'series' | 'episodes' | 'users' | 'supabase'>('analytics');
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedRlsFix, setCopiedRlsFix] = useState(false);
  const [syncUrl, setSyncUrl] = useState<string>('');
  const [copiedSyncUrl, setCopiedSyncUrl] = useState(false);
  const [copiedSeedCode, setCopiedSeedCode] = useState(false);
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [supabaseTestResult, setSupabaseTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [isPushingSupabase, setIsPushingSupabase] = useState(false);
  const [isPullingSupabase, setIsPullingSupabase] = useState(false);
  const [jsonImportInput, setJsonImportInput] = useState('');
  const [showJsonInput, setShowJsonInput] = useState(false);
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Series Form State
  const [editingSeries, setEditingSeries] = useState<Partial<AudioSeries> | null>(null);
  const [seriesModalOpen, setSeriesModalOpen] = useState(false);

  // Episode Form State
  const [editingEpisode, setEditingEpisode] = useState<Partial<AudioEpisode> | null>(null);
  const [episodeModalOpen, setEpisodeModalOpen] = useState(false);
  const [selectedSeriesFilter, setSelectedSeriesFilter] = useState<string>('all');

  // User Management State (Requirement 1)
  const [editingUser, setEditingUser] = useState<Partial<UserProfile> | null>(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [decryptedPasswords, setDecryptedPasswords] = useState<Record<string, string>>({});
  const [copiedPasswordId, setCopiedPasswordId] = useState<string | null>(null);

  // Analytics Metrics
  const totalLikes = series.reduce((acc, s) => acc + s.likes, 0);
  const totalUnlikes = series.reduce((acc, s) => acc + s.unlikes, 0);
  const totalListens = series.reduce((acc, s) => acc + s.totalListens, 0);
  const overallApproval = totalLikes + totalUnlikes > 0 ? Math.round((totalLikes / (totalLikes + totalUnlikes)) * 100) : 100;

  // Toggle password visibility for user row (decrypts with AES-256)
  const togglePasswordVisibility = async (userId: string, rawPassword: string) => {
    if (!visiblePasswords[userId]) {
      let clearPass = rawPassword;
      if (rawPassword.startsWith('enc:') || rawPassword.startsWith('enc_b64:')) {
        clearPass = await decryptPassword(rawPassword);
      }
      setDecryptedPasswords(prev => ({ ...prev, [userId]: clearPass }));
      setVisiblePasswords(prev => ({ ...prev, [userId]: true }));
    } else {
      setVisiblePasswords(prev => ({ ...prev, [userId]: false }));
    }
  };

  // Copy decrypted password to clipboard
  const handleCopyPassword = async (userId: string, rawPassword: string) => {
    let clearPass = decryptedPasswords[userId] || rawPassword;
    if (clearPass.startsWith('enc:') || clearPass.startsWith('enc_b64:')) {
      clearPass = await decryptPassword(rawPassword);
    }
    navigator.clipboard.writeText(clearPass);
    setCopiedPasswordId(userId);
    setTimeout(() => setCopiedPasswordId(null), 2000);
  };

  // Open modal with decrypted password for editing
  const handleStartEditUser = async (user: UserProfile) => {
    let clearPass = user.password;
    if (user.password.startsWith('enc:') || user.password.startsWith('enc_b64:')) {
      clearPass = await decryptPassword(user.password);
    }
    setEditingUser({ ...user, password: clearPass });
    setUserModalOpen(true);
  };

  // Handle User Save (Create or Edit)
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser?.login || !editingUser?.password) return;

    if (editingUser.id) {
      // Edit existing user
      const existing = allUsers.find(u => u.id === editingUser.id);
      if (existing) {
        await updateUser({
          ...existing,
          name: editingUser.name || editingUser.login,
          login: editingUser.login.trim(),
          password: editingUser.password,
          email: editingUser.email || `${editingUser.login.trim()}@skillson.com`,
          role: editingUser.role || 'user',
        });
      }
    } else {
      // Create new user
      await createUser({
        name: editingUser.name || editingUser.login,
        login: editingUser.login.trim(),
        password: editingUser.password,
        role: editingUser.role || 'user',
        email: editingUser.email,
      });
    }

    setUserModalOpen(false);
    setEditingUser(null);
  };

  // Handle Series Save (Includes episode duration estimate)
  const handleSaveSeries = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSeries?.title || !editingSeries?.category) return;

    const newSeries: AudioSeries = {
      id: editingSeries.id || `series-${Date.now()}`,
      title: editingSeries.title || '',
      subtitle: editingSeries.subtitle || '',
      synopsis: editingSeries.synopsis || '',
      category: editingSeries.category || 'Geral',
      heroImage: editingSeries.heroImage || '/src/assets/images/skills_hero_leadership_1792881116508.jpg',
      posterImage: editingSeries.posterImage || editingSeries.heroImage || '/src/assets/images/skills_hero_leadership_1792881116508.jpg',
      matchScore: editingSeries.matchScore || 98,
      releaseYear: editingSeries.releaseYear || new Date().getFullYear(),
      ratingBadge: editingSeries.ratingBadge || '14+',
      audioQuality: editingSeries.audioQuality || 'Áudio HD Imersivo',
      mentor: editingSeries.mentor || 'Mentor Especialista',
      mentorRole: editingSeries.mentorRole || '',
      tags: typeof editingSeries.tags === 'string' ? (editingSeries.tags as string).split(',').map(t => t.trim()) : (editingSeries.tags || []),
      featured: editingSeries.featured || false,
      likes: editingSeries.likes ?? 0,
      unlikes: editingSeries.unlikes ?? 0,
      totalListens: editingSeries.totalListens ?? 0,
      episodeDurationEstimate: editingSeries.episodeDurationEstimate || '20 min por episódio',
      createdAt: editingSeries.createdAt || new Date().toISOString(),
    };

    addOrUpdateSeries(newSeries);
    setSeriesModalOpen(false);
    setEditingSeries(null);
  };

  // Handle Episode Save
  const handleSaveEpisode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEpisode?.title || !editingEpisode?.seriesId) return;

    const isEdit = Boolean(editingEpisode.id);
    const targetEpisodeId = isEdit
      ? editingEpisode.id!.trim()
      : `ep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const episodeNum = editingEpisode.episodeNumber !== undefined && editingEpisode.episodeNumber !== null
      ? Number(editingEpisode.episodeNumber)
      : 1;
    const isSynopsis = Boolean(editingEpisode.isSynopsis || episodeNum === 0);
    const finalEpisodeNum = isSynopsis ? 0 : Math.max(1, episodeNum);
    const durMinutes = Number(editingEpisode.durationMinutes) || 20;

    const newEpisode: AudioEpisode = {
      id: targetEpisodeId,
      seriesId: editingEpisode.seriesId.trim(),
      episodeNumber: finalEpisodeNum,
      isSynopsis: isSynopsis,
      season: Number(editingEpisode.season) || 1,
      title: editingEpisode.title.trim(),
      synopsis: editingEpisode.synopsis?.trim() || '',
      durationMinutes: durMinutes,
      durationFormatted: editingEpisode.durationFormatted?.trim() || `${durMinutes} min`,
      audioUrl: editingEpisode.audioUrl?.trim() || '',
      imageUrl: editingEpisode.imageUrl?.trim() || '',
      createdAt: editingEpisode.createdAt || new Date().toISOString(),
    };

    addOrUpdateEpisode(newEpisode);
    setEpisodeModalOpen(false);
    setEditingEpisode(null);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleCopyRlsFix = () => {
    navigator.clipboard.writeText(SUPABASE_RLS_FIX_SQL);
    setCopiedRlsFix(true);
    setTimeout(() => setCopiedRlsFix(false), 2000);
  };

  const filteredEpisodes = selectedSeriesFilter === 'all'
    ? episodes
    : episodes.filter(e => e.seriesId.trim().toLowerCase() === selectedSeriesFilter.trim().toLowerCase());

  return (
    <div className="min-h-screen bg-[#141414] text-white pt-24 pb-32 px-4 md:px-12">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#E50914] text-white">
              Área Administrativa
            </span>
            <span className="text-xs text-neutral-400">skills.ON! Gestão Executiva</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <Shield className="w-7 h-7 text-[#E50914]" />
            <span>Painel de Controle e Gestão de Conteúdo</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentView('home')}
            className="px-4 py-2 rounded bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 transition-colors border border-neutral-700"
          >
            ← Voltar ao Catálogo
          </button>

          <button
            onClick={() => {
              if (confirm('Deseja restaurar os dados padrão das séries e usuários?')) {
                resetAllData();
              }
            }}
            className="px-3 py-2 rounded bg-neutral-900 hover:bg-neutral-800 text-xs text-neutral-400 hover:text-white transition-colors border border-neutral-800 flex items-center gap-1.5"
            title="Restaurar séries e métricas originais"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restaurar Padrões</span>
          </button>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 md:gap-4 overflow-x-auto no-scrollbar py-4 border-b border-neutral-800">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'bg-[#E50914] text-white'
              : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Consolidação de Likes & Métricas</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'users'
              ? 'bg-[#E50914] text-white'
              : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Gestão de Usuários & Senhas ({allUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('series')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'series'
              ? 'bg-[#E50914] text-white'
              : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Gerenciar Séries ({series.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('episodes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'episodes'
              ? 'bg-[#E50914] text-white'
              : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>Gerenciar Episódios & Áudios Drive ({episodes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('supabase')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'supabase'
              ? 'bg-[#E50914] text-white shadow-lg'
              : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <Smartphone className="w-4 h-4 text-amber-400" />
          <span>Sincronização Mobile & Nuvem</span>
        </button>
      </div>

      {/* CONTENT TAB 1: CONSOLIDATION OF LIKES AND ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="py-6 space-y-8 animate-in fade-in duration-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 space-y-1">
              <span className="text-xs text-neutral-400 uppercase font-semibold">Total de Séries Ativas</span>
              <p className="text-3xl font-extrabold text-white font-mono">{series.length}</p>
              <span className="text-[11px] text-neutral-500">{episodes.length} episódios indexados</span>
            </div>

            <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 space-y-1">
              <span className="text-xs text-neutral-400 uppercase font-semibold">Total de Curtidas (Likes)</span>
              <div className="flex items-center gap-2">
                <ThumbsUp className="w-5 h-5 text-emerald-400" />
                <p className="text-3xl font-extrabold text-emerald-400 font-mono">{totalLikes}</p>
              </div>
              <span className="text-[11px] text-neutral-500">Reações positivas consolidadas</span>
            </div>

            <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 space-y-1">
              <span className="text-xs text-neutral-400 uppercase font-semibold">Total de Descurtidas (Unlikes)</span>
              <div className="flex items-center gap-2">
                <ThumbsDown className="w-5 h-5 text-red-400" />
                <p className="text-3xl font-extrabold text-red-400 font-mono">{totalUnlikes}</p>
              </div>
              <span className="text-[11px] text-neutral-500">Feedback de ajuste do aluno</span>
            </div>

            <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 space-y-1">
              <span className="text-xs text-neutral-400 uppercase font-semibold">Índice Geral de Aprovação</span>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-400" />
                <p className="text-3xl font-extrabold text-white font-mono">{overallApproval}%</p>
              </div>
              <span className="text-[11px] text-emerald-400 font-semibold">{totalListens.toLocaleString()} audições totais</span>
            </div>
          </div>

          {/* Consolidated Table of Reactions */}
          <div className="bg-neutral-900/70 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-neutral-800">
              <h3 className="text-base font-bold text-white">Relatório Consolidado de Avaliações por Áudio Série</h3>
              <p className="text-xs text-neutral-400">
                Consolidação em tempo real das preferências dos estudantes (Likes, Amei e Unlikes padrão Netflix).
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm">
                <thead className="bg-neutral-800/80 text-neutral-400 uppercase text-[11px] font-semibold border-b border-neutral-700">
                  <tr>
                    <th className="py-3 px-4">Série / Treinamento</th>
                    <th className="py-3 px-4">Categoria</th>
                    <th className="py-3 px-4 text-center">Curtidas (👍)</th>
                    <th className="py-3 px-4 text-center">Descurtidas (👎)</th>
                    <th className="py-3 px-4">Sentimento / Aprovação</th>
                    <th className="py-3 px-4 text-right">Ouvintes Totais</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {series.map((s) => {
                    const totalReactions = s.likes + s.unlikes;
                    const approvalPct = totalReactions > 0 ? Math.round((s.likes / totalReactions) * 100) : 100;
                    return (
                      <tr key={s.id} className="hover:bg-neutral-800/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-8 rounded overflow-hidden bg-neutral-800 shrink-0">
                              <img src={s.posterImage || s.heroImage} alt={s.title} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="font-bold text-white line-clamp-1">{s.title}</p>
                              <p className="text-xs text-neutral-400">{s.mentor}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-neutral-300">{s.category}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400">{s.likes}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-red-400">{s.unlikes}</td>
                        <td className="py-3 px-4">
                          <div className="w-36">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="font-bold text-white">{approvalPct}%</span>
                              <span className="text-[10px] text-neutral-400">{totalReactions} votos</span>
                            </div>
                            <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden flex">
                              <div className="bg-emerald-500 h-full" style={{ width: `${approvalPct}%` }} />
                              <div className="bg-red-500 h-full" style={{ width: `${100 - approvalPct}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-neutral-300">
                          {s.totalListens.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT TAB 2: USER MANAGEMENT (REQUIREMENT 1) */}
      {activeTab === 'users' && (
        <div className="py-6 space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-[#E50914]" />
                <span>Gestão de Usuários e Controle de Acessos</span>
              </h2>
              <p className="text-xs text-neutral-400">
                Crie, edite e exclua usuários. Defina o login e a senha de cada um, com opção de visualizar e copiar senhas.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingUser({
                  name: '',
                  login: '',
                  password: '',
                  role: 'user',
                  email: '',
                });
                setUserModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#E50914] hover:bg-[#b80710] text-xs md:text-sm font-bold text-white shadow-lg transition-transform active:scale-95 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Novo Usuário</span>
            </button>
          </div>

          {/* Admin Credentials Quick Reference Box */}
          <div className="bg-neutral-900 border border-neutral-700/80 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#E50914]/20 border border-[#E50914]/40 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-[#E50914]" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Credenciais Oficiais do Administrador</p>
                <p className="text-xs text-neutral-400">
                  Login: <strong className="text-amber-300 font-mono">skills.on.admin</strong> &nbsp;|&nbsp;
                  Senha: <strong className="text-amber-300 font-mono">jmlustosa.skills.on!</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Acesso Total Habilitado</span>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm">
                <thead className="bg-neutral-800/80 text-neutral-400 uppercase text-[11px] font-semibold border-b border-neutral-700">
                  <tr>
                    <th className="py-3.5 px-4">Usuário / Nome</th>
                    <th className="py-3.5 px-4">LOGIN de Acesso</th>
                    <th className="py-3.5 px-4">SENHA do Usuário</th>
                    <th className="py-3.5 px-4">Perfil</th>
                    <th className="py-3.5 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {allUsers.map((user) => {
                    const isPasswordVisible = visiblePasswords[user.id];
                    const isMainAdmin = user.login === 'skills.on.admin' || user.id === 'user-admin';

                    return (
                      <tr key={user.id} className="hover:bg-neutral-800/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-800 border border-neutral-700 shrink-0">
                              <img src={user.avatar || '/assets/aistudio/skillsON__INSTAGRAM_6edfb550.jpg'} alt={user.name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="font-bold text-white">{user.name}</p>
                              <p className="text-[11px] text-neutral-400">{user.email || `${user.login}@skillson.com`}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-semibold text-neutral-200">
                          <span className="bg-neutral-800 px-2 py-1 rounded border border-neutral-700">
                            {user.login}
                          </span>
                        </td>

                        {/* SENHA COM BOTÃO DE VISUALIZAR E COPIAR (CRIPTOGRAFADA COM AES-256) */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono bg-black/60 px-2.5 py-1 rounded border border-neutral-800 text-neutral-200 text-xs min-w-[120px] select-all">
                              {isPasswordVisible ? (decryptedPasswords[user.id] || user.password) : '••••••••••••'}
                            </span>

                            {/* Botão de Visualizar Senha Descriptografada */}
                            <button
                              onClick={() => togglePasswordVisibility(user.id, user.password)}
                              className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                              title={isPasswordVisible ? 'Ocultar senha' : 'Descriptografar e visualizar senha'}
                            >
                              {isPasswordVisible ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4" />}
                            </button>

                            {/* Botão de Copiar Senha */}
                            <button
                              onClick={() => handleCopyPassword(user.id, user.password)}
                              className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                              title="Copiar senha descriptografada"
                            >
                              {copiedPasswordId === user.id ? (
                                <Check className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase px-2.5 py-0.5 rounded ${
                            user.role === 'admin'
                              ? 'bg-[#E50914]/20 text-[#E50914] border border-[#E50914]/40'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                          }`}>
                            {user.role === 'admin' ? 'Administrador' : 'Estudante'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleStartEditUser(user)}
                              className="p-1.5 rounded hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                              title="Editar usuário e senha"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {!isMainAdmin && (
                              <button
                                onClick={() => {
                                  if (confirm(`Excluir permanentemente o usuário "${user.name}" (${user.login})?`)) {
                                    deleteUser(user.id);
                                  }
                                }}
                                className="p-1.5 rounded hover:bg-neutral-700 text-neutral-400 hover:text-red-400 transition-colors"
                                title="Excluir usuário"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT TAB 3: SERIES MANAGEMENT */}
      {activeTab === 'series' && (
        <div className="py-6 space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">Catálogo de Séries de Áudio</h2>
              <p className="text-xs text-neutral-400">
                Configure as imagens externas, textos, categorias, duração estimada e metadados de cada série.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingSeries({
                  title: '',
                  subtitle: '',
                  category: 'Liderança e Gestão Estratégica',
                  synopsis: '',
                  heroImage: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&auto=format&fit=crop&q=80',
                  posterImage: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&auto=format&fit=crop&q=80',
                  mentor: '',
                  mentorRole: '',
                  matchScore: 98,
                  releaseYear: 2026,
                  ratingBadge: '14+',
                  audioQuality: 'Áudio HD Imersivo',
                  episodeDurationEstimate: '20 min por episódio',
                  tags: ['Liderança', 'Carreira'],
                  featured: false,
                });
                setSeriesModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#E50914] hover:bg-[#b80710] text-xs md:text-sm font-bold text-white shadow-lg transition-transform active:scale-95 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Nova Áudio Série</span>
            </button>
          </div>

          {/* FEATURED SERIES SELECTOR (REQUIREMENT 3: SELEÇÃO DA SÉRIE EM DESTAQUE NA TELA INICIAL) */}
          {(() => {
            const currentFeatured = series.find(s => s.featured) || series[0];
            return (
              <div className="bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-neutral-950 border border-amber-500/40 rounded-xl p-5 shadow-xl relative overflow-hidden">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  {/* Left: Info & Dropdown selector */}
                  <div className="space-y-3 max-w-xl">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
                        <Star className="w-5 h-5 fill-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <span>Série em Destaque na Tela Inicial (Billboard Hero)</span>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                            Principal
                          </span>
                        </h3>
                        <p className="text-xs text-neutral-400">
                          Escolha qual série ocupará o destaque principal no topo da tela inicial do aplicativo:
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                      <select
                        value={currentFeatured?.id || ''}
                        onChange={(e) => setFeaturedSeries(e.target.value)}
                        className="bg-neutral-800 text-white font-semibold text-xs rounded-lg px-3.5 py-2.5 border border-amber-500/50 focus:outline-none focus:border-amber-400 shadow-sm cursor-pointer"
                      >
                        {series.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.featured ? '⭐ [DESTAQUE ATUAL] ' : ''}{s.title} ({s.category})
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => setCurrentView('home')}
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs border border-neutral-700 transition-colors"
                        title="Ver como ficou a tela inicial"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver na Home</span>
                      </button>
                    </div>
                  </div>

                  {/* Right: Mini Preview of Featured Series */}
                  {currentFeatured && (
                    <div className="flex items-center gap-4 bg-neutral-950/80 p-3 rounded-lg border border-neutral-800 shrink-0">
                      <div className="w-24 h-16 rounded overflow-hidden bg-neutral-900 border border-neutral-700 shrink-0">
                        <img
                          src={currentFeatured.heroImage || currentFeatured.posterImage}
                          alt={currentFeatured.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="space-y-0.5 max-w-[200px]">
                        <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                          Destaque Ativo na Home
                        </span>
                        <h4 className="text-xs font-bold text-white truncate">{currentFeatured.title}</h4>
                        <p className="text-[11px] text-neutral-400 truncate">{currentFeatured.mentor}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Series Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {series.map((s) => (
              <div
                key={s.id}
                className={`bg-neutral-900/80 rounded-xl overflow-hidden border transition-all flex flex-col justify-between ${
                  s.featured ? 'border-amber-500/50 shadow-lg shadow-amber-500/10' : 'border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div>
                  <div className="relative aspect-video w-full bg-neutral-950">
                    <img src={s.heroImage || s.posterImage} alt={s.title} className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold bg-black/80 text-white border border-neutral-700">
                      {s.ratingBadge}
                    </div>
                    {s.featured && (
                      <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-black flex items-center gap-1 shadow-md">
                        <Star className="w-3 h-3 fill-black text-black" />
                        <span>Destaque Principal</span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-neutral-400">
                      <span className="text-[#E50914] font-semibold">{s.category}</span>
                      <span className="flex items-center gap-1 text-neutral-300">
                        <Clock className="w-3.5 h-3.5 text-neutral-400" />
                        {s.episodeDurationEstimate || '20 min'}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-white line-clamp-1">{s.title}</h3>
                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">{s.synopsis}</p>

                    <div className="pt-2 flex items-center justify-between text-xs border-t border-neutral-800 text-neutral-400">
                      <span>Mentor: <strong className="text-neutral-200">{s.mentor}</strong></span>
                      <span className="text-emerald-400 font-semibold">{s.matchScore}% Match</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-neutral-950/60 border-t border-neutral-800 flex items-center justify-between gap-2">
                  {/* Action 1: Set as featured or show active */}
                  {s.featured ? (
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-amber-400/15 border border-amber-400/40 text-amber-300 font-bold text-xs">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>Destaque Ativo</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setFeaturedSeries(s.id)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-neutral-800 hover:bg-amber-500/20 text-neutral-300 hover:text-amber-300 border border-neutral-700 hover:border-amber-500/40 text-xs font-medium transition-all"
                      title="Destacar esta série na tela inicial do APP"
                    >
                      <Star className="w-3.5 h-3.5 text-neutral-400 hover:text-amber-400" />
                      <span>Destacar no Início</span>
                    </button>
                  )}

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        const existingEps = episodes.filter(e => e.seriesId.trim().toLowerCase() === s.id.trim().toLowerCase());
                        const regularEps = existingEps.filter(e => !e.isSynopsis && Number(e.episodeNumber) > 0);
                        const hasSynopsis = existingEps.some(e => e.isSynopsis || Number(e.episodeNumber) === 0);
                        // If series doesn't have synopsis yet, prompt user or default cleanly
                        const isSyn = !hasSynopsis;
                        const initialEpNum = isSyn ? 0 : (regularEps.length + 1);

                        setEditingEpisode({
                          id: undefined,
                          seriesId: s.id,
                          episodeNumber: initialEpNum,
                          isSynopsis: isSyn,
                          season: 1,
                          title: isSyn ? `Sinopse: Introdução a ${s.title}` : '',
                          synopsis: '',
                          durationMinutes: isSyn ? 6 : 20,
                          durationFormatted: isSyn ? '6 min' : '20 min',
                          audioUrl: '',
                          imageUrl: s.posterImage || s.heroImage,
                        });
                        setEpisodeModalOpen(true);
                      }}
                      className="p-1.5 rounded hover:bg-neutral-800 text-neutral-300 hover:text-emerald-400 transition-colors"
                      title="Adicionar novo episódio diretamente a esta série"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openSeriesModal(s)}
                      className="p-1.5 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
                      title="Pré-visualizar modal de episódios"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingSeries({ ...s });
                        setSeriesModalOpen(true);
                      }}
                      className="p-1.5 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
                      title="Editar série"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Excluir permanentemente a série "${s.title}"?`)) {
                          deleteSeries(s.id);
                        }
                      }}
                      className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-red-400 transition-colors"
                      title="Excluir série"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTENT TAB 4: EPISODES & GOOGLE DRIVE AUDIOS */}
      {activeTab === 'episodes' && (
        <div className="py-6 space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">Gerenciador de Episódios & Áudios Google Drive</h2>
              <p className="text-xs text-neutral-400">
                Insira links de compartilhamento do seu Google Drive ou links externos para streaming imediato.
              </p>
            </div>

            <button
              onClick={() => {
                const targetSeriesId = selectedSeriesFilter !== 'all' ? selectedSeriesFilter : (series[0]?.id || '');
                const targetSeriesObj = series.find(s => s.id === targetSeriesId) || series[0];
                const existingEps = episodes.filter(e => e.seriesId.trim().toLowerCase() === targetSeriesId.trim().toLowerCase());
                const regularEps = existingEps.filter(e => !e.isSynopsis && Number(e.episodeNumber) > 0);
                const hasSynopsis = existingEps.some(e => e.isSynopsis || Number(e.episodeNumber) === 0);
                const isSyn = !hasSynopsis;
                const initialEpNum = isSyn ? 0 : (regularEps.length + 1);

                setEditingEpisode({
                  id: undefined,
                  seriesId: targetSeriesId,
                  episodeNumber: initialEpNum,
                  isSynopsis: isSyn,
                  season: 1,
                  title: isSyn ? `Sinopse: Introdução a ${targetSeriesObj?.title || 'Série'}` : '',
                  synopsis: '',
                  durationMinutes: isSyn ? 6 : 20,
                  durationFormatted: isSyn ? '6 min' : '20 min',
                  audioUrl: '',
                  imageUrl: targetSeriesObj?.posterImage || targetSeriesObj?.heroImage || '',
                });
                setEpisodeModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#E50914] hover:bg-[#b80710] text-xs md:text-sm font-bold text-white shadow-lg transition-transform active:scale-95 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Novo Episódio</span>
            </button>
          </div>

          {/* Filter by Series */}
          <div className="flex items-center gap-3 bg-neutral-900 p-3 rounded-lg border border-neutral-800">
            <span className="text-xs font-semibold text-neutral-400">Filtrar por Série:</span>
            <select
              value={selectedSeriesFilter}
              onChange={(e) => setSelectedSeriesFilter(e.target.value)}
              className="bg-neutral-800 text-xs text-white rounded px-3 py-1.5 border border-neutral-700 focus:outline-none"
            >
              <option value="all">Todas as Séries ({episodes.length} episódios)</option>
              {series.map((s) => {
                const sEpsCount = episodes.filter(e => e.seriesId.trim().toLowerCase() === s.id.trim().toLowerCase()).length;
                return (
                  <option key={s.id} value={s.id}>
                    {s.title} ({sEpsCount} {sEpsCount === 1 ? 'ep.' : 'eps.'})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Episodes List Table with Visible Scrollbar */}
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto max-h-[620px] overflow-y-auto visible-scrollbar">
              <table className="w-full text-left text-xs md:text-sm">
                <thead className="bg-neutral-800/80 text-neutral-400 uppercase text-[11px] font-semibold border-b border-neutral-700">
                  <tr>
                    <th className="py-3 px-4">Ep.</th>
                    <th className="py-3 px-4">Título & Sinopse</th>
                    <th className="py-3 px-4">Série Vinculada</th>
                    <th className="py-3 px-4">Origem do Áudio</th>
                    <th className="py-3 px-4">Duração</th>
                    <th className="py-3 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {filteredEpisodes.map((ep) => {
                    const parent = series.find(s => s.id === ep.seriesId);
                    const isDrive = !!extractGoogleDriveId(ep.audioUrl);

                    return (
                      <tr key={ep.id} className="hover:bg-neutral-800/50 transition-colors">
                        <td className="py-3 px-4">
                          {(ep.isSynopsis || Number(ep.episodeNumber) === 0) ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 whitespace-nowrap">
                              <Radio className="w-3 h-3 text-amber-400" />
                              SINOPSE (00)
                            </span>
                          ) : (
                            <span className="font-mono font-bold text-neutral-300 bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700 text-xs">
                              Ep. {ep.episodeNumber.toString().padStart(2, '0')}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-8 rounded overflow-hidden bg-neutral-800 shrink-0">
                              <img src={ep.imageUrl || parent?.posterImage} alt={ep.title} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="font-bold text-white line-clamp-1">{ep.title}</p>
                              <p className="text-xs text-neutral-400 line-clamp-1">{ep.synopsis}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-neutral-300 font-medium">
                          {parent?.title || ep.seriesId}
                        </td>
                        <td className="py-3 px-4">
                          {isDrive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-xs font-semibold border border-blue-500/30">
                              <HardDrive className="w-3 h-3" />
                              Google Drive
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 text-xs">
                              URL Direta
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-neutral-300 font-semibold">
                          {ep.durationFormatted}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => playEpisode(ep, parent)}
                              className="p-1.5 rounded hover:bg-neutral-700 text-emerald-400 hover:text-white transition-colors"
                              title="Testar reprodução"
                            >
                              <Play className="w-4 h-4 fill-current" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingEpisode({ ...ep });
                                setEpisodeModalOpen(true);
                              }}
                              className="p-1.5 rounded hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                              title="Editar episódio"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Excluir o episódio "${ep.title}"?`)) {
                                  deleteEpisode(ep.id);
                                }
                              }}
                              className="p-1.5 rounded hover:bg-neutral-700 text-neutral-400 hover:text-red-400 transition-colors"
                              title="Excluir episódio"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT TAB 5: MULTI-DEVICE SYNC & CLOUD (MOBILE, NETLIFY & SUPABASE) */}
      {activeTab === 'supabase' && (
        <div className="py-6 space-y-6 max-w-4xl animate-in fade-in duration-200 text-white">
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Smartphone className="w-6 h-6 text-[#E50914]" />
              <span>Sincronização Multi-Dispositivo & Nuvem (Celular / Netlify / Supabase)</span>
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Transfira suas novas séries e episódios criados no computador diretamente para o seu celular ou configure sincronização automática na nuvem para todos os alunos.
            </p>
          </div>

          {/* EXPLANATORY DIAGNOSTIC BANNER */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-300">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <span>Por que seu celular abriu a versão com as séries antigas (default)?</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              O <strong>Netlify</strong> é um servidor de arquivos estáticos. Quando você apagou os exemplos e cadastrou sua nova série no seu computador, o aplicativo salvou tudo na <strong>memória local do navegador deste computador (LocalStorage)</strong>. Como o celular possui uma memória isolada e limpa, ao abrir o link ele recorreu aos dados iniciais de demonstração (<em>default</em>).
            </p>
            <p className="text-xs text-amber-200/90 font-medium">
              💡 <strong>Como resolver?</strong> Escolha qualquer uma das 4 opções abaixo para transferir seus dados agora mesmo para o celular ou tornar suas novas séries o padrão oficial definitivo da plataforma.
            </p>
          </div>

          {/* OPTION 1: INSTANT MOBILE SYNC LINK */}
          <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-950 border border-[#E50914]/40 rounded-xl p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#E50914] bg-[#E50914]/10 px-2 py-0.5 rounded border border-[#E50914]/30">
                  Opção 1 • Mais Rápida (Zero Cadastro)
                </span>
                <h3 className="text-base font-bold text-white mt-1 flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-[#E50914]" />
                  <span>Sincronizar Agora com o Celular via Link Direto</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Gera um link exclusivo contendo todas as suas séries ({series.length}) e episódios ({episodes.length}).
                </p>
              </div>

              <button
                onClick={() => {
                  const url = generateSyncUrl();
                  setSyncUrl(url);
                }}
                className="px-4 py-2.5 rounded-lg bg-[#E50914] hover:bg-[#b80710] text-xs font-bold text-white shadow-lg flex items-center gap-2 transition-transform active:scale-95 shrink-0"
              >
                <Smartphone className="w-4 h-4" />
                <span>Gerar Link de Sincronização</span>
              </button>
            </div>

            {syncUrl && (
              <div className="p-3.5 bg-black/80 rounded-lg border border-neutral-800 space-y-2.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Link gerado com sucesso! Envie para o WhatsApp do seu celular:</span>
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(syncUrl);
                      setCopiedSyncUrl(true);
                      setTimeout(() => setCopiedSyncUrl(false), 2500);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white transition-colors"
                  >
                    {copiedSyncUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSyncUrl ? 'Link Copiado!' : 'Copiar Link'}</span>
                  </button>
                </div>

                <div className="p-2.5 bg-neutral-900 rounded font-mono text-[11px] text-neutral-300 break-all select-all max-h-24 overflow-y-auto border border-neutral-800">
                  {syncUrl}
                </div>

                <p className="text-[11px] text-neutral-400">
                  📲 <strong>Como usar no celular:</strong> Copie o link acima, mande para si mesmo no WhatsApp ou e-mail e abra no navegador do seu celular. O aplicativo detectará o link e gravará automaticamente as séries no celular!
                </p>
              </div>
            )}
          </div>

          {/* OPTION 2: FULL JSON BACKUP & RESTORE */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/30">
                Opção 2 • 100% Confiável Para Qualquer Aparelho
              </span>
              <h3 className="text-base font-bold text-white mt-1 flex items-center gap-2">
                <Download className="w-4 h-4 text-blue-400" />
                <span>Backup Completo do Catálogo (Exportar & Importar Arquivo)</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Baixe um arquivo de segurança com todas as suas séries, áudios e usuários cadastrados para restaurar quando quiser no celular ou em outro computador.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Export Box */}
              <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 flex flex-col justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Exportar Catálogo deste Computador</span>
                  </h4>
                  <p className="text-[11px] text-neutral-400">
                    Gera o arquivo <strong>skills_on_catalog.json</strong> contendo {series.length} séries e {episodes.length} episódios.
                  </p>
                </div>
                <button
                  onClick={exportCatalog}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Arquivo skills_on_catalog.json</span>
                </button>
              </div>

              {/* Import Box */}
              <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 flex flex-col justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-blue-400" />
                    <span>Importar Catálogo (Neste Aparelho)</span>
                  </h4>
                  <p className="text-[11px] text-neutral-400">
                    Selecione o arquivo de backup exportado para carregar todas as séries no aparelho atual.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white cursor-pointer border border-neutral-700 transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>Selecionar Arquivo .json</span>
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const content = event.target?.result as string;
                          if (content) {
                            const res = importCatalog(content);
                            setImportStatus(res);
                            setTimeout(() => setImportStatus(null), 5000);
                          }
                        };
                        reader.readAsText(file);
                        e.target.value = '';
                      }}
                    />
                  </label>

                  <button
                    onClick={() => setShowJsonInput(prev => !prev)}
                    className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white border border-neutral-700 text-xs"
                    title="Colar texto JSON manualmente"
                  >
                    <FileCode className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Manual JSON Paste Area */}
            {showJsonInput && (
              <div className="p-3 bg-black/80 rounded-lg border border-neutral-800 space-y-2">
                <label className="text-[11px] text-neutral-300 font-semibold block">
                  Colar código JSON do catálogo:
                </label>
                <textarea
                  rows={4}
                  value={jsonImportInput}
                  onChange={(e) => setJsonImportInput(e.target.value)}
                  placeholder='Cole aqui o conteúdo de skills_on_catalog.json...'
                  className="w-full bg-neutral-900 border border-neutral-800 rounded p-2 text-xs font-mono text-neutral-200 focus:outline-none focus:border-[#E50914]"
                />
                <button
                  onClick={() => {
                    if (!jsonImportInput.trim()) return;
                    const res = importCatalog(jsonImportInput);
                    setImportStatus(res);
                    if (res.success) {
                      setJsonImportInput('');
                      setShowJsonInput(false);
                    }
                    setTimeout(() => setImportStatus(null), 5000);
                  }}
                  className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-colors"
                >
                  Restaurar Dados a partir do Texto
                </button>
              </div>
            )}

            {importStatus && (
              <div className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                importStatus.success ? 'bg-emerald-950/60 border border-emerald-500 text-emerald-300' : 'bg-red-950/60 border border-red-500 text-red-300'
              }`}>
                {importStatus.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                <span>{importStatus.message}</span>
              </div>
            )}
          </div>

          {/* OPTION 3: PERMANENT NETLIFY REPO SEED */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                Opção 3 • Oficial para Todos os Alunos
              </span>
              <h3 className="text-base font-bold text-white mt-1 flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-400" />
                <span>Tornar este Catálogo o Padrão Oficial do Netlify</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Deseja que qualquer pessoa ou aluno no mundo que abra o link do Netlify veja diretamente a sua nova série sem precisar importar nada?
              </p>
            </div>

            <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-neutral-200">Arquivo Seed para Repositório / Pasta public</p>
                <p className="text-[11px] text-neutral-400">
                  Baixe o catálogo formatado como <strong>public/catalog.json</strong> ou copie o código para <strong>initialData.ts</strong>.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    const code = generateInitialDataTsCode(series, episodes);
                    navigator.clipboard.writeText(code);
                    setCopiedSeedCode(true);
                    setTimeout(() => setCopiedSeedCode(false), 2500);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white border border-neutral-700 transition-colors"
                >
                  {copiedSeedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSeedCode ? 'Código Copiado!' : 'Copiar initialData.ts'}</span>
                </button>

                <button
                  onClick={() => {
                    downloadCatalogFile(series, episodes, allUsers, 'catalog.json');
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded bg-amber-600 hover:bg-amber-500 text-xs font-bold text-black transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar catalog.json</span>
                </button>
              </div>
            </div>
          </div>

          {/* OPTION 4: REAL SUPABASE CLOUD DATABASE SYNC */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                Opção 4 • Nuvem Profissional em Tempo Real
              </span>
              <h3 className="text-base font-bold text-white mt-1 flex items-center gap-2">
                <Cloud className="w-4 h-4 text-emerald-400" />
                <span>Sincronização em Nuvem Supabase (PostgreSQL)</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Conecte um banco de dados gratuito no Supabase para que qualquer alteração feita no PC apareça instantaneamente no celular de todos os alunos em tempo real.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Supabase Project URL</label>
                <input
                  type="text"
                  placeholder="https://xyzcompany.supabase.co"
                  value={supabaseConfig.supabaseUrl}
                  onChange={(e) => updateSupabaseConfig({ supabaseUrl: e.target.value.trim() })}
                  className="w-full bg-neutral-800 text-xs text-white rounded px-3 py-2 border border-neutral-700 focus:outline-none focus:border-[#E50914]"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">Supabase Anon Key</label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseConfig.supabaseAnonKey}
                  onChange={(e) => updateSupabaseConfig({ supabaseAnonKey: e.target.value.trim() })}
                  className="w-full bg-neutral-800 text-xs text-white rounded px-3 py-2 border border-neutral-700 focus:outline-none focus:border-[#E50914]"
                />
              </div>
            </div>

            {/* Supabase Actions Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-800">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-300">
                <input
                  type="checkbox"
                  checked={supabaseConfig.useLiveSupabase}
                  onChange={(e) => updateSupabaseConfig({ useLiveSupabase: e.target.checked })}
                  className="w-4 h-4 rounded text-[#E50914] bg-neutral-800 border-neutral-700 focus:ring-0"
                />
                <span>Ativar Sincronização Automática em Nuvem</span>
              </label>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  disabled={isTestingSupabase}
                  onClick={async () => {
                    if (!supabaseConfig.supabaseUrl || !supabaseConfig.supabaseAnonKey) {
                      alert('Preencha a URL e a Anon Key do Supabase antes de testar.');
                      return;
                    }
                    setIsTestingSupabase(true);
                    setSupabaseTestResult(null);
                    const res = await testSupabase(supabaseConfig.supabaseUrl, supabaseConfig.supabaseAnonKey);
                    setIsTestingSupabase(false);
                    setSupabaseTestResult(res);
                  }}
                  className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white border border-neutral-700 transition-colors"
                >
                  {isTestingSupabase ? 'Testando...' : 'Testar Conexão'}
                </button>

                <button
                  disabled={isPushingSupabase}
                  onClick={async () => {
                    setIsPushingSupabase(true);
                    const res = await pushToSupabaseCloud();
                    setIsPushingSupabase(false);
                    alert(res.message);
                  }}
                  className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isPushingSupabase ? 'Enviando...' : 'Enviar Dados deste PC (Upload)'}</span>
                </button>

                <button
                  disabled={isPullingSupabase}
                  onClick={async () => {
                    setIsPullingSupabase(true);
                    const res = await pullFromSupabaseCloud();
                    setIsPullingSupabase(false);
                    alert(res.message);
                  }}
                  className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isPullingSupabase ? 'Baixando...' : 'Puxar da Nuvem (Download)'}</span>
                </button>
              </div>
            </div>

            {supabaseTestResult && (
              <div className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                supabaseTestResult.ok ? 'bg-emerald-950/60 border border-emerald-500 text-emerald-300' : 'bg-red-950/60 border border-red-500 text-red-300'
              }`}>
                {supabaseTestResult.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                <span>{supabaseTestResult.message}</span>
              </div>
            )}

            {/* Quick RLS 42501 Fix Card */}
            <div className="p-3.5 rounded-lg bg-amber-950/40 border border-amber-500/40 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs font-bold text-amber-200">
                    Apareceu o erro de Row-Level Security (RLS 42501) ao enviar?
                  </span>
                </div>
                <button
                  onClick={handleCopyRlsFix}
                  className="flex items-center justify-center gap-1.5 px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-colors cursor-pointer shrink-0"
                >
                  {copiedRlsFix ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedRlsFix ? 'Comando Copiado!' : 'Copiar Correção RLS (1 Clique)'}</span>
                </button>
              </div>
              <p className="text-[11px] text-amber-300/90 leading-relaxed">
                O PostgreSQL do Supabase por padrão bloqueia gravações feitas pela chave pública anônima. Basta colar este comando rápido na aba aberta do <strong>SQL Editor</strong> do Supabase e clicar em <strong>Run</strong>:
              </p>
              <pre className="p-2.5 bg-black/60 rounded border border-amber-500/30 text-[10px] font-mono text-amber-300 select-all overflow-x-auto">
{`alter table public.series disable row level security;
alter table public.episodes disable row level security;
alter table public.user_reactions disable row level security;
alter table public.episodes add column if not exists is_synopsis boolean default false;`}
              </pre>
            </div>

            {/* SQL Script for Supabase */}
            <div className="pt-2 space-y-2 border-t border-neutral-800">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Script SQL Completo do Supabase (Criação das Tabelas)</h4>
                  <p className="text-[11px] text-neutral-400">Copie e execute no SQL Editor do Supabase se estiver criando um novo banco:</p>
                </div>
                <button
                  onClick={handleCopySql}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#E50914] hover:bg-[#b80710] text-xs font-bold text-white transition-colors"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copiado!' : 'Copiar Script SQL'}</span>
                </button>
              </div>

              <pre className="p-3 bg-black/80 rounded-lg text-[11px] font-mono text-neutral-300 overflow-x-auto max-h-48 border border-neutral-800">
                {SUPABASE_SQL_SCHEMA}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CRIAR / EDITAR USUÁRIO (REQUIREMENT 1) */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#181818] border border-neutral-800 rounded-xl w-full max-w-md p-6 text-white space-y-4 my-auto shadow-2xl">
            <h3 className="text-lg font-bold text-white border-b border-neutral-800 pb-3 flex items-center gap-2">
              <Key className="w-5 h-5 text-[#E50914]" />
              <span>{editingUser?.id ? 'Editar Usuário e Senha' : 'Criar Novo Usuário'}</span>
            </h3>

            <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
              <div>
                <label className="text-neutral-400 block mb-1">Nome Completo do Usuário *</label>
                <input
                  type="text"
                  required
                  value={editingUser?.name || ''}
                  onChange={(e) => setEditingUser(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Carlos Eduardo Silva"
                  className="w-full bg-neutral-800 text-white rounded px-3 py-2 border border-neutral-700 focus:outline-none focus:border-[#E50914]"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">LOGIN de Acesso *</label>
                <input
                  type="text"
                  required
                  value={editingUser?.login || ''}
                  onChange={(e) => setEditingUser(prev => ({ ...prev, login: e.target.value }))}
                  placeholder="Ex: carlos.aluno ou email"
                  className="w-full bg-neutral-800 text-white font-mono rounded px-3 py-2 border border-neutral-700 focus:outline-none focus:border-[#E50914]"
                />
                <p className="text-[10px] text-neutral-500 mt-1">Este será o identificador usado para entrar no aplicativo.</p>
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">SENHA de Acesso *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={editingUser?.password || ''}
                    onChange={(e) => setEditingUser(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Digite a senha deste usuário"
                    className="w-full bg-neutral-800 text-white font-mono rounded pl-3 pr-20 py-2 border border-neutral-700 focus:outline-none focus:border-[#E50914]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const randomPass = Math.random().toString(36).slice(-8) + '!';
                      setEditingUser(prev => ({ ...prev, password: randomPass }));
                    }}
                    className="absolute right-2 top-1.5 px-2 py-0.5 rounded bg-neutral-700 hover:bg-neutral-600 text-[10px] font-bold text-neutral-200"
                  >
                    Gerar
                  </button>
                </div>
                <p className="text-[10px] text-neutral-500 mt-1">A senha é exibida em texto claro para controle do administrador.</p>
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Perfil de Acesso *</label>
                <select
                  value={editingUser?.role || 'user'}
                  onChange={(e) => setEditingUser(prev => ({ ...prev, role: e.target.value as 'admin' | 'user' }))}
                  className="w-full bg-neutral-800 text-white rounded px-3 py-2 border border-neutral-700 focus:outline-none focus:border-[#E50914]"
                >
                  <option value="user">Estudante / Aluno (Apenas Séries & Catálogo)</option>
                  <option value="admin">Administrador (Acesso Total ao Painel)</option>
                </select>
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">E-mail de Contato (Opcional)</label>
                <input
                  type="email"
                  value={editingUser?.email || ''}
                  onChange={(e) => setEditingUser(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="usuario@empresa.com"
                  className="w-full bg-neutral-800 text-white rounded px-3 py-2 border border-neutral-700 focus:outline-none focus:border-[#E50914]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    setUserModalOpen(false);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-[#E50914] hover:bg-[#b80710] text-white font-bold transition-colors"
                >
                  Salvar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT SERIES (WITH DURATION ESTIMATE) */}
      {seriesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#181818] border border-neutral-800 rounded-xl w-full max-w-2xl p-6 text-white space-y-4 my-auto shadow-2xl">
            <h3 className="text-lg font-bold text-white border-b border-neutral-800 pb-3">
              {editingSeries?.id ? 'Editar Áudio Série' : 'Nova Áudio Série de Treinamento'}
            </h3>

            <form onSubmit={handleSaveSeries} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-neutral-400 block mb-1">Título da Série *</label>
                  <input
                    type="text"
                    required
                    value={editingSeries?.title || ''}
                    onChange={(e) => setEditingSeries(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: High Stakes Leadership"
                    className="w-full bg-neutral-800 text-white rounded px-3 py-2 border border-neutral-700 focus:outline-none focus:border-[#E50914]"
                  />
                </div>

                <div>
                  <label className="text-neutral-400 block mb-1">Categoria do Carrossel *</label>
                  <input
                    type="text"
                    required
                    value={editingSeries?.category || ''}
                    onChange={(e) => setEditingSeries(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="Ex: Liderança e Gestão Estratégica"
                    className="w-full bg-neutral-800 text-white rounded px-3 py-2 border border-neutral-700 focus:outline-none focus:border-[#E50914]"
                  />
                </div>
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Sinopse Exclusiva da Série *</label>
                <textarea
                  rows={3}
                  required
                  value={editingSeries?.synopsis || ''}
                  onChange={(e) => setEditingSeries(prev => ({ ...prev, synopsis: e.target.value }))}
                  placeholder="Descrição cinematográfica detalhada do treinamento..."
                  className="w-full bg-neutral-800 text-white rounded px-3 py-2 border border-neutral-700 focus:outline-none focus:border-[#E50914]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-neutral-400 block mb-1">Link Externo da Imagem de Banner (16:9) *</label>
                  <input
                    type="text"
                    required
                    value={editingSeries?.heroImage || ''}
                    onChange={(e) => setEditingSeries(prev => ({ ...prev, heroImage: e.target.value }))}
                    placeholder="https://... ou caminho de imagem"
                    className="w-full bg-neutral-800 text-white rounded px-3 py-2 border border-neutral-700 focus:outline-none focus:border-[#E50914]"
                  />
                </div>

                <div>
                  <label className="text-neutral-400 block mb-1">Link Externo do Pôster / Card *</label>
                  <input
                    type="text"
                    required
                    value={editingSeries?.posterImage || ''}
                    onChange={(e) => setEditingSeries(prev => ({ ...prev, posterImage: e.target.value }))}
                    placeholder="https://... ou caminho de imagem"
                    className="w-full bg-neutral-800 text-white rounded px-3 py-2 border border-neutral-700 focus:outline-none focus:border-[#E50914]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-neutral-400 block mb-1">Nome do Mentor / Instrutor</label>
                  <input
                    type="text"
                    value={editingSeries?.mentor || ''}
                    onChange={(e) => setEditingSeries(prev => ({ ...prev, mentor: e.target.value }))}
                    placeholder="Ex: David Chen"
                    className="w-full bg-neutral-800 text-white rounded px-3 py-2 border border-neutral-700 focus:outline-none focus:border-[#E50914]"
                  />
                </div>

                <div>
                  <label className="text-neutral-400 block mb-1">Duração dos Episódios * (Req. 4)</label>
                  <input
                    type="text"
                    value={editingSeries?.episodeDurationEstimate || '20 min'}
                    onChange={(e) => setEditingSeries(prev => ({ ...prev, episodeDurationEstimate: e.target.value }))}
                    placeholder="Ex: 20 min ou 18 a 25 min"
                    className="w-full bg-neutral-800 text-white rounded px-3 py-2 border border-neutral-700 focus:outline-none focus:border-[#E50914]"
                  />
                </div>

                <div>
                  <label className="text-neutral-400 block mb-1">Classificação Indicativa</label>
                  <input
                    type="text"
                    value={editingSeries?.ratingBadge || '14+'}
                    onChange={(e) => setEditingSeries(prev => ({ ...prev, ratingBadge: e.target.value }))}
                    placeholder="Ex: Livre, 12+, 14+"
                    className="w-full bg-neutral-800 text-white rounded px-3 py-2 border border-neutral-700 focus:outline-none focus:border-[#E50914]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-neutral-400 block mb-1">Qualidade de Áudio</label>
                  <input
                    type="text"
                    value={editingSeries?.audioQuality || 'Áudio Espacial 3D'}
                    onChange={(e) => setEditingSeries(prev => ({ ...prev, audioQuality: e.target.value }))}
                    placeholder="Ex: Dolby Atmos, Áudio 3D"
                    className="w-full bg-neutral-800 text-white rounded px-3 py-2 border border-neutral-700 focus:outline-none focus:border-[#E50914]"
                  />
                </div>

                <div>
                  <label className="text-neutral-400 block mb-1">Tags (separadas por vírgula)</label>
                  <input
                    type="text"
                    value={Array.isArray(editingSeries?.tags) ? editingSeries?.tags.join(', ') : (editingSeries?.tags || '')}
                    onChange={(e) => setEditingSeries(prev => ({ ...prev, tags: e.target.value as any }))}
                    placeholder="Liderança, Estratégia, Gestão"
                    className="w-full bg-neutral-800 text-white rounded px-3 py-2 border border-neutral-700 focus:outline-none focus:border-[#E50914]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="featuredCheck"
                  checked={editingSeries?.featured || false}
                  onChange={(e) => setEditingSeries(prev => ({ ...prev, featured: e.target.checked }))}
                  className="rounded bg-neutral-800 border-neutral-700 text-[#E50914] focus:ring-0"
                />
                <label htmlFor="featuredCheck" className="text-neutral-300 font-semibold cursor-pointer">
                  Destacar no Billboard Principal (Tela Inicial)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    setSeriesModalOpen(false);
                    setEditingSeries(null);
                  }}
                  className="px-4 py-2 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-[#E50914] hover:bg-[#b80710] text-white font-bold transition-colors"
                >
                  Salvar Série
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT EPISODE */}
      {episodeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#181818] border border-neutral-800 rounded-xl w-full max-w-2xl p-6 text-white space-y-4 my-auto shadow-2xl">
            <h3 className="text-lg font-bold text-white border-b border-neutral-800 pb-3">
              {editingEpisode?.id ? 'Editar Episódio' : 'Novo Episódio de Áudio'}
            </h3>

            <form onSubmit={handleSaveEpisode} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="text-neutral-400 block mb-1">Áudio Série Vinculada *</label>
                  <select
                    required
                    value={editingEpisode?.seriesId || ''}
                    onChange={(e) => {
                      const newSeriesId = e.target.value;
                      const sObj = series.find(s => s.id === newSeriesId);
                      const epsCount = episodes.filter(ep => ep.seriesId.trim().toLowerCase() === newSeriesId.trim().toLowerCase()).length;
                      setEditingEpisode(prev => ({
                        ...prev,
                        seriesId: newSeriesId,
                        episodeNumber: prev?.id ? prev.episodeNumber : (epsCount + 1),
                        imageUrl: prev?.imageUrl || sObj?.posterImage || sObj?.heroImage || '',
                      }));
                    }}
                    className="w-full bg-neutral-800 text-white rounded px-3 py-2 border border-neutral-700 focus:outline-none focus:border-[#E50914]"
                  >
                    {series.map((s) => {
                      const sCount = episodes.filter(ep => ep.seriesId.trim().toLowerCase() === s.id.trim().toLowerCase()).length;
                      return (
                        <option key={s.id} value={s.id}>
                          {s.title} ({sCount} {sCount === 1 ? 'ep.' : 'eps.'})
                        </option>
                      );
                    })}
                  </select>

                  {/* Confirmação visual em tempo real da série vinculada */}
                  {(() => {
                    const currentSelected = series.find(s => s.id === editingEpisode?.seriesId);
                    const epsCount = episodes.filter(ep => ep.seriesId.trim().toLowerCase() === editingEpisode?.seriesId?.trim().toLowerCase()).length;
                    if (!currentSelected) return null;
                    return (
                      <div className="mt-2 p-2.5 rounded bg-neutral-900 border border-neutral-700/80 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 truncate">
                          <div className="w-10 h-7 rounded overflow-hidden bg-neutral-800 shrink-0">
                            <img src={currentSelected.posterImage || currentSelected.heroImage} alt={currentSelected.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="text-[11px] truncate">
                            <p className="font-bold text-white truncate">{currentSelected.title}</p>
                            <p className="text-neutral-400 text-[10px]">{currentSelected.category}</p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-neutral-800 text-amber-300 font-mono text-[10px] font-bold shrink-0">
                          {epsCount} {epsCount === 1 ? 'ep. existente' : 'eps. existentes'}
                        </span>
                      </div>
                    );
                  })()}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-neutral-300 font-bold block">Nº do Episódio *</label>
                    <span className="text-[10px] text-amber-400 font-semibold">
                      {(editingEpisode?.isSynopsis || Number(editingEpisode?.episodeNumber) === 0)
                        ? '0 = Sinopse / Abertura'
                        : 'Episódio ≥ 1'}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingEpisode?.episodeNumber ?? 1}
                    onChange={(e) => {
                      const rawVal = e.target.value;
                      const parsed = rawVal === '' ? 0 : parseInt(rawVal, 10);
                      const isZero = parsed === 0;
                      setEditingEpisode(prev => ({
                        ...prev,
                        episodeNumber: isNaN(parsed) ? 0 : parsed,
                        isSynopsis: isZero,
                      }));
                    }}
                    className={`w-full text-white rounded px-3 py-2 border font-mono font-bold focus:outline-none ${
                      (editingEpisode?.isSynopsis || Number(editingEpisode?.episodeNumber) === 0)
                        ? 'bg-amber-950/40 border-amber-500/60 text-amber-300'
                        : 'bg-neutral-800 border-neutral-700 focus:border-[#E50914]'
                    }`}
                  />
                </div>
              </div>

              {/* SELETOR INTERATIVO DE FINALIDADE DO ÁUDIO: SINOPSE (EP. 0) VS EPISÓDIO DE TREINAMENTO (EP. 1+) */}
              <div className="space-y-1.5 pt-1">
                <label className="text-neutral-300 font-bold block text-[11px] uppercase tracking-wider">
                  Finalidade deste Áudio (Classificação):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Card 1: Sinopse / Introdução (Episódio 0) */}
                  <div
                    onClick={() => {
                      const sId = editingEpisode?.seriesId;
                      const sObj = series.find(s => s.id === sId);
                      setEditingEpisode(prev => ({
                        ...prev,
                        isSynopsis: true,
                        episodeNumber: 0,
                        title: (!prev?.title || prev?.title === '')
                          ? `Sinopse: Introdução a ${sObj?.title || 'Série'}`
                          : prev?.title,
                        durationMinutes: prev?.durationMinutes && prev.durationMinutes !== 20 ? prev.durationMinutes : 6,
                        durationFormatted: prev?.durationFormatted && prev.durationFormatted !== '20 min' ? prev.durationFormatted : '6 min',
                      }));
                    }}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      (editingEpisode?.isSynopsis || Number(editingEpisode?.episodeNumber) === 0)
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-1 ring-amber-400/50 shadow-md shadow-amber-500/10'
                        : 'bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:bg-neutral-850'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                        <Radio className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>🎙️ Sinopse / Abertura (Episódio 0)</span>
                      </div>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-300 border border-amber-500/40 shrink-0">
                        EP. 0
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-300 leading-relaxed">
                      Áudio de abertura com visão geral e introdução da série. É reproduzido quando o usuário clica no botão <strong>Sinopse</strong>. <strong>Não é o Episódio 1</strong>.
                    </p>
                  </div>

                  {/* Card 2: Episódio de Treinamento (1, 2, 3...) */}
                  <div
                    onClick={() => {
                      const sId = editingEpisode?.seriesId;
                      const regularEps = episodes.filter(ep => ep.seriesId.trim().toLowerCase() === sId?.trim().toLowerCase() && Number(ep.episodeNumber) > 0 && !ep.isSynopsis);
                      const nextEpNum = regularEps.length > 0 ? (regularEps.length + 1) : 1;
                      const targetNum = (editingEpisode?.episodeNumber && Number(editingEpisode.episodeNumber) > 0)
                        ? Number(editingEpisode.episodeNumber)
                        : nextEpNum;

                      setEditingEpisode(prev => ({
                        ...prev,
                        isSynopsis: false,
                        episodeNumber: targetNum,
                        durationMinutes: prev?.durationMinutes && prev.durationMinutes !== 6 ? prev.durationMinutes : 20,
                        durationFormatted: prev?.durationFormatted && prev.durationFormatted !== '6 min' ? prev.durationFormatted : '20 min',
                      }));
                    }}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      (!editingEpisode?.isSynopsis && Number(editingEpisode?.episodeNumber) > 0)
                        ? 'bg-[#E50914]/15 border-[#E50914] text-white ring-1 ring-[#E50914]/50 shadow-md shadow-[#E50914]/10'
                        : 'bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:bg-neutral-850'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                        <Play className="w-3.5 h-3.5 fill-[#E50914] text-[#E50914] shrink-0" />
                        <span>🎧 Episódio de Treinamento (1, 2, 3...)</span>
                      </div>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700 shrink-0">
                        EP. ≥ 1
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-300 leading-relaxed">
                      Aula regular com conteúdo programático. O primeiro áudio de treinamento é verdadeiramente o <strong>Episódio 1</strong>.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Título do Episódio *</label>
                <input
                  type="text"
                  required
                  value={editingEpisode?.title || ''}
                  onChange={(e) => setEditingEpisode(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: O Dilema do Primeiro Minuto: Como Agir sob Choque"
                  className="w-full bg-neutral-800 text-white rounded px-3 py-2 border border-neutral-700 focus:outline-none focus:border-[#E50914]"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Sinopse do Episódio *</label>
                <textarea
                  rows={3}
                  required
                  value={editingEpisode?.synopsis || ''}
                  onChange={(e) => setEditingEpisode(prev => ({ ...prev, synopsis: e.target.value }))}
                  placeholder="Descrição sucinta dos tópicos e insights abordados neste episódio..."
                  className="w-full bg-neutral-800 text-white rounded px-3 py-2 border border-neutral-700 focus:outline-none focus:border-[#E50914]"
                />
              </div>

              {/* GOOGLE DRIVE AUDIO LINK INPUT WITH DIAGNOSTICS & TEST */}
              {(() => {
                const analysis = analyzeAudioUrl(editingEpisode?.audioUrl || '');
                return (
                  <div className="bg-neutral-900 p-3 rounded-lg border border-neutral-700/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-neutral-200 font-semibold flex items-center gap-1.5 text-xs">
                        <HardDrive className="w-4 h-4 text-blue-400" />
                        <span>Link do Áudio no Google Drive ou Link Direto *</span>
                      </label>
                      {analysis.isGoogleDrive && analysis.fileId && (
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 rounded flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>Arquivo Google Drive Válido</span>
                        </span>
                      )}
                    </div>

                    <input
                      type="text"
                      required
                      value={editingEpisode?.audioUrl || ''}
                      onChange={(e) => setEditingEpisode(prev => ({ ...prev, audioUrl: e.target.value }))}
                      placeholder="https://drive.google.com/file/d/SEU_ID_DO_ARQUIVO/view?usp=sharing"
                      className="w-full bg-neutral-800 text-white rounded px-3 py-2 border border-neutral-700 focus:outline-none focus:border-blue-400 font-mono text-[11px]"
                    />

                    {/* Folder warning if user accidentally pasted a folder link */}
                    {analysis.isFolder && (
                      <div className="p-2.5 rounded bg-red-500/10 border border-red-500/40 text-xs text-red-300 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <span>{analysis.errorMessage}</span>
                      </div>
                    )}

                    {/* Google Drive Status & Quick Test */}
                    {analysis.isGoogleDrive && analysis.fileId && (
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-800 text-xs">
                        <span className="text-[11px] text-neutral-400 font-mono truncate max-w-xs">
                          ID: <strong className="text-white">{analysis.fileId}</strong>
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (editingEpisode) {
                                playEpisode({
                                  id: editingEpisode.id || `ep-test-${Date.now()}`,
                                  seriesId: editingEpisode.seriesId || (series[0]?.id || ''),
                                  episodeNumber: editingEpisode.episodeNumber || 1,
                                  season: 1,
                                  title: editingEpisode.title || 'Teste de Áudio',
                                  synopsis: editingEpisode.synopsis || '',
                                  durationMinutes: 10,
                                  durationFormatted: editingEpisode.durationFormatted || '10 min',
                                  audioUrl: editingEpisode.audioUrl || '',
                                  imageUrl: editingEpisode.imageUrl || '',
                                  createdAt: new Date().toISOString(),
                                });
                              }
                            }}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Testar Áudio Agora</span>
                          </button>
                          {analysis.directWebUrl && (
                            <a
                              href={analysis.directWebUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 rounded bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 text-[11px] flex items-center gap-1"
                              title="Abrir no Google Drive para verificar permissão"
                            >
                              <span>Ver no Drive</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    <p className="text-[11px] text-neutral-400 leading-tight">
                      Dica Essencial: No Google Drive, clique com o botão direito no arquivo MP3 &gt; <strong>Compartilhar</strong> &gt; em &ldquo;Acesso geral&rdquo;, selecione <strong>&ldquo;Qualquer pessoa com o link&rdquo;</strong> (função: Leitor).
                    </p>
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-neutral-400 block mb-1">Link da Imagem de Thumbnail</label>
                  <input
                    type="text"
                    value={editingEpisode?.imageUrl || ''}
                    onChange={(e) => setEditingEpisode(prev => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="https://... ou caminho de imagem"
                    className="w-full bg-neutral-800 text-white rounded px-3 py-2 border border-neutral-700 focus:outline-none focus:border-[#E50914]"
                  />
                </div>

                <div>
                  <label className="text-neutral-400 block mb-1">Duração do Episódio * (Req. 4)</label>
                  <input
                    type="text"
                    value={editingEpisode?.durationFormatted || '20 min'}
                    onChange={(e) => setEditingEpisode(prev => ({ ...prev, durationFormatted: e.target.value }))}
                    placeholder="Ex: 22 min"
                    className="w-full bg-neutral-800 text-white rounded px-3 py-2 border border-neutral-700 focus:outline-none focus:border-[#E50914]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    setEpisodeModalOpen(false);
                    setEditingEpisode(null);
                  }}
                  className="px-4 py-2 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-[#E50914] hover:bg-[#b80710] text-white font-bold transition-colors"
                >
                  Salvar Episódio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
