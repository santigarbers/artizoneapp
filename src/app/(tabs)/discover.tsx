import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FilterSheet } from '@/components/features/FilterSheet';
import { MusicianCard } from '@/components/features/MusicianCard';
import { MusicianCarousel } from '@/components/features/MusicianCarousel';
import { CARD_WIDTH } from '@/components/features/MusicianCarouselCard';
import { MusicianMarker } from '@/components/features/MusicianMarker';
import { Skeleton } from '@/components/ui/Skeleton';
import { useConnections } from '@/lib/hooks/useConnections';
import { useLocation } from '@/lib/hooks/useLocation';
import {
  DEFAULT_FILTERS,
  type DiscoverFilters,
  type Musician,
  useNearbyMusicians,
} from '@/lib/hooks/useNearbyMusicians';
import { usePresence } from '@/lib/hooks/usePresence';
import { useSession } from '@/lib/hooks/useSession';

type ViewMode = 'list' | 'map';

const INSTRUMENT_ORDER = [
  'Guitarra', 'Voz', 'Batería', 'Bajo', 'Teclado', 'Piano',
  'Violín', 'Saxofón', 'Trompeta', 'Cajón', 'Percusión', 'Contrabajo',
];

const INSTRUMENT_LABELS: Record<string, string> = {
  Guitarra: 'Guitarristas',
  Voz: 'Cantantes',
  Batería: 'Bateristas',
  Bajo: 'Bajistas',
  Teclado: 'Tecladistas',
  Piano: 'Pianistas',
  Violín: 'Violinistas',
  Saxofón: 'Saxofonistas',
  Trompeta: 'Trompetistas',
  Cajón: 'Cajoneros',
  Percusión: 'Percusionistas',
  Contrabajo: 'Contrabajistas',
};

