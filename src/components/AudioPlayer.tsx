import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Play,
  Pause,
  Square,
  X,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  ThumbsUp,
  ThumbsDown,
  HardDrive,
  ListMusic,
  Clock,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Loader2,
  Tv,
  Radio,
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
    audioError,
    audioLoading,
    isUsingEmbedPlayer,
    toggleEmbedPlayer,
    retryPlayback,
    drivePreviewEmbedUrl,
    driveDirectWebUrl,
    togglePlayPause,
    stopAudio,
    closePlayerAndGoHome,
    seekTo,
    skipSeconds,
    setSpeed,
    setAudioVolume,
    toggleMute,
    nextEpisode,
    prevEpisode,
    currentUser,
    toggleReaction,
    toggleEpisodeReaction,
    episodes,
    playEpisode,
    isPlayerExpanded,
  } = useApp();

  const [showQueue, setShowQueue] = useState(false);

  // Requirement: ONLY the expanded theater view is active. No docked bottom bar.
  if (!isPlayerExpanded || !currentPlayingEpisode) return null;

  const currentEpisodeReaction = currentPlayingEpisode ? currentUser.reactions[currentPlayingEpisode.id] : null;
  const speedOptions = [0.75, 1.0, 1.25, 1.5, 2.0];

  // Series episodes for queue
  const seriesEpisodes = currentPlayingSeries
    ? episodes
        .filter(e => e.seriesId.trim().toLowerCase() === currentPlayingSeries.id.trim().toLowerCase())
        .sort((a, b) => (Number(a.episodeNumber) || 0) - (Number(b.episodeNumber) || 0))
    : [];

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    seekTo(val);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-[#141414] flex flex-col justify-between p-3.5 sm:p-6 md:p-12 animate-in fade-in duration-300 overflow-y-auto select-none">
      {/* Top Header Bar in Theater Mode - Fully Responsive for Smartphones */}
      <div className="flex items-center justify-between gap-2 pb-3 md:pb-4 border-b border-neutral-800 shrink-0">
        {/* Spacer on left - SKILLS.ON Modo Imersivo text removed as requested */}
        <div />

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {drivePreviewEmbedUrl && (
            <button
              onClick={() => toggleEmbedPlayer(!isUsingEmbedPlayer)}
              className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded text-xs font-semibold border transition-colors cursor-pointer ${
                isUsingEmbedPlayer
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white'
              }`}
              title="Alternar entre Player Nativo e Player Embutido do Google Drive"
            >
              <Tv className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isUsingEmbedPlayer ? 'Drive Ativo' : 'Player Drive'}</span>
            </button>
          )}

          <button
            onClick={() => setShowQueue(!showQueue)}
            className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded text-xs font-semibold border transition-colors cursor-pointer ${
              showQueue
                ? 'bg-[#E50914] border-[#E50914] text-white'
                : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Episódios</span>
            <span className="sm:hidden">Fila</span>
          </button>

          {/* Botão STOP no topo (otimizado para toque) */}
          <button
            onClick={stopAudio}
            className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 border border-neutral-700 hover:border-red-500 transition-all cursor-pointer shadow-md active:scale-95"
            title="Parar reprodução de áudio (Stop)"
          >
            <Square className="w-3.5 h-3.5 fill-[#E50914] text-[#E50914]" />
            <span>Stop</span>
          </button>

          {/* Botão FECHAR: Fecha a visão expandida e retorna automaticamente à tela principal */}
          <button
            onClick={closePlayerAndGoHome}
            className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-[#E50914] hover:bg-[#b80710] text-xs font-bold text-white transition-all cursor-pointer shadow-lg active:scale-95"
            title="Fechar player e voltar para a tela principal"
          >
            <X className="w-4 h-4" />
            <span>Fechar</span>
          </button>
        </div>
      </div>

      {/* Center Stage: Artwork / Embed Player + Metadata (Responsive on Mobile) */}
      <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-4 sm:gap-8 md:gap-16 py-3 sm:py-6 max-w-5xl mx-auto w-full my-auto">
        {/* Artwork Card or Google Drive Embed Player */}
        <div className="w-full max-w-[260px] sm:max-w-sm md:max-w-lg shrink-0">
          {isUsingEmbedPlayer && drivePreviewEmbedUrl ? (
            <div className="w-full bg-neutral-900 border border-blue-500/40 rounded-xl p-3 sm:p-4 shadow-2xl space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between text-xs text-blue-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4" />
                  Player Google Drive (Nativo)
                </span>
                <button
                  onClick={() => toggleEmbedPlayer(false)}
                  className="text-neutral-400 hover:text-white underline text-[11px] cursor-pointer"
                >
                  Voltar
                </button>
              </div>
              <iframe
                src={drivePreviewEmbedUrl}
                className="w-full h-36 sm:h-44 rounded-lg bg-black border border-neutral-800"
                allow="autoplay"
                title="Google Drive Audio Preview"
              />
              <p className="text-[10px] sm:text-[11px] text-neutral-400 text-center">
                Reproduz áudios do Google Drive com proteção direta.
              </p>
            </div>
          ) : (
            <div className="relative aspect-video w-full rounded-xl overflow-hidden shadow-2xl border border-neutral-800 group">
              <img
                src={currentPlayingEpisode.imageUrl || currentPlayingSeries?.heroImage || currentPlayingSeries?.posterImage}
                alt={currentPlayingEpisode.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/src/assets/images/skills_hero_leadership_1792881116508.jpg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              
              {/* Audio Waveform animation overlay */}
              <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-1 h-6 sm:h-8">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-full bg-[#E50914] transition-all duration-150 ${
                      isPlaying ? 'animate-pulse' : 'opacity-40'
                    }`}
                    style={{
                      height: isPlaying ? `${Math.max(15, (Math.sin(i * 0.8 + currentTime * 3) + 1) * 50)}%` : '20%',
                      animationDelay: `${i * 35}ms`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Info and Details */}
        <div className="flex-1 space-y-2 sm:space-y-4 text-center md:text-left w-full min-w-0">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
            {(currentPlayingEpisode.isSynopsis || Number(currentPlayingEpisode.episodeNumber) === 0) ? (
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-extrabold flex items-center gap-1">
                <Radio className="w-3 h-3 text-amber-400" />
                ÁUDIO DE SINOPSE (ABERTURA • EPISÓDIO 0)
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-[#E50914]/20 text-[#E50914] border border-[#E50914]/40 font-extrabold">
                EPISÓDIO {currentPlayingEpisode.episodeNumber}
              </span>
            )}
            {currentPlayingSeries && (
              <>
                <span className="text-neutral-500">•</span>
                <span className="text-neutral-300 truncate max-w-[140px] sm:max-w-none">{currentPlayingSeries.category}</span>
                <span className="text-neutral-500">•</span>
                <span className="text-neutral-400">{currentPlayingSeries.audioQuality}</span>
              </>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl md:text-4xl font-extrabold text-white tracking-tight line-clamp-2">
            {currentPlayingEpisode.title}
          </h2>

          <p className="text-xs sm:text-base font-semibold text-neutral-300 truncate">
            {currentPlayingSeries?.title} — {currentPlayingSeries?.mentor}
          </p>

          <p className="text-xs sm:text-sm text-neutral-400 max-w-xl leading-relaxed line-clamp-2 sm:line-clamp-3 md:line-clamp-none">
            {currentPlayingEpisode.synopsis}
          </p>

          {/* Episode Duration Display */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-0.5 sm:pt-1">
            <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] sm:text-xs font-semibold flex items-center gap-1">
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Duração: {currentPlayingEpisode.durationFormatted || `${currentPlayingEpisode.durationMinutes} min`}</span>
            </span>
            {currentPlayingSeries?.episodeDurationEstimate && (
              <span className="text-[10px] sm:text-[11px] text-neutral-400 bg-neutral-800/80 px-2 py-0.5 sm:py-1 rounded border border-neutral-700 hidden sm:inline-block">
                Série: ~{currentPlayingSeries.episodeDurationEstimate}
              </span>
            )}
          </div>

          {/* Source Info Badge */}
          <div className="pt-1 flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-3">
            {audioSourceInfo.isGoogleDrive && (
              <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 rounded bg-blue-500/10 border border-blue-500/30 text-[10px] sm:text-xs font-semibold text-blue-400">
                <HardDrive className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                Google Drive Stream
              </span>
            )}
            {currentPlayingSeries && (
              <div className="flex items-center gap-1 bg-neutral-800/80 px-2 sm:px-3 py-0.5 sm:py-1 rounded border border-neutral-700 text-[10px] sm:text-xs text-neutral-300">
                <ThumbsUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
                <span>{currentPlayingSeries.likes} curtidas</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Episode Queue Drawer (Theater mode) */}
      {showQueue && (
        <div className="max-h-36 sm:max-h-48 overflow-y-auto mb-3 sm:mb-4 bg-neutral-900/90 rounded-lg p-2.5 sm:p-3 border border-neutral-800 max-w-4xl mx-auto w-full">
          <p className="text-[11px] sm:text-xs font-bold uppercase text-neutral-400 mb-1.5 sm:mb-2">Fila de Episódios</p>
          <div className="space-y-1">
            {seriesEpisodes.map((ep) => (
              <button
                key={ep.id}
                onClick={() => playEpisode(ep, currentPlayingSeries || undefined)}
                className={`w-full text-left px-2.5 py-1.5 sm:py-2 rounded flex items-center justify-between text-xs transition-colors cursor-pointer active:scale-98 ${
                  ep.id === currentPlayingEpisode.id
                    ? 'bg-[#E50914]/20 text-[#E50914] font-bold border border-[#E50914]/40'
                    : 'text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                <span className="truncate mr-2">
                  {(ep.isSynopsis || Number(ep.episodeNumber) === 0)
                    ? `Sinopse: ${ep.title}`
                    : `Ep. ${ep.episodeNumber}: ${ep.title}`}
                </span>
                <span className="text-neutral-500 shrink-0 text-[11px]">{ep.durationFormatted}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Diagnostic banner if error */}
      {audioError && (
        <div className="mb-2 sm:mb-3 max-w-4xl mx-auto w-full p-2.5 sm:p-3 rounded-lg bg-amber-500/10 border border-amber-500/40 text-xs text-amber-300 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-[11px] sm:text-xs">{audioError}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {drivePreviewEmbedUrl && !isUsingEmbedPlayer && (
              <button
                onClick={() => toggleEmbedPlayer(true)}
                className="px-2.5 py-1 rounded bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-colors cursor-pointer"
              >
                Player Seguro Drive
              </button>
            )}
            {driveDirectWebUrl && (
              <a
                href={driveDirectWebUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-700 text-xs flex items-center gap-1"
              >
                <span>Abrir</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <button
              onClick={retryPlayback}
              className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 cursor-pointer"
              title="Recarregar"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Controls Bar in Theater Mode (Mobile Finger Friendly) */}
      <div className="pt-3 sm:pt-4 border-t border-neutral-800 max-w-4xl mx-auto w-full space-y-2.5 sm:space-y-3 shrink-0">
        {/* Seeker Slider */}
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-[11px] sm:text-xs font-mono tabular-nums text-neutral-400 w-10 sm:w-12 text-right">
            {formatTime(currentTime)}
          </span>
          <div className="relative flex-1 group py-1">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeekChange}
              className="w-full h-2 sm:h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#E50914]"
            />
          </div>
          <span className="text-[11px] sm:text-xs font-mono tabular-nums text-neutral-400 w-10 sm:w-12">
            {formatTime(duration)}
          </span>
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between">
          {/* Individual Episode Reactions: Thumbs */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            {currentPlayingEpisode && (
              <>
                <button
                  onClick={() => toggleEpisodeReaction(currentPlayingEpisode.id, 'like')}
                  className={`p-1.5 sm:p-2 rounded-full transition-colors cursor-pointer active:scale-90 ${
                    currentEpisodeReaction === 'like' ? 'text-[#E50914] bg-white/10' : 'text-neutral-400 hover:text-white'
                  }`}
                  title={currentEpisodeReaction === 'like' ? 'Desfazer curtida do episódio' : 'Curtir este episódio'}
                >
                  <ThumbsUp className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={() => toggleEpisodeReaction(currentPlayingEpisode.id, 'dislike')}
                  className={`p-1.5 sm:p-2 rounded-full transition-colors cursor-pointer active:scale-90 ${
                    currentEpisodeReaction === 'dislike' ? 'text-[#E50914] bg-white/10' : 'text-neutral-400 hover:text-white'
                  }`}
                  title={currentEpisodeReaction === 'dislike' ? 'Desfazer dislike do episódio' : 'Não gostei deste episódio'}
                >
                  <ThumbsDown className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </>
            )}
          </div>

          {/* Central Audio Controls with STOP and PLAY (Optimized spacing for phones) */}
          <div className="flex items-center gap-1.5 sm:gap-3 md:gap-4">
            <button
              onClick={prevEpisode}
              className="p-1.5 sm:p-2 text-neutral-300 hover:text-white transition-colors cursor-pointer active:scale-90"
              title="Episódio Anterior"
            >
              <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              onClick={() => skipSeconds(-10)}
              className="p-1.5 sm:p-2 text-neutral-300 hover:text-white transition-colors flex items-center gap-0.5 cursor-pointer active:scale-90"
              title="Voltar 10 segundos"
            >
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-[9px] sm:text-[10px] font-bold">10</span>
            </button>

            {/* BOTÃO STOP CENTRAL */}
            <button
              onClick={stopAudio}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-neutral-800 hover:bg-neutral-700 hover:border-red-500 border border-neutral-700 text-white flex items-center justify-center transition-all active:scale-90 shadow-md cursor-pointer shrink-0"
              title="Parar áudio e voltar ao início (Stop)"
            >
              <Square className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-[#E50914] text-[#E50914]" />
            </button>

            {/* BOTÃO PLAY / PAUSE (Touch friendly principal) */}
            <button
              onClick={togglePlayPause}
              disabled={audioLoading}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white hover:bg-neutral-200 text-black flex items-center justify-center transition-transform active:scale-90 shadow-xl cursor-pointer disabled:opacity-80 shrink-0"
              title={isPlaying ? 'Pausar' : 'Reproduzir'}
            >
              {audioLoading ? (
                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-black animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-black" />
              ) : (
                <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-black translate-x-0.5" />
              )}
            </button>

            <button
              onClick={() => skipSeconds(10)}
              className="p-1.5 sm:p-2 text-neutral-300 hover:text-white transition-colors flex items-center gap-0.5 cursor-pointer active:scale-90"
              title="Avançar 10 segundos"
            >
              <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-[9px] sm:text-[10px] font-bold">10</span>
            </button>

            <button
              onClick={nextEpisode}
              className="p-1.5 sm:p-2 text-neutral-300 hover:text-white transition-colors cursor-pointer active:scale-90"
              title="Próximo Episódio"
            >
              <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Speed & Volume */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => {
                const nextIdx = (speedOptions.indexOf(playbackRate) + 1) % speedOptions.length;
                setSpeed(speedOptions[nextIdx]);
              }}
              className="px-2 sm:px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-[11px] sm:text-xs font-bold text-white transition-colors border border-neutral-700 cursor-pointer active:scale-95"
              title="Velocidade"
            >
              {playbackRate}x
            </button>

            <div className="hidden sm:flex items-center gap-2">
              <button onClick={toggleMute} className="text-neutral-300 hover:text-white cursor-pointer">
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
  );
};
