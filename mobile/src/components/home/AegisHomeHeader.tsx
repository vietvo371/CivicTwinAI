import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  theme,
  COLORS,
  SPACING,
  FONT_SIZE,
  BORDER_RADIUS,
  textStyles,
} from '../../theme';
import NotificationBellButton from '../../component/NotificationBellButton';
import { User } from '../../types/api/auth';
import { AegisEntrance, AIPulseLED } from '../common/AegisAnimated';
import { AIActivityStream } from './AIActivityStream';
import { useTranslation } from '../../hooks/useTranslation';

interface AegisHomeHeaderProps {
  user: User | null;
  onProfilePress: () => void;
  aiStatus?: 'active' | 'warning' | 'alert';
  logs?: string[];
}

/**
 * Senior AegisHomeHeader - Animated Digital Twin Edition
 * Refined for high-fidelity "Digital Twin" aesthetic.
 * - Vertical greeting hierarchy
 * - Floating status banner with Pulse LED
 * - Staggered entrance animations
 */
export const AegisHomeHeader: React.FC<AegisHomeHeaderProps> = ({
  user,
  onProfilePress,
  aiStatus = 'active',
  logs,
}) => {
  const { t } = useTranslation();
  const userName = user?.name || t('profile.user');

  const getAIStatusLabel = () => {
    switch (aiStatus) {
      case 'warning': return t('home.aiWarning');
      case 'alert': return t('home.aiAlert');
      default: return t('home.aiStable');
    }
  };

  const getAIStatusColor = () => {
    switch (aiStatus) {
      case 'warning': return COLORS.warning;
      case 'alert': return COLORS.error;
      default: return COLORS.primary;
    }
  };

  return (
    <View style={styles.outerContainer}>
      <View style={styles.mainHeader}>
        <View style={styles.topSection}>
          {/* Brand & Greeting Section */}
          <AegisEntrance delay={300}>
            <View style={styles.brandGreeting}>
              <View style={styles.greetingHeader}>
                <Text style={styles.dateText}>
                  {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' })}
                </Text>
                <Text style={styles.greetingText}>{t('home.greeting')}, {userName.split(' ').pop()}!</Text>
              </View>
            </View>
          </AegisEntrance>

          {/* Action Row: Notifications + Profile */}
          <AegisEntrance delay={500} direction="right">
            <View style={styles.actionRow}>
              <NotificationBellButton style={styles.iconBtn} color={COLORS.text} />

              <TouchableOpacity onPress={onProfilePress} style={styles.profileBtn}>
                <View style={styles.avatarBorder}>
                  <View style={styles.avatarInner}>
                    <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </AegisEntrance>
        </View>

        {/* AI Status Banner - Floating Style with Pulse LED & Live Stream */}
        <TouchableOpacity style={styles.aiBannerWrapper}>
          <View style={styles.aiBannerSurface}>
            <View style={styles.aiBannerContent}>
              <View style={styles.pulseContainer}>
                <AIPulseLED color={getAIStatusColor()} />
              </View>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <AIActivityStream variant="inline" logs={logs} />
              </View>
              <Icon name="chevron-right" size={16} color={COLORS.primary} />
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: BORDER_RADIUS['3xl'],
    borderBottomRightRadius: BORDER_RADIUS['3xl'],
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 15,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  mainHeader: {
    paddingTop: Platform.OS === 'ios' ? 12 : 8,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  brandGreeting: {
    flex: 1,
  },
  greetingHeader: {
    marginTop: 4,
  },
  dateText: {
    color: COLORS.textTertiary,
    fontSize: FONT_SIZE['2xs'],
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  greetingText: {
    color: COLORS.text,
    fontSize: FONT_SIZE['2xl'],
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  profileBtn: {
    marginLeft: 2,
  },
  avatarBorder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: COLORS.primary + '40',
    padding: 2,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
  aiBannerWrapper: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    backgroundColor: COLORS.primary + '08',
    borderWidth: 1,
    borderColor: COLORS.primary + '15',
  },
  aiBannerSurface: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    ...theme.shadows.xs,
  },
  aiBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulseContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  aiBannerText: {
    color: COLORS.text,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    flex: 1,
    letterSpacing: 0.2,
  },
});

export default AegisHomeHeader;
