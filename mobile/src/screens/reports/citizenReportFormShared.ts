import type { CreateReportRequest, Media } from '../../types/api/report';

/** Sau upload media: giữ URI thiết bị để preview / đồng bộ với luồng Create. */
export type IncidentFormMedia = Media & {
  local_uri?: string;
  local_type?: string;
  local_name?: string;
};

export const CATEGORIES = [
  { value: 'accident', labelKey: 'reports.categories.accident', icon: 'car-emergency', color: '#F43F5E' },
  { value: 'congestion', labelKey: 'reports.categories.congestion', icon: 'traffic-light', color: '#F59E0B' },
  { value: 'construction', labelKey: 'reports.categories.construction', icon: 'hard-hat', color: '#10B981' },
  { value: 'weather', labelKey: 'reports.categories.weather', icon: 'weather-pouring', color: '#3B82F6' },
  { value: 'other', labelKey: 'reports.categories.other', icon: 'dots-horizontal', color: '#6B7280' },
] as const;

export const PRIORITIES = [
  { value: 'low', labelKey: 'reports.priorities.low', color: '#10B981' },
  { value: 'medium', labelKey: 'reports.priorities.medium', color: '#3B82F6' },
  { value: 'high', labelKey: 'reports.priorities.high', color: '#F59E0B' },
  { value: 'critical', labelKey: 'reports.priorities.critical', color: '#F43F5E' },
] as const;

/** BE phải trả object; `[]` truthy từng làm app coi là có data. */
export function isVisionDataObject(data: unknown): data is Record<string, unknown> {
  return data !== null && typeof data === 'object' && !Array.isArray(data);
}

/** Tiêu đề gửi lên API report (legacy): «Danh mục» - «địa chỉ». */
export function buildMobileIncidentTitle(
  danh_muc: string,
  dia_chi: string,
  vi_do: number,
  kinh_do: number,
  t: (key: string) => string,
): string {
  const category = CATEGORIES.find((c) => c.value === danh_muc);
  const categoryLabel = category ? t(category.labelKey) : t('reports.categories.other');
  const loc =
    dia_chi && String(dia_chi).trim() !== ''
      ? String(dia_chi).trim()
      : `${Number(vi_do).toFixed(5)}, ${Number(kinh_do).toFixed(5)}`;
  const raw = `${categoryLabel} - ${loc}`;
  return raw.length > 200 ? `${raw.slice(0, 197)}...` : raw;
}

/** Map `danh_muc_id` từ API report → chuỗi type incident (giống Create). */
export function danhMucIdToIncidentType(id: number): string {
  const m: Record<number, string> = {
    1: 'accident',
    2: 'congestion',
    3: 'construction',
    4: 'weather',
    5: 'weather',
    6: 'other',
  };
  return m[id] ?? 'other';
}

/** Map `uu_tien_id` từ API report → severity chuỗi. */
export function uuTienIdToSeverity(id: number): string {
  const m: Record<number, string> = {
    1: 'low',
    2: 'medium',
    3: 'high',
    4: 'critical',
  };
  return m[id] ?? 'medium';
}

export type CitizenReportFormState = {
  mo_ta: string;
  danh_muc: string;
  vi_do: number;
  kinh_do: number;
  dia_chi: string;
  uu_tien: string;
  la_cong_khai: boolean;
  media_ids: number[];
};

/** Payload `PUT /reports/:id` (field số) khớp ReportController::update. */
export function toReportUpdateBody(
  form: CitizenReportFormState,
  t: (key: string) => string,
): Partial<CreateReportRequest> {
  const typeToNum: Record<string, number> = {
    accident: 1,
    congestion: 2,
    construction: 3,
    weather: 4,
    other: 6,
  };
  const severityToNum: Record<string, number> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  };
  return {
    tieu_de: buildMobileIncidentTitle(form.danh_muc, form.dia_chi, form.vi_do, form.kinh_do, t),
    mo_ta: form.mo_ta,
    danh_muc: typeToNum[form.danh_muc] ?? 6,
    uu_tien: severityToNum[form.uu_tien] ?? 2,
    vi_do: form.vi_do,
    kinh_do: form.kinh_do,
    dia_chi: form.dia_chi,
  };
}
