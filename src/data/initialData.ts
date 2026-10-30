import { AudioSeries, AudioEpisode, UserProfile, UserAccessLog, SeriesSuggestion } from '../types';

export const INITIAL_SERIES: AudioSeries[] = [
  {
    id: 'series-leadership',
    title: 'High Stakes Leadership: A Arte da Decisão Extrema',
    subtitle: 'Gestão Estratégica & Decisão sob Pressão',
    synopsis: 'Em um cenário de incertezas brutais, líderes excepcionais não hesitam. Esta áudio série imersiva disseca os protocolos de tomada de decisão de executivos de elite, gestão de equipes de alta performance e resiliência emocional sob risco corporativo.',
    category: 'Liderança e Gestão Estratégica',
    heroImage: '/src/assets/images/skills_hero_leadership_1792881116508.jpg',
    posterImage: '/src/assets/images/skills_hero_leadership_1792881116508.jpg',
    matchScore: 99,
    releaseYear: 2026,
    ratingBadge: '14+',
    audioQuality: 'Áudio Espacial 3D',
    mentor: 'David Chen',
    mentorRole: 'Ex-C-Level & Conselheiro Estratégico',
    tags: ['Liderança', 'Gestão de Crise', 'Estratégia', 'Tomada de Decisão'],
    featured: true,
    likes: 342,
    unlikes: 12,
    totalListens: 2840,
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'series-negotiation',
    title: 'Tactical Influence: Negociação sem Concessões',
    subtitle: 'Psicologia Comportamental nos Negócios',
    synopsis: 'Aprenda os segredos da persuasão e negociação de alto valor. Como calibrar perguntas, decodificar a linguagem silenciosa do cliente e fechar acordos de múltiplos dígitos sem comprometer suas margens.',
    category: 'Vendas e Negociação de Alto Impacto',
    heroImage: '/src/assets/images/skills_series_negotiation_1792881130913.jpg',
    posterImage: '/src/assets/images/skills_series_negotiation_1792881130913.jpg',
    matchScore: 97,
    releaseYear: 2026,
    ratingBadge: 'Livre',
    audioQuality: 'Dolby Master Sound',
    mentor: 'Arthur Valença',
    mentorRole: 'Estrategista de Negociações Internacionais',
    tags: ['Negociação', 'Vendas B2B', 'Persuasão', 'Influência'],
    featured: false,
    likes: 289,
    unlikes: 8,
    totalListens: 2150,
    createdAt: '2026-02-14T14:30:00Z',
  },
  {
    id: 'series-productivity',
    title: 'Deep Work: Hiperfoco na Era da Distração',
    subtitle: 'Alta Performance e Produtividade Cognitiva',
    synopsis: 'Treinamento em áudio imersivo projetado com frequências binaurais para ativar estados de fluxo profundo, eliminar a fadiga mental e construir rotinas de trabalho intelectual de altíssimo rendimento.',
    category: 'Desenvolvimento Pessoal & Produtividade',
    heroImage: '/src/assets/images/skills_series_productivity_1792881131321.jpg',
    posterImage: '/src/assets/images/skills_series_productivity_1792881131321.jpg',
    matchScore: 98,
    releaseYear: 2026,
    ratingBadge: 'Livre',
    audioQuality: 'Frequência Binaural 432Hz',
    mentor: 'Sofia Montenegro',
    mentorRole: 'Neurocientista Cognitiva & Autora',
    tags: ['Hiperfoco', 'Produtividade', 'Rotina Atômica', 'Fluxo Mental'],
    featured: false,
    likes: 412,
    unlikes: 15,
    totalListens: 3670,
    createdAt: '2026-03-01T09:15:00Z',
  },
  {
    id: 'series-communication',
    title: 'A Arte da Oratória Imersiva: Fale para Encantar',
    subtitle: 'Comunicação Magnética e Presença de Palco',
    synopsis: 'Como falar com convicção e magnetismo absoluto em reuniões, palcos e apresentações corporativas. Treine a modulação da voz, pausas dramáticas e estrutura de histórias memoráveis.',
    category: 'Comunicação e Oratória',
    heroImage: '/src/assets/images/skills_series_communication_1792881130893.jpg',
    posterImage: '/src/assets/images/skills_series_communication_1792881130893.jpg',
    matchScore: 96,
    releaseYear: 2026,
    ratingBadge: '10+',
    audioQuality: 'Áudio Imersivo HD',
    mentor: 'Ricardo Fonseca',
    mentorRole: 'Diretor Teatral & Coach Vocal de Executivos',
    tags: ['Oratória', 'Comunicação', 'Storytelling', 'Presença'],
    featured: false,
    likes: 230,
    unlikes: 6,
    totalListens: 1840,
    createdAt: '2026-03-20T16:45:00Z',
  },
];

