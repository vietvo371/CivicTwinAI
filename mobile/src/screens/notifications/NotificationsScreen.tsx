import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import PageHeader from '../../component/PageHeader';
import {
  theme,
  COLORS,
  SPACING,
  FONT_SIZE,
  BORDER_RADIUS,
  SCREEN_PADDING,
  hp,
  textStyles,
} from '../../theme';
import { useNotifications, Notification as WSNotification } from '../../hooks/useNotifications';
import { notificationService } from '../../services/notificationService';
import { Notification as APINotification } from '../../types/api/notification';
import { isUuid } from '../../utils/isUuid';
import { useTranslation } from '../../hooks/useTranslation';

interface UnifiedNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: any;
  source: 'api' | 'websocket';
}

function resolveServerNotificationId(
  item: UnifiedNotification,
  apiList: APINotification[],
): string | null {
  const meta = item.data as Record<string, unknown> | undefined;
  if (!meta) {
    return null;
  }
  const incidentId =
    meta.incident_id ??
    meta.report_id ??
    meta.id ??
    (meta.metadata as Record<string, unknown> | undefined)?.id ??
    (meta.metadata as Record<string, unknown> | undefined)?.incident_id;
  if (incidentId == null || incidentId === '') {
    return null;
  }
  const want = String(incidentId);

  const found = apiList.find(n => {
    const d = n.data as Record<string, unknown> | undefined;
    if (!d) {
      return false;
    }
    const candidates = [
      d.incident_id,
      d.id,
      d.report_id,
      (d.metadata as Record<string, unknown> | undefined)?.id,
      (d.metadata as Record<string, unknown> | undefined)?.incident_id,
    ];
    return candidates.some(c => c != null && String(c) === want);
  });

  return found && isUuid(String(found.id)) ? String(found.id) : null;
}

