import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import type { SwipeMusician } from '@/lib/hooks/useSwipeMusicians';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 80;

type Props = {
  musician: SwipeMusician;
  onSwipe: (direction: 'left' | 'right') => void;
  isTop: boolean;
};

export function SwipeCard({ musician, onSwipe, isTop }: Props) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const gesture = Gesture.Pan()
    .enabled(isTop)
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.3;
    })
    .onEnd(() => {
      if (translateX.value > SWIPE_THRESHOLD) {
        translateX.value = withTiming(SCREEN_WIDTH * 1.5, { duration: 250 }, () => {
          runOnJS(onSwipe)('right');
        });
      } else if (translateX.value < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-SCREEN_WIDTH * 1.5, { duration: 250 }, () => {
          runOnJS(onSwipe)('left');
        });
      } else {
        translateX.value = withSpring(0, { damping: 15 });
        translateY.value = withSpring(0, { damping: 15 });
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      {
        rotate: `${interpolate(
          translateX.value,
          [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
          [-10, 0, 10],
          Extrapolation.CLAMP
        )}deg`,
      },
    ],
  }));

  const likeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP),
  }));

  const nopeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.card, cardStyle]}>
        <View style={styles.avatarContainer}>
          {musician.avatar_url ? (
            <Image source={{ uri: musician.avatar_url }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{musician.username?.[0]?.toUpperCase() ?? '?'}</Text>
            </View>
          )}
        </View>

        <Animated.View style={[styles.overlayBadge, styles.likeBadge, likeStyle]}>
          <Text style={styles.likeText}>ME GUSTA</Text>
        </Animated.View>
        <Animated.View style={[styles.overlayBadge, styles.nopeBadge, nopeStyle]}>
          <Text style={styles.nopeText}>PASO</Text>
        </Animated.View>

        <View style={styles.info}>
          <Text style={styles.username}>@{musician.username}</Text>

          {musician.bio ? (
            <Text style={styles.bio} numberOfLines={2}>{musician.bio}</Text>
          ) : null}

          {musician.looking_for ? (
            <View style={styles.lookingForRow}>
              <Text style={styles.lookingForLabel}>Busca: </Text>
              <Text style={styles.lookingForText}>{musician.looking_for}</Text>
            </View>
          ) : null}

          {musician.genres && musician.genres.length > 0 ? (
            <View style={styles.tagsRow}>
              {musician.genres.slice(0, 4).map(g => (
                <View key={g} style={[styles.tag, styles.genreTag]}>
                  <Text style={styles.tagText}>{g}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {musician.instruments && musician.instruments.length > 0 ? (
            <View style={styles.tagsRow}>
              {musician.instruments.slice(0, 4).map(i => (
                <View key={i} style={[styles.tag, styles.instrumentTag]}>
                  <Text style={styles.tagText}>{i}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    width: SCREEN_WIDTH - 32,
    backgroundColor: '#111',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#222',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  avatarContainer: {
    width: '100%',
    height: 320,
    backgroundColor: '#1a1a1a',
  },
  avatar: { width: '100%', height: '100%' },
  avatarPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#222',
  },
  avatarInitial: { color: '#fff', fontSize: 64, fontWeight: 'bold' },
  overlayBadge: {
    position: 'absolute',
    top: 40,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 3,
  },
  likeBadge: {
    left: 20,
    borderColor: '#4ade80',
    backgroundColor: 'rgba(0,0,0,0.5)',
    transform: [{ rotate: '-15deg' }],
  },
  nopeBadge: {
    right: 20,
    borderColor: '#f87171',
    backgroundColor: 'rgba(0,0,0,0.5)',
    transform: [{ rotate: '15deg' }],
  },
  likeText: { color: '#4ade80', fontSize: 18, fontWeight: 'bold' },
  nopeText: { color: '#f87171', fontSize: 18, fontWeight: 'bold' },
  info: {
    padding: 20,
    gap: 10,
  },
  username: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  bio: { color: '#aaa', fontSize: 14, lineHeight: 20 },
  lookingForRow: { flexDirection: 'row', flexWrap: 'wrap' },
  lookingForLabel: { color: '#888', fontSize: 13 },
  lookingForText: { color: '#ccc', fontSize: 13, flex: 1 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  genreTag: { backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#333' },
  instrumentTag: { backgroundColor: '#1a2e1a', borderWidth: 1, borderColor: '#2a4a2a' },
  tagText: { color: '#ccc', fontSize: 12 },
});