export const INITIAL_EPISODES: AudioEpisode[] = [
  // High Stakes Leadership
  {
    id: 'ep-lead-0',
    seriesId: 'series-leadership',
    episodeNumber: 0,
    isSynopsis: true,
    season: 1,
    title: 'Sinopse: Introdução ao High Stakes Leadership',
    synopsis: 'Áudio de abertura oficial onde o mentor David Chen apresenta os objetivos da série, os detalhes de cada módulo e as diretrizes práticas para liderança em cenários de alta pressão.',
    durationMinutes: 6,
    durationFormatted: '6 min',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    imageUrl: '/src/assets/images/skills_hero_leadership_1792881116508.jpg',
    createdAt: '2026-01-09T10:00:00Z',
  },
  {
    id: 'ep-lead-1',
    seriesId: 'series-leadership',
    episodeNumber: 1,
    season: 1,
    title: 'O Dilema do Primeiro Minuto: Como Agir sob Choque',
    synopsis: 'Quando a crise explode, os primeiros 60 segundos definem o destino da operação. Técnicas de estabilização fisiológica e o modelo de decisão OODA loop sob fogo.',
    durationMinutes: 22,
    durationFormatted: '22 min',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    imageUrl: '/src/assets/images/skills_hero_leadership_1792881116508.jpg',
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'ep-lead-2',
    seriesId: 'series-leadership',
    episodeNumber: 2,
    season: 1,
    title: 'Comando Descentralizado e Alinhamento Tático',
    synopsis: 'Como liderar sem microgerenciar. Estabelecendo a "intenção do comandante" para que cada membro do time tome decisões autônomas e cirúrgicas.',
    durationMinutes: 19,
    durationFormatted: '19 min',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    imageUrl: '/src/assets/images/skills_hero_leadership_1792881116508.jpg',
    createdAt: '2026-01-12T10:00:00Z',
  },
  {
    id: 'ep-lead-3',
    seriesId: 'series-leadership',
    episodeNumber: 3,
    season: 1,
    title: 'Gestão de Egos e Conflitos em Conselhos',
    synopsis: 'Como conduzir conversas difíceis com acionistas e diretores de temperamento explosivo sem perder a autoridade nem romper parcerias vitais.',
    durationMinutes: 25,
    durationFormatted: '25 min',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    imageUrl: '/src/assets/images/skills_hero_leadership_1792881116508.jpg',
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'ep-lead-4',
    seriesId: 'series-leadership',
    episodeNumber: 4,
    season: 1,
    title: 'Construindo uma Cultura Antifrágil',
    synopsis: 'O fechamento da temporada: sistemas organizacionais que não apenas sobrevivem ao caos, mas se fortalecem com as pressões do mercado.',
    durationMinutes: 21,
    durationFormatted: '21 min',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    imageUrl: '/src/assets/images/skills_hero_leadership_1792881116508.jpg',
    createdAt: '2026-01-18T10:00:00Z',
  },

  // Tactical Influence
  {
    id: 'ep-neg-0',
    seriesId: 'series-negotiation',
    episodeNumber: 0,
    isSynopsis: true,
    season: 1,
    title: 'Sinopse: Introdução ao Tactical Influence',
    synopsis: 'Áudio de abertura com o mentor Arthur Valença detalhando as dinâmicas de negociação corporativa sem concessões destrutivas e o roteiro desta série.',
    durationMinutes: 5,
    durationFormatted: '5 min',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    imageUrl: '/src/assets/images/skills_series_negotiation_1792881130913.jpg',
    createdAt: '2026-02-13T14:30:00Z',
  },
  {
    id: 'ep-neg-1',
    seriesId: 'series-negotiation',
    episodeNumber: 1,
    season: 1,
    title: 'A Primeira Ancoragem: Controlando o Tabuleiro',
    synopsis: 'Como lançar os parâmetros da negociação antes da primeira proposta financeira, desarmando táticas predatórias da contraparte.',
    durationMinutes: 18,
    durationFormatted: '18 min',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    imageUrl: '/src/assets/images/skills_series_negotiation_1792881130913.jpg',
    createdAt: '2026-02-14T14:30:00Z',
  },
  {
    id: 'ep-neg-2',
    seriesId: 'series-negotiation',
    episodeNumber: 2,
    season: 1,
    title: 'Empatia Tática: Ouvindo o Não Dito',
    synopsis: 'O uso de espelhamento vocal, silêncio deliberado e rotulação emocional para desvendar as reais motivações ocultas do negociador.',
    durationMinutes: 24,
    durationFormatted: '24 min',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    imageUrl: '/src/assets/images/skills_series_negotiation_1792881130913.jpg',
    createdAt: '2026-02-16T14:30:00Z',
  },
  {
    id: 'ep-neg-3',
    seriesId: 'series-negotiation',
    episodeNumber: 3,
    season: 1,
    title: 'O Fechamento Suave: Transformando Não em Parceria',
    synopsis: 'Eliminando o atrito de última hora na assinatura do contrato e blindando o acordo contra arrependimento pós-negociação.',
    durationMinutes: 20,
    durationFormatted: '20 min',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    imageUrl: '/src/assets/images/skills_series_negotiation_1792881130913.jpg',
    createdAt: '2026-02-18T14:30:00Z',
  },

  // Deep Work
  {
    id: 'ep-prod-0',
    seriesId: 'series-productivity',
    episodeNumber: 0,
    isSynopsis: true,
    season: 1,
    title: 'Sinopse: Introdução ao Deep Work Executivo',
    synopsis: 'Áudio de abertura onde Sofia Montenegro explica a metodologia de foco sustentado na era da dispersão e o cronograma dos episódios de treinamento.',
    durationMinutes: 6,
    durationFormatted: '6 min',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
    imageUrl: '/src/assets/images/skills_series_productivity_1792881131321.jpg',
    createdAt: '2026-02-28T09:15:00Z',
  },
  {
    id: 'ep-prod-1',
    seriesId: 'series-productivity',
    episodeNumber: 1,
    season: 1,
    title: 'Desintoxicação Dopaminérgica: O Reset do Cérebro',
    synopsis: 'Como libertar seus circuitos de recompensa das notificações digitais compulsivas e restabelecer a clareza mental para projetos de alto impacto.',
    durationMinutes: 16,
    durationFormatted: '16 min',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    imageUrl: '/src/assets/images/skills_series_productivity_1792881131321.jpg',
    createdAt: '2026-03-01T09:15:00Z',
  },
  {
    id: 'ep-prod-2',
    seriesId: 'series-productivity',
    episodeNumber: 2,
    season: 1,
    title: 'Blocos de 90 Minutos: O Ritmo Ultraniano do Foco',
    synopsis: 'A ciência biológica dos ciclos de energia. Como sincronizar seu trabalho analítico mais complexo com seus picos fisiológicos de vigília.',
    durationMinutes: 21,
    durationFormatted: '21 min',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    imageUrl: '/src/assets/images/skills_series_productivity_1792881131321.jpg',
    createdAt: '2026-03-03T09:15:00Z',
  },
  {
    id: 'ep-prod-3',
    seriesId: 'series-productivity',
    episodeNumber: 3,
    season: 1,
    title: 'Construindo Sistemas Antidistração à Prova de Falhas',
    synopsis: 'Arquitetura de ambientes físicos e digitais para eliminar o esforço de força de vontade e tornar o foco o caminho de menor resistência.',
    durationMinutes: 19,
    durationFormatted: '19 min',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    imageUrl: '/src/assets/images/skills_series_productivity_1792881131321.jpg',
    createdAt: '2026-03-05T09:15:00Z',
  },

  // Oratória
  {
    id: 'ep-comm-0',
    seriesId: 'series-communication',
    episodeNumber: 0,
    isSynopsis: true,
    season: 1,
    title: 'Sinopse: Introdução à Oratória Imersiva',
    synopsis: 'Áudio de abertura onde Ricardo Fonseca apresenta as técnicas cênicas e vocais que transformarão suas apresentações corporativas em experiências memoráveis.',
    durationMinutes: 5,
    durationFormatted: '5 min',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    imageUrl: '/src/assets/images/skills_series_communication_1792881130893.jpg',
    createdAt: '2026-03-19T16:45:00Z',
  },
  {
    id: 'ep-comm-1',
    seriesId: 'series-communication',
    episodeNumber: 1,
    season: 1,
    title: 'A Frequência da Confiança: Respiração e Ressonância',
    synopsis: 'O aquecimento vocal do orador profissional. Como abaixar o tom de voz para soar assertivo e projetar credibilidade magnética desde o primeiro bom dia.',
    durationMinutes: 17,
    durationFormatted: '17 min',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    imageUrl: '/src/assets/images/skills_series_communication_1792881130893.jpg',
    createdAt: '2026-03-20T16:45:00Z',
  },
  {
    id: 'ep-comm-2',
    seriesId: 'series-communication',
    episodeNumber: 2,
    season: 1,
    title: 'O Gancho Inicial: Conquistando a Audiência em 15 Segundos',
    synopsis: 'Estruturas de abertura que capturam a atenção instantânea de bancas, clientes e plateias desatentas antes que peguem seus celulares.',
    durationMinutes: 23,
    durationFormatted: '23 min',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    imageUrl: '/src/assets/images/skills_series_communication_1792881130893.jpg',
    createdAt: '2026-03-22T16:45:00Z',
  },
  {
    id: 'ep-comm-3',
    seriesId: 'series-communication',
    episodeNumber: 3,
    season: 1,
    title: 'Histórias que Vendem: A Jornada do Herói Corporativo',
    synopsis: 'Como transformar dados frios e relatórios em narrativas envolventes que movem pessoas à ação e geram decisões de compra imediatas.',
    durationMinutes: 22,
    durationFormatted: '22 min',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    imageUrl: '/src/assets/images/skills_series_communication_1792881130893.jpg',
    createdAt: '2026-03-25T16:45:00Z',
  },
];

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'user-admin',
    name: 'skills.ON! Administrador',
    login: 'skills.on.admin',
    password: 'jmlustosa.skills.on!',
    email: 'admin@skillson.com',
    role: 'admin',
    avatar: '/assets/aistudio/skillsON__INSTAGRAM_6edfb550.jpg',
    myList: ['series-leadership', 'series-productivity'],
    reactions: {
      'series-leadership': 'like',
      'series-productivity': 'double_like',
    },
    listenProgress: {
      'ep-lead-1': { episodeId: 'ep-lead-1', currentTime: 450, duration: 1320, completed: false, lastPlayed: '2026-10-24T14:10:00Z' },
    },
    lastLoginAt: '2026-10-29T10:15:00Z',
    lastActiveAt: '2026-10-29T11:10:00Z',
    totalAccessCount: 14,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'user-student',
    name: 'José Marcelo (Aluno)',
    login: 'aluno',
    password: '123',
    email: 'aluno@skillson.com',
    role: 'user',
    avatar: '/assets/aistudio/skillsON__INSTAGRAM_6edfb550.jpg',
    myList: ['series-leadership', 'series-negotiation', 'series-communication'],
    reactions: {
      'series-leadership': 'like',
      'series-negotiation': 'like',
    },
    listenProgress: {
      'ep-lead-1': { episodeId: 'ep-lead-1', currentTime: 1320, duration: 1320, completed: true, lastPlayed: '2026-10-28T18:20:00Z' },
      'ep-lead-2': { episodeId: 'ep-lead-2', currentTime: 750, duration: 1140, completed: false, lastPlayed: '2026-10-29T12:40:00Z' },
    },
    lastLoginAt: '2026-10-29T12:30:00Z',
    lastActiveAt: '2026-10-29T13:05:00Z',
    totalAccessCount: 8,
    createdAt: '2026-01-02T00:00:00Z',
  },
];

