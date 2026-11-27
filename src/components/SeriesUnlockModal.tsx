import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, Lock, KeyRound, Eye, EyeOff, AlertCircle, Unlock, ShieldCheck } from 'lucide-react';

export const SeriesUnlockModal: React.FC = () => {
  const {
    seriesUnlockModalTarget,
    closeSeriesUnlockModal,
    unlockSeriesWithPassword,
  } = useApp();

  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setPasswordInput('');
    setShowPassword(false);
    setErrorMsg(null);
    setIsSubmitting(false);
  }, [seriesUnlockModalTarget?.series.id]);

  useEffect(() => {
    if (!seriesUnlockModalTarget) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSeriesUnlockModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [seriesUnlockModalTarget, closeSeriesUnlockModal]);

  if (!seriesUnlockModalTarget) return null;

  const { series } = seriesUnlockModalTarget;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) {
      setErrorMsg('Informe a senha exclusiva fornecida para esta série.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await unlockSeriesWithPassword(series.id, passwordInput);
      if (!res.success) {
        setErrorMsg(res.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={closeSeriesUnlockModal} />

      <div className="relative w-full max-w-md bg-[#161616] border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl z-10 text-white">
        {/* Series Cover Preview Banner */}
        <div className="relative h-36 w-full bg-neutral-900 overflow-hidden">
          <img
            src={series.heroImage || series.posterImage}
            alt={series.title}
            className="w-full h-full object-cover opacity-55"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/assets/images/skills_hero_leadership_1792881116508.jpg';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#161616] via-[#161616]/60 to-black/40" />

          <button
            type="button"
            onClick={closeSeriesUnlockModal}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/70 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="absolute bottom-3 left-5 right-5 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shrink-0 backdrop-blur-sm">
              <Lock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                Trilha de Capacitação • Acesso Controlado
              </span>
              <h2 className="text-base sm:text-lg font-extrabold text-white truncate">
                {series.title}
              </h2>
            </div>
          </div>
        </div>

        {/* Form & Instructions */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          <div className="p-3.5 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-1.5 text-xs text-neutral-300 leading-relaxed">
            <p className="font-semibold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Como liberar esta áudio série?</span>
            </p>
            <p className="text-neutral-400">
              Esta série possui uma <strong className="text-neutral-200">senha exclusiva</strong>. Após concluir a série anterior e responder ao questionário de fixação, solicite a senha de liberação ao administrador/mentor.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[#E50914]" />
              <span>Senha de Liberação da Série</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                required
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Digite a senha exclusiva da série"
                className="w-full bg-neutral-900 text-white font-mono text-sm rounded-xl pl-3.5 pr-11 py-3 border border-neutral-700 focus:outline-none focus:border-[#E50914] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title={showPassword ? 'Ocultar senha' : 'Visualizar senha'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-xs text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={closeSeriesUnlockModal}
              className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#E50914] hover:bg-[#b80710] disabled:opacity-60 text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#E50914]/25 transition-all active:scale-95 cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              <span>{isSubmitting ? 'Verificando...' : 'Liberar Acesso à Série'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
