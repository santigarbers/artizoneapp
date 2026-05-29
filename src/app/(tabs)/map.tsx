import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { MusicianMarker } from '@/components/features/MusicianMarker';
import { useLocation } from '@/lib/hooks/useLocation';
import { useNearbyMusicians } from '@/lib/hooks/useNearbyMusicians';
import { useSession } from '@/lib/hooks/useSession';

export default function MapScreen() {
  const { session } = useSession();
  const { coords, error, loading } = useLocation(session?.user.id);
  const { musicians } = useNearbyMusicians(coords, session?.user.id);

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
    <MapView
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
    >
      {musicians.map(musician => (
        <Marker
          key={musician.id}
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
  );
}

const styles = StyleSheet.create({
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
