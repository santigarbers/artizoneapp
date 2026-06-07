import { StyleSheet, View } from 'react-native';
import { Skeleton } from './Skeleton';

export function ConversationSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton width={48} height={48} borderRadius={24} />
      <View style={styles.info}>
        <Skeleton width={120} height={14} borderRadius={7} />
        <Skeleton width={180} height={12} borderRadius={6} style={{ marginTop: 6 }} />
      </View>
      <Skeleton width={28} height={12} borderRadius={6} />
    </View>
  );
}

export function ConversationSkeletonList({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <ConversationSkeleton key={i} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#222',
    gap: 12,
  },
  info: {
    flex: 1,
    gap: 4,
  },
});
