import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ViewStyle,
  Animated,
  Platform,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { theme, COLORS, SPACING, BORDER_RADIUS } from '../../theme';

interface AegisCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'default' | 'glass' | 'elevated' | 'outline';
  padding?: keyof typeof SPACING | number;
  borderRadius?: keyof typeof BORDER_RADIUS | number;
  activeOpacity?: number;
}

/**
 * AegisCard - A high-fidelity surface component for CivicTwinAI
 * 
 * Features:
 * - Glassmorphism support
 * - Dynamic elevation
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
      {variant === 'glass' && (
        <BlurView
          style={[StyleSheet.absoluteFill, { borderRadius: br }]}
          blurType="light"
          blurAmount={10}
          reducedTransparencyFallbackColor="white"
        />
      )}
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
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  elevated: {
    ...theme.shadows.md,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
});

export default AegisCard;
