import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ViewStyle,
  Animated,
  Platform,
  Text,
} from 'react-native';
import { theme, COLORS, SPACING, BORDER_RADIUS } from '../../theme';

interface AegisCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'default' | 'glass' | 'elevated' | 'outline';
  padding?: keyof typeof SPACING | number;
  borderRadius?: keyof typeof BORDER_RADIUS | number;
  activeOpacity?: number;
  showHudAccents?: boolean;
}

/**
 * AegisCard - A high-fidelity surface component for CivicTwinAI
 * 
 * Features:
 * - Glassmorphism support
 * - Dynamic elevation
 * - Technical HUD accents (⌞ ⌟)
 * - Snappy scale animation on press
 */
export const AegisCard: React.FC<AegisCardProps> = ({
  children,
  style,
  onPress,
  variant = 'default',
  padding = 'md',
  borderRadius = 'md',
  activeOpacity = 0.9,
  showHudAccents = false,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (onPress) {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }).start();
    }
  };

  const p = typeof padding === 'number' ? padding : SPACING[padding];
  const br = typeof borderRadius === 'number' ? borderRadius : BORDER_RADIUS[borderRadius];

  const getVariantStyle = () => {
    switch (variant) {
      case 'glass':
        return styles.glass;
      case 'elevated':
        return styles.elevated;
      case 'outline':
        return styles.outline;
      default:
        return styles.default;
    }
  };

  const HudAccents = () => (
    <>
      <View style={[styles.hudCorner, { top: 6, left: 6 }]}>
        <Text style={styles.hudBracket}>⌞</Text>
      </View>
      <View style={[styles.hudCorner, { top: 6, right: 6 }]}>
        <Text style={styles.hudBracket}>⌟</Text>
      </View>
      <View style={[styles.hudCorner, { bottom: 6, left: 6 }]}>
        <Text style={styles.hudBracket}>⌜</Text>
      </View>
      <View style={[styles.hudCorner, { bottom: 6, right: 6 }]}>
        <Text style={styles.hudBracket}>⌝</Text>
      </View>
    </>
  );

  const CardContent = (
    <Animated.View
      style={[
        styles.base,
        getVariantStyle(),
        { padding: p, borderRadius: br },
        style,
        onPress && { transform: [{ scale: scaleAnim }] },
      ]}
    >
      {(variant === 'glass' || showHudAccents) && <HudAccents />}
      <View style={styles.content}>{children}</View>
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={activeOpacity}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        delayPressIn={0}
      >
        {CardContent}
      </TouchableOpacity>
    );
  }

  return CardContent;
};

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    backgroundColor: COLORS.white,
  },
  content: {
    zIndex: 1,
  },
  default: {
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...theme.shadows.sm,
  },
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    ...theme.shadows.xs,
  },
  elevated: {
    ...theme.shadows.md,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  hudCorner: {
    position: 'absolute',
    zIndex: 2,
    opacity: 0.25,
  },
  hudBracket: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '900',
  },
});

export default AegisCard;
