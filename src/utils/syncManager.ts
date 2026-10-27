import { AudioSeries, AudioEpisode, UserProfile } from '../types';

export interface CatalogPayload {
  version: string;
  exportedAt: string;
  series: AudioSeries[];
  episodes: AudioEpisode[];
  users?: UserProfile[];
  supabaseConfig?: {
    supabaseUrl: string;
    supabaseAnonKey: string;
    useLiveSupabase: boolean;
  };
}

/**
 * Encodes the catalog into a compressed Base64 string for URL hash transfer.
 */
export function encodeCatalogForUrl(
  series: AudioSeries[],
  episodes: AudioEpisode[],
  users?: UserProfile[],
  supabaseConfig?: { supabaseUrl: string; supabaseAnonKey: string; useLiveSupabase: boolean }
): string {
  const payload: CatalogPayload = {
    version: '2.0',
    exportedAt: new Date().toISOString(),
    series,
    episodes,
    users,
    supabaseConfig,
  };
  const json = JSON.stringify(payload);
  // Encode utf-8 safely in base64
  return btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p1) => {
    return String.fromCharCode(parseInt(p1, 16));
  }));
}

/**
 * Decodes a Base64 string from URL back to catalog object.
 */
export function decodeCatalogFromUrl(encoded: string): CatalogPayload | null {
  try {
    const raw = atob(encoded);
    const decodedJson = decodeURIComponent(
      Array.prototype.map.call(raw, (c: string) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join('')
    );
    const data = JSON.parse(decodedJson);
    if (data && Array.isArray(data.series) && Array.isArray(data.episodes)) {
      return data;
    }
    return null;
  } catch (e) {
    console.warn('Failed to decode catalog from URL', e);
    return null;
  }
}

/**
 * Trigger browser download of catalog as a JSON file.
 */
export function downloadCatalogFile(series: AudioSeries[], episodes: AudioEpisode[], users?: UserProfile[], filename = 'skills_on_catalog.json') {
  const payload: CatalogPayload = {
    version: '2.0',
    exportedAt: new Date().toISOString(),
    series,
    episodes,
    users,
  };
  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates TS code for initialData.ts so the user can easily update their default codebase.
 */
export function generateInitialDataTsCode(series: AudioSeries[], episodes: AudioEpisode[]): string {
  return `// Gerado automaticamente pelo skills.ON! Admin
import { AudioSeries, AudioEpisode, UserProfile } from '../types';

export const INITIAL_SERIES: AudioSeries[] = ${JSON.stringify(series, null, 2)};

export const INITIAL_EPISODES: AudioEpisode[] = ${JSON.stringify(episodes, null, 2)};
`;
}

/**
 * Supabase REST API Direct Integration (No external heavy package required)
 */
export async function testSupabaseConnection(supabaseUrl: string, supabaseKey: string): Promise<{ ok: boolean; message: string }> {
  try {
    const cleanUrl = supabaseUrl.replace(/\/+$/, '');
    const res = await fetch(`${cleanUrl}/rest/v1/series?limit=1`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });

    if (res.ok) {
      return { ok: true, message: 'Conexão com o Supabase estabelecida com sucesso!' };
    } else {
      const errText = await res.text();
      return { ok: false, message: `Erro ${res.status}: ${errText || 'Falha de autenticação ou tabela series não existe'}` };
    }
  } catch (e: any) {
    return { ok: false, message: `Erro ao conectar: ${e?.message || 'Verifique sua URL do Supabase'}` };
  }
}

/**
 * Push local series, episodes, and users to Supabase tables.
 */
export async function pushCatalogToSupabase(
  supabaseUrl: string,
  supabaseKey: string,
  series: AudioSeries[],
  episodes: AudioEpisode[],
  users?: UserProfile[]
): Promise<{ ok: boolean; message: string }> {
  try {
    const cleanUrl = supabaseUrl.replace(/\/+$/, '');

    // 1. Format and Upsert Series
    const seriesRows = series.map(s => ({
      id: s.id,
      title: s.title,
      subtitle: s.subtitle || '',
      synopsis: s.synopsis,
      category: s.category,
      hero_image: s.heroImage,
      poster_image: s.posterImage,
      match_score: s.matchScore,
      release_year: s.releaseYear,
      rating_badge: s.ratingBadge,
      audio_quality: s.audioQuality,
      mentor: s.mentor,
      mentor_role: s.mentorRole,
      tags: s.tags,
      featured: Boolean(s.featured),
      likes: s.likes || 0,
      unlikes: s.unlikes || 0,
      total_listens: s.totalListens || 0,
    }));

    const resSeries = await fetch(`${cleanUrl}/rest/v1/series`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify(seriesRows),
    });

    if (!resSeries.ok) {
      const err = await resSeries.text();
      if (err.includes('42501') || err.includes('row-level security')) {
        throw new Error('Bloqueio de Permissão (RLS 42501) no Supabase: O banco bloqueou a gravação de séries. Execute o script de "Correção RLS" no SQL Editor do Supabase (disponível no Painel Admin) e tente novamente.');
      }
      throw new Error(`Falha ao sincronizar séries: ${err}`);
    }

    // 2. Format and Upsert Episodes
    const episodesRows = episodes.map(e => ({
      id: e.id,
      series_id: e.seriesId,
      episode_number: e.episodeNumber,
      season: e.season || 1,
      title: e.title,
      synopsis: e.synopsis || '',
      duration_minutes: e.durationMinutes || 20,
      duration_formatted: e.durationFormatted || '20 min',
      audio_url: e.audioUrl,
      image_url: e.imageUrl || '',
      is_synopsis: Boolean(e.isSynopsis || e.episodeNumber === 0),
    }));

    const resEpisodes = await fetch(`${cleanUrl}/rest/v1/episodes`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify(episodesRows),
    });

    if (!resEpisodes.ok) {
      const err = await resEpisodes.text();
      if (err.includes('42501') || err.includes('row-level security')) {
        throw new Error('Bloqueio de Permissão (RLS 42501) no Supabase: O banco bloqueou a gravação de episódios. Execute o script de "Correção RLS" no SQL Editor do Supabase e tente novamente.');
      }
      if (err.includes('is_synopsis') || err.includes('column') || err.includes('does not exist')) {
        throw new Error('Coluna ausente no Supabase: A tabela episodes precisa da coluna "is_synopsis". Execute o script SQL atualizado no SQL Editor do Supabase.');
      }
      throw new Error(`Falha ao sincronizar episódios: ${err}`);
    }

    // 3. Format and Upsert Users (if provided)
    let usersCount = 0;
    if (users && users.length > 0) {
      const userRows = users.map(u => ({
        id: u.id,
        name: u.name,
        login: u.login.trim().toLowerCase(),
        password: u.password,
        email: u.email || `${u.login}@skillson.com`,
        role: u.role || 'user',
        avatar: u.avatar || '/assets/aistudio/skillsON__INSTAGRAM_6edfb550.jpg',
        my_list: u.myList || [],
        reactions: u.reactions || {},
        listen_progress: u.listenProgress || {},
        created_at: u.createdAt || new Date().toISOString(),
      }));

      const resUsers = await fetch(`${cleanUrl}/rest/v1/users`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify(userRows),
      });

      if (resUsers.ok) {
        usersCount = users.length;
      } else {
        console.warn('Notice: Users table might not exist yet in Supabase or had an issue. Execute updated SQL schema if needed.');
      }
    }

    return {
      ok: true,
      message: `Sincronizado com sucesso! ${series.length} séries, ${episodes.length} episódios${usersCount > 0 ? ` e ${usersCount} usuários` : ''} enviados para o Supabase.`
    };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Erro ao sincronizar com Supabase' };
  }
}