export const INITIAL_ACCESS_LOGS: UserAccessLog[] = [
  {
    id: 'session-demo-1',
    userId: 'user-student',
    userName: 'José Marcelo (Aluno)',
    userLogin: 'aluno',
    userAvatar: '/assets/aistudio/skillsON__INSTAGRAM_6edfb550.jpg',
    loginAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    lastActiveAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    durationMinutes: 23,
    status: 'online',
    deviceInfo: 'Computador Windows • Chrome 122',
    episodesHeard: ['Sinopse: Introdução ao High Stakes Leadership', 'Ep. 01: O Dilema do Primeiro Minuto'],
  },
  {
    id: 'session-demo-2',
    userId: 'user-admin',
    userName: 'skills.ON! Administrador',
    userLogin: 'skills.on.admin',
    userAvatar: '/assets/aistudio/skillsON__INSTAGRAM_6edfb550.jpg',
    loginAt: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
    lastActiveAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    durationMinutes: 55,
    status: 'closed',
    deviceInfo: 'MacBook Pro • Safari 17',
    episodesHeard: ['Ep. 01: O Dilema do Primeiro Minuto', 'Ep. 02: Comando Descentralizado'],
  },
  {
    id: 'session-demo-3',
    userId: 'user-student',
    userName: 'José Marcelo (Aluno)',
    userLogin: 'aluno',
    userAvatar: '/assets/aistudio/skillsON__INSTAGRAM_6edfb550.jpg',
    loginAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    lastActiveAt: new Date(Date.now() - 23.2 * 3600 * 1000).toISOString(),
    durationMinutes: 48,
    status: 'closed',
    deviceInfo: 'Smartphone Android • Chrome Mobile',
    episodesHeard: ['Ep. 01: O Dilema do Primeiro Minuto'],
  },
];

