import React from 'react';
import { useApp } from '../context/AppContext';
import { Info, Volume2, VolumeX, Plus, Check, Clock } from 'lucide-react';
import { AudioSeries } from '../types';

interface HeroBillboardProps {
  series: AudioSeries;
}

export const HeroBillboard: React.FC<HeroBillboardProps> = ({ series }) => {
  const {
    episodes,
    openSeriesModal,
    isMuted,
    toggleMute,
    currentUser,
    toggleMyList,
  } = useApp();

  const seriesEpisodes = episodes
    .filter(e => e.seriesId.trim().toLowerCase() === series.id.trim().toLowerCase())
    .sort((a, b) => (Number(a.episodeNumber) || 0) - (Number(b.episodeNumber) || 0));
  const firstEpisode = seriesEpisodes[0];
  const isInMyList = currentUser.myList.includes(series.id);

  return (
    <div className="relative w-full h-[75vh] min-h-[500px] md:h-[85vh] md:min-h-[620px] max-h-[880px] overflow-hidden select-none">
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

        {/* Netflix Multi-direction Scrim Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/75 to-transparent w-full md:w-3/4 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-black/30 z-10" />
        <div className="absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-[#141414] to-transparent z-10" />
      </div>

      {/* Hero Content Container with Generous Top Clearance */}
      <div className="relative z-20 h-full flex flex-col justify-end pt-20 sm:pt-28 md:pt-36 pb-16 sm:pb-20 md:pb-28 px-4 md:px-12 max-w-3xl">
        {/* Category & Badge */}
        <div className="flex items-center gap-2 mb-1.5 sm:mb-2 text-[11px] sm:text-xs font-semibold tracking-wider text-neutral-300">
          <span className="text-[#E50914] font-bold tracking-widest uppercase">ÁUDIO SÉRIE ORIGINAL</span>
          <span className="text-neutral-500">•</span>
          <span className="text-white/90 truncate">{series.category}</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15] mb-2 sm:mb-3 drop-shadow-md">
          {series.title}
        </h1>

        {/* Metadata info strip */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs md:text-sm font-medium mb-3 sm:mb-4 text-neutral-300">
          <span className="text-emerald-400 font-bold">{series.matchScore}% relevante</span>
          <span className="text-neutral-400">{series.releaseYear}</span>
          <span className="px-1.5 py-0.5 border border-neutral-600 rounded text-[10px] sm:text-[11px] text-neutral-300 font-semibold">
            {series.ratingBadge}
          </span>
          <span className="text-neutral-400 hidden xs:inline">{seriesEpisodes.length} Episódios</span>
          <span className="flex items-center gap-1 text-amber-300 font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>{series.episodeDurationEstimate || (firstEpisode ? firstEpisode.durationFormatted : '20 min')}</span>
          </span>
          <span className="px-1.5 py-0.5 bg-neutral-800/80 border border-neutral-700 rounded text-[10px] sm:text-[11px] text-neutral-300 font-medium hidden sm:inline-block">
            {series.audioQuality}
          </span>
        </div>

        {/* Synopsis */}
        <p className="text-xs sm:text-sm md:text-base text-neutral-200 leading-relaxed mb-4 sm:mb-6 line-clamp-2 sm:line-clamp-3 md:line-clamp-4 drop-shadow">
          {series.synopsis}
        </p>

        {/* CTAs: Only 'Mais Informações' as requested for proper screen sequencing */}
        <div className="flex items-center gap-3">
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

      {/* Right Edge: Mute / Sound Toggle & Rating Flag */}
      <div className="absolute right-0 bottom-24 z-20 flex items-center">
        <button
          onClick={toggleMute}
          className="p-2 rounded-full border border-neutral-500/60 bg-black/50 hover:bg-black/80 text-white mr-4 transition-colors backdrop-blur-sm"
          title={isMuted ? 'Ativar Som' : 'Silenciar'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <div className="border-l-2 border-neutral-300 bg-neutral-900/80 backdrop-blur-sm py-1 pl-3 pr-6 text-xs font-bold text-neutral-300">
          {series.ratingBadge}
        </div>
      </div>
    </div>
  );
};