/**
 * Fetch series, episodes, and users from Supabase tables.
 */
export async function pullCatalogFromSupabase(
  supabaseUrl: string,
  supabaseKey: string
): Promise<{ ok: boolean; message: string; series?: AudioSeries[]; episodes?: AudioEpisode[]; users?: UserProfile[] }> {
  try {
    const cleanUrl = supabaseUrl.replace(/\/+$/, '');

    // Fetch Series
    const resSeries = await fetch(`${cleanUrl}/rest/v1/series?select=*&order=created_at.desc`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });

    if (!resSeries.ok) {
      throw new Error('Falha ao buscar séries do Supabase');
    }

    const rawSeries: any[] = await resSeries.json();
    const mappedSeries: AudioSeries[] = rawSeries.map(s => ({
      id: s.id,
      title: s.title,
      subtitle: s.subtitle || '',
      synopsis: s.synopsis,
      category: s.category,
      heroImage: s.hero_image,
      posterImage: s.poster_image,
      matchScore: s.match_score || 98,
      releaseYear: s.release_year || 2026,
      ratingBadge: s.rating_badge || '14+',
      audioQuality: s.audio_quality || 'Áudio HD Imersivo',
      mentor: s.mentor,
      mentorRole: s.mentor_role || '',
      tags: Array.isArray(s.tags) ? s.tags : [],
      featured: Boolean(s.featured),
      likes: s.likes || 0,
      unlikes: s.unlikes || 0,
      totalListens: s.total_listens || 0,
      createdAt: s.created_at || new Date().toISOString(),
    }));

    // Fetch Episodes
    const resEpisodes = await fetch(`${cleanUrl}/rest/v1/episodes?select=*&order=episode_number.asc`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });

    if (!resEpisodes.ok) {
      throw new Error('Falha ao buscar episódios do Supabase');
    }

    const rawEpisodes: any[] = await resEpisodes.json();
    const mappedEpisodes: AudioEpisode[] = rawEpisodes.map(e => ({
      id: e.id,
      seriesId: e.series_id,
      episodeNumber: Number(e.episode_number),
      isSynopsis: Boolean(e.is_synopsis || Number(e.episode_number) === 0),
      season: Number(e.season) || 1,
      title: e.title,
      synopsis: e.synopsis || '',
      durationMinutes: Number(e.duration_minutes) || 20,
      durationFormatted: e.duration_formatted || `${e.duration_minutes || 20} min`,
      audioUrl: e.audio_url,
      imageUrl: e.image_url || '',
      createdAt: e.created_at || new Date().toISOString(),
    }));

    // Fetch Users (if table exists)
    let mappedUsers: UserProfile[] | undefined = undefined;
    try {
      const resUsers = await fetch(`${cleanUrl}/rest/v1/users?select=*&order=created_at.asc`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      });
      if (resUsers.ok) {
        const rawUsers: any[] = await resUsers.json();
        mappedUsers = rawUsers.map(r => ({
          id: r.id,
          name: r.name,
          login: r.login,
          password: r.password,
          email: r.email || `${r.login}@skillson.com`,
          role: r.role as 'admin' | 'user',
          avatar: r.avatar || '/assets/aistudio/skillsON__INSTAGRAM_6edfb550.jpg',
          myList: Array.isArray(r.my_list) ? r.my_list : [],
          reactions: (r.reactions && typeof r.reactions === 'object') ? r.reactions : {},
          listenProgress: (r.listen_progress && typeof r.listen_progress === 'object') ? r.listen_progress : {},
          createdAt: r.created_at || new Date().toISOString(),
        }));
      }
    } catch {
      // Table might not exist yet, ignore
    }

    return {
      ok: true,
      message: `${mappedSeries.length} séries, ${mappedEpisodes.length} episódios${mappedUsers ? ` e ${mappedUsers.length} usuários` : ''} carregados do Supabase!`,
      series: mappedSeries,
      episodes: mappedEpisodes,
      users: mappedUsers,
    };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Erro ao baixar dados do Supabase' };
  }
}

