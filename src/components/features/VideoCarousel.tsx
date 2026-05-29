import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Video } from '@/lib/hooks/useVideos';

type VideoItemProps = {
  url: string;
};

function VideoItem({ url }: VideoItemProps) {
  const player = useVideoPlayer(url, p => {
    p.loop = false;
  });

  return (
    <View style={styles.item}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        nativeControls
      />
    </View>
  );
}

type Props = {
  videos: Video[];
};

export function VideoCarousel({ videos }: Props) {
  if (videos.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {videos.map(video => (
        <VideoItem key={video.id} url={video.url} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    paddingHorizontal: 2,
  },
  item: {
    width: 160,
    aspectRatio: 9 / 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  video: {
    flex: 1,
  },
});
