import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Shield, User, Lock, ArrowRight, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { loginWithCredentials, currentUser, allUsers } = useApp();

  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const res = loginWithCredentials(loginInput, password);
    if (res.success) {
      setSuccessMsg('Autenticado com sucesso!');
      setTimeout(() => {
        onClose();
      }, 500);
    } else {
      setErrorMsg(res.message || 'Credenciais inválidas. Verifique seu login e senha.');
    }
  };

  const handleQuickFill = (userLogin: string, userPass: string) => {
    setLoginInput(userLogin);
    setPassword(userPass);
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[#181818] border border-neutral-800 rounded-2xl p-6 sm:p-8 text-white shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header with Original Logo */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <img
              src="/assets/aistudio/skills_ON_BRANCO_transparente_a2b697f4.png"
              alt="skills.ON! Educação Executiva"
              className="h-10 sm:h-12 object-contain"
            />
          </div>
          <p className="text-xs text-neutral-400">
            Acesso ao Streaming de Áudio Séries de Treinamento
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Quick Reference / 1-Click Credentials Fill */}
        <div className="mb-6 p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
            Acesso Rápido com Credenciais Cadastradas:
          </span>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickFill('skills.on.admin', 'jmlustosa.skills.on!')}
              className="px-2.5 py-2 rounded-lg bg-neutral-800 hover:bg-[#E50914] text-left transition-colors border border-neutral-700/80 group"
            >
              <div className="flex items-center gap-1.5 font-bold text-neutral-200 group-hover:text-white">
                <Shield className="w-3.5 h-3.5 text-[#E50914] group-hover:text-white" />
                <span>Admin</span>
              </div>
              <span className="text-[10px] text-neutral-400 group-hover:text-neutral-200 font-mono block truncate">
                skills.on.admin
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('aluno', '123')}
              className="px-2.5 py-2 rounded-lg bg-neutral-800 hover:bg-blue-600 text-left transition-colors border border-neutral-700/80 group"
            >
              <div className="flex items-center gap-1.5 font-bold text-neutral-200 group-hover:text-white">
                <User className="w-3.5 h-3.5 text-blue-400 group-hover:text-white" />
                <span>Aluno</span>
              </div>
              <span className="text-[10px] text-neutral-400 group-hover:text-neutral-200 font-mono block truncate">
                aluno
              </span>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs text-neutral-300 block mb-1 font-medium">LOGIN de Acesso</label>
            <div className="relative">
              <User className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                placeholder="Ex: skills.on.admin ou aluno"
                className="w-full bg-neutral-900 text-sm text-white font-mono rounded-lg pl-9 pr-3 py-2.5 border border-neutral-700 focus:outline-none focus:border-[#E50914]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-neutral-300 block mb-1 font-medium">SENHA</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha de acesso"
                className="w-full bg-neutral-900 text-sm text-white font-mono rounded-lg pl-9 pr-10 py-2.5 border border-neutral-700 focus:outline-none focus:border-[#E50914]"
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
            className="w-full py-3 rounded-lg bg-[#E50914] hover:bg-[#b80710] font-bold text-sm text-white transition-transform active:scale-98 shadow-xl mt-3 flex items-center justify-center gap-2"
          >
            <span>Entrar na Plataforma</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-neutral-800 text-center">
          <p className="text-[11px] text-neutral-400">
            Logins e senhas de alunos são gerenciados exclusivamente pelo Administrador no Painel Admin.
          </p>
        </div>
      </div>
    </div>
  );
};