/**
 * Upsert a single episode to Supabase in real time
 */
export async function pushSingleEpisodeToSupabase(
  supabaseUrl: string,
  supabaseKey: string,
  e: AudioEpisode
): Promise<boolean> {
  try {
    const cleanUrl = supabaseUrl.replace(/\/+$/, '');
    const row = {
      id: e.id,
      series_id: e.seriesId,
      episode_number: e.episodeNumber,
      season: e.season || 1,
      title: e.title,
      synopsis: e.synopsis || '',
      duration_minutes: e.durationMinutes || 20,
      duration_formatted: e.durationFormatted || '20 min',
      audio_url: e.audioUrl,
      image_url: e.imageUrl || '',
      is_synopsis: Boolean(e.isSynopsis || e.episodeNumber === 0),
    };
    const res = await fetch(`${cleanUrl}/rest/v1/episodes`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify(row),
    });
    return res.ok;
  } catch (err) {
    console.warn('Real-time episode push error:', err);
    return false;
  }
}

/**
 * Delete a single episode from Supabase in real time
 */
export async function deleteEpisodeFromSupabase(
  supabaseUrl: string,
  supabaseKey: string,
  episodeId: string
): Promise<boolean> {
  try {
    const cleanUrl = supabaseUrl.replace(/\/+$/, '');
    const res = await fetch(`${cleanUrl}/rest/v1/episodes?id=eq.${encodeURIComponent(episodeId.trim())}`, {
      method: 'DELETE',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });
    return res.ok;
  } catch (err) {
    console.warn('Real-time episode delete error:', err);
    return false;
  }
}

