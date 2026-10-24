import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Shield, LogOut } from 'lucide-react';

interface NavbarProps {
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth }) => {
  const {
    currentUser,
    currentView,
    setCurrentView,
    searchQuery,
    setSearchQuery,
    logout,
    isLoggedIn,
  } = useApp();

  const [isScrolled, setIsScrolled] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 px-4 md:px-12 flex items-center justify-between h-16 md:h-18 ${
        isScrolled
          ? 'bg-[#141414]/95 backdrop-blur-md shadow-2xl border-b border-white/5'
          : 'bg-gradient-to-b from-black/90 via-black/40 to-transparent'
      }`}
    >
      {/* Left: Original skills.ON! Logo & Navigation */}
      <div className="flex items-center gap-8">
        <button
          onClick={() => {
            setCurrentView('home');
            setSearchQuery('');
          }}
          className="flex items-center gap-2 focus:outline-none group text-left py-1"
          title="skills.ON! Educação Executiva"
        >
          {/* Official Original Logo Attachment */}
          <img
            src="/assets/aistudio/skills_ON_BRANCO_transparente_a2b697f4.png"
            alt="skills.ON! Educação Executiva"
            className="h-6 sm:h-7 md:h-8 w-auto object-contain group-hover:scale-102 transition-transform duration-200"
          />
        </button>

        {/* Netflix Desktop Navigation Links (Always Accessible to Student & Admin) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => {
              setCurrentView('home');
              setSearchQuery('');
            }}
            className={`transition-colors whitespace-nowrap ${
              currentView === 'home' && !searchQuery
                ? 'text-white font-bold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Início
          </button>
          <button
            onClick={() => {
              setCurrentView('series_catalog');
              setSearchQuery('');
            }}
            className={`transition-colors whitespace-nowrap ${
              currentView === 'series_catalog'
                ? 'text-white font-bold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Séries de Treinamento
          </button>
          <button
            onClick={() => {
              setCurrentView('top_rated');
              setSearchQuery('');
            }}
            className={`transition-colors whitespace-nowrap ${
              currentView === 'top_rated'
                ? 'text-white font-bold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Mais Bem Avaliadas
          </button>
          <button
            onClick={() => {
              setCurrentView('my_list');
              setSearchQuery('');
            }}
            className={`transition-colors whitespace-nowrap ${
              currentView === 'my_list'
                ? 'text-white font-bold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Minha Lista
          </button>
        </nav>
      </div>

      {/* Right: Search, Admin Access (Admin ONLY), and Logout Button (NO profile photo switch) */}
      <div className="flex items-center gap-3 md:gap-4 text-sm">
        {/* Search Input */}
        <div className="relative flex items-center">
          {showSearchInput ? (
            <div className="flex items-center bg-black/80 border border-white/20 rounded-md px-2.5 py-1.5 transition-all w-44 sm:w-64">
              <Search className="w-4 h-4 text-neutral-400 mr-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Títulos, temas, mentores..."
                autoFocus
                className="bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none w-full"
                onBlur={() => {
                  if (!searchQuery) setShowSearchInput(false);
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-neutral-400 hover:text-white ml-1"
                >
                  ✕
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowSearchInput(true)}
              className="p-1.5 text-neutral-300 hover:text-white transition-colors"
              title="Buscar no catálogo"
            >
              <Search className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Admin Dashboard Button: EXCLUSIVELY AVAILABLE FOR ADMIN LOGIN */}
        {currentUser.role === 'admin' && (
          <button
            onClick={() => setCurrentView(currentView === 'admin' ? 'home' : 'admin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
              currentView === 'admin'
                ? 'bg-[#E50914] text-white shadow-lg shadow-[#E50914]/30'
                : 'bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200 border border-white/10'
            }`}
            title="Acessar o Painel de Controle Administrativo"
          >
            <Shield className="w-3.5 h-3.5 text-[#E50914]" />
            <span className="hidden sm:inline">Painel Admin</span>
            <span className="sm:hidden">Admin</span>
          </button>
        )}

        {/* User identification label */}
        <div className="hidden lg:flex flex-col text-right">
          <span className="text-xs font-semibold text-neutral-200 truncate max-w-[130px]">
            {currentUser.name}
          </span>
          <span className="text-[10px] text-neutral-400">
            {currentUser.role === 'admin' ? 'Administrador' : 'Estudante'}
          </span>
        </div>

        {/* Clean Logout Button (Replaces the photo switcher menu) */}
        {isLoggedIn ? (
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-neutral-900/90 hover:bg-neutral-800 text-xs text-neutral-300 hover:text-white border border-neutral-700/80 transition-colors"
            title="Encerrar sessão"
          >
            <LogOut className="w-3.5 h-3.5 text-neutral-400" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            className="px-4 py-1.5 rounded bg-[#E50914] hover:bg-[#b80710] text-xs font-bold text-white transition-colors shadow-md"
          >
            Entrar
          </button>
        )}
      </div>
    </header>
  );
};
