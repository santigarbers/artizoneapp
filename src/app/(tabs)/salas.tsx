import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VenueCard } from '@/components/features/VenueCard';
import { VenueMarker } from '@/components/features/VenueMarker';
import { useLocation } from '@/lib/hooks/useLocation';
import { useSession } from '@/lib/hooks/useSession';
import { VENUE_TYPES, useVenues, type Venue, type VenueType } from '@/lib/hooks/useVenues';

const FILTER_TYPES = Object.entries(VENUE_TYPES) as [VenueType, (typeof VENUE_TYPES)[VenueType]][];

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function SalasScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const { session } = useSession();
  const { coords } = useLocation(session?.user.id);

  const [activeFilter, setActiveFilter] = useState<VenueType | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);

  const { venues } = useVenues(activeFilter);

  function handleMarkerPress(venue: Venue) {
    setSelectedVenue(venue);
    mapRef.current?.animateToRegion(
      { latitude: venue.latitude - 0.003, longitude: venue.longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 },
      400,
    );
  }

  function handleFilterPress(type: VenueType | null) {
    setActiveFilter(prev => (prev === type ? null : type));
    setSelectedVenue(null);
  }

  const distanceKm =
    selectedVenue && coords
      ? haversineKm(coords.latitude, coords.longitude, selectedVenue.latitude, selectedVenue.longitude)
      : null;

  const region = coords
    ? { latitude: coords.latitude, longitude: coords.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 }
    : { latitude: -34.6037, longitude: -58.3816, latitudeDelta: 0.05, longitudeDelta: 0.05 };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        userInterfaceStyle="dark"
        showsUserLocation
        showsMyLocationButton={false}
      >
        {venues.map(venue => (
          <Marker
            key={venue.id}
            coordinate={{ latitude: venue.latitude, longitude: venue.longitude }}
            onPress={() => handleMarkerPress(venue)}
            tracksViewChanges={false}
          >
            <VenueMarker venue={venue} selected={selectedVenue?.id === venue.id} />
          </Marker>
        ))}
      </MapView>

      {/* Filter chips */}
      <View style={[styles.filtersContainer, { paddingTop: insets.top + 12 }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          <Pressable
            style={[styles.chip, activeFilter === null && styles.chipActive]}
            onPress={() => handleFilterPress(null)}
          >
            <Text style={[styles.chipText, activeFilter === null && styles.chipTextActive]}>Todos</Text>
          </Pressable>
          {FILTER_TYPES.map(([type, config]) => (
            <Pressable
              key={type}
              style={[styles.chip, activeFilter === type && styles.chipActive]}
              onPress={() => handleFilterPress(type)}
            >
              <Text style={styles.chipEmoji}>{config.emoji}</Text>
              <Text style={[styles.chipText, activeFilter === type && styles.chipTextActive]}>
                {config.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* My location button */}
      {coords && (
        <Pressable
          style={[styles.locationButton, { bottom: selectedVenue ? 220 : 32 }]}
          onPress={() => mapRef.current?.animateToRegion(
            { latitude: coords.latitude, longitude: coords.longitude, latitudeDelta: 0.03, longitudeDelta: 0.03 },
            400,
          )}
        >
          <Text style={styles.locationIcon}>◎</Text>
        </Pressable>
      )}

      <VenueCard
        venue={selectedVenue}
        distanceKm={distanceKm}
        onClose={() => setSelectedVenue(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  filtersContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  filtersScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(17,17,17,0.92)',
    borderWidth: 1,
    borderColor: '#333',
  },
  chipActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  chipEmoji: { fontSize: 13 },
  chipText: { color: '#ccc', fontSize: 13, fontWeight: '500' },
  chipTextActive: { color: '#000', fontWeight: '600' },
  locationButton: {
    position: 'absolute',
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(17,17,17,0.92)',
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationIcon: { color: '#fff', fontSize: 20 },
});