/**
 * Upsert a single series to Supabase in real time
 */
export async function pushSingleSeriesToSupabase(
  supabaseUrl: string,
  supabaseKey: string,
  s: AudioSeries
): Promise<boolean> {
  try {
    const cleanUrl = supabaseUrl.replace(/\/+$/, '');
    const row = {
      id: s.id,
      title: s.title,
      subtitle: s.subtitle || '',
      synopsis: s.synopsis,
      category: s.category,
      hero_image: s.heroImage,
      poster_image: s.posterImage,
      match_score: s.matchScore,
      release_year: s.releaseYear,
      rating_badge: s.ratingBadge,
      audio_quality: s.audioQuality,
      mentor: s.mentor,
      mentor_role: s.mentorRole,
      tags: s.tags,
      featured: Boolean(s.featured),
      likes: s.likes || 0,
      unlikes: s.unlikes || 0,
      total_listens: s.totalListens || 0,
    };
    const res = await fetch(`${cleanUrl}/rest/v1/series`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify(row),
    });
    return res.ok;
  } catch (err) {
    console.warn('Real-time series push error:', err);
    return false;
  }
}

/**
 * Delete a single series from Supabase in real time
 */
export async function deleteSeriesFromSupabase(
  supabaseUrl: string,
  supabaseKey: string,
  seriesId: string
): Promise<boolean> {
  try {
    const cleanUrl = supabaseUrl.replace(/\/+$/, '');
    const res = await fetch(`${cleanUrl}/rest/v1/series?id=eq.${encodeURIComponent(seriesId.trim())}`, {
      method: 'DELETE',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });
    return res.ok;
  } catch (err) {
    console.warn('Real-time series delete error:', err);
    return false;
  }
}

/**
 * Upsert a single user to Supabase in real time
 */
export async function pushSingleUserToSupabase(
  supabaseUrl: string,
  supabaseKey: string,
  u: UserProfile
): Promise<boolean> {
  try {
    const cleanUrl = supabaseUrl.replace(/\/+$/, '');
    const row = {
      id: u.id,
      name: u.name,
      login: u.login.trim().toLowerCase(),
      password: u.password,
      email: u.email || `${u.login}@skillson.com`,
      role: u.role || 'user',
      avatar: u.avatar || '/assets/aistudio/skillsON__INSTAGRAM_6edfb550.jpg',
      my_list: u.myList || [],
      reactions: u.reactions || {},
      listen_progress: u.listenProgress || {},
      created_at: u.createdAt || new Date().toISOString(),
    };
    const res = await fetch(`${cleanUrl}/rest/v1/users`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify(row),
    });
    return res.ok;
  } catch (err) {
    console.warn('Real-time user push error:', err);
    return false;
  }
}

/**
 * Delete a single user from Supabase in real time
 */
export async function deleteUserFromSupabase(
  supabaseUrl: string,
  supabaseKey: string,
  userId: string
): Promise<boolean> {
  try {
    const cleanUrl = supabaseUrl.replace(/\/+$/, '');
    const res = await fetch(`${cleanUrl}/rest/v1/users?id=eq.${encodeURIComponent(userId.trim())}`, {
      method: 'DELETE',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });
    return res.ok;
  } catch (err) {
    console.warn('Real-time user delete error:', err);
    return false;
  }
}

