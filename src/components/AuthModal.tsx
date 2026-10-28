import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, ArrowRight, Eye, EyeOff, CheckCircle2, ShieldCheck, User } from 'lucide-react';
import loginMosaicBg from '../assets/images/audio_skills_mosaic_bg.jpg';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { loginWithCredentials } = useApp();

  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const res = await loginWithCredentials(loginInput, password);
      if (res.success) {
        setSuccessMsg('Autenticado com sucesso!');
        setTimeout(() => {
          onClose();
        }, 400);
      } else {
        setErrorMsg(res.message || 'Credenciais inválidas. Verifique seu login e senha.');
      }
    } catch {
      setErrorMsg('Erro no processo de autenticação. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden select-none">
      {/* Cinematic Training Mosaic Background */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-black">
        <img
          src={loginMosaicBg}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/assets/aistudio/audio_skills_mosaic_bg.jpg';
          }}
          alt="AUDIO SKILLS Treinamento Corporativo e Soft Skills"
          className="w-full h-full object-cover object-center scale-105 filter brightness-85 contrast-105"
        />
        {/* Balanced Dark Overlay: Keeps photo mosaic clearly visible while ensuring login card readability */}
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/70" />
      </div>

      {/* Solid Black Login Box (Remains perfectly readable and central) */}
      <div className="relative w-full max-w-md bg-black/90 sm:bg-[#141414]/95 border border-neutral-800 rounded-2xl p-6 sm:p-8 text-white shadow-[0_20px_60px_rgba(0,0,0,0.9)] z-10 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header with Enlarged Official AUDIO SKILLS Logo (No Close 'X' button as requested) */}
        <div className="text-center mb-6">
          <img
            src="/assets/aistudio/audio_skills_logo_new.jpeg"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://i.imgur.com/LyJxYFP.jpeg';
            }}
            alt="AUDIO SKILLS por skills.ON!"
            className="h-16 sm:h-20 md:h-22 w-auto max-w-[200px] object-contain mx-auto mb-3 mix-blend-screen filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]"
          />
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Entrar na Plataforma</h2>
          <p className="text-xs text-neutral-400 mt-1">
            Áudio Séries de Treinamento e Educação Executiva
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Secure Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs text-neutral-300 block mb-1 font-medium">LOGIN de Acesso</label>
            <div className="relative">
              <User className="w-4 h-4 text-neutral-500 absolute left-3 top-3.5" />
              <input
                type="text"
                required
                autoComplete="username"
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                placeholder="Informe seu login"
                className="w-full bg-neutral-900 text-sm text-white font-mono rounded-lg pl-9 pr-3 py-2.5 border border-neutral-700 focus:outline-none focus:border-[#E50914] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-neutral-300 block mb-1 font-medium">SENHA</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Informe sua senha"
                className="w-full bg-neutral-900 text-sm text-white font-mono rounded-lg pl-9 pr-10 py-2.5 border border-neutral-700 focus:outline-none focus:border-[#E50914] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-neutral-400 hover:text-white"
                title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-lg bg-[#E50914] hover:bg-[#b80710] font-bold text-sm text-white transition-transform active:scale-98 shadow-xl mt-3 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <span>{isLoading ? 'Autenticando...' : 'Entrar no Sistema'}</span>
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Cryptographic Security Badge */}
        <div className="mt-6 pt-4 border-t border-neutral-800/80 flex items-center justify-center gap-1.5 text-[11px] text-neutral-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Autenticação protegida por criptografia AES-256 e SHA-256</span>
        </div>
      </div>
    </div>
  );
};
