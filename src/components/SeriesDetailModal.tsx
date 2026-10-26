import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Play,
  Plus,
  Check,
  ThumbsUp,
  ThumbsDown,
  Heart,
  Volume2,
  VolumeX,
  Clock,
  Radio,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { AudioEpisode } from '../types';

export const SeriesDetailModal: React.FC = () => {
  const {
    selectedSeriesForModal,
    closeSeriesModal,
    episodes,
    playEpisode,
    currentUser,
    toggleMyList,
    toggleReaction,
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

            <h2 className="text-xl sm:text-2xl md:text-4xl font-extrabold tracking-tight text-white mb-3 sm:mb-4 drop-shadow-md">
              {series.title}
            </h2>

            {/* Actions Bar: SINOPSE (Áudio de Abertura) & EPISÓDIOS DA SÉRIE */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Botão 1: SINOPSE (Primeiro áudio com explicação e detalhes da série) */}
              <button
                onClick={handlePlaySynopsis}
                className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded bg-white hover:bg-neutral-200 text-black font-bold text-xs sm:text-base transition-all active:scale-95 shadow-lg cursor-pointer"
                title="Ouvir o áudio de abertura com explicações e detalhes da série"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-black" />
                <span>
                  {currentPlayingEpisode?.id === synopsisEpisode?.id && isPlaying
                    ? 'Tocando Sinopse'
                    : 'Sinopse'}
                </span>
              </button>

              {/* Botão 2: EPISÓDIOS DA SÉRIE */}
              <button
                onClick={handleGoToEpisodes}
                className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded bg-[#E50914] hover:bg-[#b80710] text-white font-bold text-xs sm:text-base transition-all active:scale-95 shadow-lg shadow-[#E50914]/20 cursor-pointer"
                title="Ver a lista de episódios de treinamento e escolher qual ouvir"
              >
                <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                <span className="hidden xs:inline">Episódios da Série</span>
                <span className="xs:hidden">Episódios</span>
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

              {/* Likes counter badge for clarity */}
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
                <span className="flex items-center gap-1 text-xs text-amber-300 font-semibold bg-neutral-800/80 px-2 py-0.5 rounded border border-neutral-700">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{series.episodeDurationEstimate || '20 min por episódio'}</span>
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

          {/* TAB 1: EPISODES LIST (Netflix Layout Standard with Prominent Visible Scrollbar) */}
          {activeTab === 'episodes' && (
            <div className="space-y-3">
              {/* Episodes Header & Scroll indicator */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-neutral-900/90 px-3.5 py-2.5 rounded-lg border border-neutral-800">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-xs sm:text-sm">
                    {seriesEpisodes.length} {seriesEpisodes.length === 1 ? 'Áudio Cadastrado' : 'Áudios Cadastrados'}
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    ({trainingEpisodes.length} {trainingEpisodes.length === 1 ? 'episódio de treinamento' : 'episódios de treinamento'} {synopsisEpisode ? '+ 1 sinopse' : ''})
                  </span>
                </div>
                {seriesEpisodes.length > 2 && (
                  <span className="text-amber-300 font-semibold flex items-center gap-1.5 text-[11px] bg-amber-500/15 px-2.5 py-1 rounded border border-amber-500/30 shrink-0">
                    <span className="animate-pulse">↕</span>
                    <span>Role a barra lateral vermelha para ver todos</span>
                  </span>
                )}
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
                    const progressPct = progress
                      ? Math.min(100, (progress.currentTime / progress.duration) * 100)
                      : 0;

                    return (
                      <div
                        key={episode.id}
                        onClick={() => handlePlayEpisode(episode)}
                        className={`group flex flex-col md:flex-row items-start md:items-center justify-between p-3 sm:p-4 rounded-lg transition-all cursor-pointer border ${
                          isCurrent
                            ? 'bg-neutral-800/90 border-[#E50914]/80 shadow-md'
                            : isEpSynopsis
                            ? 'bg-amber-950/20 hover:bg-amber-950/30 border-amber-500/30 hover:border-amber-500/50'
                            : 'bg-neutral-900/50 hover:bg-neutral-800/70 border-neutral-800/80 hover:border-neutral-700'
                        }`}
                      >
                        {/* Left: Number + Thumbnail + Info */}
                        <div className="flex items-start md:items-center gap-2.5 sm:gap-4 w-full md:w-3/4">
                          {/* Episode Number or INTRO Badge */}
                          {isEpSynopsis ? (
                            <div className="flex flex-col items-center justify-center shrink-0 w-8 sm:w-10 pt-1 md:pt-0">
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 tracking-wider">
                                INTRO
                              </span>
                              <span className="text-[8px] text-amber-400/80 font-mono font-bold mt-0.5">EP. 0</span>
                            </div>
                          ) : (
                            <span className="text-base sm:text-xl md:text-2xl font-bold text-neutral-500 group-hover:text-white transition-colors w-6 sm:w-8 text-center shrink-0 pt-1 md:pt-0">
                              {episode.episodeNumber.toString().padStart(2, '0')}
                            </span>
                          )}

                          {/* Thumbnail with Play Hover */}
                          <div className="relative aspect-video w-24 sm:w-32 md:w-40 rounded overflow-hidden bg-neutral-800 shrink-0 border border-neutral-700/50">
                            <img
                              src={episode.imageUrl || series.posterImage}
                              alt={episode.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />

                            {/* Play overlay button */}
                            <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                              isCurrent && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            }`}>
                              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
                                <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-black translate-x-0.5" />
                              </div>
                            </div>

                            {/* Listen progress bar in thumbnail bottom */}
                            {progressPct > 0 && (
                              <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-700">
                                <div
                                  className="h-full bg-[#E50914]"
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
                                  <span>Áudio de Sinopse (Abertura)</span>
                                </span>
                              ) : (
                                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-neutral-300 bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-700 shrink-0">
                                  Episódio {episode.episodeNumber}
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

                        {/* Right: Duration & Listen Button */}
                        <div className="mt-2.5 md:mt-0 flex items-center justify-between md:justify-end gap-3 sm:gap-4 w-full md:w-auto shrink-0 pl-8 sm:pl-12 md:pl-0">
                          <div className="flex items-center gap-1 text-[11px] sm:text-xs md:text-sm font-semibold text-neutral-400">
                            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            <span>{episode.durationFormatted || `${episode.durationMinutes} min`}</span>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayEpisode(episode);
                            }}
                            className={`px-3 py-1.5 rounded text-xs font-bold text-white transition-colors border cursor-pointer active:scale-95 ${
                              isEpSynopsis
                                ? 'bg-amber-600 hover:bg-amber-500 border-amber-500/50'
                                : 'bg-neutral-800 hover:bg-[#E50914] border-neutral-700'
                            }`}
                          >
                            {isCurrent && isPlaying ? 'Pausar' : isEpSynopsis ? 'Ouvir Sinopse' : 'Ouvir'}
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