/**
 * Fetch all users from Supabase
 */
export async function pullUsersFromSupabase(
  supabaseUrl: string,
  supabaseKey: string
): Promise<{ ok: boolean; users?: UserProfile[]; message: string }> {
  try {
    const cleanUrl = supabaseUrl.replace(/\/+$/, '');
    const res = await fetch(`${cleanUrl}/rest/v1/users?select=*&order=created_at.asc`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });

    if (!res.ok) {
      throw new Error('Falha ao buscar usuários do Supabase');
    }

    const rows: any[] = await res.json();
    const mapped: UserProfile[] = rows.map(r => ({
      id: r.id,
      name: r.name,
      login: r.login,
      password: r.password,
      email: r.email || `${r.login}@skillson.com`,
      role: r.role as 'admin' | 'user',
      avatar: r.avatar || '/assets/aistudio/skillsON__INSTAGRAM_6edfb550.jpg',
      myList: Array.isArray(r.my_list) ? r.my_list : [],
      reactions: (r.reactions && typeof r.reactions === 'object') ? r.reactions : {},
      listenProgress: (r.listen_progress && typeof r.listen_progress === 'object') ? r.listen_progress : {},
      createdAt: r.created_at || new Date().toISOString(),
    }));

    return { ok: true, users: mapped, message: `${mapped.length} usuários carregados do Supabase.` };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Erro ao carregar usuários' };
  }
}

/**
 * Push all users to Supabase in bulk
 */
export async function pushAllUsersToSupabase(
  supabaseUrl: string,
  supabaseKey: string,
  users: UserProfile[]
): Promise<{ ok: boolean; message: string }> {
  try {
    const cleanUrl = supabaseUrl.replace(/\/+$/, '');
    const rows = users.map(u => ({
      id: u.id,
      name: u.name,
      login: u.login.trim().toLowerCase(),
      password: u.password,
      email: u.email || `${u.login}@skillson.com`,
      role: u.role || 'user',
      avatar: u.avatar || '/assets/aistudio/skillsON__INSTAGRAM_6edfb550.jpg',
      my_list: u.myList || [],
      reactions: u.reactions || {},
      listen_progress: u.listenProgress || {},
      created_at: u.createdAt || new Date().toISOString(),
    }));

    const res = await fetch(`${cleanUrl}/rest/v1/users`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify(rows),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Falha ao sincronizar usuários: ${err}`);
    }

    return { ok: true, message: `${users.length} usuários sincronizados com o Supabase com sucesso!` };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Erro ao enviar usuários para o Supabase' };
  }
}

/**
 * Fetch a single user by login directly from Supabase (for real-time multi-device login)
 */
export async function fetchUserByLoginFromSupabase(
  supabaseUrl: string,
  supabaseKey: string,
  login: string
): Promise<UserProfile | null> {
  try {
    const cleanUrl = supabaseUrl.replace(/\/+$/, '');
    const cleanLogin = login.trim().toLowerCase();
    const res = await fetch(`${cleanUrl}/rest/v1/users?login=eq.${encodeURIComponent(cleanLogin)}&limit=1`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });

    if (!res.ok) return null;
    const rows: any[] = await res.json();
    if (!rows || rows.length === 0) return null;

    const r = rows[0];
    return {
      id: r.id,
      name: r.name,
      login: r.login,
      password: r.password,
      email: r.email || `${r.login}@skillson.com`,
      role: r.role as 'admin' | 'user',
      avatar: r.avatar || '/assets/aistudio/skillsON__INSTAGRAM_6edfb550.jpg',
      myList: Array.isArray(r.my_list) ? r.my_list : [],
      reactions: (r.reactions && typeof r.reactions === 'object') ? r.reactions : {},
      listenProgress: (r.listen_progress && typeof r.listen_progress === 'object') ? r.listen_progress : {},
      createdAt: r.created_at || new Date().toISOString(),
    };
  } catch (err) {
    console.warn('Fetch user by login error:', err);
    return null;
  }
}
