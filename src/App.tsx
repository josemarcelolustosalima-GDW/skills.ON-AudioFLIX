/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { HeroBillboard } from './components/HeroBillboard';
import { CategoryRow } from './components/CategoryRow';
import { SeriesDetailModal } from './components/SeriesDetailModal';
import { AudioPlayer } from './components/AudioPlayer';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { SeriesCard } from './components/SeriesCard';
import {
  Search,
  Heart,
  Bookmark,
  Home,
  Layers,
  Shield,
  CheckCircle2,
} from 'lucide-react';

function MainApp() {
  const {
    series,
    episodes,
    currentView,
    searchQuery,
    setSearchQuery,
    currentUser,
    setCurrentView,
    isLoggedIn,
    isMobilePreview,
    syncNotification,
    clearSyncNotification,
  } = useApp();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('Todas');

  // Featured billboard series
  const featuredSeries = series.find(s => s.featured) || series[0];

  // Distinct categories from series
  const categories = Array.from(new Set(series.map(s => s.category)));

  // Filtered series when search is active
  const searchResults = searchQuery
    ? series.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.mentor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.synopsis.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  // My List Series
  const myListSeries = series.filter(s => currentUser.myList.includes(s.id));

  // Top Rated Series (Sorted by net approval and likes)
  const topRatedSeries = [...series].sort((a, b) => {
    const rateA = a.likes / (a.likes + a.unlikes || 1);
    const rateB = b.likes / (b.likes + b.unlikes || 1);
    return rateB - rateA || b.likes - a.likes;
  });

  // Series with user listen history ("Continuar Ouvindo")
  const inProgressEpisodeIds = Object.keys(currentUser.listenProgress);
  const continueListeningSeries = series.filter(s =>
    episodes.some(e => e.seriesId === s.id && inProgressEpisodeIds.includes(e.id))
  );

  return (
    <div className={isMobilePreview ? "min-h-screen bg-neutral-950 py-3 md:py-6 px-2 flex flex-col items-center justify-center" : "min-h-screen bg-[#141414] text-white flex flex-col font-sans selection:bg-[#E50914] selection:text-white"}>
      {isMobilePreview && (
        <div className="hidden md:flex items-center justify-between w-full max-w-[420px] mb-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs font-semibold">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Simulador Mobile (Smartphone)</span>
          </span>
          <span className="text-[11px] text-neutral-400">Padrão 390px</span>
        </div>
      )}

      <div className={isMobilePreview ? "w-full max-w-[420px] h-[92vh] max-h-[860px] bg-[#141414] text-white flex flex-col relative rounded-[38px] border-[8px] border-neutral-800 shadow-2xl overflow-y-auto selection:bg-[#E50914] selection:text-white pb-20 ring-1 ring-white/10" : "w-full min-h-screen bg-[#141414] text-white flex flex-col selection:bg-[#E50914] selection:text-white pb-16 md:pb-0"}>
        {/* Top Navbar */}
        <Navbar onOpenAuth={() => setAuthModalOpen(true)} />

        {/* Global Sync Notification Toast */}
        {syncNotification && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] bg-emerald-950/95 border border-emerald-500 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-top-4 duration-300 backdrop-blur-md">
            <div className="flex items-center gap-2.5 text-xs font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{syncNotification}</span>
            </div>
            <button
              onClick={clearSyncNotification}
              className="p-1 rounded hover:bg-emerald-900 text-neutral-300 hover:text-white shrink-0 cursor-pointer"
              title="Fechar notificação"
            >
              ✕
            </button>
          </div>
        )}

      {/* RENDER VIEW: ADMIN DASHBOARD */}
      {currentView === 'admin' ? (
        <div className="pb-24 md:pb-12">
          <AdminDashboard />
        </div>
      ) : (
        /* REGULAR NETFLIX EXPERIENCE (MOBILE ADAPTED WITH SAFE CLEARANCE) */
        <main className="flex-1 pb-28 md:pb-24">
          {/* SEARCH RESULTS VIEW */}
          {searchQuery ? (
            <div className="pt-24 md:pt-28 px-3 sm:px-6 md:px-12 max-w-7xl mx-auto space-y-6">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                <div>
                  <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                    <Search className="w-5 h-5 text-[#E50914]" />
                    <span className="truncate">Busca: &ldquo;{searchQuery}&rdquo;</span>
                  </h1>
                  <p className="text-xs text-neutral-400 mt-1">
                    {searchResults.length} áudio séries encontradas
                  </p>
                </div>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-neutral-400 hover:text-white underline cursor-pointer shrink-0 ml-2"
                >
                  Limpar
                </button>
              </div>

              {searchResults.length === 0 ? (
                <div className="py-20 text-center text-neutral-400 space-y-3">
                  <p className="text-base">Nenhuma áudio série encontrada com este termo.</p>
                  <p className="text-xs text-neutral-500">Tente buscar por &ldquo;Liderança&rdquo;, &ldquo;Vendas&rdquo;, &ldquo;David Chen&rdquo; ou explore o catálogo inicial.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                  {searchResults.map(s => (
                    <SeriesCard key={s.id} series={s} />
                  ))}
                </div>
              )}
            </div>
          ) : currentView === 'my_list' ? (
            /* MINHA LISTA VIEW */
            <div className="pt-24 md:pt-28 px-3 sm:px-6 md:px-12 max-w-7xl mx-auto space-y-6">
              <div className="border-b border-neutral-800 pb-4">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2.5">
                  <Bookmark className="w-5 h-5 sm:w-6 sm:h-6 text-[#E50914]" />
                  <span>Minha Lista de Treinamentos</span>
                </h1>
                <p className="text-xs text-neutral-400 mt-1">
                  Suas áudio séries salvas para escutar no seu próprio ritmo.
                </p>
              </div>

              {myListSeries.length === 0 ? (
                <div className="py-24 text-center text-neutral-400 space-y-3">
                  <p className="text-base font-semibold">Sua lista está vazia no momento.</p>
                  <p className="text-xs text-neutral-500">
                    Toque no botão <strong>+</strong> nos cards das séries para adicioná-las aqui.
                  </p>
                  <button
                    onClick={() => setCurrentView('home')}
                    className="px-5 py-2.5 rounded bg-white text-black font-bold text-xs hover:bg-neutral-200 transition-colors inline-block mt-2 cursor-pointer"
                  >
                    Explorar Catálogo
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                  {myListSeries.map(s => (
                    <SeriesCard key={s.id} series={s} />
                  ))}
                </div>
              )}
            </div>
          ) : currentView === 'top_rated' ? (
            /* MAIS BEM AVALIADAS VIEW */
            <div className="pt-24 md:pt-28 px-3 sm:px-6 md:px-12 max-w-7xl mx-auto space-y-6">
              <div className="border-b border-neutral-800 pb-4">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2.5">
                  <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-[#E50914]" />
                  <span>Mais Bem Avaliadas pelos Alunos</span>
                </h1>
                <p className="text-xs text-neutral-400 mt-1">
                  Ranking consolidado com maior índice de aprovação da plataforma.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                {topRatedSeries.map(s => (
                  <SeriesCard key={s.id} series={s} />
                ))}
              </div>
            </div>
          ) : currentView === 'series_catalog' ? (
            /* FULL CATALOG VIEW WITH CATEGORY FILTERS (SÉRIES DE TREINAMENTO) */
            <div className="pt-24 md:pt-28 px-3 sm:px-6 md:px-12 max-w-7xl mx-auto space-y-6 md:space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4 md:pb-5">
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white">
                    Catálogo Completo de Áudio Séries
                  </h1>
                  <p className="text-xs text-neutral-400 mt-1">
                    Explore todos os programas de treinamento com padrão imersivo Netflix.
                  </p>
                </div>

                {/* Filter tabs */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                  <button
                    onClick={() => setSelectedCategoryFilter('Todas')}
                    className={`px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      selectedCategoryFilter === 'Todas'
                        ? 'bg-white text-black'
                        : 'bg-neutral-800 text-neutral-300 hover:text-white'
                    }`}
                  >
                    Todas ({series.length})
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategoryFilter(cat)}
                      className={`px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        selectedCategoryFilter === cat
                          ? 'bg-white text-black'
                          : 'bg-neutral-800 text-neutral-300 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                {(selectedCategoryFilter === 'Todas'
                  ? series
                  : series.filter(s => s.category === selectedCategoryFilter)
                ).map(s => (
                  <SeriesCard key={s.id} series={s} />
                ))}
              </div>
            </div>
          ) : (
            /* HOME VIEW (DEFAULT NETFLIX HOME BILLBOARD & CAROUSELS) */
            <>
              {/* Hero Billboard */}
              {featuredSeries && <HeroBillboard series={featuredSeries} />}

              {/* Negative margin row stack like Netflix */}
              <div className="relative -mt-6 sm:-mt-8 md:-mt-14 z-20 space-y-2 md:space-y-4">
                {/* Row 1: Continuar Ouvindo (if any in progress) */}
                {continueListeningSeries.length > 0 && (
                  <CategoryRow
                    title="Continuar Ouvindo"
                    subtitle="Retome seu treinamento exatamente de onde parou"
                    seriesList={continueListeningSeries}
                  />
                )}

                {/* Row 2: Em Alta no skills.ON! */}
                <CategoryRow
                  title="Em Alta no skills.ON!"
                  subtitle="Os treinamentos executivos mais ouvidos esta semana"
                  seriesList={topRatedSeries}
                />

                {/* Dynamic Category Rows */}
                {categories.map(cat => {
                  const catSeries = series.filter(s => s.category === cat);
                  return (
                    <CategoryRow
                      key={cat}
                      title={cat}
                      seriesList={catSeries}
                    />
                  );
                })}
              </div>
            </>
          )}
        </main>
      )}

      {/* Netflix Series Details & Episode List Modal */}
      <SeriesDetailModal />

      {/* Persistent Audio Player (Visão Expandida Imersiva Oficial) */}
      <AudioPlayer />

      {/* User Login & Password Modal */}
      <AuthModal
        isOpen={!isLoggedIn || authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* Netflix Standard Dark Footer (with clearance for mobile bottom nav) */}
      <footer className="mt-auto border-t border-neutral-900 bg-[#101010] py-8 sm:py-10 px-4 md:px-12 text-neutral-500 text-xs mb-14 md:mb-0">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <img
              src="/assets/aistudio/skills_ON_BRANCO_transparente_a2b697f4.png"
              alt="skills.ON! Educação Executiva"
              className="h-7 sm:h-8 md:h-9 object-contain"
            />
            <span className="hidden sm:inline text-neutral-600">|</span>
            <span className="text-neutral-400">Plataforma de Treinamento Imersivo em Áudio Séries</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-neutral-400">
            <button onClick={() => { setCurrentView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-left hover:underline cursor-pointer">
              Início do Catálogo
            </button>
            <button onClick={() => { setCurrentView('series_catalog'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-left hover:underline cursor-pointer">
              Todas as Séries
            </button>
            <button onClick={() => { setCurrentView('top_rated'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-left hover:underline cursor-pointer">
              Mais Votadas
            </button>
            {currentUser.role === 'admin' && (
              <button onClick={() => { setCurrentView('admin'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-left hover:underline text-[#E50914] font-semibold cursor-pointer">
                Painel Administrativo
              </button>
            )}
          </div>

          <div className="pt-4 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-2 text-neutral-600 text-[11px]">
            <p>© {new Date().getFullYear()} skills.ON! — Todos os direitos reservados. Padrão de layout e experiência visual inspirado na Netflix.</p>
            <p className="flex items-center gap-1.5">
              <span>Hospedagem Netlify</span>
              <span>•</span>
              <span>Google Drive Audio Stream</span>
            </p>
          </div>
        </div>
      </footer>

      {/* MOBILE BOTTOM NAVIGATION BAR (Padrão Netflix / Spotify para Smartphones) */}
      <nav
        className={`fixed bottom-0 ${
          isMobilePreview
            ? 'left-1/2 -translate-x-1/2 w-full max-w-[404px] rounded-b-[30px]'
            : 'left-0 right-0'
        } z-40 ${
          isMobilePreview ? 'flex' : 'md:hidden flex'
        } bg-[#121212]/95 backdrop-blur-md border-t border-neutral-800/90 px-2 py-1.5 items-center justify-around select-none`}
      >
        <button
          onClick={() => {
            setCurrentView('home');
            setSearchQuery('');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors cursor-pointer active:scale-95 ${
            currentView === 'home' && !searchQuery ? 'text-white' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Home className={`w-5 h-5 ${currentView === 'home' && !searchQuery ? 'text-[#E50914]' : ''}`} />
          <span className="text-[10px] font-medium mt-0.5">Início</span>
        </button>

        <button
          onClick={() => {
            setCurrentView('series_catalog');
            setSearchQuery('');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors cursor-pointer active:scale-95 ${
            currentView === 'series_catalog' ? 'text-white' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Layers className={`w-5 h-5 ${currentView === 'series_catalog' ? 'text-[#E50914]' : ''}`} />
          <span className="text-[10px] font-medium mt-0.5">Séries</span>
        </button>

        <button
          onClick={() => {
            setCurrentView('top_rated');
            setSearchQuery('');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors cursor-pointer active:scale-95 ${
            currentView === 'top_rated' ? 'text-white' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Heart className={`w-5 h-5 ${currentView === 'top_rated' ? 'text-[#E50914]' : ''}`} />
          <span className="text-[10px] font-medium mt-0.5">Mais Votadas</span>
        </button>

        <button
          onClick={() => {
            setCurrentView('my_list');
            setSearchQuery('');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors cursor-pointer active:scale-95 ${
            currentView === 'my_list' ? 'text-white' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Bookmark className={`w-5 h-5 ${currentView === 'my_list' ? 'text-[#E50914]' : ''}`} />
          <span className="text-[10px] font-medium mt-0.5">Minha Lista</span>
        </button>

        {currentUser.role === 'admin' && (
          <button
            onClick={() => {
              setCurrentView('admin');
              setSearchQuery('');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors cursor-pointer active:scale-95 ${
              currentView === 'admin' ? 'text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Shield className={`w-5 h-5 ${currentView === 'admin' ? 'text-[#E50914]' : ''}`} />
            <span className="text-[10px] font-medium mt-0.5">Admin</span>
          </button>
        )}
      </nav>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
