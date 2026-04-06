import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, Modal, ActivityIndicator, PermissionsAndroid, Alert, Animated, StatusBar, Pressable } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MapboxGL from '@rnmapbox/maps';
import Geolocation from 'react-native-geolocation-service';
import PageHeader from '../../component/PageHeader';
import InputCustom from '../../component/InputCustom';
import ModalCustom from '../../component/ModalCustom';
import { AegisEntrance } from '../../components/common/AegisAnimated';
import { theme, COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SCREEN_PADDING, wp, hp, AegisCard } from '../../theme';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { aiService, incidentService, mapService, mediaService } from '../../services';
import env from '../../config/env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CATEGORIES,
  PRIORITIES,
  buildMobileIncidentTitle,
  isVisionDataObject,
  type IncidentFormMedia,
} from './citizenReportFormShared';

const DRAFT_KEY = '@civictwin_report_draft';

// Initialize Mapbox
MapboxGL.setAccessToken(env.MAPBOX_ACCESS_TOKEN);

const CreateReportScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  /** Một Modal duy nhất: working = AI + upload, summary = kết quả (tránh 2 Modal RN chồng nhau). */
  const [mediaWorkflowPhase, setMediaWorkflowPhase] = useState<'idle' | 'working' | 'summary'>('idle');
  /** Theo dõi từng bước thật — tránh tick % khiến “Hoàn tất” sáng trước khi AI/upload xong. */
  const [mediaWfAiDone, setMediaWfAiDone] = useState(false);
  const [mediaWfUploadDone, setMediaWfUploadDone] = useState(false);
  const [mediaWfFinishing, setMediaWfFinishing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [aiAnalysisMessage, setAiAnalysisMessage] = useState('');
  const [aiFilledFields, setAiFilledFields] = useState<string[]>([]);

  // Map Modal State
  const [showMapModal, setShowMapModal] = useState(false);
  const [tempLocation, setTempLocation] = useState<number[] | null>(null);
  const [tempAddress, setTempAddress] = useState('');
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [mapGpsLoading, setMapGpsLoading] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState<IncidentFormMedia[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [aiParseLoading, setAiParseLoading] = useState(false);
  const [aiVisionResult, setAiVisionResult] = useState<any>(null);
  const mapRef = useRef<MapboxGL.MapView>(null);
  const cameraRef = useRef<MapboxGL.Camera>(null);
  /** Tránh request geocode cũ ghi đè địa chỉ khi có tọa độ mới (GPS + chạm map chồng lên nhau). */
  const reverseGeocodeSeq = useRef(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Animation for category modal
  const categorySlideAnim = useRef(new Animated.Value(500)).current;
  const categoryBackdropAnim = useRef(new Animated.Value(0)).current;

  const [formData, setFormData] = useState<any>({
    mo_ta: '',
    danh_muc: 'accident',
    vi_do: 10.7769,
    kinh_do: 106.7009,
    dia_chi: '',
    uu_tien: 'medium',
    la_cong_khai: true,
    media_ids: [],
  });
  const [draftRestored, setDraftRestored] = useState(false);
  const isMounted = useRef(false);

  // Load draft on mount
  useEffect(() => {
    AsyncStorage.getItem(DRAFT_KEY).then(raw => {
      if (raw) {
        try {
          const saved = JSON.parse(raw) as Partial<any>;
          if (saved.mo_ta || saved.dia_chi) {
            const { the_tags: _removed, tieu_de: _oldTitle, ...rest } = saved;
            setFormData((prev: any) => ({ ...prev, ...rest, media_ids: [] }));
            setDraftRestored(true);
            setTimeout(() => setDraftRestored(false), 4000);
          }
        } catch { /* ignore corrupt draft */ }
      }
      isMounted.current = true;
    });
  }, []);

  // Auto-save draft on every form change (after mount)
  useEffect(() => {
    if (!isMounted.current) return;
    const saveable = {
      mo_ta: formData.mo_ta,
      dia_chi: formData.dia_chi,
      danh_muc: formData.danh_muc,
      uu_tien: formData.uu_tien,
      vi_do: formData.vi_do,
      kinh_do: formData.kinh_do,
      la_cong_khai: formData.la_cong_khai,
    };
    AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(saveable));
  }, [formData]);

  const handleAIParse = async () => {
    if (!formData.mo_ta.trim()) {
      setErrorMessage('Vui lòng nhập mô tả để AI phân tích.');
      setShowErrorModal(true);
      return;
    }

    setAiParseLoading(true);
    try {
      const response = await aiService.parseReport(formData.mo_ta);
      const data = response.data;
      if (__DEV__) {
        console.log('[CreateReport] parse-report: sẽ áp dụng từ `data`:', {
          type: data?.type,
          severity: data?.severity,
          location: data?.location,
          title: data?.title,
          summary_len: data?.summary?.length,
          error: data?.error,
        });
      }

      if (data?.error === 'NOT_ENOUGH_INFO') {
        setErrorMessage(data.message || 'AI không có đủ thông tin để phân tích.');
        setShowErrorModal(true);
        setAiParseLoading(false);
        return;
      }

      // Auto-fill form fields from AI response
      setFormData((prev: any) => ({
        ...prev,
        danh_muc: data?.type || prev.danh_muc,
        uu_tien: data?.severity || prev.uu_tien,
        dia_chi: data?.location || prev.dia_chi,
      }));

      setAiFilledFields(['danh_muc', 'uu_tien', 'dia_chi']);
      setSuccessMessage('AI đã phân tích và điền thông tin thành công!');
      setShowSuccessModal(true);
    } catch (error) {
      setErrorMessage('Lỗi khi AI phân tích mô tả.');
      setShowErrorModal(true);
    }
    setAiParseLoading(false);
  };

  const mapPriorityLevel = (priority: string): string => {
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    return validPriorities.includes(priority.toLowerCase()) ? priority.toLowerCase() : 'medium';
  };

  const mediaWorkflowAnimating =
    mediaWorkflowPhase === 'working' &&
    (!mediaWfAiDone || !mediaWfUploadDone || mediaWfFinishing);

  // Animate loading (giữ chạy suốt working cho đến khi upload xong + bước hoàn tất)
  useEffect(() => {
    let pulseLoop: Animated.CompositeAnimation | null = null;
    let rotateLoop: Animated.CompositeAnimation | null = null;

    if (mediaWorkflowAnimating) {
      // Pulse animation
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();

      // Rotate animation
      rotateLoop = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      );
      rotateLoop.start();
    } else {
      pulseAnim.setValue(1);
      rotateAnim.setValue(0);
    }

    return () => {
      pulseLoop?.stop();
      rotateLoop?.stop();
    };
  }, [mediaWorkflowAnimating]);

  // Animate category modal
  useEffect(() => {
    if (showCategoryModal) {
      Animated.parallel([
        Animated.spring(categorySlideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(categoryBackdropAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showCategoryModal]);

  const handleCloseCategoryModal = () => {
    Animated.parallel([
      Animated.timing(categorySlideAnim, {
        toValue: 500,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(categoryBackdropAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowCategoryModal(false);
    });
  };

  const uploadMediaAssets = async (assets: any[]) => {
    if (!assets?.length) return;

    const newMedia: IncidentFormMedia[] = [];
    const newMediaIds: number[] = [];
    const totalAssets = assets.length;
    const first = assets[0];

    try {
      setMediaWorkflowPhase('working');
      setMediaWfAiDone(false);
      setMediaWfUploadDone(false);
      setMediaWfFinishing(false);
      // —— Bước 1: phân tích ảnh đầu (vision) ——
      setUploadingMedia(false);
      setAiAnalyzing(true);
      setUploadProgress(8);
      setUploadStatus('Đang gửi ảnh cho AI phân tích...');

      let visionPayload: Record<string, unknown> | null = null;
      let visionBeMessage = '';
      try {
        const fd = new FormData();
        fd.append('image', {
          uri: first.uri,
          type: first.type || 'image/jpeg',
          name: first.fileName || 'photo.jpg',
        } as any);
        const visionRes = await aiService.analyzeImage(fd);
        visionBeMessage = (visionRes?.message as string) || '';
        if (__DEV__) {
          const d = visionRes?.data;
          console.log(
            '[CreateReport] analyze-image: success=',
            visionRes?.success,
            'message=',
            visionBeMessage || '(none)',
            'data=',
            Array.isArray(d) ? `array[len=${d.length}]` : d != null && typeof d === 'object' ? Object.keys(d as object) : String(d),
          );
        }
        if (visionRes.success && isVisionDataObject(visionRes.data)) {
          visionPayload = visionRes.data as Record<string, unknown>;
          setUploadProgress(32);
          setUploadStatus('Đang nhận kết quả từ AI...');
        } else {
          if (__DEV__) {
            console.warn('[CreateReport] analyze-image: bỏ qua data (không phải object JSON — có thể là [] hoặc null).');
          }
          setUploadProgress(28);
        }
      } catch (e) {
        console.warn('analyze-image:', e);
        setUploadStatus('Không phân tích được ảnh — vẫn tải ảnh lên bình thường');
        await new Promise<void>((r) => setTimeout(r, 500));
      }

      setUploadProgress(36);
      setAiAnalyzing(false);
      setMediaWfAiDone(true);
      setUploadingMedia(true);
      setUploadStatus('Đang áp dụng kết quả vào form...');
      setUploadProgress(40);

      if (visionPayload) {
        setAiVisionResult(visionPayload);
        const filledFields: string[] = [];
        const allowedTypes = ['accident', 'congestion', 'construction', 'weather', 'other'];
        const allowedSev = ['low', 'medium', 'high', 'critical'];

        const vType = typeof visionPayload.type === 'string' ? visionPayload.type : '';
        const vSev = typeof visionPayload.severity === 'string' ? visionPayload.severity : '';
        const vDesc =
          typeof visionPayload.description === 'string' ? visionPayload.description.trim() : '';

        if (vType && allowedTypes.includes(vType)) {
          filledFields.push('danh_muc');
        }
        if (vSev && allowedSev.includes(vSev)) {
          filledFields.push('uu_tien');
        }
        if (vDesc) {
          filledFields.push('mo_ta');
        }

        setFormData((prev: any) => {
          const next = { ...prev };
          if (vType && allowedTypes.includes(vType)) {
            next.danh_muc = vType;
          }
          if (vSev && allowedSev.includes(vSev)) {
            next.uu_tien = vSev;
          }
          if (vDesc) {
            next.mo_ta = vDesc;
          }
          return next;
        });

        setAiFilledFields((prev) => {
          const incoming = new Set(filledFields);
          const rest = prev.filter((f) => !incoming.has(f));
          return [...rest, ...filledFields];
        });

        const categoryLabel = CATEGORIES.find((c: any) => c.value === vType)?.label || 'Khác';
        const priorityLabel = PRIORITIES.find((p: any) => p.value === vSev)?.label || 'Trung bình';
        const confPct =
          visionPayload.confidence != null && !Number.isNaN(Number(visionPayload.confidence))
            ? `${Math.round(Number(visionPayload.confidence) * 100)}%`
            : null;
        const unclear = visionPayload.unclear === true;
        const userHint =
          typeof visionPayload.user_hint === 'string' ? visionPayload.user_hint.trim() : '';

        if (unclear) {
          setAiAnalysisMessage(
            `⚠️ ${visionBeMessage || 'Ảnh chưa đủ rõ để tự điền form.'}\n\n` +
              (userHint ? `${userHint}\n\n` : '') +
              (vDesc ? `📝 Gợi ý trong mô tả: ${vDesc}\n\n` : '') +
              `👉 Bạn nên xóa ảnh này, chụp lại (gần, sáng, rõ sự cố) rồi thêm lại.`,
          );
        } else {
          setAiAnalysisMessage(
            `AI đã phân tích ảnh${confPct ? ` (${confPct} tin cậy)` : ''} và điền form.\n\n` +
              `📁 Danh mục: ${categoryLabel}\n` +
              `⚠️ Mức độ: ${priorityLabel}\n\n` +
              `Tiêu đề khi gửi gồm loại sự cố và địa điểm bạn chọn. Hãy xem lại mô tả và vị trí trước khi gửi.`,
          );
        }
        if (__DEV__) {
          console.log('[CreateReport] Form đã ghi từ vision `data`:', {
            unclear,
            danh_muc: vType,
            uu_tien: vSev,
            mo_ta_len: vDesc.length,
            confidence: visionPayload.confidence,
          });
        }
      } else {
        setAiVisionResult(null);
      }

      // —— Bước 2: Tải toàn bộ ảnh lên media (preview + gửi incident sau) ——
      setUploadProgress(44);
      setUploadStatus(`Đang tải 0/${totalAssets} ảnh...`);

      for (let i = 0; i < totalAssets; i++) {
        const asset = assets[i];
        setUploadStatus(`Đang tải ${i + 1}/${totalAssets} ảnh...`);
        setUploadProgress(44 + Math.round(((i + 1) / totalAssets) * 48));

        try {
          const response = await mediaService.uploadMedia(
            asset,
            asset.type?.includes('video') ? 'video' : 'image',
            'phan_anh',
            'Hình ảnh phản ánh',
          );
          if (response.success && response.data) {
            newMedia.push({
              ...response.data,
              local_uri: asset.uri,
              local_type: asset.type || 'image/jpeg',
              local_name: asset.fileName || `upload_${Date.now()}.jpg`,
            });
            newMediaIds.push(response.data.id);
          }
        } catch (error) {
          console.error('Upload Media:', error);
        }
      }

      if (newMedia.length > 0) {
        setUploadedMedia((prev) => [...prev, ...newMedia]);
        setFormData((prev: any) => ({
          ...prev,
          media_ids: [...(prev.media_ids || []), ...newMediaIds],
        }));
      }

      setMediaWfUploadDone(true);
      setUploadingMedia(false);
      setUploadProgress(100);
      setUploadStatus('Đã tải xong ảnh');

      if (visionPayload) {
        setUploadStatus('Đang chuẩn bị hiển thị kết quả AI...');
        setMediaWfFinishing(true);
        await new Promise<void>((r) => setTimeout(r, 700));
        setMediaWfFinishing(false);
        setMediaWorkflowPhase('summary');
      } else {
        setMediaWorkflowPhase('idle');
      }
    } catch (error) {
      console.error('uploadMediaAssets:', error);
      setMediaWfAiDone(false);
      setMediaWfUploadDone(false);
      setMediaWfFinishing(false);
      setMediaWorkflowPhase('idle');
      setErrorMessage('Đã xảy ra lỗi khi xử lý ảnh. Vui lòng thử lại.');
      setShowErrorModal(true);
    } finally {
      setUploadingMedia(false);
      setAiAnalyzing(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.5, // Reduced quality to avoid 413
        maxWidth: 1024, // Resize large images
        maxHeight: 1024,
        saveToPhotos: true,
      });

      if (result.assets && result.assets.length > 0) {
        await uploadMediaAssets(result.assets);
      }
    } catch (error) {
      console.error('Camera error:', error);
      setErrorMessage('Không thể mở camera. Vui lòng kiểm tra quyền truy cập.');
      setShowErrorModal(true);
    }
  };

  const handleSelectFromGallery = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo', // Chỉ cho phép ảnh
        selectionLimit: 5 - uploadedMedia.length,
        quality: 0.5, // Reduced quality to avoid 413
        maxWidth: 1024, // Resize large images
        maxHeight: 1024,
      });

      if (result.assets && result.assets.length > 0) {
        await uploadMediaAssets(result.assets);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      setErrorMessage('Không thể chọn ảnh. Vui lòng thử lại.');
      setShowErrorModal(true);
    }
  };

  const handleSelectMedia = () => {
    if (uploadedMedia.length >= 5) {
      setErrorMessage('Bạn chỉ được tải lên tối đa 5 ảnh/video');
      setShowErrorModal(true);
      return;
    }

    Alert.alert(
      'Chọn hình ảnh',
      'Chọn nguồn hình ảnh',
      [
        {
          text: 'Chụp ảnh',
          onPress: handleTakePhoto,
        },
        {
          text: 'Chọn từ thư viện',
          onPress: handleSelectFromGallery,
        },
        {
          text: 'Hủy',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const handleRemoveMedia = (mediaId: number) => {
    setUploadedMedia(uploadedMedia.filter((m: any) => m.id !== mediaId));
    setFormData((prev: any) => ({
      ...prev,
      media_ids: (prev.media_ids || []).filter((id: number) => id !== mediaId)
    }));
  };

  const [errors, setErrors] = useState<{
    mo_ta?: string;
    dia_chi?: string;
  }>({});

  useEffect(() => {
    // Initialize tempLocation with current formData location when modal opens
    if (showMapModal) {
      setTempLocation([formData.kinh_do, formData.vi_do]);
      setTempAddress(formData.dia_chi);
    }
  }, [showMapModal]);

  // Căn camera theo ghim khi mở modal hoặc đổi điểm chọn / GPS trên bản đồ
  useEffect(() => {
    if (!showMapModal || !tempLocation || tempLocation.length < 2) return;
    const timer = setTimeout(() => {
      cameraRef.current?.flyTo([tempLocation[0], tempLocation[1]], 500);
    }, 200);
    return () => clearTimeout(timer);
  }, [showMapModal, tempLocation]);

  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            return;
          }
        } else {
          const auth = await Geolocation.requestAuthorization('whenInUse');
          if (auth !== 'granted') {
            return;
          }
        }

        Geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            const seq = ++reverseGeocodeSeq.current;

            let address = '';
            try {
              address = await mapService.reverseGeocode(latitude, longitude);
            } catch (error) {
              if (__DEV__) {
                console.warn('Reverse geocode error:', error);
              }
            }

            if (seq !== reverseGeocodeSeq.current) return;

            setFormData((prev: any) => ({
              ...prev,
              vi_do: latitude,
              kinh_do: longitude,
              dia_chi: address || prev.dia_chi,
            }));
          },
          (error) => {
            console.log('Location error:', error.code, error.message);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      } catch (error) {
        console.error('Permission error:', error);
      }
    };

    getCurrentLocation();
  }, []);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!formData.mo_ta.trim()) {
      newErrors.mo_ta = 'Vui lòng nhập mô tả';
    } else if (formData.mo_ta.length < 20) {
      newErrors.mo_ta = 'Mô tả phải có ít nhất 20 ký tự';
    }

    if (!formData.dia_chi.trim()) {
      newErrors.dia_chi = 'Vui lòng nhập địa chỉ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append(
        'title',
        buildMobileIncidentTitle(
          formData.danh_muc,
          formData.dia_chi,
          formData.vi_do,
          formData.kinh_do,
        ),
      );
      fd.append('type', formData.danh_muc);
      fd.append('severity', formData.uu_tien);
      fd.append('description', formData.mo_ta);
      fd.append('source', 'citizen');
      fd.append('location_name', formData.dia_chi);
      fd.append('latitude', formData.vi_do.toString());
      fd.append('longitude', formData.kinh_do.toString());

      // Multipart `images[]` kèm báo cáo
      uploadedMedia.slice(0, 5).forEach((m) => {
        fd.append('images[]', {
          uri: m.local_uri,
          type: m.local_type || 'image/jpeg',
          name: m.local_name || 'photo.jpg',
        } as any);
      });

      const response = await incidentService.createIncident(fd);

      if (response.success) {
        setSuccessMessage('Báo cáo của bạn đã được gửi thành công!');
        setShowSuccessModal(true);
      }
    } catch (error: any) {
      console.error('❌ [API Error] Create Incident:', error);
      setErrorMessage(error.response?.data?.message || 'Không thể tạo báo cáo. Vui lòng thử lại.');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    AsyncStorage.removeItem(DRAFT_KEY); // Clear draft after submit
    setShowSuccessModal(false);

    // Reset form data
    setFormData({
      mo_ta: '',
      danh_muc: 'accident',
      vi_do: 10.7769,
      kinh_do: 106.7009,
      dia_chi: '',
      uu_tien: 'medium',
      la_cong_khai: true,
      media_ids: [],
    });

    // Clear uploaded media
    setUploadedMedia([]);
    setErrors({});
    setAiFilledFields([]);

    // Navigate back
    navigation.goBack();
  };

  const handleMapPress = async (feature: any) => {
    const coords = feature.geometry.coordinates;
    setTempLocation(coords);

    try {
      setLoadingAddress(true);
      const seq = ++reverseGeocodeSeq.current;
      const address = await mapService.reverseGeocode(coords[1], coords[0]);
      if (seq !== reverseGeocodeSeq.current) return;
      setTempAddress(address);
    } catch (error) {
      if (__DEV__) {
        console.warn('Reverse Geocode:', error);
      }
    } finally {
      setLoadingAddress(false);
    }
  };

  const confirmLocation = () => {
    if (!tempLocation || tempLocation.length < 2) return;
    setFormData((prev: any) => ({
      ...prev,
      kinh_do: tempLocation[0],
      vi_do: tempLocation[1],
      dia_chi:
        (tempAddress && tempAddress.trim()) ||
        prev.dia_chi ||
        `Vị trí: ${tempLocation[1].toFixed(6)}, ${tempLocation[0].toFixed(6)}`,
    }));
    setShowMapModal(false);
  };

  const handleMyLocationOnMap = async () => {
    try {
      setMapGpsLoading(true);
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Quyền vị trí', 'Cần quyền vị trí để đưa ghim về chỗ bạn đang đứng.');
          return;
        }
      } else {
        const auth = await Geolocation.requestAuthorization('whenInUse');
        if (auth !== 'granted') {
          Alert.alert('Quyền vị trí', 'Bật quyền vị trí trong Cài đặt để dùng tính năng này.');
          return;
        }
      }

      Geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const coord: number[] = [longitude, latitude];
          setTempLocation(coord);
          setLoadingAddress(true);
          const seq = ++reverseGeocodeSeq.current;
          try {
            const address = await mapService.reverseGeocode(latitude, longitude);
            if (seq !== reverseGeocodeSeq.current) return;
            setTempAddress(address);
          } catch {
            if (seq !== reverseGeocodeSeq.current) return;
            setTempAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          } finally {
            setLoadingAddress(false);
            setMapGpsLoading(false);
          }
        },
        (error) => {
          Alert.alert('Không lấy được vị trí', error.message || 'Thử lại sau.');
          setMapGpsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
      );
    } catch {
      setMapGpsLoading(false);
    }
  };

  const openMapModal = () => {
    setTempLocation([formData.kinh_do, formData.vi_do]);
    setShowMapModal(true);
  };

  const submitDisabled = loading || uploadingMedia || aiAnalyzing;

  return (
    <View style={styles.screenRoot}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <View style={[styles.topWhiteArea, { paddingTop: insets.top }]}>
        <View style={styles.headerShell}>
          <PageHeader
            title="Báo cáo sự cố"
            variant="default"
            showBack={true}
            showNotification={false}
            style={styles.pageHeaderInner}
            rightComponent={
              <Pressable
                onPress={handleSubmit}
                disabled={submitDisabled}
                style={({ pressed }) => [
                  styles.headerSendPill,
                  submitDisabled && styles.headerSendPillDisabled,
                  pressed && !submitDisabled && styles.headerSendPillPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Gửi phản ánh"
                accessibilityState={{ disabled: submitDisabled, busy: loading }}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <Icon name="send" size={18} color={COLORS.white} />
                    <Text style={styles.headerSendPillText}>Gửi</Text>
                  </>
                )}
              </Pressable>
            }
          />
        </View>
      </View>

      {/* Draft Restored Banner */}
      {draftRestored && (
        <View style={styles.draftBanner}>
          <Icon name="content-save-outline" size={18} color={COLORS.primary} />
          <Text style={styles.draftBannerText}>Đã khôi phục bản nháp trước đó của bạn</Text>
          <TouchableOpacity onPress={() => {
            setDraftRestored(false);
            AsyncStorage.removeItem(DRAFT_KEY);
            setFormData({
              mo_ta: '',
              danh_muc: 'accident',
              vi_do: 10.7769,
              kinh_do: 106.7009,
              dia_chi: '',
              uu_tien: 'medium',
              la_cong_khai: true,
              media_ids: [],
            });
          }}>
            <Text style={styles.draftBannerDiscard}>Xóa nháp</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: SPACING['5xl'] + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Media Upload */}
        <AegisEntrance delay={120} preset="gentle">
          <AegisCard variant="default" padding="lg" borderRadius="xl" style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>HÌNH ẢNH</Text>
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.livePillText}>AI</Text>
            </View>
          </View>
          <Text style={styles.sectionSubtitle}>
            Thêm ảnh: AI đọc ảnh đầu tiên để gợi ý nội dung; mọi ảnh bạn chọn sẽ được đính kèm khi gửi phản ánh.
          </Text>

          {/* Kết quả phân tích ảnh (AI) */}
          {aiVisionResult && (
            <Animated.View style={styles.aiVisionCard}>
              <LinearGradient
                colors={['#10B981', '#3B82F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.aiVisionGradient}
              />
              <View style={styles.aiVisionContent}>
                <View style={styles.aiVisionHeader}>
                  <View style={styles.aiVisionTitleRow}>
                    <View style={styles.aiVisionIconBox}>
                      <Icon name="eye-outline" size={16} color="#10B981" />
                    </View>
                    <Text style={styles.aiVisionTitle}>AI PHÂN TÍCH HÌNH ẢNH</Text>
                  </View>
                  <TouchableOpacity onPress={() => setAiVisionResult(null)}>
                    <Icon name="close" size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <View style={styles.aiVisionBadgeRow}>
                  {aiVisionResult.type && (
                    <View style={styles.aiResultBadge}>
                      <Text style={styles.aiResultBadgeText}>{aiVisionResult.type.toUpperCase()}</Text>
                    </View>
                  )}
                  {aiVisionResult.severity && (
                    <View style={[styles.aiResultBadge, { backgroundColor: '#F43F5E20', borderColor: '#F43F5E40' }]}>
                      <Text style={[styles.aiResultBadgeText, { color: '#F43F5E' }]}>{aiVisionResult.severity.toUpperCase()}</Text>
                    </View>
                  )}
                </View>

                {aiVisionResult.description && (
                  <Text style={styles.aiVisionDesc}>{aiVisionResult.description}</Text>
                )}

                {aiVisionResult.confidence != null && (
                  <View style={styles.confidenceContainer}>
                    <View style={styles.confidenceHeader}>
                      <Text style={styles.confidenceLabel}>Độ tin cậy</Text>
                      <Text style={styles.confidenceValue}>{Math.round(aiVisionResult.confidence * 100)}%</Text>
                    </View>
                    <View style={styles.confidenceBarBg}>
                      <View
                        style={[
                          styles.confidenceBarFill,
                          { width: `${Math.min(aiVisionResult.confidence * 100, 100)}%` }
                        ]}
                      />
                    </View>
                  </View>
                )}

                <View style={styles.aiVisionFooter}>
                  <Icon name="auto-fix" size={14} color="#64748B" />
                  <Text style={styles.aiVisionFooterText}>AI đã tự động điền các trường thông tin</Text>
                </View>
              </View>
            </Animated.View>
          )}

          <View style={styles.mediaGrid}>
            {uploadedMedia.map((media: any, index: number) => (
              <View key={media.id} style={styles.mediaCard}>
                <Image
                  source={{ uri: media.thumbnail_url || media.url }}
                  style={styles.mediaPhoto}
                  resizeMode="cover"
                />
                <View style={styles.mediaOverlay}>
                  <View style={styles.mediaIndex}>
                    <Text style={styles.mediaIndexText}>{index + 1}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.mediaRemoveButton}
                    onPress={() => handleRemoveMedia(media.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Icon name="close-circle" size={24} color={theme.colors.white} />
                  </TouchableOpacity>
                </View>
                {(media as any).ai_analysis && (
                  <View style={styles.mediaAiBadge}>
                    <Icon name="check-decagram" size={14} color={theme.colors.success} />
                  </View>
                )}
              </View>
            ))}

            {uploadedMedia.length < 5 && (
              <TouchableOpacity
                style={styles.uploadCard}
                activeOpacity={0.7}
                onPress={handleSelectMedia}
                disabled={uploadingMedia}
              >
                {uploadingMedia ? (
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                ) : (
                  <>
                    <View style={styles.uploadIconBox}>
                      <Icon name="camera-plus-outline" size={32} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.uploadCardText}>Thêm ảnh</Text>
                    <Text style={styles.uploadCardHint}>{uploadedMedia.length}/5</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.uploadInfoRow}>
            <Icon name="information-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.uploadInfo}>
              Tối đa 5 ảnh (JPG, PNG). Ảnh đầu tiên được AI đọc để gợi ý; các ảnh còn lại chỉ đính kèm báo cáo.
            </Text>
          </View>
          </AegisCard>
        </AegisEntrance>

        {/* Category Selection - Select Style */}
        <AegisEntrance delay={220} preset="gentle">
          <AegisCard variant="default" padding="lg" borderRadius="xl" style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>DANH MỤC</Text>
            {aiFilledFields.includes('danh_muc') ? (
              <View style={styles.categoryBadgeAi}>
                <Text style={styles.categoryBadgeAiText}>AI</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.sectionSubtitle}>Chọn danh mục phù hợp với vấn đề</Text>

          <TouchableOpacity
            style={styles.categorySelectButton}
            onPress={() => setShowCategoryModal(true)}
            activeOpacity={0.7}
          >
            {(() => {
              const selectedCategory = CATEGORIES.find((c: any) => c.value === formData.danh_muc);
              return (
                <>
                  <View style={[
                    styles.categorySelectIcon,
                    { backgroundColor: selectedCategory ? selectedCategory.color + '15' : COLORS.backgroundSecondary }
                  ]}>
                    <Icon
                      name={selectedCategory?.icon || 'shape'}
                      size={24}
                      color={selectedCategory?.color || theme.colors.textSecondary}
                    />
                  </View>
                  <View style={styles.categorySelectContent}>
                    <Text style={styles.categorySelectLabel}>
                      {selectedCategory?.label || 'Chọn danh mục'}
                    </Text>
                    {selectedCategory && (
                      <Text style={styles.categorySelectHint}>Nhấn để thay đổi</Text>
                    )}
                  </View>
                  <Icon name="chevron-down" size={24} color={theme.colors.textSecondary} />
                </>
              );
            })()}
          </TouchableOpacity>
          </AegisCard>
        </AegisEntrance>

        {/* Main Info */}
        <AegisEntrance delay={320} preset="gentle">
          <AegisCard variant="default" padding="lg" borderRadius="xl" style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>NỘI DUNG</Text>
            <TouchableOpacity
              style={[styles.aiParsePill, aiParseLoading && styles.aiParsePillDisabled]}
              onPress={handleAIParse}
              disabled={aiParseLoading || !formData.mo_ta}
            >
              {aiParseLoading ? (
                <ActivityIndicator size="small" color={COLORS.accent} />
              ) : (
                <>
                  <Icon name="auto-fix" size={14} color={COLORS.accent} />
                  <Text style={styles.aiParsePillText}>AI PARSE</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionSubtitle}>
            Khi gửi, tiêu đề được tạo từ danh mục và địa chỉ. Viết mô tả rõ ràng; chạm AI Parse nếu muốn gợi ý từ đoạn chữ.
          </Text>

          <View style={styles.inputGroup}>
            <View style={styles.inputWithBadge}>
              <InputCustom
                label="Mô tả"
                placeholder="Mô tả chi tiết vấn đề"
                value={formData.mo_ta}
                onChangeText={(text) => {
                  setFormData({ ...formData, mo_ta: text });
                  // Remove from AI filled fields when manually edited
                  if (aiFilledFields.includes('mo_ta')) {
                    setAiFilledFields(prev => prev.filter(f => f !== 'mo_ta'));
                  }
                }}
                error={errors.mo_ta}
                leftIcon="text"
                multiline
                numberOfLines={5}
                maxLength={1000}
                containerStyle={styles.input}
              />
              {aiFilledFields.includes('mo_ta') && (
                <View style={[styles.aiFieldIndicator, { top: 8 }]}>
                  <Icon name="robot" size={12} color={theme.colors.primary} />
                </View>
              )}
            </View>
            <View style={styles.charCountRow}>
              <Text style={styles.charCount}>{formData.mo_ta.length}/1000</Text>
            </View>
          </View>

          <View style={styles.generatedTitlePreviewBox}>
            <View style={styles.generatedTitlePreviewHeader}>
              <Icon name="format-title" size={18} color={theme.colors.primary} />
              <Text style={styles.generatedTitlePreviewHeading}>Tiêu đề khi gửi</Text>
            </View>
            <Text style={styles.generatedTitlePreviewHint}>
              Cập nhật theo danh mục (trên) và địa chỉ (mục Vị trí).
            </Text>
            <Text style={styles.generatedTitlePreviewBody} numberOfLines={4}>
              {buildMobileIncidentTitle(
                formData.danh_muc,
                formData.dia_chi,
                formData.vi_do,
                formData.kinh_do,
              )}
            </Text>
          </View>
          </AegisCard>
        </AegisEntrance>

        {/* Location */}
        <AegisEntrance delay={420} preset="gentle">
          <AegisCard variant="default" padding="lg" borderRadius="xl" style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>VỊ TRÍ</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Đã tự lấy GPS khi mở màn hình (nếu được phép). Chạm &quot;Chọn vị trí trên bản đồ&quot; để chỉnh điểm, rồi Xác nhận — địa chỉ và tọa độ sẽ cập nhật theo ghim.
          </Text>

          <View style={styles.inputGroup}>
            <InputCustom
              label="Địa chỉ"
              placeholder="Nhập địa chỉ cụ thể"
              value={formData.dia_chi}
              onChangeText={(text) => setFormData({ ...formData, dia_chi: text })}
              error={errors.dia_chi}
              leftIcon="map-marker"
              containerStyle={styles.input}
            />
            <TouchableOpacity
              style={styles.mapButton}
              activeOpacity={0.7}
              onPress={openMapModal}
            >
              <View style={styles.mapButtonIcon}>
                <Icon name="map-search" size={24} color={theme.colors.primary} />
              </View>
              <View style={styles.mapButtonContent}>
                <Text style={styles.mapButtonText}>Chọn vị trí trên bản đồ</Text>
                <Text style={styles.mapButtonHint}>Chạm để mở bản đồ</Text>
              </View>
              <Icon name="chevron-right" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            {formData.vi_do && formData.kinh_do && (
              <Text style={styles.coordsText}>
                Tọa độ: {formData.vi_do.toFixed(6)}, {formData.kinh_do.toFixed(6)}
              </Text>
            )}
          </View>
          </AegisCard>
        </AegisEntrance>

        {/* Priority */}
        <AegisEntrance delay={520} preset="gentle">
          <AegisCard variant="default" padding="lg" borderRadius="xl" style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>MỨC ĐỘ</Text>
            {aiFilledFields.includes('uu_tien') ? (
              <View style={styles.categoryBadgeAi}>
                <Text style={styles.categoryBadgeAiText}>AI</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.sectionSubtitle}>Đánh giá mức độ nghiêm trọng của vấn đề</Text>

          <View style={styles.priorityContainer}>
            {PRIORITIES.map((priority: any) => {
              const isActive = formData.uu_tien === priority.value;
              const isAiFilled = isActive && aiFilledFields.includes('uu_tien');
              return (
                <TouchableOpacity
                  key={priority.value}
                  style={[
                    styles.priorityChip,
                    isActive && {
                      backgroundColor: priority.color,
                      borderColor: priority.color,
                    },
                    isAiFilled && styles.priorityChipAiFilled,
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, uu_tien: priority.value });
                    // Remove from AI filled fields when manually changed
                    if (aiFilledFields.includes('uu_tien')) {
                      setAiFilledFields(prev => prev.filter(f => f !== 'uu_tien'));
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.priorityContent}>
                    {isActive && <Icon name="check-circle" size={18} color={theme.colors.white} />}
                    <Text style={[
                      styles.priorityText,
                      isActive && { color: theme.colors.white, fontWeight: '700' }
                    ]}>
                      {priority.label}
                    </Text>
                    {isAiFilled && (
                      <Icon name="robot" size={14} color={theme.colors.white} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
          </AegisCard>
        </AegisEntrance>

        <AegisEntrance delay={620} preset="gentle">
          <View style={styles.footerBranding}>
            <View style={styles.footerLine} />
            <View style={styles.footerBrandRow}>
              <Icon name="shield-check" size={14} color={COLORS.primary} />
              <Text style={styles.footerBrandText}>CIVICTWIN AI • BÁO CÁO CÔNG DÂN</Text>
            </View>
          </View>
        </AegisEntrance>
      </ScrollView>

      {/* Map Modal */}
      <Modal
        visible={showMapModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMapModal(false)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.mapModalContainer} edges={['bottom']}>
            <View style={styles.mapHeader}>
              <TouchableOpacity onPress={() => setShowMapModal(false)} style={styles.closeButton}>
                <Icon name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
              <Text style={styles.mapTitle}>Chọn vị trí</Text>
              <TouchableOpacity onPress={confirmLocation} style={styles.confirmButton}>
                <Text style={styles.confirmButtonText}>Xác nhận</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.mapContainer}>
              <MapboxGL.MapView
                ref={mapRef}
                style={styles.map}
                styleURL={MapboxGL.StyleURL.Street}
                logoEnabled={false}
                attributionEnabled={false}
                onPress={handleMapPress}
              >
                <MapboxGL.Camera
                  ref={cameraRef}
                  zoomLevel={15}
                  centerCoordinate={tempLocation || [106.7009, 10.7769]}
                  animationMode="flyTo"
                  animationDuration={800}
                />
                {tempLocation && (
                  <MapboxGL.PointAnnotation
                    id="selectedLocation"
                    coordinate={tempLocation}
                  >
                    <View style={styles.markerContainer}>
                      <Icon name="map-marker" size={40} color={theme.colors.primary} />
                    </View>
                  </MapboxGL.PointAnnotation>
                )}
              </MapboxGL.MapView>

              <TouchableOpacity
                style={styles.mapMyLocationFab}
                onPress={handleMyLocationOnMap}
                disabled={mapGpsLoading}
                activeOpacity={0.85}
                accessibilityLabel="Vị trí của tôi"
              >
                {mapGpsLoading ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <Icon name="crosshairs-gps" size={22} color={theme.colors.primary} />
                )}
              </TouchableOpacity>

              <View style={styles.addressOverlay}>
                {loadingAddress ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <Text style={styles.addressText} numberOfLines={2}>
                    {tempAddress || 'Chạm vào bản đồ để chọn vị trí'}
                  </Text>
                )}
              </View>
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Success Modal */}
      <ModalCustom
        isModalVisible={showSuccessModal}
        setIsModalVisible={setShowSuccessModal}
        title="Thành công"
        type="success"
        isClose={false}
        actionText="OK"
        onPressAction={handleSuccessClose}
      >
        <Text style={styles.modalText}>{successMessage}</Text>
      </ModalCustom>

      {/* Error Modal */}
      <ModalCustom
        isModalVisible={showErrorModal}
        setIsModalVisible={setShowErrorModal}
        title="Lỗi"
        type="error"
        isClose={false}
        actionText="OK"
      >
        <Text style={styles.modalText}>{errorMessage}</Text>
      </ModalCustom>

      {/* Category Selection Modal - Animated Bottom Sheet */}
      {showCategoryModal && (
        <>
          {/* Backdrop */}
          <Animated.View
            style={[
              styles.categoryBackdrop,
              {
                opacity: categoryBackdropAnim,
              }
            ]}
          >
            <TouchableOpacity
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              activeOpacity={1}
              onPress={handleCloseCategoryModal}
            />
          </Animated.View>

          {/* Bottom Sheet */}
          <Animated.View
            style={[
              styles.categoryModalContent,
              {
                transform: [{ translateY: categorySlideAnim }],
              }
            ]}
          >
            {/* Sheet Handle */}
            <View style={styles.sheetHandle} />

            {/* Modal Header */}
            <View style={styles.categoryModalHeader}>
              <Text style={styles.categoryModalTitle}>Chọn danh mục</Text>
              <TouchableOpacity onPress={handleCloseCategoryModal}>
                <Icon name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.categoryModalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.categoryOptionsContainer}>
                {CATEGORIES.map((category: any) => {
                  const isSelected = formData.danh_muc === category.value;
                  return (
                    <TouchableOpacity
                      key={category.value}
                      style={[
                        styles.categoryOption,
                        isSelected && styles.categoryOptionSelected,
                        isSelected && { borderColor: category.color }
                      ]}
                      onPress={() => {
                        setFormData({ ...formData, danh_muc: category.value });
                        // Remove from AI filled fields when manually changed
                        if (aiFilledFields.includes('danh_muc')) {
                          setAiFilledFields(prev => prev.filter(f => f !== 'danh_muc'));
                        }
                        setTimeout(() => handleCloseCategoryModal(), 200);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.categoryOptionIcon,
                        { backgroundColor: category.color + '15' }
                      ]}>
                        <Icon
                          name={category.icon}
                          size={28}
                          color={category.color}
                        />
                      </View>
                      <View style={styles.categoryOptionContent}>
                        <Text style={[
                          styles.categoryOptionLabel,
                          isSelected && { color: category.color }
                        ]}>
                          {category.label}
                        </Text>
                      </View>
                      {isSelected && (
                        <View style={[styles.categoryOptionCheck, { backgroundColor: category.color }]}>
                          <Icon name="check" size={18} color={theme.colors.white} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </Animated.View>
        </>
      )}

      {/* Upload + AI: một Modal (working → summary) — không mở ModalCustom thứ hai */}
      <Modal
        visible={mediaWorkflowPhase !== 'idle'}
        transparent={true}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          if (mediaWorkflowPhase === 'summary') {
            setMediaWorkflowPhase('idle');
          }
        }}
      >
        <View style={styles.loadingOverlay}>
          {mediaWorkflowPhase === 'working' ? (
            <View style={styles.loadingCard}>
              <Animated.View
                style={[
                  styles.loadingIconContainer,
                  {
                    transform: [
                      { scale: pulseAnim },
                      {
                        rotate: rotateAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg'],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Icon name="robot" size={48} color={theme.colors.primary} />
              </Animated.View>

              <Text style={styles.loadingTitle}>
                {!mediaWfAiDone
                  ? '🤖 Đang phân tích ảnh'
                  : !mediaWfUploadDone
                    ? '📤 Đang tải ảnh lên'
                    : mediaWfFinishing
                      ? '✨ Đang hoàn tất'
                      : 'Đang xử lý'}
              </Text>
              <Text style={styles.loadingStatus}>{uploadStatus}</Text>

              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                  <Animated.View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${uploadProgress}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>{Math.round(uploadProgress)}%</Text>
              </View>

              <View style={styles.stepsContainer}>
                <View style={styles.stepItem}>
                  <View
                    style={[
                      styles.stepDot,
                      !mediaWfAiDone && styles.stepDotActive,
                      mediaWfAiDone && styles.stepDotCompleted,
                    ]}
                  >
                    {mediaWfAiDone ? (
                      <Icon name="check" size={12} color={theme.colors.white} />
                    ) : (
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.stepText,
                      !mediaWfAiDone && styles.stepTextActive,
                      mediaWfAiDone && styles.stepTextDone,
                    ]}
                  >
                    Phân tích AI
                  </Text>
                </View>

                <View style={styles.stepDivider} />

                <View style={styles.stepItem}>
                  <View
                    style={[
                      styles.stepDot,
                      mediaWfAiDone && !mediaWfUploadDone && styles.stepDotActive,
                      mediaWfUploadDone && styles.stepDotCompleted,
                    ]}
                  >
                    {mediaWfUploadDone ? (
                      <Icon name="check" size={12} color={theme.colors.white} />
                    ) : mediaWfAiDone ? (
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                    ) : null}
                  </View>
                  <Text
                    style={[
                      styles.stepText,
                      mediaWfAiDone && !mediaWfUploadDone && styles.stepTextActive,
                      mediaWfUploadDone && styles.stepTextDone,
                    ]}
                  >
                    Tải ảnh
                  </Text>
                </View>

                <View style={styles.stepDivider} />

                <View style={styles.stepItem}>
                  <View
                    style={[
                      styles.stepDot,
                      mediaWfUploadDone && mediaWfFinishing && styles.stepDotActive,
                      mediaWfUploadDone && mediaWfFinishing && styles.stepDotCompleted,
                    ]}
                  >
                    {mediaWfUploadDone && mediaWfFinishing ? (
                      <ActivityIndicator size="small" color={theme.colors.white} />
                    ) : null}
                  </View>
                  <Text
                    style={[
                      styles.stepText,
                      mediaWfUploadDone && mediaWfFinishing && styles.stepTextActive,
                    ]}
                  >
                    Hiển thị kết quả
                  </Text>
                </View>
              </View>

              <Text style={styles.loadingHint}>
                {!mediaWfAiDone
                  ? 'AI đang đọc ảnh — thường mất vài giây, vui lòng đợi.'
                  : !mediaWfUploadDone
                    ? 'Đang tải ảnh — vui lòng đợi và giữ mạng ổn định.'
                    : mediaWfFinishing
                      ? 'Chuẩn bị bảng tóm tắt cho bạn...'
                      : ''}
              </Text>
            </View>
          ) : (
            <View style={styles.loadingCard}>
              <LinearGradient
                colors={[theme.colors.success + '22', theme.colors.primary + '12']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.mediaSummaryIconRing}
              >
                <View style={styles.mediaSummaryIconWrap}>
                  <Icon name="check-decagram" size={40} color={theme.colors.success} />
                </View>
              </LinearGradient>
              <Text style={styles.loadingTitle}>Đã phân tích xong</Text>
              <Text style={styles.mediaSummarySubtitle}>
                Gợi ý đã được áp dụng vào form — bạn có thể chỉnh lại trước khi gửi.
              </Text>
              <ScrollView
                style={styles.mediaSummaryScroll}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.mediaSummaryMessageBox}>
                  <Text style={styles.aiModalText}>{aiAnalysisMessage}</Text>
                </View>
              </ScrollView>
              <TouchableOpacity
                style={styles.mediaSummaryButton}
                activeOpacity={0.85}
                onPress={() => setMediaWorkflowPhase('idle')}
              >
                <Text style={styles.mediaSummaryButtonText}>Đã hiểu, tiếp tục</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  topWhiteArea: {
    backgroundColor: COLORS.white,
  },
  headerShell: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerSendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
  },
  headerSendPillPressed: {
    opacity: 0.88,
  },
  headerSendPillDisabled: {
    opacity: 0.4,
  },
  headerSendPillText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.white,
  },
  pageHeaderInner: {
    backgroundColor: COLORS.transparent,
    elevation: 0,
    shadowOpacity: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SCREEN_PADDING.horizontal,
    paddingTop: SPACING.md,
  },
  sectionCard: {
    marginBottom: SPACING.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionHeading: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  livePill: {
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
  livePillText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.primary,
  },
  categoryBadgeAi: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: COLORS.successLight,
    borderWidth: 1,
    borderColor: COLORS.success + '35',
  },
  categoryBadgeAiText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.success,
    letterSpacing: 0.5,
  },
  aiParsePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.accent + '40',
    backgroundColor: COLORS.accent + '10',
  },
  aiParsePillDisabled: {
    opacity: 0.45,
  },
  aiParsePillText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.accent,
    letterSpacing: 0.3,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  categorySelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  categorySelectIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  categorySelectContent: {
    flex: 1,
  },
  categorySelectLabel: {
    fontSize: FONT_SIZE.md,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  categorySelectHint: {
    fontSize: FONT_SIZE.xs,
    color: theme.colors.textSecondary,
  },
  categoryBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  categoryModalContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: BORDER_RADIUS['2xl'],
    borderTopRightRadius: BORDER_RADIUS['2xl'],
    maxHeight: hp('70%'),
    paddingBottom: SPACING.xl,
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  categoryModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  categoryModalTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: theme.colors.text,
  },
  categoryModalScroll: {
    flex: 1,
  },
  categoryOptionsContainer: {
    padding: SPACING.md,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: theme.colors.background,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryOptionSelected: {
    backgroundColor: theme.colors.white,
    borderWidth: 2,
    ...theme.shadows.md,
  },
  categoryOptionIcon: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  categoryOptionContent: {
    flex: 1,
  },
  categoryOptionLabel: {
    fontSize: FONT_SIZE.lg,
    color: theme.colors.text,
    fontWeight: '600',
  },
  categoryOptionCheck: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  input: {
    marginBottom: 0,
  },
  charCount: {
    fontSize: FONT_SIZE.xs,
    color: theme.colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  charCountRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  inputWithBadge: {
    position: 'relative',
  },
  aiFieldIndicator: {
    position: 'absolute',
    top: -8,
    right: 8,
    backgroundColor: theme.colors.primary + '15',
    borderRadius: BORDER_RADIUS.full,
    padding: 6,
    borderWidth: 2,
    borderColor: theme.colors.white,
    ...theme.shadows.sm,
  },
  generatedTitlePreviewBox: {
    marginTop: SPACING.xs,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: theme.colors.primary + '0C',
    borderWidth: 1,
    borderColor: theme.colors.primary + '28',
  },
  generatedTitlePreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.xs,
  },
  generatedTitlePreviewHeading: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: theme.colors.text,
  },
  generatedTitlePreviewHint: {
    fontSize: FONT_SIZE.xs,
    color: theme.colors.textSecondary,
    marginBottom: SPACING.sm,
    lineHeight: 18,
  },
  generatedTitlePreviewBody: {
    fontSize: FONT_SIZE.sm,
    color: theme.colors.text,
    fontWeight: '600',
    lineHeight: 22,
  },
  aiFilledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.success + '10',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: theme.colors.success + '30',
  },
  aiFilledText: {
    fontSize: FONT_SIZE.xs,
    color: theme.colors.success,
    fontWeight: '600',
  },
  priorityChipAiFilled: {
    ...theme.shadows.sm,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  mapButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  mapButtonContent: {
    flex: 1,
  },
  mapButtonText: {
    fontSize: FONT_SIZE.md,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  mapButtonHint: {
    fontSize: FONT_SIZE.xs,
    color: theme.colors.textSecondary,
  },
  coordsText: {
    fontSize: FONT_SIZE.xs,
    color: theme.colors.textSecondary,
    marginTop: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  priorityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  priorityChip: {
    flex: 1,
    minWidth: '47%',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  priorityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  priorityText: {
    fontSize: FONT_SIZE.md,
    color: theme.colors.text,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  uploadIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  uploadTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  mediaCard: {
    width: (wp('100%') - SCREEN_PADDING.horizontal * 2 - SPACING.md * 3) / 2,
    aspectRatio: 1,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: theme.colors.backgroundSecondary,
    ...theme.shadows.sm,
  },
  mediaPhoto: {
    width: '100%',
    height: '100%',
  },
  mediaOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  mediaIndex: {
    position: 'absolute',
    top: SPACING.xs,
    left: SPACING.xs,
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaIndexText: {
    color: theme.colors.white,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  mediaRemoveButton: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
  },
  mediaAiBadge: {
    position: 'absolute',
    bottom: SPACING.xs,
    left: SPACING.xs,
    backgroundColor: theme.colors.white,
    borderRadius: BORDER_RADIUS.full,
    padding: 4,
    ...theme.shadows.md,
  },
  uploadCard: {
    width: (wp('100%') - SCREEN_PADDING.horizontal * 2 - SPACING.md * 3) / 2,
    aspectRatio: 1,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '05',
  },
  uploadIconBox: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  uploadCardText: {
    fontSize: FONT_SIZE.md,
    color: theme.colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  uploadCardHint: {
    fontSize: FONT_SIZE.xs,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  uploadInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  uploadInfo: {
    flex: 1,
    fontSize: FONT_SIZE.xs,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: theme.colors.background,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  privacyIconBox: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  privacyContent: {
    flex: 1,
  },
  privacyLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 2,
  },
  privacyDescription: {
    fontSize: FONT_SIZE.xs,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  footerBranding: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  footerLine: {
    width: 40,
    height: 1,
    backgroundColor: COLORS.borderDark,
    opacity: 0.35,
    marginBottom: SPACING.md,
  },
  footerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    opacity: 0.55,
  },
  footerBrandText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.textTertiary,
    letterSpacing: 1.5,
  },
  submitInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: theme.colors.info + '10',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: theme.colors.info + '30',
  },
  submitInfoText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: theme.colors.info,
    fontWeight: '500',
    lineHeight: 20,
  },
  modalText: {
    textAlign: 'center',
    color: theme.colors.text,
    fontSize: FONT_SIZE.md,
  },
  aiModalText: {
    textAlign: 'left',
    color: theme.colors.text,
    fontSize: FONT_SIZE.sm,
    lineHeight: 22,
    paddingHorizontal: SPACING.xs,
  },
  mapModalContainer: {
    flex: 1,
    backgroundColor: theme.colors.white,
    marginTop: hp('20%'), // Start from 20% down (80% height)
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...theme.shadows.lg,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  closeButton: {
    padding: SPACING.sm,
  },
  mapTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: theme.colors.text,
  },
  confirmButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: BORDER_RADIUS.md,
  },
  confirmButtonText: {
    color: theme.colors.white,
    fontWeight: '600',
    fontSize: FONT_SIZE.sm,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapMyLocationFab: {
    position: 'absolute',
    bottom: 88,
    right: SPACING.md,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    ...theme.shadows.md,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressOverlay: {
    position: 'absolute',
    bottom: SPACING.xl,
    left: SPACING.md,
    right: SPACING.md,
    backgroundColor: theme.colors.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    ...theme.shadows.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  addressText: {
    color: theme.colors.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingCard: {
    backgroundColor: theme.colors.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl * 1.5,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    ...theme.shadows.xl,
  },
  loadingIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 3,
    borderColor: theme.colors.primary + '30',
  },
  loadingTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  loadingStatus: {
    fontSize: FONT_SIZE.md,
    color: theme.colors.textSecondary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '100%',
    marginBottom: SPACING.lg,
  },
  progressBarBackground: {
    width: '100%',
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: BORDER_RADIUS.full,
  },
  progressText: {
    fontSize: FONT_SIZE.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  stepDotActive: {
    backgroundColor: theme.colors.primary + '30',
    borderColor: theme.colors.primary,
  },
  stepDotCompleted: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  stepText: {
    fontSize: FONT_SIZE.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  stepTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  stepTextDone: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  stepDivider: {
    height: 2,
    backgroundColor: theme.colors.border,
    flex: 0.5,
    marginHorizontal: -SPACING.xs,
    marginBottom: SPACING.lg,
  },
  loadingHint: {
    fontSize: FONT_SIZE.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  mediaSummaryIconRing: {
    padding: 3,
    borderRadius: 42,
    marginBottom: SPACING.md,
  },
  mediaSummaryIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaSummarySubtitle: {
    fontSize: FONT_SIZE.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  mediaSummaryMessageBox: {
    width: '100%',
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  mediaSummaryScroll: {
    width: '100%',
    maxHeight: 240,
    marginBottom: SPACING.lg,
  },
  mediaSummaryButton: {
    width: '100%',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  mediaSummaryButtonText: {
    color: theme.colors.white,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  draftBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.infoLight,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.info + '25',
    paddingHorizontal: SCREEN_PADDING.horizontal,
    paddingVertical: SPACING.sm,
  },
  draftBannerText: {
    flex: 1,
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: COLORS.info,
  },
  draftBannerDiscard: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: theme.colors.error,
  },
  // AI Vision Styles
  aiVisionCard: {
    backgroundColor: theme.colors.white,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#10B98130',
    ...theme.shadows.md,
  },
  aiVisionGradient: {
    height: 4,
    width: '100%',
  },
  aiVisionContent: {
    padding: SPACING.md,
  },
  aiVisionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  aiVisionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiVisionIconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B98115',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiVisionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 1,
  },
  aiVisionBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.sm,
  },
  aiResultBadge: {
    backgroundColor: '#3B82F615',
    borderColor: '#3B82F630',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  aiResultBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#3B82F6',
  },
  aiVisionDesc: {
    fontSize: FONT_SIZE.sm,
    color: theme.colors.text,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  confidenceContainer: {
    marginBottom: SPACING.md,
  },
  confidenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  confidenceLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  confidenceValue: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
  },
  confidenceBarBg: {
    height: 6,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  aiVisionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  aiVisionFooterText: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
});

export const citizenReportScreenStyles = styles;

export default CreateReportScreen;
