import React, { useEffect, useMemo } from 'react';
import { View, Text, ViewStyle, TextStyle, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  Easing,
  FadeInDown,
  interpolate,
  withSequence,
  Extrapolation,
} from 'react-native-reanimated';
import { COLORS } from '../../theme';

/**
 * Senior Animation Presets - Apple Health Style Physics
 * - Gentle: High damping, smooth transition
 * - Snappy: Fast response, clean stop
 * - Slow: Dramatic and deliberate reveal
 */
export const ANIM_PRESETS = {
  gentle: { damping: 20, stiffness: 90, mass: 1 },
  snappy: { damping: 15, stiffness: 150, mass: 0.8 },
  slow: { damping: 25, stiffness: 40, mass: 1.2 },
};

type AnimPresetKey = keyof typeof ANIM_PRESETS;

interface AegisEntranceProps {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  preset?: AnimPresetKey;
  style?: ViewStyle | ViewStyle[];
}

/**
 * Senior AegisEntrance - Physics-based Layout Revelation
 */
export const AegisEntrance: React.FC<AegisEntranceProps> = ({
  children,
  delay = 0,
  direction = 'up',
  preset = 'gentle',
  style,
}) => {
  const config = ANIM_PRESETS[preset];

  return (
    <Animated.View
      entering={FadeInDown.delay(delay)
        .springify()
        .damping(config.damping)
        .stiffness(config.stiffness)
        .mass(config.mass)}
      style={style}
    >
      {children}
    </Animated.View>
  );
};

interface AegisLaserScanProps {
  color: string;
  height?: number;
  active?: boolean;
}

/**
 * Senior AegisLaserScan - Volumetric Digital Twin Radar
 * - Layered volumetric glow
 * - Synchronized sensor flicker
 * - Smooth physical interpolation
 */
export const AegisLaserScan: React.FC<AegisLaserScanProps> = ({
  color,
  height = 120,
  active = true,
}) => {
  const scanPos = useSharedValue(0);
  const flicker = useSharedValue(1);

  useEffect(() => {
    if (active) {
      scanPos.value = withRepeat(
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.quad) }),
        -1,
        true
      );

      flicker.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 100 }),
          withTiming(1, { duration: 100 }),
          withTiming(0.7, { duration: 150 }),
          withTiming(1, { duration: 50 })
        ),
        -1,
        true
      );
    }
  }, [active]);

  const scanStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scanPos.value,
      [0, 1],
      [0, height],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ translateY }],
      opacity: interpolate(scanPos.value, [0, 0.1, 0.9, 1], [0, 1, 1, 0]),
    };
  });

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scanPos.value, [0, 0.5, 1], [0.3, 0.6, 0.3]),
  }));

  return (
    <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
      {/* Volumetric Beam */}
      <Animated.View style={[styles.laserBeam, scanStyle, { backgroundColor: color }]}>
        <Animated.View style={[styles.laserGlow, glowStyle, { backgroundColor: color }]} />
      </Animated.View>
    </View>
  );
};

/**
 * Numerical Animation Suite
 */
export const AnimatedNumber: React.FC<{ value: number; style?: TextStyle; delay?: number }> = ({ 
  value, 
  style, 
  delay = 0 
}) => {
  const [display, setDisplay] = React.useState(0);

  useEffect(() => {
    let start: number | null = null;
    const duration = 1500;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start - delay) / duration, 1);
      if (progress >= 0) {
        setDisplay(Math.floor(progress * value));
      }
      if (progress < 1) requestAnimationFrame(step);
    };
    const t = setTimeout(() => requestAnimationFrame(step), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return <Text style={style}>{display}</Text>;
};

/**
 * AI Heartbeat Pulse
 */
export const AIPulseLED: React.FC<{ color?: string }> = ({ color = COLORS.primary }) => {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.6, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: interpolate(pulse.value, [1, 1.6], [0.6, 0.1]),
  }));

  return (
    <View style={styles.ledContainer}>
      <Animated.View style={[styles.ledGlow, animatedStyle, { backgroundColor: color }]} />
      <View style={[styles.ledCore, { backgroundColor: color }]} />
    </View>
  );
};

const styles = {
  ledContainer: {
    width: 12,
    height: 12,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  ledGlow: {
    position: 'absolute' as const,
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  ledCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
    zIndex: 1,
  },
  laserBeam: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    zIndex: 10,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  laserGlow: {
    position: 'absolute' as const,
    top: -10,
    bottom: -10,
    left: 0,
    right: 0,
    opacity: 0.3,
  },
};

const StyleSheet = {
  absoluteFill: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  }
};