export const INITIAL_SUGGESTIONS: SeriesSuggestion[] = [
  {
    id: 'sug-1',
    userId: 'user-student',
    userName: 'José Marcelo (Aluno)',
    userLogin: 'aluno',
    userAvatar: '/assets/aistudio/skillsON__INSTAGRAM_6edfb550.jpg',
    themeTitle: 'Comunicação Não-Violenta e Mediação de Conflitos',
    sourceType: 'youtube',
    sourceReference: 'https://www.youtube.com/watch?v=l7TONauJGfc (Palestra Dr. Marshall Rosenberg)',
    category: 'Comunicação e Relacionamento Interpessoal',
    notes: 'Acho fundamental termos uma áudio série prática para ensinar líderes a desarmar conversas difíceis com suas equipes e clientes.',
    status: 'in_analysis',
    adminNotes: 'Excelente tema. Podemos estruturar uma série de 6 episódios rápidos com simulações práticas de diálogos difíceis.',
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
  },
  {
    id: 'sug-2',
    userId: 'user-carla',
    userName: 'Carla Vasconcellos',
    userLogin: 'carla.mentoria',
    userAvatar: '/assets/aistudio/skillsON__INSTAGRAM_6edfb550.jpg',
    themeTitle: 'Mentalidade Antifrágil: Crescendo sob o Caos',
    sourceType: 'book',
    sourceReference: 'Livro: Antifrágil (Coisas que se Beneficiam com o Caos) - Nassim Nicholas Taleb',
    category: 'Liderança e Gestão Estratégica',
    notes: 'Abordar como transformar choques e crises corporativas em vantagens competitivas em vez de apenas sobreviver a elas.',
    status: 'approved',
    adminNotes: 'Aprovado! Iniciar roteirização para áudio série de 5 episódios.',
    createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'sug-3',
    userId: 'user-marcos',
    userName: 'Marcos Vinicius',
    userLogin: 'marcos.dev',
    userAvatar: '/assets/aistudio/skillsON__INSTAGRAM_6edfb550.jpg',
    themeTitle: 'Neurociência do Foco, Sono e Gestão de Dopamina',
    sourceType: 'podcast',
    sourceReference: 'Huberman Lab Podcast - Protocols for Focus, Stress and Performance',
    category: 'Desenvolvimento Pessoal & Produtividade',
    notes: 'Protocolos práticos de base científica para melhorar a capacidade de concentração diária de quem trabalha sob alta pressão.',
    status: 'pending',
    createdAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
  },
];

