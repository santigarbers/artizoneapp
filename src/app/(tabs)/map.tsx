import { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { MusicianCard } from '@/components/features/MusicianCard';
import { MusicianMarker } from '@/components/features/MusicianMarker';
import { useLocation } from '@/lib/hooks/useLocation';
import { Musician, useNearbyMusicians } from '@/lib/hooks/useNearbyMusicians';
import { useSession } from '@/lib/hooks/useSession';

export default function MapScreen() {
  const { session } = useSession();
  const { coords, error, loading } = useLocation(session?.user.id);
  const { musicians } = useNearbyMusicians(coords, session?.user.id);
  const [selectedMusician, setSelectedMusician] = useState<Musician | null>(null);
  const mapRef = useRef<MapView>(null);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#fff" />
        <Text style={styles.text}>Obteniendo ubicación...</Text>
      </View>
    );
  }

  if (error || !coords) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error ?? 'No se pudo obtener la ubicación'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
        showsMyLocationButton
        onPress={() => setSelectedMusician(null)}
        onMarkerPress={(e) => {
          const id = e.nativeEvent.id;
          const musician = musicians.find(m => m.id === id);
          if (musician) {
            setSelectedMusician(musician);
            mapRef.current?.animateToRegion({
              latitude: musician.latitude,
              longitude: musician.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }, 400);
          }
        }}
      >
        {musicians.map(musician => (
          <Marker
            key={musician.id}
            identifier={musician.id}
            coordinate={{
              latitude: musician.latitude,
              longitude: musician.longitude,
            }}
            tracksViewChanges={false}
          >
            <MusicianMarker musician={musician} />
          </Marker>
        ))}
      </MapView>

      <MusicianCard
        musician={selectedMusician}
        onClose={() => setSelectedMusician(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  centered: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  text: { color: '#888', fontSize: 14 },
  error: { color: '#ff4444', fontSize: 14, textAlign: 'center', paddingHorizontal: 24 },
});
