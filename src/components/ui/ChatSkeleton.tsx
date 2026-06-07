import { StyleSheet, View } from 'react-native';
import { Skeleton } from './Skeleton';

function BubbleSkeleton({ align, width }: { align: 'left' | 'right'; width: number }) {
  return (
    <View style={[styles.row, align === 'right' ? styles.rowRight : styles.rowLeft]}>
      <Skeleton width={width} height={36} borderRadius={18} />
    </View>
  );
}

export function ChatSkeleton() {
  return (
    <View style={styles.container}>
      <BubbleSkeleton align="left" width={160} />
      <BubbleSkeleton align="right" width={120} />
      <BubbleSkeleton align="left" width={200} />
      <BubbleSkeleton align="right" width={180} />
      <BubbleSkeleton align="left" width={140} />
      <BubbleSkeleton align="right" width={100} />
      <BubbleSkeleton align="left" width={170} />
      <BubbleSkeleton align="right" width={150} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 10,
  },
  row: {
    width: '100%',
  },
  rowLeft: {
    alignItems: 'flex-start',
  },
  rowRight: {
    alignItems: 'flex-end',
  },
});
