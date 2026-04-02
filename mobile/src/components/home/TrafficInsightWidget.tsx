import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AegisCard } from '../common/AegisCard';
import { AegisButton } from '../common/AegisButton';
import {
  COLORS,
  SPACING,
  FONT_SIZE,
  textStyles,
  theme,
} from '../../theme';
import { AegisLaserScan } from '../common/AegisAnimated';

interface TrafficInsightWidgetProps {
  status: 'smooth' | 'heavy' | 'congested' | 'alert';
  locationName: string;
  onMapPress: () => void;
}

/**
 * TrafficInsightWidget - The AI brain summary on the HomeScreen
 * 
 * Features:
 * - Real-time "AI Radar" pulse animation
 * - Senior-grade Volumetric Laser Scanning
 * - Technical sensor node data
 */
export const TrafficInsightWidget: React.FC<TrafficInsightWidgetProps> = ({
  status,
  locationName,
  onMapPress,
}) => {
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    // Radar Pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.5,
          duration: 1500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const getStatusConfig = () => {
    switch (status) {
      case 'heavy':
        return {
          label: 'Mật độ cao',
          subLabel: 'Phát hiện ùn ứ nhẹ tại khu vực lân cận',
          color: COLORS.warning,
          icon: 'traffic-cone',
        };
      case 'congested':
        return {
          label: 'Ùn tắc nghiêm trọng',
          subLabel: 'Vui lòng chọn lộ trình thay thế',
          color: COLORS.error,
          icon: 'car-brake-alert',
        };
      case 'alert':
        return {
          label: 'Cảnh báo sự cố',
          subLabel: 'Có tai nạn xảy ra cách đây 500m',
          color: COLORS.error,
          icon: 'alert-decagram',
        };
      default:
        return {
          label: 'Giao thông ổn định',
          subLabel: 'Hiện không có sự cố nào được ghi nhận',
          color: COLORS.success,
          icon: 'check-decagram',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <AegisCard variant="glass" style={styles.container}>
      {/* Senior Volumetric Laser Scanning Overlay */}
      <AegisLaserScan color={config.color} height={140} />

      {/* Technical HUD Details */}
      <View style={styles.hudNodeLeft}>
        <Text style={styles.hudText}>SENSOR: 0xA41</Text>
      </View>
      <View style={styles.hudNodeRight}>
        <Text style={styles.hudText}>CONF: 94.2%</Text>
      </View>

      <View style={styles.content}>
        {/* Radar Pulse Animation */}
        <View style={styles.radarContainer}>
          <Animated.View
            style={[
              styles.pulseCircle,
              {
                backgroundColor: config.color + '30',
                transform: [{ scale: pulseAnim }],
                opacity: pulseAnim.interpolate({
                  inputRange: [1, 1.5],
                  outputRange: [0.6, 0],
                }),
              },
            ]}
          />
          <View style={[styles.centerCircle, { backgroundColor: config.color }]}>
            <Icon name={config.icon} size={20} color={COLORS.white} />
          </View>
        </View>

        {/* Text Summary */}
        <View style={styles.textContainer}>
          <View style={styles.labelRow}>
            <Text style={[styles.statusLabel, { color: config.color }]}>
              {config.label}
            </Text>
            <View style={[styles.aiBadge, { borderColor: config.color + '40' }]}>
              <Text style={[styles.aiText, { color: config.color }]}>AI Live</Text>
            </View>
          </View>
          <Text style={styles.locationText} numberOfLines={1}>{locationName}</Text>
          <Text style={styles.subLabel}>{config.subLabel}</Text>
        </View>
      </View>

      {/* Action Area */}
      <View style={styles.footer}>
        <AegisButton
          title="Xem chi tiết bản đồ"
          onPress={onMapPress}
          variant="ghost"
          size="sm"
          icon="map-search-outline"
          textStyle={{ color: COLORS.primary }}
        />
      </View>
    </AegisCard>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.md,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    overflow: 'hidden',
  },
  hudNodeLeft: {
    position: 'absolute',
    top: 8,
    left: 12,
    zIndex: 4,
    opacity: 0.4,
  },
  hudNodeRight: {
    position: 'absolute',
    top: 8,
    right: 12,
    zIndex: 4,
    opacity: 0.4,
  },
  hudText: {
    fontSize: 7,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: COLORS.textTertiary,
    fontWeight: '800',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 18,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  radarContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  pulseCircle: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  centerCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    ...theme.shadows.sm,
  },
  textContainer: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  statusLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    marginRight: 8,
  },
  aiBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
  },
  aiText: {
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  locationText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  subLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    fontWeight: '400',
  },
  footer: {
    paddingTop: SPACING.xs,
    alignItems: 'flex-start',
  },
});

export default TrafficInsightWidget;
