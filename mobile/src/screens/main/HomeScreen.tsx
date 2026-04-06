import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootStackParamList, CitizenTabParamList } from '../../navigation/types';
import {
  theme,
  COLORS,
  SPACING,
  FONT_SIZE,
  BORDER_RADIUS,
  ICON_SIZE,
  SCREEN_PADDING,
  cardStyles,
  textStyles,
  wp,
  hp,
  AegisCard,
  AegisButton,
} from '../../theme';
import AegisHomeHeader from '../../components/home/AegisHomeHeader';
import TrafficInsightWidget from '../../components/home/TrafficInsightWidget';

import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { reportService } from '../../services/reportService';
import { Report } from '../../types/api/report';
import { incidentService, Incident } from '../../services/incidentService';
import Geolocation from 'react-native-geolocation-service';
import {
  getStatusText,
  getStatusColor,
  formatDate,
} from '../../utils/reportUtils';
import { AegisEntrance, AnimatedNumber } from '../../components/common/AegisAnimated';

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<CitizenTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface StatsData {
  tong_phan_anh: number;
  da_giai_quyet: number;
  dang_xu_ly: number;
  ty_le_giai_quyet?: number;
  thoi_gian_xu_ly_trung_binh?: number;
}

/**
 * Senior HomeScreen - Digital Twin Core Edition
 * Optimized for high-fidelity "Digital Twin" aesthetic.
 * - AI Live Command Stream (Ticker)
 * - Micro-sparkline data visualization
 * - Technical HUD card accents
 */
