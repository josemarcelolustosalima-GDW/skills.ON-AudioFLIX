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
import { Search, Sparkles, Heart, Bookmark, Filter, ShieldCheck } from 'lucide-react';

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
    <div className="min-h-screen bg-[#141414] text-white flex flex-col selection:bg-[#E50914] selection:text-white">
      {/* Top Navbar */}
      <Navbar onOpenAuth={() => setAuthModalOpen(true)} />

      {/* RENDER VIEW: ADMIN DASHBOARD */}
      {currentView === 'admin' ? (
        <AdminDashboard />
      ) : (
        /* REGULAR NETFLIX EXPERIENCE */
        <main className="flex-1 pb-24">
          {/* SEARCH RESULTS VIEW */}
          {searchQuery ? (
            <div className="pt-28 px-4 md:px-12 max-w-7xl mx-auto space-y-6">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                    <Search className="w-5 h-5 text-[#E50914]" />
                    <span>Resultados para: &ldquo;{searchQuery}&rdquo;</span>
                  </h1>
                  <p className="text-xs text-neutral-400 mt-1">
                    {searchResults.length} áudio séries encontradas
                  </p>
                </div>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-neutral-400 hover:text-white underline"
                >
                  Limpar busca
                </button>
              </div>

              {searchResults.length === 0 ? (
                <div className="py-20 text-center text-neutral-400 space-y-3">
                  <p className="text-base">Nenhuma áudio série encontrada com este termo.</p>
                  <p className="text-xs text-neutral-500">Tente buscar por &ldquo;Liderança&rdquo;, &ldquo;Vendas&rdquo;, &ldquo;David Chen&rdquo; ou explore o catálogo inicial.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {searchResults.map(s => (
                    <SeriesCard key={s.id} series={s} />
                  ))}
                </div>
              )}
            </div>
          ) : currentView === 'my_list' ? (
            /* MINHA LISTA VIEW */
            <div className="pt-28 px-4 md:px-12 max-w-7xl mx-auto space-y-6">
              <div className="border-b border-neutral-800 pb-4">
                <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2.5">
                  <Bookmark className="w-6 h-6 text-[#E50914]" />
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
                    Clique no botão <strong>+</strong> nos cards das séries para adicioná-las aqui.
                  </p>
                  <button
                    onClick={() => setCurrentView('home')}
                    className="px-5 py-2.5 rounded bg-white text-black font-bold text-xs hover:bg-neutral-200 transition-colors inline-block mt-2"
                  >
                    Explorar Catálogo
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {myListSeries.map(s => (
                    <SeriesCard key={s.id} series={s} />
                  ))}
                </div>
              )}
            </div>
          ) : currentView === 'top_rated' ? (
            /* MAIS BEM AVALIADAS VIEW */
            <div className="pt-28 px-4 md:px-12 max-w-7xl mx-auto space-y-6">
              <div className="border-b border-neutral-800 pb-4">
                <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2.5">
                  <Heart className="w-6 h-6 text-[#E50914]" />
                  <span>Mais Bem Avaliadas pelos Alunos</span>
                </h1>
                <p className="text-xs text-neutral-400 mt-1">
                  Ranking consolidado com maior índice de aprovação (Likes & Amei) da plataforma.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {topRatedSeries.map(s => (
                  <SeriesCard key={s.id} series={s} />
                ))}
              </div>
            </div>
          ) : currentView === 'series_catalog' ? (
            /* FULL CATALOG VIEW WITH CATEGORY FILTERS */
            <div className="pt-28 px-4 md:px-12 max-w-7xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                    Catálogo Completo de Áudio Séries
                  </h1>
                  <p className="text-xs text-neutral-400 mt-1">
                    Explore todos os programas de treinamento com padrão imersivo Netflix.
                  </p>
                </div>

                {/* Filter tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  <button
                    onClick={() => setSelectedCategoryFilter('Todas')}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
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
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
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

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
              <div className="relative -mt-8 md:-mt-14 z-20 space-y-2 md:space-y-4">
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

      {/* Persistent Audio Player (Floating Bottom Bar + Theater Fullscreen) */}
      <AudioPlayer />

      {/* User Login & Password Modal */}
      <AuthModal
        isOpen={!isLoggedIn || authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* Netflix Standard Dark Footer */}
      <footer className="mt-auto border-t border-neutral-900 bg-[#101010] py-10 px-4 md:px-12 text-neutral-500 text-xs">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <img
              src="/assets/aistudio/skills_ON_BRANCO_transparente_a2b697f4.png"
              alt="skills.ON! Educação Executiva"
              className="h-8 md:h-9 object-contain"
            />
            <span className="hidden sm:inline text-neutral-600">|</span>
            <span className="text-neutral-400">Plataforma de Treinamento Imersivo em Áudio Séries</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-neutral-400">
            <button onClick={() => setCurrentView('home')} className="text-left hover:underline">
              Início do Catálogo
            </button>
            <button onClick={() => setCurrentView('series_catalog')} className="text-left hover:underline">
              Todas as Séries
            </button>
            <button onClick={() => setCurrentView('top_rated')} className="text-left hover:underline">
              Mais Votadas
            </button>
            {currentUser.role === 'admin' && (
              <button onClick={() => setCurrentView('admin')} className="text-left hover:underline text-[#E50914] font-semibold">
                Painel Administrativo
              </button>
            )}
          </div>

          <div className="pt-4 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-2 text-neutral-600 text-[11px]">
            <p>© {new Date().getFullYear()} skills.ON! — Todos os direitos reservados. Padrão de layout e experiência visual inspirado na Netflix.</p>
            <p className="flex items-center gap-1.5">
              <span>Hospedagem Netlify</span>
              <span>•</span>
              <span>Banco Supabase Ready</span>
              <span>•</span>
              <span>Google Drive Audio Stream</span>
            </p>
          </div>
        </div>
      </footer>
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
