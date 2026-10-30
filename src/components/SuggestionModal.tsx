import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Lightbulb,
  Youtube,
  BookOpen,
  Mic,
  FileText,
  Sparkles,
  Send,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';
import { SuggestionSourceType } from '../types';

export const SuggestionModal: React.FC = () => {
  const {
    isSuggestionModalOpen,
    closeSuggestionModal,
    addSuggestion,
    currentUser,
    suggestions,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'form' | 'my_suggestions'>('form');
  const [themeTitle, setThemeTitle] = useState('');
  const [sourceType, setSourceType] = useState<SuggestionSourceType>('youtube');
  const [sourceReference, setSourceReference] = useState('');
  const [category, setCategory] = useState('Liderança e Gestão Estratégica');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  if (!isSuggestionModalOpen) return null;

  // Filter suggestions by current user
  const userSuggestions = suggestions.filter(
    s => s.userId === currentUser.id || s.userLogin === currentUser.login
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!themeTitle.trim() || !sourceReference.trim()) return;

    setIsSubmitting(true);
    try {
      await addSuggestion({
        themeTitle: themeTitle.trim(),
        sourceType,
        sourceReference: sourceReference.trim(),
        category,
        notes: notes.trim(),
      });
      setSubmittedSuccess(true);
      setTimeout(() => {
        setThemeTitle('');
        setSourceReference('');
        setNotes('');
        setSubmittedSuccess(false);
        setActiveTab('my_suggestions');
      }, 1600);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSourcePlaceholder = () => {
    switch (sourceType) {
      case 'youtube':
        return 'Ex: https://www.youtube.com/watch?v=... ou título do vídeo e canal';
      case 'book':
        return 'Ex: Livro "Hábitos Atômicos" - James Clear';
      case 'podcast':
        return 'Ex: Podcast Huberman Lab - Episódio sobre Foco e Dopamina';
      case 'article':
        return 'Ex: Harvard Business Review - Artigo sobre Liderança Adaptativa';
      default:
        return 'Ex: Artigo, palestra, case real ou metodologia que você recomenda';
    }
  };

  const getSourceIcon = (type: SuggestionSourceType) => {
    switch (type) {
      case 'youtube':
        return <Youtube className="w-4 h-4 text-red-500" />;
      case 'book':
        return <BookOpen className="w-4 h-4 text-amber-400" />;
      case 'podcast':
        return <Mic className="w-4 h-4 text-blue-400" />;
      case 'article':
        return <FileText className="w-4 h-4 text-emerald-400" />;
      default:
        return <Lightbulb className="w-4 h-4 text-purple-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Aprovada para Produção</span>
          </span>
        );
      case 'in_production':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/40 flex items-center gap-1">
            <Sparkles className="w-3 h-3 animate-spin" />
            <span>Em Produção de Áudio</span>
          </span>
        );
      case 'in_analysis':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Em Avaliação pelo Mentor</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-800 text-neutral-400 border border-neutral-700">
            Arquivada / Tema Similar Existente
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Pendente de Avaliação</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto visible-scrollbar bg-black/80 backdrop-blur-md flex justify-center items-center p-3 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop click */}
      <div className="fixed inset-0" onClick={closeSuggestionModal} />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-2xl bg-[#181818] rounded-xl overflow-hidden shadow-2xl z-10 border border-neutral-800 text-white flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-neutral-800 flex items-start justify-between bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-neutral-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0 shadow-inner">
              <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#E50914]/20 text-[#E50914] border border-[#E50914]/30">
                  Colaboração dos Alunos
                </span>
                <span className="text-xs text-neutral-400 hidden xs:inline">skills.ON! Co-criação</span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white">
                Sugerir Novo Tema ou Série de Estudos
              </h2>
            </div>
          </div>

          <button
            onClick={closeSuggestionModal}
            className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 border-b border-neutral-800 bg-neutral-950/40 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`pb-2.5 px-2 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'form'
                ? 'border-[#E50914] text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Enviar Nova Sugestão</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('my_suggestions')}
            className={`pb-2.5 px-2 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'my_suggestions'
                ? 'border-[#E50914] text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Minhas Sugestões ({userSuggestions.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto visible-scrollbar max-h-[calc(92vh-160px)] space-y-5">
          {activeTab === 'form' ? (
            submittedSuccess ? (
              <div className="py-12 px-4 text-center space-y-3 animate-in fade-in zoom-in duration-300">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white">Sugestão Enviada com Sucesso!</h3>
                <p className="text-sm text-neutral-300 max-w-md mx-auto leading-relaxed">
                  Obrigado por contribuir com a mentoria <strong>skills.ON!</strong>. O administrador e os mentores irão avaliar o tema para o roteiro de uma nova áudio série imersiva.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* User identification badge (no bureaucracy) */}
                <div className="bg-neutral-900/80 p-3 rounded-lg border border-neutral-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-white text-xs">
                      {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
                    </div>
                    <div>
                      <span className="text-neutral-400 block text-[10px]">Sugestão enviada por:</span>
                      <span className="font-bold text-white">{currentUser.name}</span>
                      <span className="text-neutral-400 ml-1.5 font-mono">(@{currentUser.login})</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    Sem burocracia
                  </span>
                </div>

                {/* 1. Source Type Selector */}
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                    1. Qual é a principal fonte de inspiração ou referência?
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'youtube', label: 'Vídeo YouTube', icon: <Youtube className="w-4 h-4 text-red-500" /> },
                      { id: 'book', label: 'Livro / Autor', icon: <BookOpen className="w-4 h-4 text-amber-400" /> },
                      { id: 'podcast', label: 'Podcast / Áudio', icon: <Mic className="w-4 h-4 text-blue-400" /> },
                      { id: 'topic', label: 'Tema / Conceito', icon: <Lightbulb className="w-4 h-4 text-purple-400" /> },
                    ].map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSourceType(item.id as SuggestionSourceType)}
                        className={`flex items-center justify-center gap-2 p-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          sourceType === item.id
                            ? 'bg-[#E50914]/20 border-[#E50914] text-white shadow-md'
                            : 'bg-neutral-900 hover:bg-neutral-850 border-neutral-800 text-neutral-300'
                        }`}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Suggested Theme Title */}
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">
                    2. Tema Foco ou Título Proposto <span className="text-[#E50914]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={themeTitle}
                    onChange={(e) => setThemeTitle(e.target.value)}
                    placeholder="Ex: Comunicação Não-Violenta para Líderes, Hábitos Atômicos, Gestão de Conflitos..."
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#E50914]"
                  />
                </div>

                {/* 3. Link or Reference */}
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">
                    3. Link da Fonte ou Referência <span className="text-[#E50914]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={sourceReference}
                    onChange={(e) => setSourceReference(e.target.value)}
                    placeholder={getSourcePlaceholder()}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#E50914]"
                  />
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Cole o link do YouTube/Podcast ou digite o nome do livro e autor para que o mentor consulte o conteúdo original.
                  </p>
                </div>

                {/* 4. Category / Area */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1">
                      Área de Foco / Categoria
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E50914] cursor-pointer"
                    >
                      <option value="Liderança e Gestão Estratégica">Liderança e Gestão Estratégica</option>
                      <option value="Vendas e Negociação de Alto Impacto">Vendas e Negociação de Alto Impacto</option>
                      <option value="Desenvolvimento Pessoal & Produtividade">Desenvolvimento Pessoal & Produtividade</option>
                      <option value="Comunicação e Relacionamento Interpessoal">Comunicação e Relacionamento Interpessoal</option>
                      <option value="Inteligência Emocional e Tomada de Decisão">Inteligência Emocional e Tomada de Decisão</option>
                      <option value="Inovação, Tecnologia & Futuro">Inovação, Tecnologia & Futuro</option>
                      <option value="Outro Tema">Outro Tema</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1">
                      Por que esse tema é importante? <span className="text-neutral-500 font-normal">(Opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Ex: Ajudaria muito no dia a dia com minha equipe de vendas..."
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E50914]"
                    />
                  </div>
                </div>

                {/* Footer Submit Action */}
                <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={closeSuggestionModal}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !themeTitle.trim() || !sourceReference.trim()}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#E50914] hover:bg-[#b80710] disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-[#E50914]/25 transition-all cursor-pointer active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? 'Enviando...' : 'Enviar Sugestão'}</span>
                  </button>
                </div>
              </form>
            )
          ) : (
            /* Tab 2: My Suggestions history */
            <div className="space-y-3">
              {userSuggestions.length === 0 ? (
                <div className="text-center py-10 text-neutral-400 space-y-2">
                  <Lightbulb className="w-8 h-8 text-neutral-600 mx-auto" />
                  <p className="text-sm font-semibold">Você ainda não enviou nenhuma sugestão.</p>
                  <p className="text-xs text-neutral-500">
                    Compartilhe temas, vídeos ou livros para inspirar os próximos lançamentos de áudio séries!
                  </p>
                  <button
                    onClick={() => setActiveTab('form')}
                    className="mt-2 px-4 py-1.5 rounded-lg bg-[#E50914] text-white text-xs font-bold"
                  >
                    Enviar Primeira Sugestão
                  </button>
                </div>
              ) : (
                userSuggestions.map(sug => (
                  <div
                    key={sug.id}
                    className="bg-neutral-900/90 p-4 rounded-xl border border-neutral-800 space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded bg-neutral-800 text-neutral-300">
                          {getSourceIcon(sug.sourceType)}
                        </span>
                        <h4 className="font-bold text-sm text-white">{sug.themeTitle}</h4>
                      </div>
                      <div>{getStatusBadge(sug.status)}</div>
                    </div>

                    <div className="text-xs text-neutral-300 bg-neutral-950/60 p-2.5 rounded-lg border border-neutral-800/80 space-y-1">
                      <p className="truncate">
                        <span className="text-neutral-500 font-semibold">Fonte: </span>
                        {sug.sourceReference.startsWith('http') ? (
                          <a
                            href={sug.sourceReference}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline inline-flex items-center gap-1"
                          >
                            <span>{sug.sourceReference}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span>{sug.sourceReference}</span>
                        )}
                      </p>
                      {sug.notes && (
                        <p className="text-neutral-400">
                          <span className="text-neutral-500 font-semibold">Sua observação: </span>
                          {sug.notes}
                        </p>
                      )}
                    </div>

                    {sug.adminNotes && (
                      <div className="bg-amber-950/25 border border-amber-500/30 p-2.5 rounded-lg text-xs text-amber-200 flex items-start gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block text-amber-300">Parecer do Administrador / Mentor:</span>
                          <p className="text-neutral-300 text-[11px] leading-relaxed">{sug.adminNotes}</p>
                        </div>
                      </div>
                    )}

                    <div className="text-[10px] text-neutral-500 flex items-center justify-between pt-1">
                      <span>Categoria: {sug.category || 'Geral'}</span>
                      <span>Enviada em {new Date(sug.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
