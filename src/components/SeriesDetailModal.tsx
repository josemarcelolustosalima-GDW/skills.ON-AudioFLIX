import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Play,
  Plus,
  Check,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  Heart,
  Volume2,
  VolumeX,
  Clock,
  Radio,
  ExternalLink,
  Layers,
  RotateCcw,
} from 'lucide-react';
import { AudioEpisode } from '../types';
import { formatSecondsToTime } from '../utils/audioResolver';

export const SeriesDetailModal: React.FC = () => {
  const {
    selectedSeriesForModal,
    closeSeriesModal,
    episodes,
    playEpisode,
    currentUser,
    toggleMyList,
    toggleReaction,
    toggleEpisodeReaction,
    toggleEpisodeCompleted,
    series: allSeries,
    currentPlayingEpisode,
    isPlaying,
    setCurrentView,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'episodes' | 'similar' | 'about'>('episodes');
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSeriesModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeSeriesModal]);

  if (!selectedSeriesForModal) return null;

  const series = allSeries.find(s => s.id.trim() === selectedSeriesForModal.id.trim()) || selectedSeriesForModal;
  const seriesEpisodes = episodes
    .filter(e => e.seriesId.trim().toLowerCase() === series.id.trim().toLowerCase())
    .sort((a, b) => (Number(a.episodeNumber) || 0) - (Number(b.episodeNumber) || 0));
  const isInMyList = currentUser.myList.includes(series.id);
  const currentReaction = currentUser.reactions[series.id];

  // Similar series recommendations
  const similarSeries = allSeries
    .filter(s => s.id !== series.id && (s.category === series.category || s.tags.some(t => series.tags.includes(t))))
    .slice(0, 3);

  // Dedicated Synopsis audio (Episode 0 or isSynopsis: true)
  const synopsisEpisode = seriesEpisodes.find(e => e.isSynopsis || Number(e.episodeNumber) === 0)
    || seriesEpisodes.find(e => e.title.toLowerCase().includes('sinopse') || e.title.toLowerCase().includes('abertura'))
    || null;

  // Real training episodes (Episódio 1 em diante)
  const trainingEpisodes = seriesEpisodes.filter(e => !e.isSynopsis && Number(e.episodeNumber) > 0);

  // Completion metrics
  const completedEpisodesCount = seriesEpisodes.filter(e => currentUser.listenProgress[e.id]?.completed).length;
  const isSeriesCompleted = seriesEpisodes.length > 0 && completedEpisodesCount === seriesEpisodes.length;
  const seriesProgressPct = seriesEpisodes.length > 0 ? Math.round((completedEpisodesCount / seriesEpisodes.length) * 100) : 0;

  // Next episode to continue or resume
  const inProgressEpisode = seriesEpisodes.find(e => {
    const p = currentUser.listenProgress[e.id];
    return p && !p.completed && p.currentTime > 5;
  }) || seriesEpisodes.find(e => !currentUser.listenProgress[e.id]?.completed) || seriesEpisodes[0];

  const handlePlayEpisode = (episode: AudioEpisode) => {
    playEpisode(episode, series);
  };

  // Play opening audio (episode 0 / isSynopsis) as synopsis
  const handlePlaySynopsis = () => {
    if (synopsisEpisode) {
      handlePlayEpisode(synopsisEpisode);
    } else if (seriesEpisodes[0]) {
      handlePlayEpisode(seriesEpisodes[0]);
    }
  };

  // Navigate to training series episodes list
  const handleGoToEpisodes = () => {
    setActiveTab('episodes');
    setCurrentView('series_catalog');
    setTimeout(() => {
      const section = document.getElementById('modal-episodes-section');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto visible-scrollbar bg-black/85 backdrop-blur-sm flex justify-center items-start p-0 sm:p-4 md:py-8 animate-in fade-in duration-200">
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={closeSeriesModal} />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-4xl bg-[#181818] rounded-none sm:rounded-xl overflow-hidden shadow-2xl z-10 my-0 sm:my-4 md:my-6 border border-neutral-800 text-white flex flex-col mb-16">
        {/* Close Button */}
        <button
          onClick={closeSeriesModal}
          className="absolute top-4 right-4 z-30 w-9 h-9 rounded-full bg-[#181818]/80 hover:bg-neutral-800 border border-neutral-700 text-white flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Hero Banner Section */}
        <div className="relative aspect-[16/9] md:aspect-[21/9] w-full bg-neutral-900 overflow-hidden">
          <img
            src={series.heroImage || series.posterImage}
            alt={series.title}
            className="w-full h-full object-cover object-top"
          />

          {/* Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#181818]/80 via-transparent to-transparent" />

          {/* Banner Overlaid Content */}
          <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 md:left-10 sm:right-6 z-20">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#E50914]">
              <span>ÁUDIO SÉRIE</span>
              <span className="text-neutral-500">•</span>
              <span className="text-neutral-300 truncate">{series.category}</span>
            </div>

            <h2 className="text-xl sm:text-2xl md:text-4xl font-extrabold tracking-tight text-white mb-2 sm:mb-3 drop-shadow-md">
              {series.title}
            </h2>

            {/* Series Overall Evolution Progress Bar */}
            {seriesProgressPct > 0 && (
              <div className="mb-3 max-w-sm sm:max-w-md bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-neutral-700/80 flex items-center gap-2.5 shadow-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-[10px] sm:text-xs mb-1 font-semibold">
                    <span className="text-neutral-300 flex items-center gap-1">
                      {isSeriesCompleted ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Série Totalmente Concluída</span>
                        </>
                      ) : (
                        <span>Progresso do Aluno</span>
                      )}
                    </span>
                    <span className={isSeriesCompleted ? 'text-emerald-400 font-bold' : 'text-[#E50914] font-bold'}>
                      {completedEpisodesCount}/{seriesEpisodes.length} ouvidos ({seriesProgressPct}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-700/80 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isSeriesCompleted ? 'bg-emerald-500' : 'bg-[#E50914]'
                      }`}
                      style={{ width: `${seriesProgressPct}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Actions Bar: CONTINUAR / SINOPSE / EPISÓDIOS */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Botão Principal: Continuar ou Ouvir Próximo se houver progresso */}
              {inProgressEpisode && (
                <button
                  onClick={() => handlePlayEpisode(inProgressEpisode)}
                  className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded bg-[#E50914] hover:bg-[#b80710] text-white font-bold text-xs sm:text-base transition-all active:scale-95 shadow-lg shadow-[#E50914]/25 cursor-pointer"
                  title={`Ouvir ${inProgressEpisode.title}`}
                >
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
                  <span>
                    {currentPlayingEpisode?.id === inProgressEpisode.id && isPlaying
                      ? 'Reproduzindo Agora'
                      : currentUser.listenProgress[inProgressEpisode.id]?.currentTime && !currentUser.listenProgress[inProgressEpisode.id]?.completed
                      ? `Continuar Ep. ${inProgressEpisode.episodeNumber}`
                      : isSeriesCompleted
                      ? 'Ouvir Série Novamente'
                      : `Episódio ${inProgressEpisode.episodeNumber}`}
                  </span>
                </button>
              )}

              {/* Botão: SINOPSE (Primeiro áudio com explicação e detalhes da série) */}
              <button
                onClick={handlePlaySynopsis}
                className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded bg-white/90 hover:bg-white text-black font-bold text-xs sm:text-base transition-all active:scale-95 shadow-lg cursor-pointer"
                title="Ouvir o áudio de abertura com explicações e detalhes da série"
              >
                <Radio className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-black" />
                <span>Sinopse</span>
              </button>

              {/* Botão: EPISÓDIOS DA SÉRIE */}
              <button
                onClick={handleGoToEpisodes}
                className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded bg-neutral-800/90 hover:bg-neutral-700 text-white font-bold text-xs sm:text-base transition-all active:scale-95 border border-neutral-700 cursor-pointer"
                title="Ver a lista de episódios de treinamento e escolher qual ouvir"
              >
                <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                <span className="hidden xs:inline">Ver Episódios</span>
              </button>

              <button
                onClick={() => toggleMyList(series.id)}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-neutral-500 hover:border-white bg-[#2a2a2a]/80 text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                title={isInMyList ? 'Remover da Minha Lista' : 'Adicionar à Minha Lista'}
              >
                {isInMyList ? <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" /> : <Plus className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>

              {/* Reaction Thumbs */}
              <div className="flex items-center gap-0.5 sm:gap-1 bg-[#2a2a2a]/80 border border-neutral-700 rounded-full p-0.5 sm:p-1">
                <button
                  onClick={() => toggleReaction(series.id, 'like')}
                  className={`p-2 rounded-full transition-colors ${
                    currentReaction === 'like'
                      ? 'bg-[#E50914] text-white'
                      : 'text-neutral-300 hover:text-white hover:bg-neutral-700'
                  }`}
                  title="Gostei"
                >
                  <ThumbsUp className="w-4 h-4" />
                </button>

                <button
                  onClick={() => toggleReaction(series.id, 'double_like')}
                  className={`p-2 rounded-full transition-colors ${
                    currentReaction === 'double_like'
                      ? 'bg-[#E50914] text-white'
                      : 'text-neutral-300 hover:text-[#E50914] hover:bg-neutral-700'
                  }`}
                  title="Amei!"
                >
                  <Heart className="w-4 h-4 fill-current" />
                </button>

                <button
                  onClick={() => toggleReaction(series.id, 'dislike')}
                  className={`p-2 rounded-full transition-colors ${
                    currentReaction === 'dislike'
                      ? 'bg-neutral-700 text-[#E50914]'
                      : 'text-neutral-300 hover:text-white hover:bg-neutral-700'
                  }`}
                  title="Não é para mim"
                >
                  <ThumbsDown className="w-4 h-4" />
                </button>
              </div>

              {/* Likes counter badge */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-900/80 border border-neutral-700 text-xs text-neutral-300">
                <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold text-white">{series.likes}</span>
                <span className="text-neutral-500">|</span>
                <ThumbsDown className="w-3.5 h-3.5 text-neutral-400" />
                <span className="text-neutral-400">{series.unlikes}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="px-6 md:px-10 py-6">
          {/* Metadata Split Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-neutral-800">
            {/* Left 2 Cols: Details & Synopsis */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="text-emerald-400 font-bold">{series.matchScore}% de Relevância</span>
                <span className="text-neutral-400">{series.releaseYear}</span>
                <span className="px-2 py-0.5 border border-neutral-600 rounded text-xs text-neutral-300 font-semibold">
                  {series.ratingBadge}
                </span>
                <span className="text-neutral-300">{seriesEpisodes.length} Episódios</span>
                <span className="flex items-center gap-1 text-xs text-amber-300 font-semibold bg-neutral-800/80 px-2.5 py-0.5 rounded border border-neutral-700">
                  <Clock className="w-3.5 h-3.5" />
                  <span>2 a 4 min por episódio</span>
                </span>
                <span className="px-2 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-300 font-medium">
                  {series.audioQuality}
                </span>
              </div>

              <p className="text-sm md:text-base text-neutral-200 leading-relaxed">
                {series.synopsis}
              </p>
            </div>

            {/* Right 1 Col: Mentor & Tags */}
            <div className="space-y-3 text-xs md:text-sm">
              <div>
                <span className="text-neutral-500 block mb-0.5">Mentor Especialista:</span>
                <span className="text-white font-medium">{series.mentor}</span>
                {series.mentorRole && (
                  <span className="block text-neutral-400 text-xs">{series.mentorRole}</span>
                )}
              </div>

              <div>
                <span className="text-neutral-500 block mb-0.5">Gênero & Categoria:</span>
                <span className="text-white font-medium">{series.category}</span>
              </div>

              <div>
                <span className="text-neutral-500 block mb-1">Tags do Treinamento:</span>
                <div className="flex flex-wrap gap-1.5">
                  {series.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs text-neutral-300 hover:text-white transition-colors"
                    >
                      {tag} •
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs (Episódios / Semelhantes / Sobre) */}
          <div id="modal-episodes-section" className="mt-8 mb-6 flex items-center justify-between border-b border-neutral-800 pb-3 scroll-mt-6">
            <div className="flex items-center gap-6">
              <button
                onClick={() => setActiveTab('episodes')}
                className={`text-lg font-bold pb-2 transition-colors border-b-2 ${
                  activeTab === 'episodes'
                    ? 'text-white border-[#E50914]'
                    : 'text-neutral-400 border-transparent hover:text-neutral-200'
                }`}
              >
                Episódios
              </button>

              {similarSeries.length > 0 && (
                <button
                  onClick={() => setActiveTab('similar')}
                  className={`text-lg font-bold pb-2 transition-colors border-b-2 ${
                    activeTab === 'similar'
                      ? 'text-white border-[#E50914]'
                      : 'text-neutral-400 border-transparent hover:text-neutral-200'
                  }`}
                >
                  Títulos Semelhantes
                </button>
              )}

              <button
                onClick={() => setActiveTab('about')}
                className={`text-lg font-bold pb-2 transition-colors border-b-2 ${
                  activeTab === 'about'
                    ? 'text-white border-[#E50914]'
                    : 'text-neutral-400 border-transparent hover:text-neutral-200'
                }`}
              >
                Sobre {series.title}
              </button>
            </div>

            {/* Season Selector */}
            {activeTab === 'episodes' && (
              <div className="text-sm font-semibold text-neutral-300 bg-neutral-800/80 px-3 py-1.5 rounded border border-neutral-700">
                Temporada 1
              </div>
            )}
          </div>

          {/* TAB 1: EPISODES LIST (Prominent Visible Scrollbar) */}
          {activeTab === 'episodes' && (
            <div className="space-y-3">
              {/* Episodes Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-neutral-900/90 px-3.5 py-2.5 rounded-lg border border-neutral-800">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-xs sm:text-sm">
                    {seriesEpisodes.length} {seriesEpisodes.length === 1 ? 'Áudio Cadastrado' : 'Áudios Cadastrados'}
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    ({trainingEpisodes.length} {trainingEpisodes.length === 1 ? 'episódio de treinamento' : 'episódios de treinamento'} {synopsisEpisode ? '+ 1 sinopse' : ''})
                  </span>
                </div>
              </div>

              {/* Scrollable Episodes List Container with explicit Visible Scrollbar */}
              <div className="space-y-3 max-h-[480px] md:max-h-[600px] overflow-y-auto pr-2 visible-scrollbar">
                {seriesEpisodes.length === 0 ? (
                  <div className="text-center py-12 text-neutral-400">
                    <p>Nenhum episódio cadastrado nesta série ainda.</p>
                  </div>
                ) : (
                  seriesEpisodes.map((episode) => {
                    const isCurrent = currentPlayingEpisode?.id === episode.id;
                    const isEpSynopsis = Boolean(episode.isSynopsis || Number(episode.episodeNumber) === 0);
                    const progress = currentUser.listenProgress[episode.id];
                    const isCompleted = Boolean(progress?.completed);
                    const progressPct = isCompleted
                      ? 100
                      : progress && progress.duration > 0
                      ? Math.min(100, Math.round((progress.currentTime / progress.duration) * 100))
                      : 0;

                    return (
                      <div
                        key={episode.id}
                        onClick={() => handlePlayEpisode(episode)}
                        className={`group flex flex-col md:flex-row items-start md:items-center justify-between p-3 sm:p-4 rounded-lg transition-all cursor-pointer border ${
                          isCurrent
                            ? 'bg-neutral-800/90 border-[#E50914]/80 shadow-md ring-1 ring-[#E50914]/30'
                            : isCompleted
                            ? 'bg-neutral-900/70 border-emerald-900/50 hover:border-emerald-700/60'
                            : isEpSynopsis
                            ? 'bg-amber-950/20 hover:bg-amber-950/30 border-amber-500/30 hover:border-amber-500/50'
                            : 'bg-neutral-900/50 hover:bg-neutral-800/70 border-neutral-800/80 hover:border-neutral-700'
                        }`}
                      >
                        {/* Left: Number + Thumbnail + Info */}
                        <div className="flex items-start md:items-center gap-2.5 sm:gap-4 w-full md:w-3/4">
                          {/* Episode Number or INTRO Badge or Completed Check */}
                          {isEpSynopsis ? (
                            <div className="flex flex-col items-center justify-center shrink-0 w-8 sm:w-10 pt-1 md:pt-0">
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 tracking-wider">
                                INTRO
                              </span>
                              <span className="text-[8px] text-amber-400/80 font-mono font-bold mt-0.5">EP. 0</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center w-6 sm:w-8 shrink-0 pt-1 md:pt-0">
                              <span className={`text-base sm:text-xl md:text-2xl font-bold transition-colors ${
                                isCompleted ? 'text-emerald-400' : 'text-neutral-500 group-hover:text-white'
                              }`}>
                                {episode.episodeNumber.toString().padStart(2, '0')}
                              </span>
                            </div>
                          )}

                          {/* Thumbnail with Play Hover */}
                          <div className="relative aspect-video w-24 sm:w-32 md:w-40 rounded overflow-hidden bg-neutral-800 shrink-0 border border-neutral-700/50 shadow-inner">
                            <img
                              src={episode.imageUrl || series.posterImage}
                              alt={episode.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />

                            {/* Completed Badge on Thumbnail */}
                            {isCompleted && (
                              <div className="absolute top-1 left-1 bg-emerald-600/95 backdrop-blur text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-1 shadow-md z-10">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                <span>Ouvido</span>
                              </div>
                            )}

                            {/* In-progress badge on Thumbnail */}
                            {!isCompleted && progress && progress.currentTime > 5 && (
                              <div className="absolute top-1 left-1 bg-black/85 backdrop-blur text-amber-300 text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-500/30 flex items-center gap-1 shadow-md z-10">
                                <Clock className="w-2.5 h-2.5" />
                                <span>{formatSecondsToTime(progress.currentTime)}</span>
                              </div>
                            )}

                            {/* Play overlay button */}
                            <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                              isCurrent && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            }`}>
                              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
                                <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-black translate-x-0.5" />
                              </div>
                            </div>

                            {/* Listen progress bar on thumbnail bottom (Red / Emerald like YouTube) */}
                            {progressPct > 0 && (
                              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/70">
                                <div
                                  className={`h-full transition-all duration-300 ${
                                    isCompleted ? 'bg-emerald-500' : 'bg-[#E50914]'
                                  }`}
                                  style={{ width: `${progressPct}%` }}
                                />
                              </div>
                            )}
                          </div>

                          {/* Episode Titles & Synopsis */}
                          <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                              {isEpSynopsis ? (
                                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40 flex items-center gap-1 shrink-0">
                                  <Radio className="w-2.5 h-2.5 text-amber-400" />
                                  <span>ÁUDIO SINOPSE</span>
                                </span>
                              ) : (
                                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-neutral-300 bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-700 shrink-0">
                                  Episódio {episode.episodeNumber}
                                </span>
                              )}

                              {/* Progress Status Pill */}
                              {isCompleted && (
                                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-600/40 flex items-center gap-1 shrink-0">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  <span>Concluído</span>
                                </span>
                              )}

                              {!isCompleted && progress && progress.currentTime > 5 && (
                                <span className="text-[9px] sm:text-[10px] font-bold text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-600/40 flex items-center gap-1 shrink-0">
                                  <Clock className="w-2.5 h-2.5 text-amber-400" />
                                  <span>Parou em {formatSecondsToTime(progress.currentTime)} ({progressPct}%)</span>
                                </span>
                              )}

                              <h4 className={`text-xs sm:text-sm md:text-base font-bold transition-colors line-clamp-1 ${
                                isCurrent ? 'text-[#E50914]' : isEpSynopsis ? 'text-amber-100' : 'text-white group-hover:text-neutral-100'
                              }`}>
                                {episode.title}
                              </h4>

                              {isCurrent && isPlaying && (
                                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#E50914] bg-[#E50914]/20 px-1.5 py-0.5 rounded border border-[#E50914]/40 flex items-center gap-1 shrink-0">
                                  <Radio className="w-2.5 h-2.5 animate-pulse" />
                                  <span>No ar</span>
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] sm:text-xs md:text-sm text-neutral-400 line-clamp-2 leading-relaxed">
                              {episode.synopsis}
                            </p>
                          </div>
                        </div>

                        {/* Right: Likes, Duration, Mark Completed & Listen Button */}
                        <div className="mt-2.5 md:mt-0 flex items-center justify-between md:justify-end gap-2 sm:gap-3 w-full md:w-auto shrink-0 pl-8 sm:pl-12 md:pl-0">
                          {/* Individual Episode Reaction (independent per episode) */}
                          <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-full border border-neutral-800">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleEpisodeReaction(episode.id, 'like');
                              }}
                              className={`p-1 rounded-full transition-all cursor-pointer active:scale-90 ${
                                currentUser.reactions[episode.id] === 'like' || currentUser.reactions[episode.id] === 'double_like'
                                  ? 'text-[#E50914] bg-white/10'
                                  : 'text-neutral-500 hover:text-white'
                              }`}
                              title={
                                currentUser.reactions[episode.id] === 'like'
                                  ? 'Desfazer curtida deste episódio'
                                  : 'Curtir este episódio'
                              }
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleEpisodeReaction(episode.id, 'dislike');
                              }}
                              className={`p-1 rounded-full transition-all cursor-pointer active:scale-90 ${
                                currentUser.reactions[episode.id] === 'dislike'
                                  ? 'text-[#E50914] bg-white/10'
                                  : 'text-neutral-500 hover:text-white'
                              }`}
                              title={
                                currentUser.reactions[episode.id] === 'dislike'
                                  ? 'Desfazer dislike deste episódio'
                                  : 'Não curti este episódio'
                              }
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Manual Toggle Mark As Completed Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleEpisodeCompleted(episode.id);
                            }}
                            className={`p-1.5 rounded-full transition-all border cursor-pointer active:scale-90 ${
                              isCompleted
                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 hover:bg-emerald-500/30'
                                : 'bg-neutral-800/80 border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500'
                            }`}
                            title={isCompleted ? 'Desmarcar como concluído' : 'Marcar manualmente como ouvido'}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>

                          {/* Duration */}
                          <div className="flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-neutral-400 shrink-0">
                            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            <span>{episode.durationFormatted || `${episode.durationMinutes} min`}</span>
                          </div>

                          {/* Smart Play Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayEpisode(episode);
                            }}
                            className={`px-3 py-1.5 rounded text-xs font-bold text-white transition-all border cursor-pointer active:scale-95 flex items-center gap-1.5 shrink-0 ${
                              isCurrent && isPlaying
                                ? 'bg-[#E50914] border-[#E50914] shadow-md'
                                : isCompleted
                                ? 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
                                : !isCompleted && progress && progress.currentTime > 5
                                ? 'bg-[#E50914] hover:bg-[#b80710] border-[#E50914] shadow-sm'
                                : isEpSynopsis
                                ? 'bg-amber-600 hover:bg-amber-500 border-amber-500/50'
                                : 'bg-neutral-800 hover:bg-[#E50914] border-neutral-700'
                            }`}
                          >
                            {isCurrent && isPlaying ? (
                              <span>Pausar</span>
                            ) : isCompleted ? (
                              <>
                                <RotateCcw className="w-3 h-3 text-neutral-400" />
                                <span>Ouvir de novo</span>
                              </>
                            ) : !isCompleted && progress && progress.currentTime > 5 ? (
                              <>
                                <Play className="w-3 h-3 fill-white" />
                                <span>Continuar ({formatSecondsToTime(progress.currentTime)})</span>
                              </>
                            ) : isEpSynopsis ? (
                              <span>Ouvir Sinopse</span>
                            ) : (
                              <span>Ouvir</span>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}

                {seriesEpisodes.length > 3 && (
                  <div className="pt-3 pb-2 text-center text-[11px] text-neutral-500 border-t border-neutral-800/80">
                    Fim da lista • Todos os {seriesEpisodes.length} episódios carregados
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: SIMILAR SERIES */}
          {activeTab === 'similar' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {similarSeries.map((s) => (
                <div
                  key={s.id}
                  onClick={() => {
                    closeSeriesModal();
                    setTimeout(() => useApp().openSeriesModal(s), 50);
                  }}
                  className="bg-neutral-900 rounded-lg overflow-hidden border border-neutral-800 hover:border-neutral-600 cursor-pointer transition-all hover:scale-102"
                >
                  <div className="aspect-video relative">
                    <img src={s.heroImage} alt={s.title} className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] bg-black/70 font-bold">
                      {s.ratingBadge}
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-emerald-400 font-bold">{s.matchScore}% relevante</span>
                      <span className="text-neutral-400">{s.releaseYear}</span>
                    </div>
                    <h4 className="font-bold text-sm text-white truncate">{s.title}</h4>
                    <p className="text-xs text-neutral-400 line-clamp-3 leading-relaxed">
                      {s.synopsis}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: ABOUT */}
          {activeTab === 'about' && (
            <div className="space-y-4 text-sm text-neutral-300">
              <h3 className="text-lg font-bold text-white">Sobre {series.title}</h3>
              <p className="leading-relaxed">{series.synopsis}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-neutral-800">
                <div>
                  <span className="text-xs text-neutral-500 uppercase block font-semibold">Instrutor & Mentor</span>
                  <p className="text-white font-medium mt-1">{series.mentor}</p>
                  <p className="text-xs text-neutral-400">{series.mentorRole}</p>
                </div>

                <div>
                  <span className="text-xs text-neutral-500 uppercase block font-semibold">Tecnologia de Áudio</span>
                  <p className="text-amber-300 font-medium mt-1">{series.audioQuality}</p>
                  <p className="text-xs text-neutral-400">Otimizado para fones de ouvido e estéreo de alta fidelidade</p>
                </div>

                <div>
                  <span className="text-xs text-neutral-500 uppercase block font-semibold">Avaliação da Comunidade</span>
                  <p className="text-white font-medium mt-1">
                    {series.likes} curtidas ({Math.round((series.likes / (series.likes + series.unlikes || 1)) * 100)}% de aprovação)
                  </p>
                </div>

                <div>
                  <span className="text-xs text-neutral-500 uppercase block font-semibold">Total de Ouvintes</span>
                  <p className="text-white font-medium mt-1">{series.totalListens.toLocaleString()} reproduções</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
