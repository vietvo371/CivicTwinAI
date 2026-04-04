import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNotifications } from '../hooks/useNotifications';
import { theme } from '../theme/colors';
import { setFcmForegroundHandler } from '../realtime/fcmForegroundBridge';
import { mapRemoteMessageToInAppNotification } from '../utils/mapFcmToInAppNotification';
import { navigateToIncidentDetailFromInAppNotification } from '../navigation/navigateFromPushNotification';

export const NotificationBanner = () => {
  const { notifications, markAsRead, prependNotification } = useNotifications();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;

  const latestNotification = notifications.find(n => !n.read);

  useEffect(() => {
    setFcmForegroundHandler(msg => {
      const n = mapRemoteMessageToInAppNotification(msg);
      if (n) prependNotification(n);
    });
    return () => setFcmForegroundHandler(null);
  }, [prependNotification]);

  useEffect(() => {
    if (latestNotification) {
      showToast();
    }
  }, [latestNotification?.id]);

  const showToast = () => {
    if (!latestNotification) return;

    // Reset animations
    slideAnim.setValue(-100);
    fadeAnim.setValue(0);
    progressAnim.setValue(1);

    // Show toast animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Progress bar animation (5 seconds)
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: 5000,
      useNativeDriver: false,
    }).start();

    // Auto hide after 5 seconds
    const timer = setTimeout(() => {
      hideToast();
    }, 5000);

    return () => clearTimeout(timer);
  };

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (latestNotification) {
        markAsRead(latestNotification.id);
      }
    });
  };

  const onToastContentPress = () => {
    if (latestNotification) {
      navigateToIncidentDetailFromInAppNotification(
        latestNotification.type,
        latestNotification.data,
      );
    }
    hideToast();
  };

  if (!latestNotification) return null;

  const getToastConfig = () => {
    const newStatus = latestNotification.data?.new_status;
    
    // For report_status type, color by status
    if (latestNotification.type === 'report_status') {
      if (newStatus === 3) { // Hoàn thành
        return {
          backgroundColor: theme.colors.successLight,
          icon: 'check-circle',
          iconColor: theme.colors.success,
          borderColor: theme.colors.success,
        };
      }
      if (newStatus === 4) { // Từ chối
        return {
          backgroundColor: theme.colors.errorLight,
          icon: 'close-circle',
          iconColor: theme.colors.error,
          borderColor: theme.colors.error,
        };
      }
      // Default report status (Đang xử lý, Xác minh, etc)
      return {
        backgroundColor: theme.colors.infoLight,
        icon: 'information-outline',
        iconColor: theme.colors.info,
        borderColor: theme.colors.info,
      };
    }

    // Other notification types
    switch (latestNotification.type) {
      case 'points_updated':
        return {
          backgroundColor: theme.colors.successLight,
          icon: 'star-circle',
          iconColor: theme.colors.success,
          borderColor: theme.colors.success,
        };
      case 'incident_created':
        return {
          backgroundColor: '#FEF2F2',
          icon: 'alert-circle',
          iconColor: '#EF4444',
          borderColor: '#EF4444',
        };
      case 'new_nearby_report':
        return {
          backgroundColor: '#EDE7F6', // Purple light
          icon: 'map-marker-alert',
          iconColor: '#8B5CF6',
          borderColor: '#8B5CF6',
        };
      case 'fcm_push':
        return {
          backgroundColor: theme.colors.infoLight,
          icon: 'bell-ring',
          iconColor: theme.colors.info,
          borderColor: theme.colors.info,
        };
      default:
        return {
          backgroundColor: theme.colors.infoLight,
          icon: 'bell',
          iconColor: theme.colors.info,
          borderColor: theme.colors.info,
        };
    }
  };

  const config = getToastConfig();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 10, // Safe area top + 10px margin
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim,
        },
      ]}
    >
      <View
        style={[
          styles.toast,
          {
            backgroundColor: config.backgroundColor,
            borderColor: config.borderColor,
          },
        ]}
      >
        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
                backgroundColor: config.borderColor,
              },
            ]}
          />
        </View>

        <View style={styles.content}>
          <TouchableOpacity
            style={styles.tapArea}
            activeOpacity={0.92}
            onPress={onToastContentPress}
            accessibilityRole="button"
            accessibilityLabel="Mở chi tiết thông báo"
          >
            <View style={styles.iconContainer}>
              <Icon name={config.icon} size={24} color={config.iconColor} />
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.title} numberOfLines={1}>
                {latestNotification.title}
              </Text>
              <Text style={styles.message} numberOfLines={3}>
                {latestNotification.message}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={hideToast}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="close" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    // top sẽ được set dynamic bằng insets.top
    left: 16,
    right: 16,
    zIndex: 999999,
  },
  toast: {
    borderRadius: 12,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  progressContainer: {
    height: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  progressBar: {
    height: '100%',
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 8,
  },
  tapArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginRight: 4,
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
    paddingRight: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
    fontFamily: theme.typography.fontFamily,
  },
  message: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    fontFamily: theme.typography.fontFamily,
  },
  closeButton: {
    padding: 4,
    marginTop: 0,
  },
});