// Supabase SQL generation template for user to copy/paste in Supabase SQL editor
export const SUPABASE_SQL_SCHEMA = `-- skills.ON! - Supabase Database Schema
-- Execute no Supabase SQL Editor para criar as tabelas completas

-- 1. Tabela de Séries de Áudio
create table if not exists public.series (
  id text primary key,
  title text not null,
  subtitle text,
  synopsis text not null,
  category text not null,
  hero_image text not null,
  poster_image text not null,
  match_score integer default 98,
  release_year integer default 2026,
  rating_badge text default '14+',
  audio_quality text default 'Áudio HD Imersivo',
  mentor text not null,
  mentor_role text,
  tags text[] default '{}',
  featured boolean default false,
  likes integer default 0,
  unlikes integer default 0,
  total_listens integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Tabela de Episódios das Séries
create table if not exists public.episodes (
  id text primary key,
  series_id text references public.series(id) on delete cascade,
  episode_number integer not null,
  season integer default 1,
  title text not null,
  synopsis text not null,
  duration_minutes integer default 20,
  duration_formatted text,
  audio_url text not null,
  image_url text not null,
  is_synopsis boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Garantir adição da coluna is_synopsis caso a tabela já tenha sido criada:
alter table public.episodes add column if not exists is_synopsis boolean default false;

-- 3. Tabela de Reações (Likes / Unlikes)
create table if not exists public.user_reactions (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  series_id text references public.series(id) on delete cascade,
  reaction text check (reaction in ('like', 'double_like', 'dislike')),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, series_id)
);

-- 4. Tabela de Alunos e Usuários (Sincronização Multi-Dispositivo)
create table if not exists public.users (
  id text primary key,
  name text not null,
  login text unique not null,
  password text not null,
  email text,
  role text default 'user',
  avatar text default '/assets/aistudio/skillsON__INSTAGRAM_6edfb550.jpg',
  my_list text[] default '{}',
  reactions jsonb default '{}'::jsonb,
  listen_progress jsonb default '{}'::jsonb,
  last_login_at timestamp with time zone default timezone('utc'::text, now()),
  last_active_at timestamp with time zone default timezone('utc'::text, now()),
  total_access_count integer default 1,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Garantir colunas de auditoria de acesso se a tabela já existir:
alter table public.users add column if not exists last_login_at timestamp with time zone default timezone('utc'::text, now());
alter table public.users add column if not exists last_active_at timestamp with time zone default timezone('utc'::text, now());
alter table public.users add column if not exists total_access_count integer default 1;

-- 5. Tabela de Logs de Acesso e Auditoria de Sessões dos Usuários
create table if not exists public.access_logs (
  id text primary key,
  user_id text references public.users(id) on delete cascade,
  user_name text not null,
  user_login text not null,
  login_at timestamp with time zone default timezone('utc'::text, now()),
  last_active_at timestamp with time zone default timezone('utc'::text, now()),
  duration_minutes integer default 1,
  status text default 'online',
  device_info text,
  episodes_heard text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 6. Tabela de Sugestões de Novas Séries enviadas pelos Usuários
create table if not exists public.series_suggestions (
  id text primary key,
  user_id text,
  user_name text not null,
  user_login text not null,
  user_avatar text,
  theme_title text not null,
  source_type text default 'topic',
  source_reference text not null,
  category text,
  notes text,
  status text default 'pending',
  admin_notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 7. Permissões de Leitura e Gravação (RLS)
-- Liberar Leitura, Inserção, Atualização e Exclusão para sincronização direta do aplicativo:
alter table public.series disable row level security;
alter table public.episodes disable row level security;
alter table public.user_reactions disable row level security;
alter table public.users disable row level security;
alter table public.access_logs disable row level security;
alter table public.series_suggestions disable row level security;

-- Políticas de segurança permissivas (caso o RLS permaneça ativado):
drop policy if exists "Allow public read series" on public.series;
drop policy if exists "Allow all on series" on public.series;
create policy "Allow all on series" on public.series for all using (true) with check (true);

drop policy if exists "Allow public read episodes" on public.episodes;
drop policy if exists "Allow all on episodes" on public.episodes;
create policy "Allow all on episodes" on public.episodes for all using (true) with check (true);

drop policy if exists "Allow public read reactions" on public.user_reactions;
drop policy if exists "Allow authenticated insert reactions" on public.user_reactions;
drop policy if exists "Allow all on reactions" on public.user_reactions;
create policy "Allow all on reactions" on public.user_reactions for all using (true) with check (true);

drop policy if exists "Allow all on users" on public.users;
create policy "Allow all on users" on public.users for all using (true) with check (true);

drop policy if exists "Allow all on access_logs" on public.access_logs;
create policy "Allow all on access_logs" on public.access_logs for all using (true) with check (true);

drop policy if exists "Allow all on series_suggestions" on public.series_suggestions;
create policy "Allow all on series_suggestions" on public.series_suggestions for all using (true) with check (true);
`;

