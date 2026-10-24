import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ThumbsUp,
  ThumbsDown,
  Heart,
  HardDrive,
  Info,
  ListMusic,
  X,
  Sparkles,
  Clock,
} from 'lucide-react';
import { formatTime } from '../utils/audioResolver';

export const AudioPlayer: React.FC = () => {
  const {
    currentPlayingEpisode,
    currentPlayingSeries,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    volume,
    isMuted,
    audioSourceInfo,
    togglePlayPause,
    seekTo,
    skipSeconds,
    setSpeed,
    setAudioVolume,
    toggleMute,
    nextEpisode,
    prevEpisode,
    currentUser,
    toggleReaction,
    episodes,
    playEpisode,
    openSeriesModal,
  } = useApp();

  const [isExpanded, setIsExpanded] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showQueue, setShowQueue] = useState(false);

  if (!currentPlayingEpisode) return null;

  const currentReaction = currentPlayingSeries ? currentUser.reactions[currentPlayingSeries.id] : null;
  const speedOptions = [0.75, 1.0, 1.25, 1.5, 2.0];

  // Series episodes for queue
  const seriesEpisodes = currentPlayingSeries
    ? episodes.filter(e => e.seriesId === currentPlayingSeries.id)
    : [];

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    seekTo(val);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* EXPANDED FULLSCREEN THEATER VIEW */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-[#141414] flex flex-col justify-between p-6 md:p-12 animate-in fade-in duration-300">
          {/* Top Bar in Theater Mode */}
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-[#E50914] font-brand">
                skills<span className="text-white">.ON!</span>
              </span>
              <span className="text-neutral-500">|</span>
              <span className="text-sm text-neutral-300 font-medium">Modo Imersivo de Reprodução</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowQueue(!showQueue)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold border transition-colors ${
                  showQueue
                    ? 'bg-[#E50914] border-[#E50914] text-white'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white'
                }`}
              >
                <ListMusic className="w-4 h-4" />
                <span>Episódios da Série</span>
              </button>

              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white transition-colors"
                title="Minimizar player"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Center: Stage with large artwork, waveforms, and synopsis */}
          <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 py-6 max-w-5xl mx-auto w-full">
            {/* Artwork Card */}
            <div className="relative aspect-video w-full max-w-md md:max-w-lg rounded-xl overflow-hidden shadow-2xl border border-neutral-800 group">
              <img
                src={currentPlayingEpisode.imageUrl || currentPlayingSeries?.heroImage}
                alt={currentPlayingEpisode.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              
              {/* Audio Waveform animation overlay */}
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-1 h-8">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-full bg-[#E50914] transition-all duration-150 ${
                      isPlaying ? 'animate-pulse' : 'opacity-40'
                    }`}
                    style={{
                      height: isPlaying ? `${Math.max(15, (Math.sin(i * 0.8 + currentTime * 3) + 1) * 50)}%` : '20%',
                      animationDelay: `${i * 40}ms`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Info and Details */}
            <div className="flex-1 space-y-4 text-center md:text-left w-full">
              {currentPlayingSeries && (
                <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-bold uppercase tracking-wider text-[#E50914]">
                  <span>{currentPlayingSeries.category}</span>
                  <span className="text-neutral-500">•</span>
                  <span>{currentPlayingSeries.audioQuality}</span>
                </div>
              )}

              <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
                {currentPlayingEpisode.title}
              </h2>

              <p className="text-base font-semibold text-neutral-300">
                {currentPlayingSeries?.title} — {currentPlayingSeries?.mentor}
              </p>

              <p className="text-sm text-neutral-400 max-w-xl leading-relaxed">
                {currentPlayingEpisode.synopsis}
              </p>

              {/* Episode Duration Display (Requirement 4) */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
                <span className="px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Duração: {currentPlayingEpisode.durationFormatted || `${currentPlayingEpisode.durationMinutes} min`}
                </span>
                {currentPlayingSeries?.episodeDurationEstimate && (
                  <span className="text-[11px] text-neutral-400 bg-neutral-800/80 px-2 py-1 rounded border border-neutral-700">
                    Série: ~{currentPlayingSeries.episodeDurationEstimate}
                  </span>
                )}
              </div>

              {/* Source Info Badge */}
              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
                {audioSourceInfo.isGoogleDrive && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-blue-500/10 border border-blue-500/30 text-xs font-semibold text-blue-400">
                    <HardDrive className="w-3.5 h-3.5" />
                    Google Drive Stream Ativo
                  </span>
                )}
                {currentPlayingSeries && (
                  <div className="flex items-center gap-1 bg-neutral-800/80 px-3 py-1 rounded border border-neutral-700 text-xs text-neutral-300">
                    <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{currentPlayingSeries.likes} curtidas</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Episode Queue Sidebar (Theater mode) */}
          {showQueue && (
            <div className="max-h-48 overflow-y-auto mb-4 bg-neutral-900/90 rounded-lg p-3 border border-neutral-800">
              <p className="text-xs font-bold uppercase text-neutral-400 mb-2">Fila de Reprodução da Série</p>
              <div className="space-y-1">
                {seriesEpisodes.map((ep) => (
                  <button
                    key={ep.id}
                    onClick={() => playEpisode(ep, currentPlayingSeries || undefined)}
                    className={`w-full text-left px-3 py-2 rounded flex items-center justify-between text-xs transition-colors ${
                      ep.id === currentPlayingEpisode.id
                        ? 'bg-[#E50914]/20 text-[#E50914] font-bold border border-[#E50914]/40'
                        : 'text-neutral-300 hover:bg-neutral-800'
                    }`}
                  >
                    <span className="truncate">
                      Ep. {ep.episodeNumber}: {ep.title}
                    </span>
                    <span className="text-neutral-500 shrink-0 ml-2">{ep.durationFormatted}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Controls Bar in Theater Mode */}
          <div className="pt-4 border-t border-neutral-800 max-w-4xl mx-auto w-full space-y-3">
            {/* Seeker */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono tabular-nums text-neutral-400 w-12 text-right">
                {formatTime(currentTime)}
              </span>
              <div className="relative flex-1 group">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeekChange}
                  className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#E50914]"
                />
              </div>
              <span className="text-xs font-mono tabular-nums text-neutral-400 w-12">
                {formatTime(duration)}
              </span>
            </div>

            {/* Buttons Row */}
            <div className="flex items-center justify-between">
              {/* Reactions */}
              <div className="flex items-center gap-1">
                {currentPlayingSeries && (
                  <>
                    <button
                      onClick={() => toggleReaction(currentPlayingSeries.id, 'like')}
                      className={`p-2 rounded-full transition-colors ${
                        currentReaction === 'like' ? 'text-[#E50914] bg-white/10' : 'text-neutral-400 hover:text-white'
                      }`}
                      title="Gostei"
                    >
                      <ThumbsUp className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => toggleReaction(currentPlayingSeries.id, 'dislike')}
                      className={`p-2 rounded-full transition-colors ${
                        currentReaction === 'dislike' ? 'text-[#E50914] bg-white/10' : 'text-neutral-400 hover:text-white'
                      }`}
                      title="Não é para mim"
                    >
                      <ThumbsDown className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Central Audio Controls */}
              <div className="flex items-center gap-4">
                <button
                  onClick={prevEpisode}
                  className="p-2 text-neutral-300 hover:text-white transition-colors"
                  title="Episódio Anterior"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                <button
                  onClick={() => skipSeconds(-10)}
                  className="p-2 text-neutral-300 hover:text-white transition-colors flex items-center gap-0.5"
                  title="Voltar 10 segundos"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span className="text-[10px] font-bold">10</span>
                </button>

                <button
                  onClick={togglePlayPause}
                  className="w-14 h-14 rounded-full bg-white hover:bg-neutral-200 text-black flex items-center justify-center transition-transform active:scale-95 shadow-xl"
                  title={isPlaying ? 'Pausar' : 'Reproduzir'}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 fill-black" />
                  ) : (
                    <Play className="w-6 h-6 fill-black translate-x-0.5" />
                  )}
                </button>

                <button
                  onClick={() => skipSeconds(10)}
                  className="p-2 text-neutral-300 hover:text-white transition-colors flex items-center gap-0.5"
                  title="Avançar 10 segundos"
                >
                  <RotateCw className="w-5 h-5" />
                  <span className="text-[10px] font-bold">10</span>
                </button>

                <button
                  onClick={nextEpisode}
                  className="p-2 text-neutral-300 hover:text-white transition-colors"
                  title="Próximo Episódio"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              {/* Speed & Volume */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    const nextIdx = (speedOptions.indexOf(playbackRate) + 1) % speedOptions.length;
                    setSpeed(speedOptions[nextIdx]);
                  }}
                  className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white transition-colors border border-neutral-700"
                >
                  {playbackRate}x
                </button>

                <div className="flex items-center gap-2">
                  <button onClick={toggleMute} className="text-neutral-300 hover:text-white">
                    {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
                    className="w-20 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#E50914]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DOCKED BOTTOM BAR AUDIO PLAYER (Always Visible When Audio Loaded) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#181818]/95 backdrop-blur-md border-t border-neutral-800 shadow-2xl px-4 md:px-8 py-2 md:py-3 select-none">
        <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
          {/* Left: Thumbnail & Episode Meta */}
          <div className="flex items-center gap-3 w-1/4 min-w-[180px]">
            <div
              className="relative aspect-video w-14 sm:w-16 rounded overflow-hidden bg-neutral-800 shrink-0 cursor-pointer group"
              onClick={() => setIsExpanded(true)}
              title="Expandir modo imersivo"
            >
              <img
                src={currentPlayingEpisode.imageUrl || currentPlayingSeries?.posterImage}
                alt={currentPlayingEpisode.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <Maximize2 className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            <div className="truncate cursor-pointer" onClick={() => currentPlayingSeries && openSeriesModal(currentPlayingSeries)}>
              <h4 className="text-xs md:text-sm font-bold text-white truncate hover:underline">
                {currentPlayingEpisode.title}
              </h4>
              <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 truncate">
                <span className="truncate">{currentPlayingSeries?.title}</span>
                <span>•</span>
                <span className="text-amber-300 font-semibold shrink-0">
                  {currentPlayingEpisode.durationFormatted || `${currentPlayingEpisode.durationMinutes} min`}
                </span>
              </div>
            </div>

            {/* Quick Like Reaction */}
            {currentPlayingSeries && (
              <button
                onClick={() => toggleReaction(currentPlayingSeries.id, 'like')}
                className={`p-1.5 rounded-full hover:bg-neutral-800 transition-colors hidden sm:block ${
                  currentReaction === 'like' || currentReaction === 'double_like'
                    ? 'text-[#E50914]'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Gostei"
              >
                <ThumbsUp className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Center: Controls & Seeker */}
          <div className="flex-1 max-w-2xl flex flex-col items-center">
            {/* Buttons */}
            <div className="flex items-center gap-3 md:gap-5 mb-1.5">
              <button
                onClick={prevEpisode}
                className="p-1 text-neutral-400 hover:text-white transition-colors"
                title="Episódio Anterior"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={() => skipSeconds(-10)}
                className="p-1 text-neutral-400 hover:text-white transition-colors flex items-center gap-0.5"
                title="Voltar 10 segundos"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="text-[9px] font-bold">10</span>
              </button>

              <button
                onClick={togglePlayPause}
                className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white hover:bg-neutral-200 text-black flex items-center justify-center transition-transform active:scale-95 shadow-md"
                title={isPlaying ? 'Pausar' : 'Reproduzir'}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-black" />
                ) : (
                  <Play className="w-4 h-4 fill-black translate-x-0.5" />
                )}
              </button>

              <button
                onClick={() => skipSeconds(10)}
                className="p-1 text-neutral-400 hover:text-white transition-colors flex items-center gap-0.5"
                title="Avançar 10 segundos"
              >
                <RotateCw className="w-4 h-4" />
                <span className="text-[9px] font-bold">10</span>
              </button>

              <button
                onClick={nextEpisode}
                className="p-1 text-neutral-400 hover:text-white transition-colors"
                title="Próximo Episódio"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* Time seeker bar */}
            <div className="w-full flex items-center gap-2">
              <span className="text-[11px] font-mono tabular-nums text-neutral-400 w-10 text-right">
                {formatTime(currentTime)}
              </span>
              <div className="relative flex-1 group">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeekChange}
                  className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#E50914] group-hover:h-1.5 transition-all"
                />
              </div>
              <span className="text-[11px] font-mono tabular-nums text-neutral-400 w-10">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Right: Audio Speed, Google Drive Tag, Volume, Fullscreen */}
          <div className="flex items-center justify-end gap-3 w-1/4 min-w-[160px]">
            {/* Speed Button */}
            <button
              onClick={() => {
                const nextIdx = (speedOptions.indexOf(playbackRate) + 1) % speedOptions.length;
                setSpeed(speedOptions[nextIdx]);
              }}
              className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[11px] font-bold text-white transition-colors border border-neutral-700"
              title="Velocidade de reprodução"
            >
              {playbackRate}x
            </button>

            {/* Drive indicator badge */}
            {audioSourceInfo.isGoogleDrive && (
              <span
                className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold border border-blue-500/20"
                title="Áudio carregado diretamente via Google Drive Stream"
              >
                <HardDrive className="w-3 h-3" />
                Drive
              </span>
            )}

            {/* Volume control */}
            <div className="hidden sm:flex items-center gap-1.5">
              <button onClick={toggleMute} className="text-neutral-400 hover:text-white p-1">
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
                className="w-16 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#E50914]"
              />
            </div>

            {/* Maximize theater mode */}
            <button
              onClick={() => setIsExpanded(true)}
              className="p-1.5 text-neutral-400 hover:text-white transition-colors"
              title="Modo tela cheia"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
