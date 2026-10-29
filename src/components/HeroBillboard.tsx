import React from 'react';
import { useApp } from '../context/AppContext';
import { Info, Plus, Check, Play, CheckCircle2 } from 'lucide-react';
import { AudioSeries } from '../types';

interface HeroBillboardProps {
  series: AudioSeries;
}

export const HeroBillboard: React.FC<HeroBillboardProps> = ({ series }) => {
  const {
    episodes,
    openSeriesModal,
    currentUser,
    toggleMyList,
    playEpisode,
  } = useApp();

  const seriesEpisodes = episodes
    .filter(e => e.seriesId.trim().toLowerCase() === series.id.trim().toLowerCase())
    .sort((a, b) => (Number(a.episodeNumber) || 0) - (Number(b.episodeNumber) || 0));
  const trainingEpisodesCount = seriesEpisodes.filter(e => !e.isSynopsis && Number(e.episodeNumber) > 0).length;
  const isInMyList = currentUser.myList.includes(series.id);

  // User progress metrics for this featured series
  const completedEpisodesCount = seriesEpisodes.filter(e => currentUser.listenProgress[e.id]?.completed).length;
  const isSeriesCompleted = seriesEpisodes.length > 0 && completedEpisodesCount === seriesEpisodes.length;
  const seriesProgressPct = seriesEpisodes.length > 0 ? Math.round((completedEpisodesCount / seriesEpisodes.length) * 100) : 0;
  const inProgressEpisode = seriesEpisodes.find(e => {
    const p = currentUser.listenProgress[e.id];
    return p && !p.completed && p.currentTime > 5;
  }) || (completedEpisodesCount > 0 && completedEpisodesCount < seriesEpisodes.length ? seriesEpisodes.find(e => !currentUser.listenProgress[e.id]?.completed) : null);

  return (
    <div className="relative w-full h-[80vh] min-h-[620px] sm:min-h-[660px] md:h-[88vh] md:min-h-[720px] max-h-[960px] overflow-hidden select-none">
      {/* Background Hero Banner */}
      <div className="absolute inset-0">
        <img
          src={series.heroImage}
          alt={series.title}
          className="w-full h-full object-cover object-top scale-100 transition-transform duration-1000"
          onError={(e) => {
            // Elegant dark gradient fallback
            (e.target as HTMLImageElement).src = '/src/assets/images/skills_hero_leadership_1792881116508.jpg';
          }}
        />

        {/* Cinematic Multi-direction Scrim Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/80 to-transparent w-full md:w-3/4 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-black/30 z-10" />
        <div className="absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-[#141414] to-transparent z-10" />
      </div>

      {/* Hero Content Container with Generous Clearance from fixed header */}
      <div className="relative z-20 h-full flex flex-col justify-end pt-24 sm:pt-28 md:pt-32 pb-8 sm:pb-12 md:pb-14 px-4 md:px-12 max-w-3xl">
        {/* Official AUDIO SKILLS Brand Logo Centered on 'ÁUDIO SÉRIE ORIGINAL' phrase (Doubled height, proportional width) */}
        <div className="shrink-0 flex flex-wrap items-end gap-2 mb-2 sm:mb-3 text-[11px] sm:text-xs font-semibold tracking-wider text-neutral-300">
          <div className="inline-flex flex-col items-center">
            <img
              src="/assets/aistudio/audio_skills_logo_new.jpeg"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://i.imgur.com/LyJxYFP.jpeg';
              }}
              alt="AUDIO SKILLS"
              className="h-20 sm:h-24 md:h-28 lg:h-32 w-auto object-contain mix-blend-screen filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] mb-2 select-none"
            />
            <span className="text-[#E50914] font-bold tracking-widest uppercase">ÁUDIO SÉRIE ORIGINAL</span>
          </div>
          <div className="flex items-center gap-2 pb-0.5">
            <span className="text-neutral-500">•</span>
            <span className="text-white/90 truncate max-w-[240px] sm:max-w-none">{series.category}</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="shrink-0 text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15] mb-2 sm:mb-3 drop-shadow-md">
          {series.title}
        </h1>

        {/* Metadata info strip */}
        <div className="shrink-0 flex flex-wrap items-center gap-2 sm:gap-3 text-xs md:text-sm font-medium mb-3 sm:mb-4 text-neutral-300">
          <span className="text-emerald-400 font-bold">{series.matchScore}% relevante</span>
          <span className="text-neutral-400">{series.releaseYear}</span>
          <span className="px-1.5 py-0.5 border border-neutral-600 rounded text-[10px] sm:text-[11px] text-neutral-300 font-semibold">
            {series.ratingBadge}
          </span>
          {/* TOTAL NUMBER OF EPISODES TAG (Replaces duration tag on Home screen) */}
          <span className="px-2 py-0.5 bg-neutral-800/90 border border-neutral-700 rounded text-neutral-200 font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#E50914]" />
            <span>{trainingEpisodesCount > 0 ? `${trainingEpisodesCount} ${trainingEpisodesCount === 1 ? 'Episódio' : 'Episódios'}` : (seriesEpisodes.length > 0 ? `${seriesEpisodes.length} Episódios` : '10 Episódios')}</span>
          </span>
          <span className="px-1.5 py-0.5 bg-neutral-800/80 border border-neutral-700 rounded text-[10px] sm:text-[11px] text-neutral-300 font-medium hidden sm:inline-block">
            {series.audioQuality}
          </span>
        </div>

        {/* Synopsis - shrink-0 guarantees flexbox never squashes or cuts off this text */}
        <p className="shrink-0 text-xs sm:text-sm md:text-base text-neutral-200 leading-relaxed mb-4 sm:mb-5 max-w-2xl line-clamp-3 md:line-clamp-4 drop-shadow-md">
          {series.synopsis}
        </p>

        {/* Progress bar in Hero if user started listening */}
        {seriesProgressPct > 0 && (
          <div className="shrink-0 mb-3 max-w-xs bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-neutral-700/80 shadow-md">
            <div className="flex items-center justify-between text-[11px] mb-1 font-semibold">
              <span className="text-neutral-300 flex items-center gap-1">
                {isSeriesCompleted ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Concluída</span>
                  </>
                ) : (
                  <span>Seu Progresso</span>
                )}
              </span>
              <span className={isSeriesCompleted ? 'text-emerald-400 font-bold' : 'text-[#E50914] font-bold'}>
                {completedEpisodesCount}/{seriesEpisodes.length} ({seriesProgressPct}%)
              </span>
            </div>
            <div className="w-full h-1.5 bg-neutral-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isSeriesCompleted ? 'bg-emerald-500' : 'bg-[#E50914]'
                }`}
                style={{ width: `${seriesProgressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* CTAs: Continuar (se em progresso), 'Mais Informações' e Minha Lista */}
        <div className="shrink-0 flex items-center gap-3">
          {inProgressEpisode && (
            <button
              onClick={() => playEpisode(inProgressEpisode, series)}
              className="flex items-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3 rounded-md bg-[#E50914] hover:bg-[#b80710] text-white font-bold text-xs sm:text-base transition-all active:scale-95 shadow-xl shadow-[#E50914]/30 cursor-pointer"
              title={`Continuar ouvindo ${inProgressEpisode.title}`}
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
              <span>
                {currentUser.listenProgress[inProgressEpisode.id]?.currentTime && !currentUser.listenProgress[inProgressEpisode.id]?.completed
                  ? `Continuar Ep. ${inProgressEpisode.episodeNumber}`
                  : `Ouvir Ep. ${inProgressEpisode.episodeNumber}`}
              </span>
            </button>
          )}

          <button
            onClick={() => openSeriesModal(series)}
            className="flex items-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3 rounded-md bg-white hover:bg-neutral-200 text-black font-bold text-xs sm:text-base transition-all active:scale-95 shadow-xl cursor-pointer"
            title="Ver detalhes completos e episódios da série"
          >
            <Info className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
            <span>Mais Informações</span>
          </button>

          <button
            onClick={() => toggleMyList(series.id)}
            className="p-2.5 sm:p-3 rounded-full bg-neutral-800/80 hover:bg-neutral-700 text-white border border-neutral-600 transition-all active:scale-90 backdrop-blur-sm cursor-pointer"
            title={isInMyList ? 'Remover da Minha Lista' : 'Adicionar à Minha Lista'}
          >
            {isInMyList ? <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" /> : <Plus className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
