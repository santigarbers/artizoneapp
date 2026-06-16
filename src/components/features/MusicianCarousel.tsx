import { FlatList, StyleSheet, Text, View } from 'react-native';
import type { Musician } from '@/lib/hooks/useNearbyMusicians';
import type { ConnectionWithProfile } from '@/lib/hooks/useConnections';
import { MusicianCarouselCard } from './MusicianCarouselCard';

type Props = {
  title: string;
  subtitle?: string;
  musicians: Musician[];
  getConnection: (id: string) => ConnectionWithProfile | null;
  onConnect: (id: string) => Promise<void> | void;
  onlineIds?: Set<string>;
};

export function MusicianCarousel({ title, subtitle, musicians, getConnection, onConnect, onlineIds }: Props) {
  if (musicians.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      <FlatList
        data={musicians}
        keyExtractor={(m) => m.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <MusicianCarouselCard
            musician={item}
            connection={getConnection(item.id)}
            onConnect={() => onConnect(item.id)}
            isOnline={onlineIds?.has(item.id)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 14 },
  header: { paddingHorizontal: 16, gap: 3 },
  title: { color: '#fff', fontSize: 20, fontWeight: '700' },
  subtitle: { color: '#666', fontSize: 13 },
  list: { paddingHorizontal: 16 },
  separator: { width: 10 },
});
