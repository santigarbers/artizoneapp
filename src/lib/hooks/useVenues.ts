import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

export type VenueType = 'sala_ensayo' | 'local_instrumentos' | 'bar_musica' | 'estudio_grabacion' | 'espacio_cultural';

export type Venue = {
  id: string;
  name: string;
  type: VenueType;
  address: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  website: string | null;
  hours: string | null;
};

export const VENUE_TYPES: Record<VenueType, { label: string; emoji: string; color: string }> = {
  sala_ensayo:       { label: 'Sala de ensayo',        emoji: '🎸', color: '#4ade80' },
  local_instrumentos:{ label: 'Local de instrumentos', emoji: '🎵', color: '#60a5fa' },
  bar_musica:        { label: 'Bar con música',         emoji: '🍺', color: '#f97316' },
  estudio_grabacion: { label: 'Estudio de grabación',  emoji: '🎙', color: '#a78bfa' },
  espacio_cultural:  { label: 'Espacio cultural',       emoji: '🎭', color: '#fb923c' },
};

export function useVenues(filterType?: VenueType | null) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let query = supabase.from('venues').select('*');
    if (filterType) query = query.eq('type', filterType);
    query.then(({ data }) => {
      setVenues(data ?? []);
      setLoading(false);
    });
  }, [filterType]);

  return { venues, loading };
}
