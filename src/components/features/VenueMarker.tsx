import { StyleSheet, Text, View } from 'react-native';
import { VENUE_TYPES, type Venue } from '@/lib/hooks/useVenues';

type Props = { venue: Venue; selected?: boolean };

export function VenueMarker({ venue, selected = false }: Props) {
  const config = VENUE_TYPES[venue.type];
  return (
    <View style={[styles.wrapper, selected && styles.wrapperSelected]}>
      <View style={[styles.bubble, { backgroundColor: config.color }]}>
        <Text style={styles.emoji}>{config.emoji}</Text>
      </View>
      <View style={[styles.arrow, { borderTopColor: config.color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  wrapperSelected: { transform: [{ scale: 1.2 }] },
  bubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  emoji: { fontSize: 20 },
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
});
