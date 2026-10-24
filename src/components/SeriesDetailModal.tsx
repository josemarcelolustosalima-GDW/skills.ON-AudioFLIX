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

  const series = selectedSeriesForModal;
  const seriesEpisodes = episodes.filter(e => e.seriesId === series.id);
  const isInMyList = currentUser.myList.includes(series.id);
  const currentReaction = currentUser.reactions[series.id];

  // Similar series recommendations
  const similarSeries = allSeries
    .filter(s => s.id !== series.id && (s.category === series.category || s.tags.some(t => series.tags.includes(t))))
    .slice(0, 3);

  const handlePlayEpisode = (episode: AudioEpisode) => {
    playEpisode(episode, series);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex justify-center p-0 md:py-8 animate-in fade-in duration-200">
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={closeSeriesModal} />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-4xl bg-[#181818] rounded-none md:rounded-xl overflow-hidden shadow-2xl z-10 my-auto md:my-4 border border-neutral-800 text-white">
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
          <div className="absolute bottom-6 left-6 md:left-10 right-6 z-20">
            <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-[#E50914]">
              <span>ÁUDIO SÉRIE DE TREINAMENTO</span>
              <span className="text-neutral-500">•</span>
              <span className="text-neutral-300">{series.category}</span>
            </div>

            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white mb-4 drop-shadow-md">
              {series.title}
            </h2>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => seriesEpisodes[0] && handlePlayEpisode(seriesEpisodes[0])}
                className="flex items-center gap-2 px-6 py-2.5 rounded bg-white hover:bg-neutral-200 text-black font-bold text-sm md:text-base transition-all active:scale-95 shadow-lg"
              >
                <Play className="w-5 h-5 fill-black" />
                <span>
                  {currentPlayingEpisode?.seriesId === series.id && isPlaying
                    ? 'Tocando Agora'
                    : 'Ouvir Série'}
                </span>
              </button>

              <button
                onClick={() => toggleMyList(series.id)}
                className="w-10 h-10 rounded-full border border-neutral-500 hover:border-white bg-[#2a2a2a]/80 text-white flex items-center justify-center transition-all active:scale-95"
                title={isInMyList ? 'Remover da Minha Lista' : 'Adicionar à Minha Lista'}
              >
                {isInMyList ? <Check className="w-5 h-5 text-emerald-400" /> : <Plus className="w-5 h-5" />}
              </button>

              {/* Reaction Thumbs (Netflix style: Like, Love, Dislike) */}
              <div className="flex items-center gap-1 bg-[#2a2a2a]/80 border border-neutral-700 rounded-full p-1">
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
          <div className="mt-8 mb-6 flex items-center justify-between border-b border-neutral-800 pb-3">
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

          {/* TAB 1: EPISODES LIST (Netflix Layout Standard) */}
          {activeTab === 'episodes' && (
            <div className="space-y-4">
              {seriesEpisodes.length === 0 ? (
                <div className="text-center py-12 text-neutral-400">
                  <p>Nenhum episódio cadastrado nesta série ainda.</p>
                </div>
              ) : (
                seriesEpisodes.map((episode) => {
                  const isCurrent = currentPlayingEpisode?.id === episode.id;
                  const progress = currentUser.listenProgress[episode.id];
                  const progressPct = progress
                    ? Math.min(100, (progress.currentTime / progress.duration) * 100)
                    : 0;

                  return (
                    <div
                      key={episode.id}
                      onClick={() => handlePlayEpisode(episode)}
                      className={`group flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-lg transition-all cursor-pointer border ${
                        isCurrent
                          ? 'bg-neutral-800/90 border-[#E50914]/80 shadow-md'
                          : 'bg-neutral-900/50 hover:bg-neutral-800/70 border-neutral-800/80 hover:border-neutral-700'
                      }`}
                    >
                      {/* Left: Number + Thumbnail + Info */}
                      <div className="flex items-start md:items-center gap-4 w-full md:w-3/4">
                        {/* Episode Number */}
                        <span className="text-xl md:text-2xl font-bold text-neutral-500 group-hover:text-white transition-colors w-8 text-center shrink-0">
                          {episode.episodeNumber.toString().padStart(2, '0')}
                        </span>

                        {/* Thumbnail with Play Hover */}
                        <div className="relative aspect-video w-32 md:w-40 rounded overflow-hidden bg-neutral-800 shrink-0 border border-neutral-700/50">
                          <img
                            src={episode.imageUrl || series.posterImage}
                            alt={episode.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />

                          {/* Play overlay button */}
                          <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                            isCurrent && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}>
                            <div className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
                              <Play className="w-4 h-4 fill-black translate-x-0.5" />
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
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className={`text-sm md:text-base font-bold transition-colors ${
                              isCurrent ? 'text-[#E50914]' : 'text-white group-hover:text-neutral-100'
                            }`}>
                              {episode.title}
                            </h4>
                            {isCurrent && isPlaying && (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#E50914] bg-[#E50914]/20 px-2 py-0.5 rounded border border-[#E50914]/40 flex items-center gap-1">
                                <Radio className="w-3 h-3 animate-pulse" />
                                Reproduzindo
                              </span>
                            )}
                          </div>
                          <p className="text-xs md:text-sm text-neutral-400 line-clamp-2 leading-relaxed">
                            {episode.synopsis}
                          </p>
                        </div>
                      </div>

                      {/* Right: Duration & Listen Button */}
                      <div className="mt-3 md:mt-0 flex items-center justify-between md:justify-end gap-4 w-full md:w-auto shrink-0 pl-12 md:pl-0">
                        <div className="flex items-center gap-1 text-xs md:text-sm font-semibold text-neutral-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{episode.durationFormatted || `${episode.durationMinutes} min`}</span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayEpisode(episode);
                          }}
                          className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white transition-colors border border-neutral-700"
                        >
                          {isCurrent && isPlaying ? 'Pausar' : 'Ouvir'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
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
