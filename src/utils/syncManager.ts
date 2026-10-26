import { AudioSeries, AudioEpisode, UserProfile } from '../types';

export interface CatalogPayload {
  version: string;
  exportedAt: string;
  series: AudioSeries[];
  episodes: AudioEpisode[];
  users?: UserProfile[];
}

/**
 * Encodes the catalog into a compressed Base64 string for URL hash transfer.
 */
export function encodeCatalogForUrl(series: AudioSeries[], episodes: AudioEpisode[], users?: UserProfile[]): string {
  const payload: CatalogPayload = {
    version: '2.0',
    exportedAt: new Date().toISOString(),
    series,
    episodes,
    users,
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
 * Push local series and episodes to Supabase tables.
 */
export async function pushCatalogToSupabase(
  supabaseUrl: string,
  supabaseKey: string,
  series: AudioSeries[],
  episodes: AudioEpisode[]
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
      throw new Error(`Falha ao sincronizar episódios: ${err}`);
    }

    return { ok: true, message: `Sincronizado com sucesso! ${series.length} séries e ${episodes.length} episódios enviados para o Supabase.` };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Erro ao sincronizar com Supabase' };
  }
}

/**
 * Fetch series and episodes from Supabase tables.
 */
export async function pullCatalogFromSupabase(
  supabaseUrl: string,
  supabaseKey: string
): Promise<{ ok: boolean; message: string; series?: AudioSeries[]; episodes?: AudioEpisode[] }> {
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

    return {
      ok: true,
      message: `${mappedSeries.length} séries e ${mappedEpisodes.length} episódios carregados do Supabase!`,
      series: mappedSeries,
      episodes: mappedEpisodes,
    };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Erro ao baixar dados do Supabase' };
  }
}
