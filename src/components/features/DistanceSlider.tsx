import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const MIN_KM = 2;
const MAX_KM = 800;
const LOG_MIN = Math.log(MIN_KM);
const LOG_MAX = Math.log(MAX_KM);
const THUMB_SIZE = 28;

// Last 5% of track = "Sin límite"
const SIN_LIMITE_RATIO = 0.95;

function ratioToValue(ratio: number): number | null {
  if (ratio >= SIN_LIMITE_RATIO) return null;
  const km = Math.round(Math.exp(LOG_MIN + (ratio / SIN_LIMITE_RATIO) * (LOG_MAX - LOG_MIN)));
  return Math.max(MIN_KM, Math.min(MAX_KM, km));
}

function valueToRatio(value: number | null): number {
  if (value === null) return 1;
  const logKm = Math.log(Math.max(MIN_KM, value));
  return ((logKm - LOG_MIN) / (LOG_MAX - LOG_MIN)) * SIN_LIMITE_RATIO;
}

function formatLabel(value: number | null): string {
  if (value === null) return 'Sin límite';
  return `${value} km`;
}

type Props = {
  value: number | null;
  onChange: (value: number | null) => void;
};

export function DistanceSlider({ value, onChange }: Props) {
  const [trackWidth, setTrackWidth] = useState(0);
  const [displayLabel, setDisplayLabel] = useState(formatLabel(value));
  const thumbX = useSharedValue(0);
  const startX = useSharedValue(0);

  useEffect(() => {
    if (trackWidth <= 0) return;
    thumbX.value = withSpring(valueToRatio(value) * trackWidth, { damping: 20 });
    setDisplayLabel(formatLabel(value));
  }, [trackWidth, value]);

  function handleUpdate(ratio: number) {
    setDisplayLabel(formatLabel(ratioToValue(ratio)));
  }

  function handleEnd(ratio: number) {
    const val = ratioToValue(ratio);
    // Snap to end if in sin límite zone
    const finalRatio = val === null ? 1 : valueToRatio(val);
    thumbX.value = withSpring(finalRatio * trackWidth, { damping: 20, stiffness: 200 });
    setDisplayLabel(formatLabel(val));
    onChange(val);
  }

  const gesture = Gesture.Pan()
    .onBegin(() => {
      startX.value = thumbX.value;
    })
    .onUpdate((e) => {
      const clamped = Math.max(0, Math.min(trackWidth, startX.value + e.translationX));
      thumbX.value = clamped;
      const ratio = trackWidth > 0 ? clamped / trackWidth : 0;
      runOnJS(handleUpdate)(ratio);
    })
    .onEnd(() => {
      if (trackWidth <= 0) return;
      const ratio = thumbX.value / trackWidth;
      runOnJS(handleEnd)(ratio);
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX.value - THUMB_SIZE / 2 }],
  }));

  const activeStyle = useAnimatedStyle(() => ({
    width: thumbX.value,
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{displayLabel}</Text>

      <View
        style={styles.trackContainer}
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      >
        <View style={styles.track}>
          <Animated.View style={[styles.trackActive, activeStyle]} />
        </View>

        <GestureDetector gesture={gesture}>
          <Animated.View style={[styles.thumb, thumbStyle]} />
        </GestureDetector>
      </View>

      <View style={styles.labelsRow}>
        <Text style={styles.rangeLabel}>{MIN_KM} km</Text>
        <Text style={styles.rangeLabel}>Sin límite</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10, paddingTop: 4 },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  trackContainer: {
    height: THUMB_SIZE,
    justifyContent: 'center',
    position: 'relative',
  },
  track: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    overflow: 'hidden',
  },
  trackActive: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#fff',
    top: 0,
    left: 0,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rangeLabel: { color: '#555', fontSize: 11 },
});
