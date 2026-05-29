import { useEffect, useState } from 'react';
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

export function useNearbyMusicians(coords: Coords | null, currentUserId?: string) {
  const [musicians, setMusicians] = useState<Musician[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!coords) return;

    setLoading(true);
    supabase
      .rpc('nearby_musicians', {
        lat: coords.latitude,
        lng: coords.longitude,
        radius_meters: 999999999,
      })
      .then(({ data }) => {
        const others = (data ?? []).filter((m: Musician) => m.id !== currentUserId);
        setMusicians(others);
        setLoading(false);
      });
  }, [coords, currentUserId]);

  return { musicians, loading };
}
