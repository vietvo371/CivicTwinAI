import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Platform, StatusBar, Image, Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MapboxGL from '@rnmapbox/maps';
import {
  theme, SPACING, FONT_SIZE, BORDER_RADIUS, SCREEN_PADDING, wp, hp
} from '../../theme';
import PageHeader from '../../component/PageHeader';
import { incidentService, Incident, UpdateIncidentData } from '../../services/incidentService';
import { RootStackParamList } from '../../navigation/types';
import { ApiResponse } from '../../types/api/common';
import env from '../../config/env';
import { useAuth } from '../../contexts/AuthContext';

// ─── Icons & Maps ────────────────────────────────────────────────────────────

const SEVERITY_COLOR: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  low:      { bg: '#10B98115', border: '#10B98130', text: '#10B981', dot: '#10b981' },
  medium:   { bg: '#F59E0B15', border: '#F59E0B30', text: '#F59E0B', dot: '#eab308' },
  high:     { bg: '#F9731615', border: '#F9731630', text: '#F97316', dot: '#f97316' },
  critical: { bg: '#EF444415', border: '#EF444430', text: '#EF4444', dot: '#ef4444' },
};

const TYPE_ICON: Record<string, string> = {
  accident:     'car-emergency',
  congestion:   'car-brake-alert',
  construction: 'hard-hat',
  weather:      'weather-lightning-rainy',
  other:        'alert-circle-outline',
};

const REC_ICON: Record<string, string> = {
  reroute:           'map-marker-distance',
  priority_route:    'shield-check',
  alert:             'bell-alert',
  signal_change:     'traffic-light',
  alternative_route: 'route',
  advisory:          'alert-circle',
  emergency_alert:   'alert-octagon',
  congestion_alert:  'car-brake-alert',
};


type IncidentDetailRouteProp = RouteProp<RootStackParamList, 'IncidentDetail'>;

const getCleanIncidentType = (type: string | undefined | null): string => {
  return (type || '').replace('incident_type.', '').trim();
};

/**
 * Log payload BE cho màn chi tiết sự cố khẩn cấp.
 * Xem ở terminal đang chạy Metro (yarn start / npx react-native start), lọc "[EmergencyIncident BE]".
 * Bật/tắt: env.LOG_REPORT_DETAIL_PAYLOAD trong env.ts
 */
