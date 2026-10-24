import React, { useState } from 'react';
import { AudioSeries } from '../types';
import { useApp } from '../context/AppContext';
import { Play, Plus, Check, ThumbsUp, ThumbsDown, Heart, ChevronDown, Clock } from 'lucide-react';

interface SeriesCardProps {
  series: AudioSeries;
}

export const SeriesCard: React.FC<SeriesCardProps> = ({ series }) => {
  const {
    openSeriesModal,
    playEpisode,
    episodes,
    currentUser,
    toggleMyList,
    toggleReaction,
  } = useApp();

  const [isHovered, setIsHovered] = useState(false);
  const [showReactionMenu, setShowReactionMenu] = useState(false);

  const seriesEpisodes = episodes.filter(e => e.seriesId === series.id);
  const firstEpisode = seriesEpisodes[0];
  const isInMyList = currentUser.myList.includes(series.id);
  const currentReaction = currentUser.reactions[series.id];

  const handlePlayFirst = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (firstEpisode) {
      playEpisode(firstEpisode, series);
    } else {
      openSeriesModal(series);
    }
  };

  const handleToggleList = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleMyList(series.id);
  };

  const handleReaction = (e: React.MouseEvent, reactionType: 'like' | 'double_like' | 'dislike') => {
    e.stopPropagation();
    toggleReaction(series.id, reactionType);
    setShowReactionMenu(false);
  };

  return (
    <div
      className="group relative flex-none w-52 sm:w-64 md:w-72 cursor-pointer transition-all duration-300 select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowReactionMenu(false);
      }}
      onClick={() => openSeriesModal(series)}
    >
      {/* Poster Image Container */}
      <div className="relative aspect-video rounded-md overflow-hidden bg-neutral-900 border border-neutral-800 shadow-md group-hover:shadow-2xl transition-all">
        <img
          src={series.posterImage || series.heroImage}
          alt={series.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/src/assets/images/skills_hero_leadership_1792881116508.jpg';
          }}
        />

        {/* Quality and Duration pill badge */}
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1">
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-black/70 backdrop-blur-xs text-amber-300 border border-amber-300/30">
            AUDIO
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-black/75 backdrop-blur-xs text-neutral-200 border border-neutral-700 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 text-amber-400" />
            {series.episodeDurationEstimate || (firstEpisode ? firstEpisode.durationFormatted : '20 min')}
          </span>
        </div>

        {/* Rating badge */}
        <div className="absolute top-2 right-2 z-10 px-1.5 py-0.5 rounded text-[10px] font-bold bg-black/70 backdrop-blur-xs text-neutral-300 border border-neutral-700">
          {series.ratingBadge}
        </div>

        {/* Gradient scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

        {/* Title overlay in card base */}
        <div className="absolute bottom-2.5 left-3 right-3 z-10">
          <p className="text-xs font-semibold text-neutral-300 truncate">{series.mentor}</p>
          <h4 className="text-sm font-bold text-white truncate drop-shadow">{series.title}</h4>
        </div>
      </div>

      {/* Hover Card Overlay (Netflix Mini-Details) */}
      {isHovered && (
        <div className="hidden md:block absolute -top-4 -left-3 -right-3 z-30 bg-[#181818] rounded-lg shadow-2xl border border-neutral-700/80 p-3 animate-in fade-in zoom-in-95 duration-200">
          {/* Mini Preview Header */}
          <div className="relative aspect-video rounded overflow-hidden mb-3">
            <img
              src={series.heroImage || series.posterImage}
              alt={series.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-transparent" />
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePlayFirst}
                className="w-8 h-8 rounded-full bg-white hover:bg-neutral-200 text-black flex items-center justify-center transition-transform active:scale-90"
                title="Reproduzir Primeiro Episódio"
              >
                <Play className="w-4 h-4 fill-black translate-x-0.5" />
              </button>

              <button
                onClick={handleToggleList}
                className="w-8 h-8 rounded-full border border-neutral-500 hover:border-white bg-[#2a2a2a] text-white flex items-center justify-center transition-colors"
                title={isInMyList ? 'Remover da Minha Lista' : 'Adicionar à Minha Lista'}
              >
                {isInMyList ? <Check className="w-4 h-4 text-emerald-400" /> : <Plus className="w-4 h-4" />}
              </button>

              {/* Reaction Trigger Button */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowReactionMenu(!showReactionMenu);
                  }}
                  className={`w-8 h-8 rounded-full border border-neutral-500 hover:border-white bg-[#2a2a2a] text-white flex items-center justify-center transition-colors ${
                    currentReaction ? 'border-[#E50914] text-[#E50914]' : ''
                  }`}
                  title="Avaliar esta áudio série"
                >
                  {currentReaction === 'dislike' ? (
                    <ThumbsDown className="w-3.5 h-3.5 text-[#E50914]" />
                  ) : currentReaction === 'double_like' ? (
                    <Heart className="w-3.5 h-3.5 text-[#E50914] fill-[#E50914]" />
                  ) : (
                    <ThumbsUp className={`w-3.5 h-3.5 ${currentReaction === 'like' ? 'text-[#E50914] fill-[#E50914]' : ''}`} />
                  )}
                </button>

                {/* Reaction Popup Menu */}
                {showReactionMenu && (
                  <div
                    className="absolute -top-12 left-0 flex items-center gap-1.5 bg-[#232323] px-2 py-1.5 rounded-full border border-neutral-700 shadow-2xl z-40"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => handleReaction(e, 'dislike')}
                      className="p-1 rounded-full hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                      title="Não é para mim"
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleReaction(e, 'like')}
                      className="p-1 rounded-full hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                      title="Gostei"
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleReaction(e, 'double_like')}
                      className="p-1 rounded-full hover:bg-neutral-700 text-neutral-300 hover:text-[#E50914] transition-colors"
                      title="Amei!"
                    >
                      <Heart className="w-4 h-4 fill-[#E50914] text-[#E50914]" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                openSeriesModal(series);
              }}
              className="w-8 h-8 rounded-full border border-neutral-500 hover:border-white bg-[#2a2a2a] text-white flex items-center justify-center transition-colors"
              title="Mais detalhes sobre a série"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Info & Tags */}
          <div className="flex items-center gap-2 text-[11px] mb-1 font-medium">
            <span className="text-emerald-400 font-bold">{series.matchScore}% relevante</span>
            <span className="border border-neutral-600 px-1 rounded text-neutral-300 text-[10px]">
              {series.ratingBadge}
            </span>
            <span className="text-neutral-400">{seriesEpisodes.length} eps</span>
            <span className="text-amber-300 flex items-center gap-0.5 font-medium">
              <Clock className="w-2.5 h-2.5" />
              {series.episodeDurationEstimate || (firstEpisode ? firstEpisode.durationFormatted : '20 min')}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-neutral-400">
            {series.tags.slice(0, 3).map((tag, idx) => (
              <React.Fragment key={tag}>
                <span>{tag}</span>
                {idx < 2 && <span className="text-neutral-600">•</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