export const SUPABASE_RLS_FIX_SQL = `-- Correção Rápida de Permissão (RLS 42501), Tabela de Usuários, Sugestões, Auditoria e Sinopse
-- Cole e execute no SQL Editor do Supabase para destravar o Upload e Reconhecimento de Usuários:

create table if not exists public.users (
  id text primary key,
  name text not null,
  login text unique not null,
  password text not null,
  email text,
  role text default 'user',
  avatar text default '/assets/aistudio/skillsON__INSTAGRAM_6edfb550.jpg',
  my_list text[] default '{}',
  reactions jsonb default '{}'::jsonb,
  listen_progress jsonb default '{}'::jsonb,
  last_login_at timestamp with time zone default timezone('utc'::text, now()),
  last_active_at timestamp with time zone default timezone('utc'::text, now()),
  total_access_count integer default 1,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists public.access_logs (
  id text primary key,
  user_id text references public.users(id) on delete cascade,
  user_name text not null,
  user_login text not null,
  login_at timestamp with time zone default timezone('utc'::text, now()),
  last_active_at timestamp with time zone default timezone('utc'::text, now()),
  duration_minutes integer default 1,
  status text default 'online',
  device_info text,
  episodes_heard text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists public.series_suggestions (
  id text primary key,
  user_id text,
  user_name text not null,
  user_login text not null,
  user_avatar text,
  theme_title text not null,
  source_type text default 'topic',
  source_reference text not null,
  category text,
  notes text,
  status text default 'pending',
  admin_notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.series disable row level security;
alter table public.episodes disable row level security;
alter table public.user_reactions disable row level security;
alter table public.users disable row level security;
alter table public.access_logs disable row level security;
alter table public.series_suggestions disable row level security;

alter table public.episodes add column if not exists is_synopsis boolean default false;
alter table public.users add column if not exists last_login_at timestamp with time zone default timezone('utc'::text, now());
alter table public.users add column if not exists last_active_at timestamp with time zone default timezone('utc'::text, now());
alter table public.users add column if not exists total_access_count integer default 1;

drop policy if exists "Allow all on users" on public.users;
create policy "Allow all on users" on public.users for all using (true) with check (true);
drop policy if exists "Allow all on access_logs" on public.access_logs;
create policy "Allow all on access_logs" on public.access_logs for all using (true) with check (true);
drop policy if exists "Allow all on series_suggestions" on public.series_suggestions;
create policy "Allow all on series_suggestions" on public.series_suggestions for all using (true) with check (true);
`;
