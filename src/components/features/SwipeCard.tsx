import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { LinearGradient } from 'expo-linear-gradient';
import type { SwipeMusician } from '@/lib/hooks/useSwipeMusicians';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 80;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.74;

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
    .activeOffsetX([-15, 15])
    .failOffsetY([-20, 20])
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

  function handleButtonPress(direction: 'left' | 'right') {
    const targetX = direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
    translateX.value = withTiming(targetX, { duration: 250 }, () => {
      runOnJS(onSwipe)(direction);
    });
  }

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      {
        rotate: `${interpolate(
          translateX.value,
          [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
          [-10, 0, 10],
          Extrapolation.CLAMP,
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

        {/* Foto de fondo */}
        {musician.avatar_url ? (
          <Image
            source={{ uri: musician.avatar_url }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.avatarPlaceholder]}>
            <Text style={styles.avatarInitial}>{musician.username?.[0]?.toUpperCase() ?? '?'}</Text>
          </View>
        )}

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.92)']}
          locations={[0, 0.55, 1]}
          style={styles.gradient}
          pointerEvents="none"
        />

        {/* Overlays LIKE / PASO */}
        <Animated.View style={[styles.overlayBadge, styles.likeBadge, likeStyle]}>
          <Text style={styles.likeText}>ME GUSTA</Text>
        </Animated.View>
        <Animated.View style={[styles.overlayBadge, styles.nopeBadge, nopeStyle]}>
          <Text style={styles.nopeText}>PASO</Text>
        </Animated.View>

        {/* Info: nombre + contenido scrolleable */}
        <View style={styles.infoWrapper}>
          <Text style={styles.username}>@{musician.username}</Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={styles.scrollContent}
          >
            {musician.looking_for ? (
              <Text style={styles.lookingFor}>🔍 {musician.looking_for}</Text>
            ) : null}

            {musician.bio ? (
              <Text style={styles.bio}>{musician.bio}</Text>
            ) : null}

            {musician.genres && musician.genres.length > 0 ? (
              <View style={styles.tagsRow}>
                {musician.genres.map(g => (
                  <View key={g} style={[styles.tag, styles.genreTag]}>
                    <Text style={styles.tagText}>{g}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {musician.instruments && musician.instruments.length > 0 ? (
              <View style={styles.tagsRow}>
                {musician.instruments.map(i => (
                  <View key={i} style={[styles.tag, styles.instrumentTag]}>
                    <Text style={styles.tagText}>{i}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </ScrollView>
        </View>

        {/* Botones dentro de la card */}
        {isTop && (
          <View style={styles.buttons}>
            <Pressable
              style={[styles.actionButton, styles.nopeButton]}
              onPress={() => handleButtonPress('left')}
            >
              <Text style={styles.nopeIcon}>✕</Text>
            </Pressable>
            <Pressable
              style={[styles.actionButton, styles.likeButton]}
              onPress={() => handleButtonPress('right')}
            >
              <Text style={styles.likeIcon}>♥</Text>
            </Pressable>
          </View>
        )}

      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    width: SCREEN_WIDTH - 32,
    height: CARD_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#222',
  },
  avatarInitial: { color: '#fff', fontSize: 80, fontWeight: 'bold' },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: CARD_HEIGHT * 0.65,
  },
  overlayBadge: {
    position: 'absolute',
    top: 44,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 3,
  },
  likeBadge: {
    left: 20,
    borderColor: '#4ade80',
    backgroundColor: 'rgba(0,0,0,0.4)',
    transform: [{ rotate: '-15deg' }],
  },
  nopeBadge: {
    right: 20,
    borderColor: '#f87171',
    backgroundColor: 'rgba(0,0,0,0.4)',
    transform: [{ rotate: '15deg' }],
  },
  likeText: { color: '#4ade80', fontSize: 18, fontWeight: 'bold' },
  nopeText: { color: '#f87171', fontSize: 18, fontWeight: 'bold' },
  infoWrapper: {
    position: 'absolute',
    bottom: 96,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    maxHeight: CARD_HEIGHT * 0.48,
  },
  username: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  scrollContent: { gap: 8 },
  lookingFor: { color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 19 },
  bio: { color: 'rgba(255,255,255,0.80)', fontSize: 14, lineHeight: 21 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  genreTag: { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  instrumentTag: { backgroundColor: 'rgba(74,222,128,0.15)', borderWidth: 1, borderColor: 'rgba(74,222,128,0.3)' },
  tagText: { color: '#fff', fontSize: 12 },
  buttons: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  nopeButton: { backgroundColor: 'rgba(20,20,20,0.85)', borderWidth: 2, borderColor: '#f87171' },
  likeButton: { backgroundColor: 'rgba(20,20,20,0.85)', borderWidth: 2, borderColor: '#4ade80' },
  nopeIcon: { color: '#f87171', fontSize: 22, fontWeight: 'bold' },
  likeIcon: { color: '#4ade80', fontSize: 22 },
});
