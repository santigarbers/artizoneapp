import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabase';
import { Coords } from './useLocation';

export type Musician = {
  id: string;
  username: string;
  bio: string | null;
  genres: string[] | null;
  instruments: string[] | null;
  avatar_url: string | null;
  distance_meters: number;
  latitude: number;
  longitude: number;
};

export type DiscoverFilters = {
  genres: string[];
  instruments: string[];
  maxKm: number | null;
};

export const DEFAULT_FILTERS: DiscoverFilters = { genres: [], instruments: [], maxKm: null };

export function useNearbyMusicians(
  coords: Coords | null,
  currentUserId?: string,
  filters: DiscoverFilters = DEFAULT_FILTERS,
) {
  const [all, setAll] = useState<Musician[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fetchMusicians = useCallback(async () => {
    if (!coords) return;
    setLoading(true);
    const { data } = await supabase.rpc('nearby_musicians', {
      lat: coords.latitude,
      lng: coords.longitude,
      radius_meters: 999999999,
    });
    const others = (data ?? []).filter((m: Musician) => m.id !== currentUserId);
    setAll(others);
    setLoading(false);
    setLoaded(true);
  }, [coords, currentUserId]);

  useEffect(() => {
    fetchMusicians();
  }, [fetchMusicians]);

  const musicians = useMemo(() => {
    return all
      .filter((m) => {
        if (filters.genres.length > 0 && !(m.genres ?? []).some((g) => filters.genres.includes(g))) {
          return false;
        }
        if (
          filters.instruments.length > 0 &&
          !(m.instruments ?? []).some((i) => filters.instruments.includes(i))
        ) {
          return false;
        }
        if (filters.maxKm !== null && m.distance_meters > filters.maxKm * 1000) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.distance_meters - b.distance_meters);
  }, [all, filters]);

  return { musicians, loading, loaded, refetch: fetchMusicians };
}
