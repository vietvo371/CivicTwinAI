import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { COLORS, SPACING } from '../../theme';

const MOCK_LOGS = [
  '[SYS] AI Core Initialized: Neural Engine Active',
  '[TRAFFIC] Processing 142 real-time sensor nodes',
  '[GPS] Optimizing citizen rerouting strategies',
  '[IOT] Syncing IoT Gateway: 8 nodes reporting',
  '[AI] Confidence score: 98.4% for current prediction',
];

interface AIActivityStreamProps {
  variant?: 'default' | 'inline' | 'transparent';
  logs?: string[];
}

/**
 * AIActivityStream - Digital Twin Command Center Ticker
 * - Smoothly scrolls logs or real incident data.
 * - Supports text truncation for long titles.
 */
export const AIActivityStream: React.FC<AIActivityStreamProps> = ({ 
  variant = 'default',
  logs: propLogs
}) => {
  const displayLogs = propLogs && propLogs.length > 0 ? propLogs : MOCK_LOGS;
  const [currentIdx, setCurrentIdx] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    // Reset index if logs change
    setCurrentIdx(0);
  }, [propLogs]);

  useEffect(() => {
    const cycleLog = () => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 1000,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
              toValue: -5,
              duration: 800,
              useNativeDriver: true,
            }),
          ]).start(() => {
            setCurrentIdx((prev) => (prev + 1) % displayLogs.length);
            slideAnim.setValue(10);
          });
        }, 3000);
      });
    };

    cycleLog();
    const interval = setInterval(cycleLog, 5300);
    return () => clearInterval(interval);
  }, [displayLogs]);

  const isTransparent = variant === 'transparent' || variant === 'inline';

  return (
    <View style={[
      styles.container, 
      isTransparent && styles.transparentContainer,
      variant === 'default' && styles.defaultMargin
    ]}>
      <View style={styles.headerDot} />
      <Animated.View style={[
        styles.streamWrapper,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}>
        <Text 
          style={[styles.logText, isTransparent && styles.transparentText]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {displayLogs[currentIdx]}
        </Text>
      </Animated.View>
      {variant === 'default' && <View style={styles.terminalCursor} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 32,
    backgroundColor: COLORS.secondary + '05',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + '10',
    overflow: 'hidden',
  },
  defaultMargin: {
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.md,
  },
  transparentContainer: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    height: 24,
    paddingHorizontal: 0,
  },
  headerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    marginRight: 10,
  },
  streamWrapper: {
    flex: 1,
  },
  logText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 9,
    color: COLORS.primary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  transparentText: {
    fontSize: 10,
    color: COLORS.text,
  },
  terminalCursor: {
    width: 6,
    height: 10,
    backgroundColor: COLORS.primary + '40',
    marginLeft: 6,
  },
});

export default AIActivityStream;