function logEmergencyIncidentFromBackend(
  incidentId: number,
  envelope: ApiResponse<Incident> | undefined,
) {
  if (!env.LOG_REPORT_DETAIL_PAYLOAD) return;
  const tag = '[EmergencyIncident BE]';
  const line = () => console.warn(`${tag} ────────────────────────────────────────`);
  console.warn(`${tag} (Metro) GET /incidents/${incidentId}`);

  if (!envelope) {
    console.warn(`${tag} (undefined response)`);
    line();
    return;
  }

  console.warn(`${tag} success:`, envelope.success);
  console.warn(`${tag} message:`, envelope.message ?? '(none)');

  const d = envelope.data as unknown as Record<string, unknown> | null | undefined;
  if (!d) {
    console.warn(`${tag} data:`, d);
    line();
    return;
  }

  console.warn(`${tag} data keys (${Object.keys(d).length}):`, Object.keys(d).sort().join(', '));

  const sum: Record<string, unknown> = {};
  const arr = (k: string) => (Array.isArray((d as any)[k]) ? ((d as any)[k] as unknown[]).length : null);
  sum.predictions_len = arr('predictions');
  sum.recommendations_len = arr('recommendations');
  sum.affected_edge_ids_len = arr('affected_edge_ids');
  sum.has_location = !!(d as any).location;
  sum.has_metadata = !!(d as any).metadata;
  console.warn(`${tag} nested summary:`, sum);

  line();
  try {
    const json = JSON.stringify(envelope, null, 2);
    const chunkSize = 8000;
    if (json.length <= chunkSize) {
      console.warn(`${tag} full JSON:\n${json}`);
    } else {
      for (let i = 0, part = 1; i < json.length; i += chunkSize, part += 1) {
        console.warn(
          `${tag} full JSON phần ${part}/${Math.ceil(json.length / chunkSize)}:\n${json.slice(
            i,
            i + chunkSize,
          )}`,
        );
      }
    }
  } catch (e) {
    console.warn(`${tag} JSON.stringify failed`, e);
    console.warn(`${tag} data (raw):`, d);
  }
  line();
  console.warn(`${tag} ========== end ==========`);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const getSeverityMap = (t: any) => ({
  critical: { label: t('incidents.severity.critical'), color: '#EF4444', icon: 'alert-octagon' },
  high:     { label: t('incidents.severity.high'), color: '#F97316', icon: 'alert' },
  medium:   { label: t('incidents.severity.medium'), color: '#F59E0B', icon: 'alert-circle' },
  low:      { label: t('incidents.severity.low'), color: '#10B981', icon: 'information' },
});

const getStatusMap = (t: any) => ({
  open:          { label: t('incidents.open'), color: '#EF4444', icon: 'record-circle' },
  investigating: { label: t('incidents.investigating'), color: '#F59E0B', icon: 'progress-clock' },
  resolved:      { label: t('incidents.resolved'), color: '#10B981', icon: 'check-circle' },
  closed:        { label: t('incidents.closed'), color: '#6B7280', icon: 'close-circle' },
});

const getTypeMap = (t: any) => ({
  accident:     { label: t('incidents.type.accident'), icon: 'car-emergency' },
  congestion:   { label: t('incidents.type.congestion'), icon: 'car-brake-alert' },
  construction: { label: t('incidents.type.construction'), icon: 'hard-hat' },
  weather:      { label: t('incidents.type.weather'), icon: 'weather-lightning-rainy' },
  other:        { label: t('incidents.type.other'), icon: 'alert-circle-outline' },
});

const fmtDate = (iso: string | null | undefined, t: any) => {
  if (!iso) return t('common.unknown');
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return t('common.invalidDate');
    
    // Manually format to avoid toLocaleString/Intl issues in Hermes Release builds
    const pad = (n: number) => String(n).padStart(2, '0');
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (err) {
    return t('common.formatError');
  }
};

const parseAIContent = (content: any, t: any): string => {
  if (!content) return '';
  let parsed: any = content;

  if (typeof content === 'string') {
    try {
      parsed = JSON.parse(content);
    } catch {
      return content;
    }
  }

  // 1. Dạng object phức tạp (Dự báo AI có model_version, prediction_edges)
  if (parsed.model_version && Array.isArray(parsed.prediction_edges)) {
    if (parsed.prediction_edges.length === 0) {
      if (parsed.status === 'completed') {
        return t('ai.noImpact', { model: parsed.model_version });
      }
      return t('ai.processing', { model: parsed.model_version, status: parsed.status, error: parsed.error_message || '' });
    }

    const edgesInfos = parsed.prediction_edges.map((pe: any) => {
      const roadName = pe.edge?.name || t('map.roadWithId', { id: pe.edge_id });
      const time = pe.time_horizon_minutes;
      
      const sevMap: Record<string, string> = {
        severe: '🚨 ' + t('incidents.severity.critical'),
        heavy: '🔴 ' + t('incidents.severity.high'),
        high: '🟠 ' + t('incidents.severity.high'),
        moderate: '🟡 ' + t('incidents.severity.medium'), 
        medium: '🟡 ' + t('incidents.severity.medium'),
        low: '🟢 ' + t('incidents.severity.low'),
        light: '🟢 ' + t('incidents.severity.low')
      };
      
      const severity = sevMap[pe.severity?.toLowerCase()] || pe.severity;
      const conf = Math.round(Number(pe.confidence || 0) * 100) + '%';
      
      return t('ai.impactAfter', { severity, time, confidence: conf });
    });

    return t('ai.forecast', { model: parsed.model_version }) + '\n' + edgesInfos.map((e: string) => `• ${e}`).join('\n');
  }

  // 2. Dạng recommendation có type → dùng i18n để localize
  if (parsed.type && parsed.description) {
    const typeKey = `incidents.recommendations.${parsed.type}`;
    const translated = t(typeKey);
    // Nếu key tồn tại (khác key gốc), dùng bản dịch kèm count replacement
    if (translated !== typeKey) {
      return translated.replace(':count', String(parsed.details?.affected_edges?.length || 0));
    }
    // Fallback: trả về description gốc nếu không có key i18n
    return parsed.description;
  }

  // 3. Dạng text thông thường (Gợi ý AI có description, message...)
  const simpleText = parsed.description || parsed.message || parsed.title || parsed.prediction || parsed.text || parsed.content || parsed.insight || parsed.impact;
  if (simpleText) {
    return typeof simpleText === 'string' ? simpleText : JSON.stringify(simpleText);
  }

  // 4. Fallback
  return typeof parsed === 'string' ? parsed : JSON.stringify(parsed);
};

// ─── Component ──────────────────────────────────────────────────────────────

const IncidentDetailScreen = () => {
  const { t } = useTranslation();
  const route      = useRoute<IncidentDetailRouteProp>();
  const navigation = useNavigation();
  const { id }     = route.params;
  const insets = useSafeAreaInsets();
  const { isOperator, isEmergency } = useAuth();
  const canActOnIncident = isOperator || isEmergency;

  // Initialize Mapbox & other effects defensively
  React.useLayoutEffect(() => {
    if (MapboxGL && typeof MapboxGL.setAccessToken === 'function') {
      try {
        MapboxGL.setAccessToken(env.MAPBOX_ACCESS_TOKEN);
      } catch (err) {
        console.warn('Mapbox setAccessToken failed:', err);
      }
    }
  }, []);

  const [incident, setIncident]   = useState<Incident | null>(null);
  const [loading, setLoading]     = useState(true);
  const [dispatching, setDispatching] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);

  const severityMap = useMemo(() => getSeverityMap(t), [t]);
  const statusMap   = useMemo(() => getStatusMap(t), [t]);
  const typeMap     = useMemo(() => getTypeMap(t), [t]);

  const fetchIncident = useCallback(async () => {
    if (env.LOG_REPORT_DETAIL_PAYLOAD) {
      console.warn('[EmergencyIncident BE] bắt đầu fetch id=', id, '— xem log ở terminal Metro');
    }
    try {
      setLoading(true);
      const res = await incidentService.getIncident(id);
      logEmergencyIncidentFromBackend(id, res);
      if (res.success) setIncident(res.data);
    } catch (error: unknown) {
      const err = error as { message?: string; response?: { data?: unknown; status?: number } };
      Alert.alert(t('common.error'), t('incidents.fetchFailed'));
      if (env.LOG_REPORT_DETAIL_PAYLOAD) {
        console.warn('[EmergencyIncident BE] LỖI fetch:', err?.message);
        console.warn('[EmergencyIncident BE] HTTP status:', err?.response?.status);
        try {
          console.warn(
            '[EmergencyIncident BE] response.data:',
            JSON.stringify(err?.response?.data, null, 2),
          );
        } catch {
          console.warn('[EmergencyIncident BE] response.data (raw):', err?.response?.data);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchIncident(); }, [fetchIncident]);

  const handleDispatch = async () => {
    if (!incident) return;
    Alert.alert(
      t('emergency.confirmDispatchTitle'),
      t('emergency.confirmDispatchDesc', { title: incident.title }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('emergency.dispatch'),
          style: 'destructive',
          onPress: async () => {
            try {
              setDispatching(true);
              const update: UpdateIncidentData = { status: 'investigating' };
              await incidentService.updateIncident(id, update);
              await fetchIncident();
              Alert.alert(t('common.success'), t('emergency.dispatchSuccess'));
            } catch {
              Alert.alert(t('common.error'), t('emergency.dispatchFailed'));
            } finally {
              setDispatching(false);
            }
          },
        },
      ]
    );
  };

  const handleUpdateStatus = (newStatus: UpdateIncidentData['status']) => {
    if (!newStatus) return;
    const statusMap = getStatusMap(t);
    Alert.alert(
      t('incidents.updateStatus'),
      t('incidents.confirmStatusUpdateSimple', { status: (statusMap as any)[newStatus]?.label }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: async () => {
            try {
              await incidentService.updateIncident(id, { status: newStatus });
              await fetchIncident();
            } catch {
              Alert.alert(t('common.error'), t('incidents.updateFailed'));
            }
          },
        },
      ]
    );
  };

  // ─── Loading / Error ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (!incident) {
    return (
      <View style={styles.center}>
        <Icon name="alert-circle-outline" size={48} color={theme.colors.textSecondary} />
        <Text style={styles.emptyText}>{t('incidents.notFound')}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }


  const severity   = (severityMap as any)[incident.severity]   || severityMap.medium;
  const status     = (statusMap as any)[incident.status]       || statusMap.open;
  const typeInfo   = (typeMap as any)[getCleanIncidentType(incident.type)] || typeMap.other;

  const metadataImages: string[] =
    incident.metadata && Array.isArray((incident.metadata as any).images)
      ? ((incident.metadata as any).images as string[])
      : [];
  const metadataEntries: Array<[string, unknown]> =
    incident.metadata && typeof incident.metadata === 'object'
      ? Object.entries(incident.metadata).filter(([key]) => key !== 'images')
      : [];

  const isOpen          = incident.status === 'open';
  const isInvestigating = incident.status === 'investigating';
  const isResolved      = ['resolved', 'closed'].includes(incident.status);

  const timelineEvents = [
    {
      key:   'reported',
      label: t('incidents.event.reported'),
      time:  incident.created_at,
      color: '#EF4444',
      icon:  'flag',
      done:  true,
    },
    {
      key:   'investigating',
      label: t('incidents.investigating'),
      time:  isInvestigating || isResolved ? incident.updated_at : null,
      color: '#F59E0B',
      icon:  'progress-clock',
      done:  isInvestigating || isResolved,
    },
    {
      key:   'resolved',
      label: t('incidents.event.completed'),
      time:  incident.resolved_at,
      color: '#10B981',
      icon:  'check-circle',
      done:  !!incident.resolved_at,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.white} />

      <View style={[styles.topWhiteArea, { paddingTop: insets.top }]}>
        <View style={styles.headerShell}>
          <PageHeader
            title={t('incidents.detailWithId', { id: incident.id })}
            subtitle={typeInfo.label}
            variant="default"
            showNotification={false}
            style={styles.pageHeaderInner}
          />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* ── Hero: Badges + Title + Meta ── */}
        <View style={[styles.heroCard, { borderLeftColor: severity.color, borderLeftWidth: 4 }]}>
          {/* Top badges row */}
          <View style={styles.badgeRow}>
            {/* Severity */}
            <View style={[styles.badge, { backgroundColor: severity.color + '15' }]}>
              <Icon name={severity.icon} size={12} color={severity.color} />
              <Text style={[styles.badgeText, { color: severity.color }]}>{severity.label.toUpperCase()}</Text>
            </View>
            {/* Status */}
            <View style={[styles.badge, { backgroundColor: status.color + '15' }]}>
              <Icon name={status.icon} size={12} color={status.color} />
              <Text style={[styles.badgeText, { color: status.color }]}>{status.label.toUpperCase()}</Text>
            </View>
            {/* Type */}
            <View style={[styles.badge, { backgroundColor: theme.colors.backgroundSecondary }]}>
              <Icon name={typeInfo.icon} size={12} color={theme.colors.textSecondary} />
              <Text style={[styles.badgeText, { color: theme.colors.textSecondary }]}>{typeInfo.label.toUpperCase()}</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.heroTitle} numberOfLines={2}>
            {String(incident.title || t('incidents.noTitle'))}
          </Text>

          {/* Meta */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Icon name="clock-outline" size={13} color={theme.colors.textSecondary} />
              <Text style={styles.metaText}>{fmtDate(incident.created_at, t)}</Text>
            </View>
          </View>
          {incident.location_name && (
            <View style={styles.metaItem}>
              <Icon name="map-marker-outline" size={13} color={theme.colors.textSecondary} />
              <Text style={styles.metaText}>{incident.location_name}</Text>
            </View>
          )}
          {incident.location && 
           !isNaN(Number(incident.location.lat)) && 
           !isNaN(Number(incident.location.lng)) && (
            <View style={[styles.metaItem, { marginTop: 2 }]}>
              <Icon name="crosshairs-gps" size={13} color={theme.colors.textSecondary} />
              <Text style={styles.metaText}>
                {Number(incident.location.lat).toFixed(5)}, {Number(incident.location.lng).toFixed(5)}
              </Text>
            </View>
          )}
        </View>

        {/* ── Map Preview ── */}
        {incident.location && 
         !isNaN(Number(incident.location.lat)) && 
         !isNaN(Number(incident.location.lng)) && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>{t('map.mapTitleUppercase')}</Text>
            <View style={styles.mapPreviewWrap}>
              <MapboxGL.MapView
                style={styles.mapPreview}
                styleURL={MapboxGL.StyleURL.Street}
                logoEnabled={false}
                attributionEnabled={false}
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
              >
                <MapboxGL.Camera
                  zoomLevel={15}
                  centerCoordinate={[Number(incident.location.lng), Number(incident.location.lat)]}
                />

                <MapboxGL.PointAnnotation
                  id={`incident-location-${incident.id}`}
                  coordinate={[Number(incident.location.lng), Number(incident.location.lat)]}
                >
                  <View style={[styles.markerContainer, { borderColor: severity.color }]} pointerEvents="none">
                    <Icon name={typeInfo.icon} size={16} color={severity.color} />
                  </View>
                </MapboxGL.PointAnnotation>
              </MapboxGL.MapView>
            </View>

            <Text style={styles.mapCaption}>
              {incident.location_name
                ? String(incident.location_name)
                : `${Number(incident.location.lat).toFixed(5)}, ${Number(incident.location.lng).toFixed(5)}`}
            </Text>
          </View>
        )}

        {/* ── Incident Details ── */}
        {incident.description ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>{t('incidents.descriptionUppercase')}</Text>
            <Text style={styles.descText}>{incident.description}</Text>
          </View>
        ) : null}

        {/* ── Image Gallery ── */}
        {metadataImages.length > 0 && (
          <View style={styles.galleryCard}>
            {/* Image display */}
            <View style={styles.galleryContainer}>
              <Image
                source={{ uri: String(metadataImages[imgIdx]) }}
                style={styles.galleryImage}
                resizeMode="cover"
              />
              {/* Gradient overlay */}
              <View style={styles.galleryOverlay} />
              
              {/* Navigation arrows */}
              {metadataImages.length > 1 && (
                <>
                  <TouchableOpacity
                    style={styles.galleryArrowLeft}
                    onPress={() => setImgIdx((i) => (i - 1 + metadataImages.length) % metadataImages.length)}
                  >
                    <Icon name="chevron-left" size={24} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.galleryArrowRight}
                    onPress={() => setImgIdx((i) => (i + 1) % metadataImages.length)}
                  >
                    <Icon name="chevron-right" size={24} color="#fff" />
                  </TouchableOpacity>
                </>
              )}
              
              {/* Dots indicator */}
              {metadataImages.length > 1 && (
                <View style={styles.galleryDots}>
                  {metadataImages.map((_, i) => (
                    <TouchableOpacity
                      key={i}
                      onPress={() => setImgIdx(i)}
                    >
                      <View style={[
                        styles.galleryDot,
                        i === imgIdx && styles.galleryDotActive
                      ]} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── Reporter & Assigned ── */}
        <View style={styles.twoColRow}>
          {/* Reporter */}
          <View style={[styles.card, styles.halfCard, { borderLeftColor: '#8B5CF6', borderLeftWidth: 3 }]}>
            <Text style={styles.cardLabel}>{t('incidents.reporterUppercase')}</Text>
            {incident.reporter ? (
              <>
                <View style={styles.personRow}>
                  <View style={[styles.avatar, { backgroundColor: '#8B5CF620' }]}>
                    <Icon name="account" size={18} color="#8B5CF6" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.personName}>{incident.reporter.name}</Text>
                    <Text style={styles.personSub}>{incident.source === 'citizen' ? t('incidents.source.citizen') : t('incidents.source.operator')}</Text>
                  </View>
                </View>
              </>
            ) : (
              <Text style={styles.unassigned}>{t('common.unknown')}</Text>
            )}
          </View>

          {/* Assigned */}
          <View style={[styles.card, styles.halfCard, { borderLeftColor: '#3B82F6', borderLeftWidth: 3 }]}>
            <Text style={styles.cardLabel}>{t('incidents.assigneeUppercase')}</Text>
            {incident.assignee ? (
              <View style={styles.personRow}>
                <View style={[styles.avatar, { backgroundColor: '#3B82F620' }]}>
                  <Icon name="shield-account" size={18} color="#3B82F6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.personName}>{incident.assignee.name}</Text>
                  <Text style={styles.personSub}>{t('incidents.assigneeUnit')}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.personRow}>
                <View style={[styles.avatar, { backgroundColor: '#6B728020' }]}>
                  <Icon name="account-question" size={18} color="#6B7280" />
                </View>
                <Text style={styles.unassigned}>{t('incidents.notAssigned')}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Quick Actions ── */}
        {canActOnIncident ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>{t('incidents.quickActionsUppercase')}</Text>

            {/* Dispatch - primary action */}
            {!isResolved && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.dispatchBtn]}
                onPress={handleDispatch}
                disabled={dispatching}
              >
                {dispatching ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Icon name="phone-in-talk" size={20} color="#fff" />
                    <Text style={styles.actionBtnText}>{t('emergency.dispatchUnit')}</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Secondary actions row */}
            <View style={styles.secondaryActions}>
              {isOpen && (
                <TouchableOpacity
                  style={[
                    styles.secondaryBtn,
                    { borderColor: '#F59E0B20', backgroundColor: '#F59E0B08' },
                  ]}
                  onPress={() => handleUpdateStatus('investigating')}
                >
                  <Icon name="progress-clock" size={16} color="#F59E0B" />
                  <Text style={[styles.secondaryBtnText, { color: '#F59E0B' }]}>{t('incidents.startProcessing')}</Text>
                </TouchableOpacity>
              )}
              {(isOpen || isInvestigating) && (
                <TouchableOpacity
                  style={[
                    styles.secondaryBtn,
                    { borderColor: '#10B98120', backgroundColor: '#10B98108' },
                  ]}
                  onPress={() => handleUpdateStatus('resolved')}
                >
                  <Icon name="check-circle-outline" size={16} color="#10B981" />
                  <Text style={[styles.secondaryBtnText, { color: '#10B981' }]}>{t('incidents.markDone')}</Text>
                </TouchableOpacity>
              )}
              {!isResolved && (
                <TouchableOpacity
                  style={[
                    styles.secondaryBtn,
                    { borderColor: '#6B728020', backgroundColor: '#6B728008' },
                  ]}
                  onPress={() => handleUpdateStatus('closed')}
                >
                  <Icon name="close-circle-outline" size={16} color="#6B7280" />
                  <Text style={[styles.secondaryBtnText, { color: '#6B7280' }]}>{t('incidents.closeIncident')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>{t('incidents.viewOnlyUppercase')}</Text>
            <Text style={styles.viewOnlyText}>{t('incidents.viewOnlyDesc')}</Text>
          </View>
        )}

        {/* ── AI Analysis Card ── */}
        {incident.prediction && (
          <View style={styles.aiCard}>
            <View style={styles.aiCardHeader}>
              <View style={[styles.aiIconBox, { backgroundColor: '#F3E8FF' }]}>
                <Icon name="brain" size={18} color="#9333EA" />
              </View>
              <Text style={[styles.aiCardTitle, { color: '#9333EA' }]}>{t('incidents.aiAnalysis')}</Text>
              <View style={styles.aiModelBadge}>
                <Text style={styles.aiModelBadgeText}>{incident.prediction.model_version || 'ST-GCN'}</Text>
              </View>
            </View>
            
            {/* Grid stats */}
            <View style={styles.aiGridStats}>
              <View style={styles.aiStatItem}>
                <Text style={styles.aiStatValue}>
                  {incident.prediction.edges_count || 0}
                </Text>
                <Text style={styles.aiStatLabel}>{t('incidents.edgesAnalyzed')}</Text>
              </View>
              <View style={styles.aiStatItem}>
                <Text style={[styles.aiStatValue, { color: '#EF4444' }]}>
                  {Math.round((incident.prediction.max_density || 0) * 100)}%
                </Text>
                <Text style={styles.aiStatLabel}>{t('incidents.maxDensity')}</Text>
              </View>
              <View style={styles.aiStatItem}>
                <Text style={[styles.aiStatValue, { color: '#10B981' }]}>
                  {Math.round((incident.prediction.avg_confidence || 0) * 100)}%
                </Text>
                <Text style={styles.aiStatLabel}>{t('incidents.avgConfidence')}</Text>
              </View>
            </View>
            
            {/* Processing time */}
            {incident.prediction.processing_time_ms && (
              <View style={styles.aiProcessingTime}>
                <Icon name="lightning-bolt" size={12} color={theme.colors.textSecondary} />
                <Text style={styles.aiProcessingTimeText}>
                  {t('incidents.processingIn', { ms: incident.prediction.processing_time_ms })}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── Recommendations ── */}
        {incident.recommendations && incident.recommendations.length > 0 && (
          <View style={styles.recCard}>
            <View style={styles.recCardHeader}>
              <Icon name="check-circle" size={16} color="#10B981" />
              <Text style={styles.recCardTitle}>{t('incidents.approvedRecommendations')}</Text>
            </View>
            {incident.recommendations.map((rec: any, idx: number) => (
              <View key={idx} style={styles.recItemCard}>
                <View style={styles.recItemIcon}>
                  <Icon name={REC_ICON[rec.type] || 'check'} size={18} color="#10B981" />
                </View>
                <Text style={styles.recItemText}>{parseAIContent(rec, t)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Timeline ── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{t('incidents.timelineUppercase')}</Text>
          {timelineEvents.map((event, idx) => (
            <View key={event.key} style={styles.timelineRow}>
              {/* Dot + line */}
              <View style={styles.timelineDotCol}>
                <View style={[
                  styles.timelineDot,
                  { backgroundColor: event.done ? event.color : theme.colors.backgroundSecondary,
                    borderColor: event.done ? event.color : theme.colors.border }
                ]}>
                  {event.done && <Icon name={event.icon} size={10} color="#fff" />}
                </View>
                {idx < timelineEvents.length - 1 && (
                  <View style={[styles.timelineLine, { backgroundColor: timelineEvents[idx + 1].done ? event.color + '40' : theme.colors.border }]} />
                )}
              </View>

              {/* Content */}
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineLabel, { color: event.done ? theme.colors.text : theme.colors.textSecondary }]}>
                  {event.label}
                </Text>
                {event.time ? (
                  <Text style={styles.timelineTime}>{fmtDate(event.time, t)}</Text>
                ) : (
                  <Text style={[styles.timelineTime, { fontStyle: 'italic' }]}>{t('incidents.event.notHappened')}</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* ── Metadata ── */}
        {metadataEntries.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>{t('incidents.metadataUppercase')}</Text>
            {metadataEntries.map(([key, value]) => (
              <View key={key} style={styles.metadataRow}>
                <Text style={styles.metadataKey}>{key}</Text>
                <Text style={styles.metadataValue}>{String(value)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* bottom padding */}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  topWhiteArea: {
    backgroundColor: theme.colors.white,
  },
  headerShell: {
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  pageHeaderInner: {
    backgroundColor: theme.colors.transparent,
    elevation: 0,
    shadowOpacity: 0,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  loadingText: { marginTop: SPACING.md, color: theme.colors.textSecondary, fontSize: FONT_SIZE.sm },
  emptyText:   { marginTop: SPACING.md, color: theme.colors.textSecondary, fontSize: FONT_SIZE.md },
  backBtn: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: BORDER_RADIUS.md,
  },
  backBtnText: { color: '#fff', fontWeight: '700', fontSize: FONT_SIZE.sm },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: SCREEN_PADDING.horizontal, paddingTop: SPACING.md, paddingBottom: 60 },

  // Citizen/operator view-only hint
  viewOnlyText: {
    fontSize: FONT_SIZE.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },

  // Media (attached images)
  mediaScroll: { marginTop: SPACING.sm, marginBottom: SPACING.sm },
  mediaImage: {
    width: wp('70%'),
    height: wp('45%'),
    borderRadius: BORDER_RADIUS.lg,
    marginRight: SPACING.md,
    backgroundColor: theme.colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },

  // Gallery
  galleryCard: {
    marginBottom: SPACING.md,
    padding: 0,
    overflow: 'hidden',
  },
  galleryContainer: {
    width: '100%',
    height: 220,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  galleryOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'transparent',
  },
  galleryArrowLeft: {
    position: 'absolute',
    left: 10,
    top: '50%',
    transform: [{ translateY: -16 }],
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryArrowRight: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -16 }],
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryDots: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  galleryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  galleryDotActive: {
    backgroundColor: '#fff',
    width: 20,
  },

  // AI Grid Stats
  aiGridStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: BORDER_RADIUS.lg,
    padding: 12,
  },
  aiStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  aiStatValue: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.text,
  },
  aiStatLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  aiModelBadge: {
    marginLeft: 'auto',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#9333EA20',
  },
  aiModelBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#9333EA',
  },
  aiProcessingTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  aiProcessingTimeText: {
    fontSize: 10,
    color: theme.colors.textSecondary,
  },

  // Recommendations Card
  recCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#10B98130',
  },
  recCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  recCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recItemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: 8,
  },
  recItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#10B98115',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recItemText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: '#334155',
    lineHeight: 20,
    fontWeight: '500',
  },

  // Map preview
  mapPreviewWrap: {
    width: '100%',
    height: 190,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    backgroundColor: theme.colors.backgroundSecondary,
    marginBottom: SPACING.sm,
  },
  mapPreview: {
    flex: 1,
  },
  mapCaption: {
    fontSize: FONT_SIZE.xs,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    fontWeight: '600',
  },
  markerContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.white,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // AI Sections
  aiInsightsContainer: {
    marginBottom: SPACING.md,
  },
  aiCard: {
    backgroundColor: theme.colors.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    ...theme.shadows.sm,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.05)',
  },
  aiCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: 10,
  },
  aiIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiCardTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  aiContentBox: {
    gap: SPACING.sm,
  },
  recListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: BORDER_RADIUS.lg,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  aiResultText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: '#334155',
    lineHeight: 20,
    fontWeight: '500',
  },

  // Cards
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...theme.shadows.sm,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: theme.colors.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
  },
  cardLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.sm },

  // Hero
  heroCard: {
    backgroundColor: theme.colors.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...theme.shadows.sm,
  },
  badgeRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm, flexWrap: 'wrap' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  heroTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: theme.colors.text,
    lineHeight: 28,
    marginBottom: SPACING.sm,
  },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: FONT_SIZE.xs, color: theme.colors.textSecondary },

  // Description
  descText: { fontSize: FONT_SIZE.md, color: theme.colors.text, lineHeight: 24 },

  // Two columns
  twoColRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  halfCard: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginBottom: 0,
    ...theme.shadows.sm,
  },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: 4 },
  avatar: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  personName: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: theme.colors.text },
  personSub:  { fontSize: FONT_SIZE.xs, color: theme.colors.textSecondary },
  unassigned: { fontSize: FONT_SIZE.sm, color: theme.colors.textSecondary, fontStyle: 'italic', marginTop: 4 },

  // Actions
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.sm,
  },
  dispatchBtn: { backgroundColor: '#F43F5E' },
  actionBtnText: { fontSize: FONT_SIZE.md, fontWeight: '700', color: '#fff' },
  secondaryActions: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  secondaryBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg, borderWidth: 1,
    minWidth: '45%',
  },
  secondaryBtnText: { fontSize: FONT_SIZE.xs, fontWeight: '700' },

  // Recommendations / Predictions
  recItem: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm, alignItems: 'flex-start' },
  recText: { flex: 1, fontSize: FONT_SIZE.sm, color: theme.colors.text, lineHeight: 20 },

  // Timeline
  timelineRow: { flexDirection: 'row', marginBottom: 0 },
  timelineDotCol: { width: 24, alignItems: 'center' },
  timelineDot: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 0,
  },
  timelineLine: { width: 2, flex: 1, minHeight: 24, marginVertical: 2 },
  timelineContent: { flex: 1, paddingLeft: SPACING.md, paddingBottom: SPACING.md },
  timelineLabel: { fontSize: FONT_SIZE.sm, fontWeight: '700' },
  timelineTime:  { fontSize: FONT_SIZE.xs, color: theme.colors.textSecondary, marginTop: 2 },

  // Metadata table
  metadataRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight,
  },
  metadataKey:   { fontSize: FONT_SIZE.sm, color: theme.colors.textSecondary },
  metadataValue: { fontSize: FONT_SIZE.sm, color: theme.colors.text, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
});

export default IncidentDetailScreen;
