import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Platform, StatusBar, Image,
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

// MapboxGL.setAccessToken should be called inside component/lifecycle in version 10+


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

  // 2. Dạng text thông thường (Gợi ý AI có description, message...)
  const simpleText = parsed.description || parsed.message || parsed.title || parsed.prediction || parsed.text || parsed.content || parsed.insight || parsed.impact;
  if (simpleText) {
    return typeof simpleText === 'string' ? simpleText : JSON.stringify(simpleText);
  }

  // 3. Fallback
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

        {/* Attached images from BE (metadata.images) */}
        {metadataImages.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>{t('incidents.attachedImagesUppercase')}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.mediaScroll}
            >
              {metadataImages.map((url, idx) => (
                <Image
                  key={`${url}-${idx}`}
                  source={{ uri: String(url) }}
                  style={styles.mediaImage}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
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

        {/* ── AI Insights Row ── */}
        {( (incident.recommendations && incident.recommendations.length > 0) || (incident.predictions && incident.predictions.length > 0) ) && (
          <View style={styles.aiInsightsContainer}>
             {/* Recommendations Section */}
             {incident.recommendations && incident.recommendations.length > 0 && (
                <View style={styles.aiCard}>
                  <View style={styles.aiCardHeader}>
                    <View style={[styles.aiIconBox, { backgroundColor: '#EEF2FF' }]}>
                      <Icon name="brain" size={18} color="#6366F1" />
                    </View>
                    <Text style={[styles.aiCardTitle, { color: '#6366F1' }]}>{t('incidents.aiRecommendations')}</Text>
                  </View>
                  <View style={styles.aiContentBox}>
                    {incident.recommendations.map((rec: any, idx: number) => (
                      <View key={idx} style={styles.recListItem}>
                        <View style={[styles.bullet, { backgroundColor: '#6366F1' }]} />
                        <Text style={styles.aiResultText}>{parseAIContent(rec, t)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
             )}

             {/* Predictions Section */}
             {incident.predictions && incident.predictions.length > 0 && (
                <View style={[styles.aiCard, { marginTop: SPACING.md }]}>
                  <View style={styles.aiCardHeader}>
                    <View style={[styles.aiIconBox, { backgroundColor: '#F5F3FF' }]}>
                      <Icon name="chart-timeline-variant" size={18} color="#8B5CF6" />
                    </View>
                    <Text style={[styles.aiCardTitle, { color: '#8B5CF6' }]}>{t('incidents.aiPredictions')}</Text>
                  </View>
                  <View style={styles.aiContentBox}>
                    {incident.predictions.map((pred: any, idx: number) => (
                      <View key={idx} style={styles.recListItem}>
                        <View style={[styles.bullet, { backgroundColor: '#8B5CF6' }]} />
                        <Text style={styles.aiResultText}>{parseAIContent(pred, t)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
             )}
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
