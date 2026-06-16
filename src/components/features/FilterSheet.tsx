import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DistanceSlider } from './DistanceSlider';
import type { DiscoverFilters } from '@/lib/hooks/useNearbyMusicians';

const GENRES = ['Blues', 'Rock', 'Jazz', 'Cumbia', 'Tango', 'Folklore', 'Pop', 'Metal', 'Reggae', 'Funk', 'Hip Hop', 'Clásica', 'Electrónica', 'Soul', 'R&B'];
const INSTRUMENTS = ['Guitarra', 'Bajo', 'Batería', 'Teclado', 'Voz', 'Violín', 'Saxofón', 'Trompeta', 'Piano', 'Cajón', 'Percusión', 'Contrabajo'];

const SHEET_HEIGHT = 500;

type Props = {
  visible: boolean;
  filters: DiscoverFilters;
  onApply: (filters: DiscoverFilters) => void;
  onClose: () => void;
};

export function FilterSheet({ visible, filters, onApply, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<DiscoverFilters>(filters);

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      setDraft(filters);
      backdropOpacity.setValue(0);
      sheetTranslateY.setValue(SHEET_HEIGHT);
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(sheetTranslateY, { toValue: 0, damping: 22, stiffness: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  function handleClose() {
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(sheetTranslateY, { toValue: SHEET_HEIGHT, duration: 220, useNativeDriver: true }),
    ]).start(() => onClose());
  }

  function toggleGenre(genre: string) {
    setDraft(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre],
    }));
  }

  function toggleInstrument(instrument: string) {
    setDraft(prev => ({
      ...prev,
      instruments: prev.instruments.includes(instrument)
        ? prev.instruments.filter(i => i !== instrument)
        : [...prev.instruments, instrument],
    }));
  }

  function clearAll() {
    setDraft({ genres: [], instruments: [], maxKm: null });
  }

  function handleApply() {
    onApply(draft);
    handleClose();
  }

  const activeCount = draft.genres.length + draft.instruments.length + (draft.maxKm !== null ? 1 : 0);
  const hasDraft = activeCount > 0;

  const ctaLabel = activeCount === 0
    ? 'Ver músicos'
    : activeCount === 1
      ? 'Aplicar 1 filtro'
      : `Aplicar ${activeCount} filtros`;

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={handleClose}>
      {/* Backdrop: solo fade */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      {/* Sheet: solo slide desde abajo */}
      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: insets.bottom + 16 },
          { transform: [{ translateY: sheetTranslateY }] },
        ]}
      >
        <View style={styles.handle} />

        <View style={styles.header}>
          <Text style={styles.title}>Filtros</Text>
          {hasDraft && (
            <Pressable onPress={clearAll}>
              <Text style={styles.clearText}>Limpiar todo</Text>
            </Pressable>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Text style={styles.sectionTitle}>Géneros</Text>
          <View style={styles.chips}>
            {GENRES.map(g => (
              <Pressable
                key={g}
                style={[styles.chip, draft.genres.includes(g) && styles.chipActive]}
                onPress={() => toggleGenre(g)}
              >
                <Text style={[styles.chipText, draft.genres.includes(g) && styles.chipTextActive]}>
                  {g}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Instrumentos</Text>
          <View style={styles.chips}>
            {INSTRUMENTS.map(i => (
              <Pressable
                key={i}
                style={[styles.chip, draft.instruments.includes(i) && styles.chipActive]}
                onPress={() => toggleInstrument(i)}
              >
                <Text style={[styles.chipText, draft.instruments.includes(i) && styles.chipTextActive]}>
                  {i}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Distancia</Text>
          <DistanceSlider
            value={draft.maxKm}
            onChange={(val) => setDraft(prev => ({ ...prev, maxKm: val }))}
          />
        </ScrollView>

        <Pressable style={styles.applyButton} onPress={handleApply}>
          <Text style={styles.applyText}>{ctaLabel}</Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#111',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: '#222',
    maxHeight: '82%',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  clearText: { color: '#888', fontSize: 14 },
  content: { paddingHorizontal: 20, paddingBottom: 16, gap: 12 },
  sectionTitle: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 8,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#1a1a1a',
  },
  chipActive: { backgroundColor: '#fff', borderColor: '#fff' },
  chipText: { color: '#888', fontSize: 13 },
  chipTextActive: { color: '#000', fontWeight: '600' },
  applyButton: {
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyText: { color: '#000', fontSize: 16, fontWeight: '600' },
});
