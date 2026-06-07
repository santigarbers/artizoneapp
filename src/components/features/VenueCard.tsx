import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { VENUE_TYPES, type Venue } from '@/lib/hooks/useVenues';

type Props = {
  venue: Venue | null;
  distanceKm?: number | null;
  onClose: () => void;
};

export function VenueCard({ venue, distanceKm, onClose }: Props) {
  if (!venue) return null;

  const config = VENUE_TYPES[venue.type];

  function openMaps() {
    const url = `https://maps.google.com/?q=${venue!.latitude},${venue!.longitude}`;
    Linking.openURL(url);
  }

  function callPhone() {
    Linking.openURL(`tel:${venue!.phone}`);
  }

  const distanceLabel = distanceKm != null
    ? distanceKm < 1
      ? `${Math.round(distanceKm * 1000)} m`
      : `${distanceKm.toFixed(1)} km`
    : null;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.typeBadge, { backgroundColor: config.color + '22', borderColor: config.color + '44' }]}>
          <Text style={styles.typeEmoji}>{config.emoji}</Text>
          <Text style={[styles.typeLabel, { color: config.color }]}>{config.label}</Text>
        </View>
        {distanceLabel && (
          <Text style={styles.distance}>{distanceLabel}</Text>
        )}
        <Pressable onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>

      <Text style={styles.name}>{venue.name}</Text>
      <Text style={styles.address}>{venue.address}</Text>

      {venue.hours && (
        <Text style={styles.hours}>🕐 {venue.hours}</Text>
      )}

      <View style={styles.actions}>
        <Pressable style={styles.mapsButton} onPress={openMaps}>
          <Text style={styles.mapsButtonText}>Abrir en Maps</Text>
        </Pressable>
        {venue.phone && (
          <Pressable style={styles.phoneButton} onPress={callPhone}>
            <Text style={styles.phoneButtonText}>📞 Llamar</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222',
    gap: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  typeEmoji: { fontSize: 12 },
  typeLabel: { fontSize: 12, fontWeight: '600' },
  distance: { color: '#666', fontSize: 12, marginLeft: 'auto' },
  closeButton: { paddingHorizontal: 8, paddingVertical: 4, marginLeft: 4 },
  closeText: { color: '#555', fontSize: 16 },
  name: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  address: { color: '#888', fontSize: 13 },
  hours: { color: '#666', fontSize: 13 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  mapsButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  mapsButtonText: { color: '#000', fontWeight: '600', fontSize: 14 },
  phoneButton: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  phoneButtonText: { color: '#aaa', fontSize: 14 },
});