/** Id phản ánh / incident để mở IncidentDetail */
function extractDetailId(data?: Record<string, any>): number | null {
  if (!data) {
    return null;
  }
  const raw = data.id ?? data.incident_id ?? data.report_id ?? data.metadata?.id;
  if (raw == null || raw === '') {
    return null;
  }
  const n = typeof raw === 'number' ? raw : parseInt(String(raw), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function navigableTypes(type: string): boolean {
  return (
    type === 'report_status' ||
    type === 'report_status_update' ||
    type === 'incident_created' ||
    type === 'new_nearby_report' ||
    type === 'fcm_push'
  );
}

const NotificationsScreen = () => {
  const navigation = useNavigation();
  const wsHook = useNotifications();
  const { fetchUnreadCount } = wsHook;
  const { t, getCurrentLanguage } = useTranslation();

  const [apiNotifications, setApiNotifications] = useState<APINotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const convertAPINotification = useCallback((n: any): UnifiedNotification => {
    const reportId = n.data?.id || n.data?.incident_id;
    return {
      id: `api-${n.id}`,
      type: n.type || 'system',
      title: n.title,
      message: n.message,
      timestamp: new Date(n.created_at || n.ngay_tao),
      read: !!n.read,
      data: reportId ? { id: reportId, ...n.data } : n.data,
      source: 'api',
    };
  }, []);

  const convertWSNotification = useCallback(
    (n: WSNotification): UnifiedNotification => ({
      id: `ws-${n.id}`,
      type: n.type,
      title: n.title,
      message: n.message,
      timestamp: n.timestamp,
      read: n.read || false,
      data: n.data,
      source: 'websocket',
    }),
    [],
  );

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await notificationService.getNotifications();
      if (response.success && response.data) {
        setApiNotifications(response.data);
      }
    } catch (error) {
      console.error('NotificationsScreen fetch:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, [fetchNotifications, fetchUnreadCount]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const wsNotifsArray = wsHook?.notifications || [];
  const allNotifications: UnifiedNotification[] = useMemo(
    () =>
      [...wsNotifsArray.map(convertWSNotification), ...apiNotifications.map(convertAPINotification)].sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
      ),
    [wsNotifsArray, apiNotifications, convertWSNotification, convertAPINotification],
  );

  const groupNotifications = useCallback((notifications: UnifiedNotification[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups: { title: string; data: UnifiedNotification[] }[] = [
      { title: t('notifications.today'), data: [] },
      { title: t('notifications.yesterday'), data: [] },
      { title: t('notifications.earlier'), data: [] },
    ];

    notifications.forEach(notif => {
      const notifDate = new Date(notif.timestamp);
      notifDate.setHours(0, 0, 0, 0);

      if (notifDate.getTime() === today.getTime()) {
        groups[0].data.push(notif);
      } else if (notifDate.getTime() === yesterday.getTime()) {
        groups[1].data.push(notif);
      } else {
        groups[2].data.push(notif);
      }
    });

    return groups.filter(group => group.data.length > 0);
  }, []);

  const notificationSections = useMemo(
    () => groupNotifications(allNotifications),
    [allNotifications, groupNotifications],
  );

  const handleMarkAllRead = async () => {
    wsHook?.markAllAsRead?.();
    setApiNotifications(prev => prev.map(n => ({ ...n, da_doc: true, read: true })));

    try {
      await notificationService.markAllAsRead();
      setTimeout(() => fetchNotifications(), 400);
    } catch (error) {
      console.error('Mark all read:', error);
    }
  };

  const handleNotificationPress = async (item: UnifiedNotification) => {
    if (!item.read) {
      if (item.source === 'websocket') {
        const wsId = item.id.replace('ws-', '');
        wsHook?.markAsRead?.(wsId);
        const serverId = resolveServerNotificationId(item, apiNotifications);
        if (serverId) {
          try {
            setApiNotifications(prev =>
              prev.map(n => (String(n.id) === serverId ? { ...n, da_doc: true, read: true } : n)),
            );
            await notificationService.markAsRead(serverId);
          } catch (e) {
            console.error('markAsRead server:', e);
          }
        }
      }

      if (item.source === 'api' && item.id.startsWith('api-')) {
        const apiIdStr = item.id.slice('api-'.length);
        if (isUuid(apiIdStr)) {
          try {
            setApiNotifications(prev =>
              prev.map(n => (String(n.id) === apiIdStr ? { ...n, da_doc: true, read: true } : n)),
            );
            await notificationService.markAsRead(apiIdStr);
          } catch (e) {
            console.error('markAsRead:', e);
          }
        }
      }
    }

    const detailId = extractDetailId(item.data);
    if (navigableTypes(item.type) && detailId != null) {
      (navigation as any).navigate('IncidentDetail', { id: detailId });
    }
  };

  const accentForType = (type: string): string => {
    switch (type) {
      case 'report_status':
      case 'report_status_update':
        return COLORS.primary;
      case 'incident_created':
        return COLORS.error;
      case 'system':
        return COLORS.textTertiary;
      default:
        return COLORS.accent;
    }
  };

  const iconForType = (type: string): string => {
    switch (type) {
      case 'report_status':
      case 'report_status_update':
        return 'file-document-edit-outline';
      case 'incident_created':
        return 'alert-decagram-outline';
      case 'system':
        return 'cog-outline';
      default:
        return 'bell-ring-outline';
    }
  };

  const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionBar} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  const renderItem = ({ item }: { item: UnifiedNotification }) => {
    const accent = accentForType(item.type);
    const detailId = extractDetailId(item.data);
    const showDetailCta = navigableTypes(item.type) && detailId != null;

    return (
      <TouchableOpacity
        style={[styles.itemCard, !item.read && styles.itemCardUnread, { borderLeftColor: accent }]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.85}
      >
        <View style={[styles.iconCircle, { backgroundColor: `${accent}14` }]}>
          <Icon name={iconForType(item.type)} size={22} color={accent} />
        </View>

        <View style={styles.itemBody}>
          <View style={styles.itemTopRow}>
            <Text
              style={[styles.itemTitle, !item.read && styles.itemTitleUnread]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text style={styles.itemTime}>
              {item.timestamp.toLocaleTimeString(getCurrentLanguage() === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <Text style={[styles.itemMessage, !item.read && styles.itemMessageUnread]} numberOfLines={3}>
            {item.message}
          </Text>
          {showDetailCta && (
            <View style={styles.ctaRow}>
              <Text style={[styles.ctaText, { color: COLORS.primary }]}>{t('notifications.seeReport')}</Text>
              <Icon name="arrow-right" size={16} color={COLORS.primary} />
            </View>
          )}
        </View>

        {!item.read && <View style={[styles.unreadDot, { backgroundColor: accent }]} />}
      </TouchableOpacity>
    );
  };

  const listHeader = (
    <View style={styles.listIntro}>
      <Text style={styles.listIntroText}>
        {t('notifications.systemNotifications')}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeTop} edges={['top']}>
      <PageHeader
        title={t('notifications.title')}
        variant="default"
        rightIcon="check-all"
        onRightPress={handleMarkAllRead}
        showBack
        showNotification={false}
      />

      <View style={styles.body}>
        {loading && !refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingLabel}>{t('notifications.loading')}</Text>
          </View>
        ) : (
          <SectionList
            sections={notificationSections}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            keyExtractor={i => i.id}
            extraData={allNotifications}
            ListHeaderComponent={listHeader}
            contentContainerStyle={styles.listContent}
            stickySectionHeadersEnabled={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.primary]}
                tintColor={COLORS.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <View style={styles.emptyIconWrap}>
                  <Icon name="bell-sleep-outline" size={40} color={COLORS.primary} />
                </View>
                <Text style={styles.emptyTitle}>{t('notifications.noNotificationsYet')}</Text>
                <Text style={styles.emptySub}>
                  {t('notifications.notificationsWillAppear')}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  /** Cùng màu với PageHeader (default): thanh trạng thái + vùng an toàn trên */
  safeTop: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  body: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    paddingHorizontal: SCREEN_PADDING.horizontal,
    paddingBottom: SPACING['4xl'],
  },
  listIntro: {
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  listIntroText: {
    ...textStyles.caption,
    color: COLORS.textTertiary,
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  sectionBar: {
    width: 3,
    height: 14,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    fontFamily: theme.typography.fontFamily,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 3,
    ...theme.shadows.sm,
  },
  itemCardUnread: {
    backgroundColor: COLORS.backgroundSecondary,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  itemBody: {
    flex: 1,
    minWidth: 0,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginBottom: 4,
  },
  itemTitle: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
    fontFamily: theme.typography.fontFamily,
  },
  itemTitleUnread: {
    fontWeight: '800',
    color: COLORS.text,
  },
  itemTime: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textLight,
    fontFamily: theme.typography.fontFamily,
  },
  itemMessage: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textTertiary,
    lineHeight: 20,
    fontFamily: theme.typography.fontFamily,
  },
  itemMessageUnread: {
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    gap: 4,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: theme.typography.fontFamily,
  },
  unreadDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  loadingLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textTertiary,
    fontWeight: '600',
  },
  emptyWrap: {
    paddingTop: hp('12%'),
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.infoLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    fontFamily: theme.typography.fontFamily,
  },
  emptySub: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textTertiary,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: theme.typography.fontFamily,
  },
});

export default NotificationsScreen;
