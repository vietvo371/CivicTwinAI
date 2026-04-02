import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Animated,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme, COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../theme';

interface AegisButtonProps {
  title?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  iconSize?: number;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  gradient?: string[];
  fullWidth?: boolean;
  circular?: boolean;
}

/**
 * AegisButton - A luxury interaction component for CivicTwinAI
 * 
 * Features:
 * - Linear Gradient support
 * - Snappy scale-down animation
 * - Loading & Disabled states
 * - Circular mode for FABs and center tab buttons
 */
export const AegisButton: React.FC<AegisButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconSize,
  loading = false,
  disabled = false,
  style,
  textStyle,
  gradient,
  fullWidth = false,
  circular = false,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!disabled && !loading) {
      Animated.spring(scaleAnim, {
        toValue: 0.96,
        useNativeDriver: true,
        speed: 50,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
      }).start();
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          container: { backgroundColor: COLORS.secondary },
          text: { color: COLORS.textWhite },
        };
      case 'outline':
        return {
          container: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: COLORS.primary },
          text: { color: COLORS.primary },
        };
      case 'ghost':
        return {
          container: { backgroundColor: 'transparent' },
          text: { color: COLORS.primary },
        };
      case 'danger':
        return {
          container: { backgroundColor: COLORS.error },
          text: { color: COLORS.textWhite },
        };
      default:
        return {
          container: { backgroundColor: COLORS.primary },
          text: { color: COLORS.textWhite },
        };
    }
  };

  const vStyles = getVariantStyles();
  const opacity = disabled || loading ? 0.6 : 1;

  const ButtonContent = (
    <LinearGradient
      colors={gradient || (variant === 'primary' ? theme.colors.gradientPrimary : [vStyles.container.backgroundColor as string, vStyles.container.backgroundColor as string])}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[
        styles.container,
        vStyles.container,
        styles[size],
        circular && styles.circular,
        circular && styles[`circular_${size}`],
        fullWidth && styles.fullWidth,
        style,
        { opacity },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={vStyles.text.color} size="small" />
      ) : (
        <View style={styles.innerLayout}>
          {icon && (
            <Icon
              name={icon}
              size={iconSize || (size === 'sm' ? 16 : 20)}
              color={vStyles.text.color}
              style={[styles.icon, !title && { marginRight: 0 }]}
            />
          )}
          {title && (
            <Text style={[styles.text, styles[`text_${size}`], vStyles.text, textStyle]}>
              {title}
            </Text>
          )}
        </View>
      )}
    </LinearGradient>
  );

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], width: fullWidth ? '100%' : 'auto' }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={1}
        delayPressIn={0}
      >
        {ButtonContent}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  circular: {
    paddingHorizontal: 0,
    borderRadius: 999,
    aspectRatio: 1, // Force 1:1 ratio
  },
  innerLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  sm: {
    height: 36,
    paddingHorizontal: SPACING.md,
  },
  md: {
    height: 48,
    paddingHorizontal: SPACING.lg,
  },
  lg: {
    height: 56,
    paddingHorizontal: SPACING.xl,
  },
  circular_sm: {
    width: 36,
    height: 36,
  },
  circular_md: {
    width: 48,
    height: 48,
  },
  circular_lg: {
    width: 56,
    height: 56,
  },
  text: {
    fontWeight: theme.typography.fontWeight.semibold,
    textAlign: 'center',
  },
  text_sm: {
    fontSize: FONT_SIZE.xs,
  },
  text_md: {
    fontSize: FONT_SIZE.md,
  },
  text_lg: {
    fontSize: FONT_SIZE.lg,
  },
  icon: {
    marginRight: 8,
  },
});

export default AegisButton;
