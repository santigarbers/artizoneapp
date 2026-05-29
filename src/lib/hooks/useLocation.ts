import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { supabase } from '../supabase';

export type Coords = {
  latitude: number;
  longitude: number;
};

export function useLocation(userId?: string) {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permiso de ubicación denegado');
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      setCoords({ latitude, longitude });

      if (userId) {
        await supabase
          .from('profiles')
          .update({ location: `POINT(${longitude} ${latitude})` })
          .eq('id', userId);
      }

      setLoading(false);
    })();
  }, [userId]);

  return { coords, error, loading };
}
