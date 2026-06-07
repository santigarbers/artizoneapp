import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import type { Coords } from './useLocation';

export type SwipeMusician = {
  id: string;
  username: string;
  bio: string | null;
  genres: string[] | null;
  instruments: string[] | null;
  avatar_url: string | null;
  looking_for: string | null;
};

export type SwipeFilters = {
  genres: string[];
  instruments: string[];
  maxKm: number | null;
};

export const DEFAULT_FILTERS: SwipeFilters = { genres: [], instruments: [], maxKm: null };

export function useSwipeMusicians(currentUserId?: string) {
  const [musicians, setMusicians] = useState<SwipeMusician[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (currentUserId) load(DEFAULT_FILTERS, null);
  }, [currentUserId]);

  async function load(filters: SwipeFilters, coords: Coords | null) {
    if (!currentUserId) return;
    setLoading(true);

    const { data: swipedData } = await supabase
      .from('swipes')
      .select('target_id')
      .eq('user_id', currentUserId);

    const swipedIds = (swipedData ?? []).map((s: { target_id: string }) => s.target_id);

    // When distance filter is active, get eligible IDs from PostGIS RPC first
    let eligibleIds: string[] | null = null;
    if (filters.maxKm !== null && coords) {
      const { data: nearbyData } = await supabase.rpc('nearby_musicians', {
        lat: coords.latitude,
        lng: coords.longitude,
        radius_meters: filters.maxKm * 1000,
      });
      eligibleIds = (nearbyData ?? [])
        .filter((m: { id: string }) => m.id !== currentUserId && !swipedIds.includes(m.id))
        .map((m: { id: string }) => m.id);

      if (eligibleIds.length === 0) {
        setMusicians([]);
        setLoading(false);
        setLoaded(true);
        return;
      }
    }

    let query = supabase
      .from('profiles')
      .select('id, username, bio, genres, instruments, avatar_url, looking_for')
      .not('username', 'is', null);

    if (eligibleIds !== null) {
      query = query.in('id', eligibleIds);
    } else {
      query = query.neq('id', currentUserId);
      if (swipedIds.length > 0) {
        query = query.not('id', 'in', `(${swipedIds.join(',')})`);
      }
    }

    if (filters.genres.length > 0) {
      query = query.overlaps('genres', filters.genres);
    }
    if (filters.instruments.length > 0) {
      query = query.overlaps('instruments', filters.instruments);
    }

    const { data } = await query.limit(50);
    setMusicians(data ?? []);
    setLoading(false);
    setLoaded(true);
  }

  async function recordSwipe(targetId: string, direction: 'left' | 'right') {
    if (!currentUserId) return;
    await supabase.from('swipes').insert({ user_id: currentUserId, target_id: targetId, direction });
    setMusicians(prev => prev.filter(m => m.id !== targetId));
  }

  return { musicians, loading, loaded, load, recordSwipe };
}