type Section = { id: string; title: string; subtitle?: string; data: Musician[] };

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useSession();
  const userId = session?.user.id;
  const { coords, error: locationError, loading: locationLoading } = useLocation(userId);

  const [filters, setFilters] = useState<DiscoverFilters>(DEFAULT_FILTERS);
  const { musicians, loading, loaded, refetch } = useNearbyMusicians(coords, userId, filters);
  const { getConnectionWith, sendConnection, fetchConnections } = useConnections(userId);
  const { onlineIds } = usePresence(userId);

  const [view, setView] = useState<ViewMode>('list');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMusician, setSelectedMusician] = useState<Musician | null>(null);
  const mapRef = useRef<MapView>(null);

  const hasActiveFilters =
    filters.genres.length > 0 || filters.instruments.length > 0 || filters.maxKm !== null;

  const sections = useMemo<Section[]>(() => {
    if (!musicians.length) return [];

    const result: Section[] = [];

    const activeNow = musicians.filter((m) => onlineIds.has(m.id));
    if (activeNow.length > 0) {
      result.push({ id: '__active', title: 'Activos ahora', data: activeNow });
    }

    result.push({ id: '__nearest', title: 'Más cerca tuyo', data: musicians.slice(0, 8) });

    const byInstrument: Record<string, Musician[]> = {};
    for (const m of musicians) {
      for (const inst of m.instruments ?? []) {
        if (!byInstrument[inst]) byInstrument[inst] = [];
        byInstrument[inst].push(m);
      }
    }

    for (const inst of INSTRUMENT_ORDER) {
      const group = byInstrument[inst];
      if (group && group.length > 0) {
        result.push({ id: inst, title: INSTRUMENT_LABELS[inst] ?? inst, data: group });
      }
    }

    for (const [inst, group] of Object.entries(byInstrument)) {
      if (!INSTRUMENT_ORDER.includes(inst) && group.length > 0) {
        result.push({ id: inst, title: inst, data: group });
      }
    }

    return result;
  }, [musicians]);

  async function handleConnect(musicianId: string) {
    const { error } = await sendConnection(musicianId);
    if (error) Alert.alert('Error', error.message);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await Promise.all([refetch(), fetchConnections()]);
    setRefreshing(false);
  }

  if (locationLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#fff" />
        <Text style={styles.hint}>Obteniendo ubicación...</Text>
      </View>
    );
  }

  if (locationError || !coords) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.emptyIcon}>📍</Text>
        <Text style={styles.emptyTitle}>Necesitamos tu ubicación</Text>
        <Text style={styles.emptyHint}>
          {locationError ?? 'Activá la ubicación para descubrir músicos cerca tuyo.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[
          'rgba(124,58,237,0.22)',
          'rgba(109,40,217,0.10)',
          'rgba(76,29,149,0.05)',
          'transparent',
        ]}
        locations={[0, 0.3, 0.55, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.bgGradient}
        pointerEvents="none"
      />

      <View style={styles.header}>
        <Text style={styles.title}>Descubrir</Text>
        <View style={styles.headerRight}>
          <View style={styles.toggle}>
            <Pressable
              style={[styles.toggleBtn, view === 'list' && styles.toggleBtnActive]}
              onPress={() => setView('list')}
            >
              <Text style={[styles.toggleText, view === 'list' && styles.toggleTextActive]}>
                Lista
              </Text>
            </Pressable>
            <Pressable
              style={[styles.toggleBtn, view === 'map' && styles.toggleBtnActive]}
              onPress={() => setView('map')}
            >
              <Text style={[styles.toggleText, view === 'map' && styles.toggleTextActive]}>
                Mapa
              </Text>
            </Pressable>
          </View>
          <Pressable
            style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
            onPress={() => setSheetOpen(true)}
          >
            <Text style={[styles.filterIcon, hasActiveFilters && styles.filterIconActive]}>⚙</Text>
            {hasActiveFilters && <View style={styles.filterBadge} />}
          </Pressable>
        </View>
      </View>

      {view === 'list' ? (
        loading && !loaded ? (
          <ScrollView
            contentContainerStyle={styles.skeletonContent}
            showsVerticalScrollIndicator={false}
          >
            {[0, 1, 2].map((i) => (
              <View key={i} style={styles.skeletonSection}>
                <Skeleton width={150} height={22} borderRadius={6} style={styles.skeletonTitle} />
                <View style={styles.skeletonRow}>
                  {[0, 1, 2].map((j) => (
                    <Skeleton key={j} width={CARD_WIDTH} height={254} borderRadius={20} />
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        ) : sections.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🎵</Text>
            <Text style={styles.emptyTitle}>
              {hasActiveFilters ? 'Sin resultados' : 'No hay músicos cerca'}
            </Text>
            <Text style={styles.emptyHint}>
              {hasActiveFilters
                ? 'Probá con otros filtros o limpiá la búsqueda.'
                : 'Volvé más tarde, la comunidad sigue creciendo.'}
            </Text>
            {hasActiveFilters && (
              <Pressable style={styles.clearButton} onPress={() => setFilters(DEFAULT_FILTERS)}>
                <Text style={styles.clearText}>Limpiar filtros</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#fff" />
            }
          >
            {sections.map((section) => (
              <MusicianCarousel
                key={section.id}
                title={section.title}
                subtitle={section.subtitle}
                musicians={section.data}
                getConnection={getConnectionWith}
                onConnect={handleConnect}
                onlineIds={onlineIds}
              />
            ))}
          </ScrollView>
        )
      ) : (
        <View style={styles.mapContainer}>
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
              const musician = musicians.find((m) => m.id === id);
              if (musician) {
                setSelectedMusician(musician);
                mapRef.current?.animateToRegion(
                  {
                    latitude: musician.latitude,
                    longitude: musician.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  },
                  400,
                );
              }
            }}
          >
            {musicians.map((musician) => (
              <Marker
                key={musician.id}
                identifier={musician.id}
                coordinate={{ latitude: musician.latitude, longitude: musician.longitude }}
                tracksViewChanges={false}
              >
                <MusicianMarker musician={musician} />
              </Marker>
            ))}
          </MapView>

          <MusicianCard
            musician={selectedMusician}
            onClose={() => setSelectedMusician(null)}
            connection={selectedMusician ? getConnectionWith(selectedMusician.id) : null}
            onConnect={handleConnect}
          />
        </View>
      )}

      <FilterSheet
        visible={sheetOpen}
        filters={filters}
        onApply={(f) => setFilters(f)}
        onClose={() => setSheetOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  bgGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
  },
  centered: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  hint: { color: '#888', fontSize: 14 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
    padding: 2,
  },
  toggleBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 18 },
  toggleBtnActive: { backgroundColor: '#fff' },
  toggleText: { color: '#888', fontSize: 13, fontWeight: '600' },
  toggleTextActive: { color: '#000' },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: { borderColor: '#fff', backgroundColor: '#222' },
  filterIcon: { color: '#888', fontSize: 18 },
  filterIconActive: { color: '#fff' },
  filterBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ade80',
  },
  scrollContent: { paddingBottom: 32, gap: 32 },
  skeletonContent: { paddingBottom: 32, gap: 32 },
  skeletonSection: { gap: 14 },
  skeletonTitle: { marginHorizontal: 16 },
  skeletonRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { color: '#fff', fontSize: 20, fontWeight: '600' },
  emptyHint: { color: '#555', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  clearButton: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  clearText: { color: '#888', fontSize: 15 },
  mapContainer: { flex: 1 },
  map: { flex: 1 },
});
