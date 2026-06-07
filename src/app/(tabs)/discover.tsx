import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FilterSheet } from '@/components/features/FilterSheet';
import { SwipeCard } from '@/components/features/SwipeCard';
import { useConnections } from '@/lib/hooks/useConnections';
import { useLocation } from '@/lib/hooks/useLocation';
import { useSession } from '@/lib/hooks/useSession';
import { DEFAULT_FILTERS, useSwipeMusicians, type SwipeFilters } from '@/lib/hooks/useSwipeMusicians';

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useSession();
  const { coords } = useLocation(session?.user.id);
  const { musicians, loading, loaded, load, recordSwipe } = useSwipeMusicians(session?.user.id);
  const { sendConnection } = useConnections(session?.user.id);

  const [filters, setFilters] = useState<SwipeFilters>(DEFAULT_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);

  const hasActiveFilters = filters.genres.length > 0 || filters.instruments.length > 0 || filters.maxKm !== null;

  function handleApplyFilters(newFilters: SwipeFilters) {
    setFilters(newFilters);
    load(newFilters, coords ?? null);
  }
  // Note: onApply is only called from the sheet's CTA button, not on each chip tap

  async function handleSwipe(musicianId: string, direction: 'left' | 'right') {
    await recordSwipe(musicianId, direction);
    if (direction === 'right') {
      await sendConnection(musicianId);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  if (loaded && musicians.length === 0) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.emptyIcon}>🎵</Text>
        <Text style={styles.emptyTitle}>
          {hasActiveFilters ? 'Sin resultados' : 'No hay más músicos'}
        </Text>
        <Text style={styles.emptyHint}>
          {hasActiveFilters
            ? 'Probá con otros filtros o limpiá la búsqueda.'
            : 'Volvé más tarde, la comunidad sigue creciendo.'}
        </Text>
        {hasActiveFilters && (
          <Pressable style={styles.reloadButton} onPress={() => handleApplyFilters(DEFAULT_FILTERS)}>
            <Text style={styles.reloadText}>Limpiar filtros</Text>
          </Pressable>
        )}
        <Pressable style={[styles.reloadButton, { marginTop: 4 }]} onPress={() => load(filters, coords ?? null)}>
          <Text style={styles.reloadText}>Actualizar</Text>
        </Pressable>
      </View>
    );
  }

  const topMusician = musicians[0];
  const nextMusician = musicians[1];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Descubrir</Text>
        <Pressable style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]} onPress={() => setSheetOpen(true)}>
          <Text style={[styles.filterIcon, hasActiveFilters && styles.filterIconActive]}>⚙</Text>
          {hasActiveFilters && <View style={styles.filterBadge} />}
        </Pressable>
      </View>

      <View style={styles.cardArea}>
        {nextMusician && (
          <View style={styles.cardBehind} pointerEvents="none">
            <SwipeCard musician={nextMusician} onSwipe={() => {}} isTop={false} />
          </View>
        )}
        {topMusician && (
          <SwipeCard
            key={topMusician.id}
            musician={topMusician}
            onSwipe={(dir) => handleSwipe(topMusician.id, dir)}
            isTop
          />
        )}
      </View>

      <FilterSheet
        visible={sheetOpen}
        filters={filters}
        onApply={handleApplyFilters}
        onClose={() => setSheetOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16,
  },
  centered: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
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
  cardArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 16,
  },
  cardBehind: {
    position: 'absolute',
    top: 0,
    transform: [{ scale: 0.96 }],
    opacity: 0.6,
    zIndex: 0,
  },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { color: '#fff', fontSize: 20, fontWeight: '600' },
  emptyHint: { color: '#555', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  reloadButton: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  reloadText: { color: '#888', fontSize: 15 },
});
