import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Musician } from '@/lib/hooks/useNearbyMusicians';

type Props = {
  musician: Musician;
};

export function MusicianMarker({ musician }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        {musician.avatar_url ? (
          <Image source={{ uri: musician.avatar_url }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.initial}>
              {musician.username?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.arrow} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  bubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2.5,
    borderColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#fff',
  },
});