const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { registerRefreshCallback } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nearbyIncidents, setNearbyIncidents] = useState<Incident[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, reportsRes] = await Promise.all([
        reportService.getStats(),
        reportService.getReports({ page: 1, per_page: 3, sort_by: 'created_at', sort_order: 'desc' })
      ]);

      if (statsRes.success) {
        setStatsData(statsRes.data);
      }

      if (reportsRes.success && reportsRes.data) {
        const reportsData = (reportsRes.data as any).data || reportsRes.data;
        setRecentReports(Array.isArray(reportsData) ? reportsData : []);
      }
    } catch (err) {
      console.error('Error fetching home data:', err);
      setError('Không thể kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const unregister = registerRefreshCallback(fetchData);

    Geolocation.getCurrentPosition(
      (position) => {
        incidentService.getIncidents({ per_page: 5, status: 'open' })
          .then(res => {
            if (res.success && res.data) {
              const data = (res.data as any).data || res.data;
              const list = Array.isArray(data) ? data : [];
              setNearbyIncidents(list.slice(0, 3));
            }
          })
          .catch(() => { });
      },
      () => { },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 30000 }
    );

    return () => unregister();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const getStatsCards = () => {
    const total = statsData?.tong_phan_anh || 0;
    const resolved = statsData?.da_giai_quyet || 0;
    const pending = statsData?.dang_xu_ly || 0;
    const rate = statsData?.ty_le_giai_quyet?.toFixed(1) || '0';

    return [
      { id: 'total', title: 'Tổng phản ánh', value: total, subtitle: `+${rate}%`, color: COLORS.primary, icon: 'chart-box-outline' },
      { id: 'resolved', title: 'Hoàn thành', value: resolved, subtitle: 'Đã xử lý', color: COLORS.success, icon: 'check-circle-outline' },
      { id: 'pending', title: 'Đang xử lý', value: pending, subtitle: 'Hỗ trợ 24/7', color: COLORS.warning, icon: 'clock-outline' },
    ];
  };

  const renderSparkline = (color: string) => (
    <View style={styles.sparklineContainer}>
      {[4, 10, 7, 12, 6, 9].map((h, i) => (
        <View key={i} style={[styles.sparkBar, { height: h, backgroundColor: color + '40' }]} />
      ))}
    </View>
  );

  const renderModernReport = (report: Report, index: number) => (
    <AegisEntrance key={report.id} delay={1300 + index * 150} preset="gentle">
      <AegisCard variant="glass" style={styles.modernReportCard} onPress={() => navigation.navigate('IncidentDetail' as any, { id: report.id })}>
        <View style={styles.reportHeaderModern}>
          <View style={styles.badgeRow}>
            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(report.danh_muc_id) + '15' }]}>
              <Text style={[styles.categoryBadgeText, { color: getCategoryColor(report.danh_muc_id) }]}>
                {report.danh_muc?.ten_danh_muc || 'Sự cố'}
              </Text>
            </View>
            <View style={[styles.statusTag, { backgroundColor: getStatusColor(report.trang_thai) }]}>
              <Text style={styles.statusTagText}>{getStatusText(report.trang_thai)}</Text>
            </View>
          </View>
          <Text style={styles.ticketId}>#{report.id.toString().padStart(4, '0')}</Text>
        </View>

        <Text style={styles.modernReportTitle} numberOfLines={2}>{report.tieu_de}</Text>

        <View style={styles.reportFooterModern}>
          <View style={styles.reportMetaModern}>
            <Icon name="map-marker-outline" size={12} color={COLORS.textTertiary} />
            <Text style={styles.locationText} numberOfLines={1}>{report.dia_chi || 'Địa điểm chưa xác định'}</Text>
          </View>
          <Text style={styles.dateTextSmall}>{formatDate(report.created_at)}</Text>
        </View>
      </AegisCard>
    </AegisEntrance>
  );

  const getCategoryColor = (id: number) => {
    const colors: Record<number, string> = { 1: '#EF4444', 2: '#10B981', 3: '#F97316', 4: '#8B5CF6', 5: '#3B82F6' };
    return colors[id] || COLORS.textSecondary;
  };

  const renderModernStats = () => {
    const stats = getStatsCards();
    return (
      <AegisEntrance delay={1100} preset="gentle">
        <View style={styles.statsSection}>
          <View style={styles.headerRow}>
            <Text style={styles.sectionHeading}>Hệ thống dữ liệu AI</Text>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>REALTIME</Text>
            </View>
          </View>
          <View style={styles.statsGrid}>
            {stats.map((stat) => (
              <AegisCard key={stat.id} variant="glass" style={styles.statTile}>
                <View style={[styles.statIconWrapper, { backgroundColor: stat.color + '12' }]}>
                  <Icon name={stat.icon} size={20} color={stat.color} />
                </View>
                <AnimatedNumber value={stat.value} style={styles.statValue} delay={1500} />
                {renderSparkline(stat.color)}
                <Text style={styles.statLabel}>{stat.title}</Text>
                <Text style={[styles.statSub, { color: stat.color }]}>{stat.subtitle}</Text>
              </AegisCard>
            ))}
          </View>
        </View>
      </AegisEntrance>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={['top']} style={{ backgroundColor: COLORS.white }} />

      <AegisHomeHeader
        user={user}
        onProfilePress={() => navigation.navigate('Profile')}
        logs={nearbyIncidents.map(incident => `[ALERT] ${incident.title || 'Sự cố mới'}`)}
      />



      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {error && (
          <View style={styles.errorAlert}>
            <Icon name="alert-decagram" size={20} color={COLORS.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* <AegisEntrance delay={900} preset="gentle">
          <TrafficInsightWidget
            status="smooth"
            locationName="TP. Hồ Chí Minh"
            onMapPress={() => navigation.navigate('Map')}
          />
        </AegisEntrance> */}

        {renderModernStats()}

        <View style={styles.section}>
          <AegisEntrance delay={1300} preset="gentle">
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeading}>Sự cố mới nhất</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Alerts')} style={styles.viewAllBtn}>
                <Text style={styles.viewAllText}>XEM TẤT CẢ</Text>
              </TouchableOpacity>
            </View>
          </AegisEntrance>

          {loading ? (
            <View style={styles.loadingBox}>
              <Text style={styles.loadingText}>Đang đồng bộ dữ liệu AI Core...</Text>
            </View>
          ) : recentReports.length === 0 ? (
            <View style={styles.emptyPrompt}>
              <Icon name="shield-check-outline" size={48} color={COLORS.success + '30'} />
              <Text style={styles.emptyPromptText}>Mạng lưới giao thông an toàn</Text>
            </View>
          ) : (
            recentReports.map((report, idx) => renderModernReport(report, idx))
          )}
        </View>

        <AegisEntrance delay={2000} preset="gentle">
          <View style={styles.footerBranding}>
            <View style={styles.footerLine} />
            <View style={styles.footerContent}>
              <Icon name="shield-check" size={16} color={COLORS.primary} />
              <Text style={styles.footerText}>CIVICTWIN AI • SECURITY ACTIVE</Text>
            </View>
          </View>
        </AegisEntrance>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING['5xl'],
  },
  section: {
    marginTop: SPACING.xl,
    paddingHorizontal: SCREEN_PADDING.horizontal,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  sectionHeading: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginRight: 6,
  },
  liveText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.primary,
  },
  statsSection: {
    marginTop: SPACING.xl,
    paddingHorizontal: SCREEN_PADDING.horizontal,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  statTile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  statIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '900',
    color: COLORS.text,
  },
  sparklineContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 12,
    gap: 2,
    marginVertical: 4,
  },
  sparkBar: {
    width: 2,
    borderRadius: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  statSub: {
    fontSize: 9,
    fontWeight: '800',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  viewAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewAllText: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.primary,
  },
  modernReportCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  reportHeaderModern: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusTagText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  ticketId: {
    fontSize: 10,
    color: COLORS.textTertiary,
    fontWeight: '700',
  },
  modernReportTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  reportFooterModern: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: SPACING.md,
  },
  reportMetaModern: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.md,
  },
  locationText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginLeft: 4,
    fontWeight: '500',
  },
  dateTextSmall: {
    fontSize: 10,
    color: COLORS.textTertiary,
    fontWeight: '600',
  },
  loadingBox: {
    padding: SPACING['3xl'],
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textTertiary,
    fontWeight: '600',
  },
  emptyPrompt: {
    padding: SPACING['3xl'],
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  emptyPromptText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    marginTop: SPACING.md,
    fontWeight: '700',
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorLight,
    margin: SCREEN_PADDING.horizontal,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.error + '20',
  },
  errorText: {
    flex: 1,
    color: COLORS.error,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  footerBranding: {
    marginTop: SPACING['3xl'],
    marginBottom: SPACING['3xl'],
    alignItems: 'center',
  },
  footerLine: {
    width: 40,
    height: 1,
    backgroundColor: COLORS.borderDark,
    opacity: 0.3,
    marginBottom: SPACING.md,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    opacity: 0.4,
  },
  footerText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.textTertiary,
    letterSpacing: 2,
  },
});

export default HomeScreen;
