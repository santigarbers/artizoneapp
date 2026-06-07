import { StyleSheet, View } from 'react-native';
import { Skeleton } from './Skeleton';

export function ProfileSkeleton() {
  return (
    <View style={styles.container}>
      <Skeleton width={100} height={100} borderRadius={50} style={styles.avatar} />
      <Skeleton width={140} height={18} borderRadius={9} style={styles.username} />
      <Skeleton width={220} height={13} borderRadius={6} />
      <Skeleton width={180} height={13} borderRadius={6} />

      <View style={styles.section}>
        <Skeleton width={80} height={11} borderRadius={5} />
        <View style={styles.tagsRow}>
          <Skeleton width={70} height={28} borderRadius={14} />
          <Skeleton width={60} height={28} borderRadius={14} />
          <Skeleton width={80} height={28} borderRadius={14} />
        </View>
      </View>

      <View style={styles.section}>
        <Skeleton width={100} height={11} borderRadius={5} />
        <View style={styles.tagsRow}>
          <Skeleton width={90} height={28} borderRadius={14} />
          <Skeleton width={70} height={28} borderRadius={14} />
        </View>
      </View>

      <Skeleton width="100%" height={48} borderRadius={12} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
    gap: 10,
  },
  avatar: { marginBottom: 8 },
  username: { marginBottom: 4 },
  section: { width: '100%', gap: 10, marginTop: 8 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: { marginTop: 8 },
});
