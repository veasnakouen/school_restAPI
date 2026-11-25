import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Article as ArticleIcon,
  BookmarkAdd as BookmarkAddIcon,
  CloudUpload as CloudUploadIcon,
  CropLandscape as LandscapeIcon,
  CropPortrait as PortraitIcon,
  DashboardCustomize as LayoutIcon,
  DragIndicator as DragIndicatorIcon,
  Functions as FunctionsIcon,
  PictureAsPdf as PdfIcon,
  Print as PrintIcon,
  Refresh as RefreshIcon,
  RestartAlt as ResetIcon,
  TableChart as ExcelIcon,
  Tune as TuneIcon,
  ViewColumn as ViewColumnIcon,
  ViewSidebar as ViewSidebarIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import * as api from '../../services/api';
import { VEHICLE_FILTER_OPTIONS } from './vehicleFilterUtils';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SearchField } from '../../components/SearchField';

export interface ColumnOption {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
}

export type BlockId = 'header' | 'metadata' | 'table' | 'kpi' | 'notes' | 'signatures';
export type AggregateFn = 'SUM' | 'AVG' | 'COUNT' | 'NONE';

interface SavedReportTemplate {
  id: string;
  name: string;
  config: api.CustomInventoryReportRequest;
  blockOrder: BlockId[];
  hiddenBlocks: BlockId[];
  aggregateFn: AggregateFn;
  accentColor: string;
  orientation: 'landscape' | 'portrait';
  fontSizePx: number;
  notesText: string;
}

const STORAGE_KEY = 'ims_wysiwyg_report_templates_v1';

const REPORT_COLUMNS: ColumnOption[] = [
  { key: 'codeNumber', label: 'Code No' },
  { key: 'name', label: 'Item Name' },
  { key: 'initialQuantity', label: 'Q.Ty', align: 'center' },
  { key: 'quality', label: '% New', align: 'center' },
  { key: 'attributes', label: 'Size/Color' },
  { key: 'brandName', label: 'Brand' },
  { key: 'price', label: 'Unit Price', align: 'right' },
  { key: 'invoiceDate', label: 'Invoice Date', align: 'center' },
  { key: 'departmentName', label: 'Location' },
  { key: 'responsiblePerson', label: 'Responsible Person' },
  { key: 'supplierName', label: 'Suppliers' },
  { key: 'voucherNumber', label: 'Voucher #', align: 'center' },
  { key: 'donorName', label: 'Donor' },
  { key: 'categoryName', label: 'Category' },
  { key: 'totalValue', label: 'Total Value', align: 'right' },
  { key: 'purchaseType', label: 'Acquisition' },
  { key: 'year', label: 'Year', align: 'center' },
  { key: 'plateNumber', label: 'Plate #' },
  { key: 'engineNumber', label: 'Engine/Serial #' },
  { key: 'description', label: 'Description' },
];

const LEGACY_YEARLY_COLUMNS = [
  'codeNumber',
  'name',
  'initialQuantity',
  'quality',
  'attributes',
  'brandName',
  'price',
  'invoiceDate',
  'departmentName',
  'responsiblePerson',
  'supplierName',
  'voucherNumber',
  'donorName',
];

const DEFAULT_EXECUTIVE_COLUMNS = [
  'codeNumber',
  'name',
  'categoryName',
  'brandName',
  'departmentName',
  'quality',
  'initialQuantity',
  'price',
  'totalValue',
  'responsiblePerson',
];

const BLOCK_LABELS: Record<BlockId, string> = {
  header: 'Document Header & Logo',
  metadata: 'Period & Filter Metadata',
  table: 'Inventory Data Table',
  kpi: 'Summary Totals & Valuation',
  notes: 'Custom Notes / Formula Text',
  signatures: '3-Column Approval Signatures',
};

const ACCENT_COLORS = ['#1e40af', '#0f172a', '#0f766e', '#991b1b', '#475569'];

const triggerDownload = (blobData: Blob, filename: string) => {
  const url = URL.createObjectURL(blobData);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const formatLegacyDate = (iso?: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${d.getDate()}-${d.toLocaleString('en-US', { month: 'short' })}-${String(d.getFullYear()).slice(-2)}`;
};

const formatSupplierWithPhone = (p: api.ProductDto): string => {
  let sup = p.supplierName || '';
  if (
    sup.toLowerCase() === 'default supplier (excel import)' ||
    sup.toLowerCase() === 'donated (no supplier)'
  ) {
    sup = '';
  }
  const phones = (p.supplierContactList || []).filter((x) => Boolean(x?.trim()));
  if (phones.length > 0 && !sup.toLowerCase().includes('tel')) {
    return sup ? `${sup} Tel: ${phones.join(', ')}` : `Tel: ${phones.join(', ')}`;
  }
  return sup || '-';
};

const cleanDonorName = (raw?: string | null): string => {
  if (!raw) return '';
  const cleaned = raw
    .replace(/^Donor:\s*/i, '')
    .replace(/\s*\|\s*Sheet:.*$/i, '')
    .trim();
  return cleaned.toUpperCase() === 'N/A' ? '' : cleaned;
};

const resolveItemYear = (p: api.ProductDto): number => {
  if (p.invoiceDate) {
    const dt = new Date(p.invoiceDate);
    if (!isNaN(dt.getTime())) return dt.getFullYear();
  }
  if (p.year) {
    const dt = new Date(p.year);
    if (!isNaN(dt.getTime())) return dt.getFullYear();
  }
  if (p.codeNumber) {
    const m4 = p.codeNumber.match(/^(19|20)\d{2}\b/);
    if (m4) return Number(m4[0]);
    const m2 = p.codeNumber.match(/^MT(\d{2})-/i);
    if (m2) return 2000 + Number(m2[1]);
  }
  return 9999;
};

const formatCellValue = (
  item: api.ProductDto,
  key: string,
  templateStyle: 'Standard' | 'LegacyYearlyList'
): string => {
  const qty = item.initialQuantity ?? 1;
  const price = item.price ?? 0;
  const isLegacy = templateStyle === 'LegacyYearlyList';

  switch (key) {
    case 'codeNumber':
      return item.codeNumber || '-';
    case 'name':
      return item.name || '-';
    case 'categoryName':
      return item.categoryName || '-';
    case 'brandName':
      return item.brandName || (isLegacy ? '' : '-');
    case 'departmentName':
      return item.departmentName || (isLegacy ? '' : '-');
    case 'quality':
      return item.quality || (isLegacy ? '' : '-');
    case 'initialQuantity':
      return String(qty);
    case 'price':
      if (isLegacy && price === 0 && item.purchaseType?.toLowerCase() === 'donated') {
        return 'Donation';
      }
      return item.price != null
        ? `$ ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : '-';
    case 'totalValue':
      return `$ ${(price * qty).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'responsiblePerson':
      return item.responsiblePerson || (isLegacy ? '' : '-');
    case 'supplierName':
      return formatSupplierWithPhone(item);
    case 'donorName':
      return cleanDonorName(item.donorName) || (isLegacy ? '' : '-');
    case 'purchaseType':
      return item.purchaseType || '-';
    case 'voucherNumber':
      return item.voucherNumber || 'N/A';
    case 'invoiceDate':
      return isLegacy
        ? formatLegacyDate(item.invoiceDate)
        : item.invoiceDate
          ? new Date(item.invoiceDate).toLocaleDateString()
          : '-';
    case 'year':
      return item.year ? String(new Date(item.year).getFullYear()) : '-';
    case 'plateNumber':
      return item.plateNumber || '-';
    case 'engineNumber':
      return item.engineNumber || '-';
    case 'attributes':
      return item.attributes || (isLegacy ? '' : '-');
    case 'description':
      return item.description || '-';
    default:
      return '-';
  }
};

export const WysiwygReportBuilder: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  // Studio Layout Mode
  const [studioView, setStudioView] = useState<'split' | 'canvas'>('split');
  const [inspectorTab, setInspectorTab] = useState<'design' | 'columns' | 'filters'>('design');
  const [zoom, setZoom] = useState<number>(100);
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [accentColor, setAccentColor] = useState<string>('#1e40af');
  const [fontSizePx, setFontSizePx] = useState<number>(9.5);
  const [aggregateFn, setAggregateFn] = useState<AggregateFn>('SUM');
  const [showYearlySubtotals, setShowYearlySubtotals] = useState<boolean>(true);

  // Reorderable Paper Section Blocks
  const [blockOrder, setBlockOrder] = useState<BlockId[]>([
    'header',
    'metadata',
    'table',
    'kpi',
    'notes',
    'signatures',
  ]);
  const [hiddenBlocks, setHiddenBlocks] = useState<BlockId[]>(['kpi']);
  const [notesText, setNotesText] = useState<string>(
    'Summary Formula Check: {{TotalItems}} distinct items · {{TotalQty}} total units · Total Asset Valuation {{GrandTotal}} (Generated {{Today}}).'
  );

  // Drag-and-Drop States (Columns & Sections)
  const [dragColKey, setDragColKey] = useState<string | null>(null);
  const [overColKey, setOverColKey] = useState<string | null>(null);
  const [dragBlockId, setDragBlockId] = useState<BlockId | null>(null);
  const [overBlockId, setOverBlockId] = useState<BlockId | null>(null);

  // Lookups & Saved Presets
  const [categories, setCategories] = useState<api.CategoryDto[]>([]);
  const [departments, setDepartments] = useState<api.DepartmentDto[]>([]);
  const [qualities, setQualities] = useState<api.QualityDto[]>([]);
  const [savedTemplates, setSavedTemplates] = useState<SavedReportTemplate[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [newTemplateName, setNewTemplateName] = useState('');
  const [isCustomTitle, setIsCustomTitle] = useState(false);
  const [customHeaderSubtitle, setCustomHeaderSubtitle] = useState<string | null>(null);

  // Report Config
  const [config, setConfig] = useState<api.CustomInventoryReportRequest>({
    companyName: 'MT Organization',
    reportTitle: 'Inventory List',
    period: `${new Date().getFullYear()}`,
    departmentLabel: 'All Departments',
    preparedBy: user?.fullName || user?.userName || 'Inventory Officer',
    checkedBy: '',
    approvedBy: '',
    logoBase64: '',
    templateStyle: 'LegacyYearlyList',
    groupBy: 'Department',
    columns: LEGACY_YEARLY_COLUMNS,
    name: '',
    categoryId: '',
    departmentId: '',
    qualityId: '',
    productGroup: '',
    purchaseType: '',
    vehicleType: '',
    invoiceStartDate: '',
    invoiceEndDate: '',
    minPrice: undefined,
    maxPrice: undefined,
  });

  const [debouncedName, setDebouncedName] = useState('');
  const [items, setItems] = useState<api.ProductDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const requestSeqRef = useRef(0);
  const autoAddedVehicleColsRef = useRef<string[]>([]);

  const formatLoadError = (err: unknown): string => {
    const axiosErr = err as {
      response?: { status?: number; data?: { message?: string; detail?: string; title?: string } };
      message?: string;
    };
    if (!axiosErr?.response) {
      return `Cannot reach Inventory API server (${api.BASE_URL}). Verify the backend service is running.`;
    }
    const status = axiosErr.response.status;
    if (status === 401 || status === 403) {
      return `Session unauthorized (${status}). Please sign in again to load live inventory data.`;
    }
    const serverMsg =
      axiosErr.response.data?.message ||
      axiosErr.response.data?.detail ||
      axiosErr.response.data?.title;
    return serverMsg
      ? `Failed to load live inventory data (${status}): ${serverMsg}`
      : `Failed to load live inventory data (HTTP ${status}).`;
  };

  useEffect(() => {
    const loadLookups = async () => {
      const [cats, depts, quals, settings] = await Promise.all([
        api.getCategories().catch(() => []),
        api.getDepartments().catch(() => []),
        api.getQualities().catch(() => []),
        api.getSystemSettings().catch(() => null),
      ]);
      setCategories(cats);
      setDepartments(depts);
      setQualities(quals);
      if (settings) {
        setConfig((prev) => ({
          ...prev,
          companyName: settings.siteName || prev.companyName,
          logoBase64: settings.logoBase64 || prev.logoBase64,
        }));
      }
    };
    loadLookups();

    const handleBrandingUpdated = (e: Event) => {
      const detail = (e as CustomEvent<{ siteName?: string; logoBase64?: string }>).detail;
      if (!detail) return;
      setConfig((prev) => ({
        ...prev,
        companyName: detail.siteName || prev.companyName,
        logoBase64: detail.logoBase64 !== undefined ? detail.logoBase64 : prev.logoBase64,
      }));
    };

    window.addEventListener('brandingUpdated', handleBrandingUpdated);
    return () => window.removeEventListener('brandingUpdated', handleBrandingUpdated);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedName(config.name || '');
    }, 350);
    return () => clearTimeout(timer);
  }, [config.name]);

  const loadData = async () => {
    const seq = ++requestSeqRef.current;
    setLoading(true);
    setLoadError(null);
    try {
      const res = await api.getProducts({
        pageNumber: 1,
        pageSize: 500,
        sortBy: 'name',
        isAscending: true,
        name: debouncedName || undefined,
        categoryId: config.categoryId || undefined,
        departmentId: config.departmentId || undefined,
        qualityId: config.qualityId || undefined,
        productGroup: config.productGroup || undefined,
        purchaseType: config.purchaseType || undefined,
        vehicleType: config.vehicleType || undefined,
        invoiceStartDate: config.invoiceStartDate
          ? new Date(`${config.invoiceStartDate}T00:00:00Z`).toISOString()
          : undefined,
        invoiceEndDate: config.invoiceEndDate
          ? new Date(`${config.invoiceEndDate}T23:59:59Z`).toISOString()
          : undefined,
        minPrice: config.minPrice,
        maxPrice: config.maxPrice,
      });
      if (seq !== requestSeqRef.current) return;
      setItems(res.items || []);
      setTotalCount(res.totalCount || 0);
    } catch (err) {
      if (seq !== requestSeqRef.current) return;
      const msg = formatLoadError(err);
      setLoadError(msg);
      showToast(msg, 'error');
    } finally {
      if (seq === requestSeqRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadData();
    return () => {
      // Invalidate stale/StrictMode-unmounted request so duplicate error toasts never fire
      requestSeqRef.current += 1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedName,
    config.categoryId,
    config.departmentId,
    config.qualityId,
    config.productGroup,
    config.purchaseType,
    config.vehicleType,
    config.invoiceStartDate,
    config.invoiceEndDate,
    config.minPrice,
    config.maxPrice,
  ]);

  // Dynamically adapt reportTitle to selected Department or Category unless user typed a custom title
  useEffect(() => {
    if (isCustomTitle) return;
    const deptName = departments.find((d) => d.id === config.departmentId)?.name;
    const catName = categories.find((c) => c.id === config.categoryId)?.name;
    const scopePrefix = deptName || catName;
    const baseSuffix = config.templateStyle === 'LegacyYearlyList' ? 'Inventory List' : 'Inventory & Asset Audit Report';
    const nextTitle = scopePrefix ? `${scopePrefix} ${baseSuffix}` : baseSuffix;
    setConfig((prev) => (prev.reportTitle === nextTitle ? prev : { ...prev, reportTitle: nextTitle }));
  }, [config.departmentId, config.categoryId, config.templateStyle, departments, categories, isCustomTitle]);

  // Auto-surface Plate # & Engine/Serial # columns whenever Motor/Car fleet filter, vehicle category, or matching search results are active
  useEffect(() => {
    const selectedCategoryName = categories.find((c) => c.id === config.categoryId)?.name || '';
    const isVehicleCategory = /\b(motor|moto|car|vehicle|vehicles|bike|fleet|transport)\b/i.test(selectedCategoryName);
    const hasSearchVehicleMatch =
      Boolean(debouncedName.trim()) &&
      items.some((i) => Boolean(i.plateNumber || i.engineNumber));
    const shouldAutoIncludeVehicleCols =
      Boolean(config.vehicleType?.trim()) || isVehicleCategory || hasSearchVehicleMatch;

    setConfig((prev) => {
      if (shouldAutoIncludeVehicleCols) {
        const toAdd = (['plateNumber', 'engineNumber'] as const).filter(
          (k) => !prev.columns.includes(k)
        );
        if (toAdd.length === 0) return prev;
        autoAddedVehicleColsRef.current = Array.from(
          new Set([...autoAddedVehicleColsRef.current, ...toAdd])
        );
        const anchorIdx = prev.columns.indexOf('brandName');
        const insertAt = anchorIdx >= 0 ? anchorIdx + 1 : prev.columns.length;
        const nextCols = [...prev.columns];
        nextCols.splice(insertAt, 0, ...toAdd);
        return { ...prev, columns: nextCols };
      }

      if (autoAddedVehicleColsRef.current.length === 0) return prev;
      const autoSet = new Set(autoAddedVehicleColsRef.current);
      autoAddedVehicleColsRef.current = [];
      const nextCols = prev.columns.filter((c) => !autoSet.has(c));
      return nextCols.length === prev.columns.length ? prev : { ...prev, columns: nextCols };
    });
  }, [config.vehicleType, config.categoryId, categories, debouncedName, items]);

  const selectedColumns = useMemo(
    () =>
      config.columns
        .map((k) => REPORT_COLUMNS.find((c) => c.key === k))
        .filter((c): c is ColumnOption => Boolean(c)),
    [config.columns]
  );

  const availableColumns = useMemo(
    () => REPORT_COLUMNS.filter((c) => !config.columns.includes(c.key)),
    [config.columns]
  );

  const summary = useMemo(() => {
    const totalQty = items.reduce((s, i) => s + (i.initialQuantity ?? 1), 0);
    const totalPrice = items.reduce((s, i) => s + (i.price ?? 0), 0);
    const grandTotal = items.reduce((s, i) => s + (i.price ?? 0) * (i.initialQuantity ?? 1), 0);
    const avgPrice = items.length > 0 ? totalPrice / items.length : 0;
    return { totalQty, totalPrice, grandTotal, avgPrice };
  }, [items]);

  const groupedRows = useMemo(() => {
    const buildYearGroups = (list: api.ProductDto[]) => {
      const yMap = new Map<number, api.ProductDto[]>();
      list.forEach((p) => {
        const y = resolveItemYear(p);
        if (!yMap.has(y)) yMap.set(y, []);
        yMap.get(y)!.push(p);
      });
      return Array.from(yMap.entries())
        .sort(([a], [b]) => a - b)
        .map(([y, yList]) => ({
          label: y === 9999 ? 'Unspecified' : String(y),
          rows: yList.sort((a, b) => (a.codeNumber || '').localeCompare(b.codeNumber || '')),
          qtySum: yList.reduce((s, i) => s + (i.initialQuantity ?? 1), 0),
          priceSum: yList.reduce((s, i) => s + (i.price ?? 0), 0),
          valSum: yList.reduce((s, i) => s + (i.price ?? 0) * (i.initialQuantity ?? 1), 0),
        }));
    };

    if (config.groupBy === 'None') {
      return [
        {
          label: 'All Items',
          isTopSection: false,
          rows: items,
          yearSubgroups: showYearlySubtotals ? buildYearGroups(items) : [],
          qtySum: summary.totalQty,
          priceSum: summary.totalPrice,
          valSum: summary.grandTotal,
        },
      ];
    }

    if (config.groupBy === 'Year') {
      return buildYearGroups(items).map((yg) => ({
        ...yg,
        isTopSection: false,
        yearSubgroups: [] as ReturnType<typeof buildYearGroups>,
      }));
    }

    // Group by Department or Category — with nested chronological Year subtotals inside each group!
    const map = new Map<string, api.ProductDto[]>();
    items.forEach((p) => {
      const key =
        config.groupBy === 'Category'
          ? p.categoryName || 'Uncategorized'
          : p.departmentName || 'Unassigned';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
      .map(([k, list]) => ({
        label: k,
        isTopSection: true,
        rows: list.sort((a, b) => (a.codeNumber || '').localeCompare(b.codeNumber || '')),
        yearSubgroups: showYearlySubtotals ? buildYearGroups(list) : [],
        qtySum: list.reduce((s, i) => s + (i.initialQuantity ?? 1), 0),
        priceSum: list.reduce((s, i) => s + (i.price ?? 0), 0),
        valSum: list.reduce((s, i) => s + (i.price ?? 0) * (i.initialQuantity ?? 1), 0),
      }));
  }, [items, config.groupBy, showYearlySubtotals, summary]);

  const resolvedNotes = useMemo(() => {
    const deptName = departments.find((d) => d.id === config.departmentId)?.name || 'All Departments';
    return notesText
      .replace(/\{\{CompanyName\}\}/g, config.companyName)
      .replace(/\{\{ReportTitle\}\}/g, config.reportTitle)
      .replace(/\{\{Department\}\}/g, deptName)
      .replace(/\{\{TotalItems\}\}/g, items.length.toLocaleString())
      .replace(/\{\{TotalQty\}\}/g, summary.totalQty.toLocaleString())
      .replace(/\{\{GrandTotal\}\}/g, `$${summary.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
      .replace(/\{\{AvgPrice\}\}/g, `$${summary.avgPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
      .replace(/\{\{Today\}\}/g, new Date().toLocaleDateString());
  }, [notesText, config, departments, items.length, summary]);

  // Column Drag-and-Drop Handlers (works both in Toolbox and directly on Paper Table Headers!)
  const handleColDrop = (targetKey: string) => {
    if (!dragColKey || dragColKey === targetKey) {
      setDragColKey(null);
      setOverColKey(null);
      return;
    }
    setConfig((prev) => {
      const next = [...prev.columns];
      const fromIdx = next.indexOf(dragColKey);
      const toIdx = next.indexOf(targetKey);
      if (fromIdx === -1) {
        // Dragged from Available Bank directly onto the table!
        next.splice(toIdx, 0, dragColKey);
        return { ...prev, columns: next };
      }
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return { ...prev, columns: next };
    });
    setDragColKey(null);
    setOverColKey(null);
  };

  const toggleColumn = (key: string) => {
    setConfig((prev) => {
      const exists = prev.columns.includes(key);
      if (exists && prev.columns.length === 1) return prev;
      return {
        ...prev,
        columns: exists ? prev.columns.filter((c) => c !== key) : [...prev.columns, key],
      };
    });
  };

  // Section Block Drag-and-Drop Handlers on Paper Canvas
  const handleBlockDrop = (targetId: BlockId) => {
    if (!dragBlockId || dragBlockId === targetId) {
      setDragBlockId(null);
      setOverBlockId(null);
      return;
    }
    setBlockOrder((prev) => {
      const next = [...prev];
      const from = next.indexOf(dragBlockId);
      const to = next.indexOf(targetId);
      if (from === -1 || to === -1) return prev;
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDragBlockId(null);
    setOverBlockId(null);
  };

  const toggleBlockVisibility = (id: BlockId) => {
    setHiddenBlocks((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  const applyPreset = (style: 'LegacyYearlyList' | 'Standard') => {
    setIsCustomTitle(false);
    if (style === 'LegacyYearlyList') {
      setConfig((p) => ({
        ...p,
        templateStyle: 'LegacyYearlyList',
        reportTitle: 'Inventory List',
        groupBy: 'Department',
        columns: LEGACY_YEARLY_COLUMNS,
      }));
      setShowYearlySubtotals(true);
      setAccentColor('#475569');
      setAggregateFn('SUM');
      setOrientation('landscape');
      setHiddenBlocks(['kpi', 'notes']);
    } else {
      setConfig((p) => ({
        ...p,
        templateStyle: 'Standard',
        reportTitle: 'Inventory & Asset Audit Report',
        groupBy: 'Category',
        columns: DEFAULT_EXECUTIVE_COLUMNS,
      }));
      setAccentColor('#1e40af');
      setAggregateFn('SUM');
      setHiddenBlocks([]);
    }
  };

  const handleSaveTemplate = () => {
    const trimmed = newTemplateName.trim();
    if (!trimmed) {
      showToast('Enter a template name first.', 'warning');
      return;
    }
    const entry: SavedReportTemplate = {
      id: `${Date.now()}`,
      name: trimmed,
      config,
      blockOrder,
      hiddenBlocks,
      aggregateFn,
      accentColor,
      orientation,
      fontSizePx,
      notesText,
    };
    const updated = [entry, ...savedTemplates.filter((t) => t.name !== trimmed)];
    setSavedTemplates(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setNewTemplateName('');
    showToast(`Saved WYSIWYG template "${trimmed}"!`, 'success');
  };

  const handleLoadTemplate = (tpl: SavedReportTemplate) => {
    setIsCustomTitle(true);
    setConfig(tpl.config);
    setBlockOrder(tpl.blockOrder);
    setHiddenBlocks(tpl.hiddenBlocks);
    setAggregateFn(tpl.aggregateFn);
    setAccentColor(tpl.accentColor);
    setOrientation(tpl.orientation);
    setFontSizePx(tpl.fontSizePx);
    setNotesText(tpl.notesText);
    showToast(`Loaded template "${tpl.name}"`, 'info');
  };

  const handleDeleteTemplate = (id: string) => {
    const updated = savedTemplates.filter((t) => t.id !== id);
    setSavedTemplates(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setConfig((prev) => ({ ...prev, logoBase64: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const renderGroupAggregateText = (
    colKey: string,
    group: { label: string; rows: api.ProductDto[]; qtySum: number; priceSum: number; valSum: number }
  ): string => {
    if (aggregateFn === 'NONE') return '';
    if (colKey === 'name') {
      if (aggregateFn === 'COUNT') return `Count (${group.label}): ${group.rows.length}`;
      if (aggregateFn === 'AVG') return `Avg (${group.label})`;
      return `Total ${group.label}`;
    }
    if (colKey === 'initialQuantity') {
      if (aggregateFn === 'SUM') return String(group.qtySum);
      if (aggregateFn === 'AVG') return (group.qtySum / Math.max(1, group.rows.length)).toFixed(1);
      if (aggregateFn === 'COUNT') return String(group.rows.length);
    }
    if (colKey === 'price') {
      const val = aggregateFn === 'AVG' ? group.priceSum / Math.max(1, group.rows.length) : group.priceSum;
      if (aggregateFn === 'COUNT') return `${group.rows.length} items`;
      return val > 0 ? `$ ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '';
    }
    if (colKey === 'totalValue') {
      const val = aggregateFn === 'AVG' ? group.valSum / Math.max(1, group.rows.length) : group.valSum;
      return `$ ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return '';
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    setIsExporting(true);
    const deptName = departments.find((d) => d.id === config.departmentId)?.name || 'All Departments';
    const payload: api.CustomInventoryReportRequest = {
      ...config,
      departmentLabel: deptName,
      name: config.name || undefined,
      categoryId: config.categoryId || undefined,
      departmentId: config.departmentId || undefined,
      qualityId: config.qualityId || undefined,
      productGroup: config.productGroup || undefined,
      purchaseType: config.purchaseType || undefined,
      vehicleType: config.vehicleType || undefined,
      invoiceStartDate: config.invoiceStartDate ? new Date(`${config.invoiceStartDate}T00:00:00Z`).toISOString() : undefined,
      invoiceEndDate: config.invoiceEndDate ? new Date(`${config.invoiceEndDate}T23:59:59Z`).toISOString() : undefined,
    };
    const stamp = new Date().toISOString().slice(0, 10);

    try {
      if (format === 'excel') {
        try {
          const blob = await api.exportCustomInventoryExcel(payload);
          triggerDownload(blob, `wysiwyg-report-${stamp}.xlsx`);
          showToast('Excel exported!', 'success');
          return;
        } catch {
          const wb = XLSX.utils.book_new();
          groupedRows.forEach((grp) => {
            const safeName = grp.label.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31) || 'Sheet';
            const rows: Record<string, string>[] = [];
            const pushSubRow = (subGroup: typeof grp | (typeof grp.yearSubgroups)[number]) => {
              if (aggregateFn === 'NONE') return;
              const sub: Record<string, string> = {};
              selectedColumns.forEach((col) => {
                sub[col.label] = renderGroupAggregateText(col.key, subGroup);
              });
              rows.push(sub);
            };

            if (grp.yearSubgroups && grp.yearSubgroups.length > 0) {
              grp.yearSubgroups.forEach((yg) => {
                yg.rows.forEach((p) => {
                  const r: Record<string, string> = {};
                  selectedColumns.forEach((col) => {
                    r[col.label] = formatCellValue(p, col.key, config.templateStyle || 'Standard');
                  });
                  rows.push(r);
                });
                pushSubRow(yg);
              });
              if (grp.isTopSection) pushSubRow(grp);
            } else {
              grp.rows.forEach((p) => {
                const r: Record<string, string> = {};
                selectedColumns.forEach((col) => {
                  r[col.label] = formatCellValue(p, col.key, config.templateStyle || 'Standard');
                });
                rows.push(r);
              });
              if (config.groupBy !== 'None') pushSubRow(grp);
            }
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), safeName);
          });
          XLSX.writeFile(wb, `wysiwyg-report-${stamp}.xlsx`);
          showToast('Excel exported locally!', 'success');
          return;
        }
      }

      try {
        const blob = await api.exportCustomInventoryPdf(payload);
        triggerDownload(blob, `wysiwyg-report-${stamp}.pdf`);
        showToast('PDF exported!', 'success');
      } catch {
        const doc = new jsPDF(orientation);
        doc.setFontSize(14);
        doc.text(config.reportTitle, 14, 15);
        const body = items.map((p) =>
          selectedColumns.map((col) => formatCellValue(p, col.key, config.templateStyle || 'Standard'))
        );
        (doc as any).autoTable({
          startY: 22,
          head: [selectedColumns.map((c) => c.label)],
          body,
          theme: 'grid',
          styles: { fontSize: 7.5 },
        });
        doc.save(`wysiwyg-report-${stamp}.pdf`);
        showToast('PDF exported locally!', 'success');
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrintWysiwyg = () => {
    const win = window.open('', '_blank');
    if (!win) {
      showToast('Please allow popups to print.', 'warning');
      return;
    }

    const isLegacy = config.templateStyle === 'LegacyYearlyList';
    const deptName = departments.find((d) => d.id === config.departmentId)?.name || 'All Departments';
    const logoHtml = config.logoBase64
      ? `<img src="${config.logoBase64.startsWith('data:') ? config.logoBase64 : `data:image/png;base64,${config.logoBase64}`}" style="height:36px;object-fit:contain;margin-right:10px;" />`
      : '';

    const renderSectionHtml = (id: BlockId): string => {
      if (hiddenBlocks.includes(id)) return '';
      switch (id) {
        case 'header':
          return isLegacy
            ? `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                 <div style="border:1.5px solid #334155;border-radius:16px;padding:4px 14px;font-weight:700;font-size:13px;background:#f8fafc;display:inline-flex;align-items:center;">${logoHtml}${config.reportTitle}</div>
                 <div style="text-align:right;font-size:10px;color:#475569;"><div><strong>${config.companyName}</strong></div><div>${customHeaderSubtitle ?? `${deptName} · Printed ${new Date().toLocaleDateString()}`}</div></div>
               </div>`
            : `<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid ${accentColor};padding-bottom:8px;margin-bottom:10px;">
                 <div style="display:flex;align-items:center;">${logoHtml}<div><div style="font-size:16px;font-weight:700;color:${accentColor}">${config.companyName}</div><div style="font-size:13px;font-weight:600">${config.reportTitle}</div></div></div>
                 <div style="text-align:right;font-size:10px;"><div><strong>Period:</strong> ${config.period}</div><div><strong>Items:</strong> ${items.length}</div></div>
               </div>`;
        case 'metadata':
          return `<div style="display:flex;gap:16px;font-size:10px;color:#475569;margin-bottom:8px;border:1px solid #cbd5e1;padding:5px 8px;background:#f8fafc;">
                    <span><strong>Department:</strong> ${deptName}</span>
                    <span><strong>Period:</strong> ${config.period}</span>
                    <span><strong>Grouped By:</strong> ${config.groupBy} (${aggregateFn})</span>
                    <span><strong>Records:</strong> ${items.length}</span>
                  </div>`;
        case 'table': {
          const headHtml = selectedColumns.map((c) => `<th>${c.label}</th>`).join('');
          const rowsHtml = groupedRows
            .map((grp) => {
              const sectionBanner = grp.isTopSection
                ? `<tr class="dept-banner"><td colspan="${selectedColumns.length}">${config.groupBy}: ${grp.label} (${grp.rows.length} items)</td></tr>`
                : '';

              if (grp.yearSubgroups && grp.yearSubgroups.length > 0) {
                const yearHtml = grp.yearSubgroups
                  .map((yg) => {
                    const yRows = yg.rows
                      .map(
                        (p) =>
                          `<tr>${selectedColumns
                            .map(
                              (col) =>
                                `<td style="text-align:${col.align || 'left'}">${formatCellValue(p, col.key, config.templateStyle || 'Standard')}</td>`
                            )
                            .join('')}</tr>`
                      )
                      .join('');
                    const ySub =
                      aggregateFn !== 'NONE'
                        ? `<tr class="subtotal-row">${selectedColumns
                            .map(
                              (col) =>
                                `<td style="text-align:${col.align || 'left'}">${renderGroupAggregateText(col.key, yg)}</td>`
                            )
                            .join('')}</tr>`
                        : '';
                    return yRows + ySub;
                  })
                  .join('');

                const deptTotalTr =
                  aggregateFn !== 'NONE' && grp.isTopSection
                    ? `<tr class="dept-total-row">${selectedColumns
                        .map(
                          (col) =>
                            `<td style="text-align:${col.align || 'left'}">${renderGroupAggregateText(col.key, grp)}</td>`
                        )
                        .join('')}</tr>`
                    : '';

                return sectionBanner + yearHtml + deptTotalTr;
              }

              const itemTrs = grp.rows
                .map(
                  (p) =>
                    `<tr>${selectedColumns
                      .map(
                        (col) =>
                          `<td style="text-align:${col.align || 'left'}">${formatCellValue(p, col.key, config.templateStyle || 'Standard')}</td>`
                      )
                      .join('')}</tr>`
                )
                .join('');
              const subTr =
                aggregateFn !== 'NONE' && config.groupBy !== 'None'
                  ? `<tr class="subtotal-row">${selectedColumns
                      .map(
                        (col) =>
                          `<td style="text-align:${col.align || 'left'}">${renderGroupAggregateText(col.key, grp)}</td>`
                      )
                      .join('')}</tr>`
                  : '';
              return sectionBanner + itemTrs + subTr;
            })
            .join('');
          return `<table><thead><tr>${headHtml}</tr></thead><tbody>${rowsHtml}</tbody></table>`;
        }
        case 'kpi':
          return `<div style="display:flex;justify-content:space-between;margin-top:10px;padding:8px 12px;background:#f1f5f9;border:1px solid #cbd5e1;font-size:11px;">
                    <span><strong>Total Distinct Items:</strong> ${items.length}</span>
                    <span><strong>Total Quantity:</strong> ${summary.totalQty}</span>
                    <span><strong>Grand Total Value:</strong> $${summary.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>`;
        case 'notes':
          return `<div style="margin-top:10px;padding:8px;border-left:3px solid ${accentColor};background:#f8fafc;font-size:10px;">${resolvedNotes}</div>`;
        case 'signatures':
          return `<div style="display:flex;justify-content:space-between;margin-top:26px;font-size:10px;">
                    <div style="width:30%"><strong>Prepared By:</strong><br/><br/>${config.preparedBy || '_____________________'}</div>
                    <div style="width:30%"><strong>Checked By:</strong><br/><br/>${config.checkedBy || '_____________________'}</div>
                    <div style="width:30%"><strong>Approved By:</strong><br/><br/>${config.approvedBy || '_____________________'}</div>
                  </div>`;
      }
    };

    const contentHtml = blockOrder.map(renderSectionHtml).join('');
    win.document.write(`
      <!DOCTYPE html><html><head><title>${config.reportTitle}</title>
      <style>
        @page { size: A4 ${orientation}; margin: 10mm; }
        body { font-family: Arial, sans-serif; color: #0f172a; margin: 0; font-size: ${fontSizePx}px; }
        table { width: 100%; border-collapse: collapse; font-size: ${fontSizePx}px; }
        th { background: ${isLegacy ? '#e5e7eb' : accentColor}; color: ${isLegacy ? '#111827' : '#ffffff'}; border: 1px solid #6b7280; padding: 5px; text-align: center; }
        td { border: 1px solid #9ca3af; padding: 4px 5px; vertical-align: middle; }
        .subtotal-row td { background: #d9d9d9 !important; font-weight: 700; border-color: #6b7280; }
        .dept-banner td { background: #eff6ff !important; color: #1e40af; font-weight: 700; border-color: #2563eb; padding: 5px 6px; }
        .dept-total-row td { background: #dbeafe !important; font-weight: 700; border-color: #2563eb; }
        tr { page-break-inside: avoid; }
      </style></head><body>${contentHtml}
      <script>window.onload = () => { window.focus(); window.print(); };</script>
      </body></html>
    `);
    win.document.close();
  };

  // Render a WYSIWYG block on the interactive A4 paper canvas
  const renderPaperBlock = (id: BlockId) => {
    const isHidden = hiddenBlocks.includes(id);
    if (isHidden) return null;

    const isDragging = dragBlockId === id;
    const isOver = overBlockId === id && dragBlockId !== id;
    const isLegacy = config.templateStyle === 'LegacyYearlyList';
    const deptName = departments.find((d) => d.id === config.departmentId)?.name || 'All Departments';

    return (
      <Box
        key={id}
        draggable
        onDragStart={(e) => {
          // Allow inner column drag without starting block drag
          if ((e.target as HTMLElement).closest('[data-col-drag="true"]')) return;
          setDragBlockId(id);
        }}
        onDragOver={(e) => {
          if (!dragBlockId) return;
          e.preventDefault();
          setOverBlockId(id);
        }}
        onDrop={() => {
          if (dragBlockId) handleBlockDrop(id);
        }}
        onDragEnd={() => {
          setDragBlockId(null);
          setOverBlockId(null);
        }}
        sx={{
          position: 'relative',
          mb: 1.5,
          p: 0.75,
          borderRadius: 1,
          border: '1px dashed transparent',
          outline: isOver ? `2px dashed ${accentColor}` : 'none',
          opacity: isDragging ? 0.45 : 1,
          transition: 'border-color 0.15s',
          '&:hover': { borderColor: '#94a3b8' },
          '&:hover .block-toolbar': { opacity: 1 },
        }}
      >
        {/* Floating Block Handle on Hover */}
        <Box
          className="block-toolbar"
          sx={{
            position: 'absolute',
            top: -11,
            right: 8,
            opacity: 0,
            transition: 'opacity 0.15s',
            bgcolor: '#1e293b',
            color: '#fff',
            borderRadius: 1,
            px: 0.75,
            py: 0.15,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            zIndex: 5,
            fontSize: '0.68rem',
            cursor: 'grab',
          }}
        >
          <DragIndicatorIcon sx={{ fontSize: 13 }} />
          <span>{BLOCK_LABELS[id]}</span>
          <IconButton
            size="small"
            onClick={() => toggleBlockVisibility(id)}
            sx={{ color: '#cbd5e1', p: 0.25 }}
            title="Hide section"
          >
            <VisibilityOffIcon sx={{ fontSize: 13 }} />
          </IconButton>
        </Box>

        {id === 'header' && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: isLegacy ? 'none' : `2px solid ${accentColor}`,
              pb: isLegacy ? 0.5 : 1,
              gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {config.logoBase64 && (
                <img
                  src={
                    config.logoBase64.startsWith('data:')
                      ? config.logoBase64
                      : `data:image/png;base64,${config.logoBase64}`
                  }
                  alt="Logo"
                  style={{ height: isLegacy ? 30 : 48, objectFit: 'contain' }}
                />
              )}
              {isLegacy ? (
                <Box
                  sx={{
                    border: '1.5px solid #334155',
                    borderRadius: 5,
                    px: 2,
                    py: 0.4,
                    bgcolor: '#f8fafc',
                  }}
                >
                  <input
                    value={config.reportTitle}
                    onChange={(e) => {
                      setIsCustomTitle(true);
                      setConfig((p) => ({ ...p, reportTitle: e.target.value }));
                    }}
                    style={{
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      fontWeight: 700,
                      fontSize: '13px',
                      color: '#0f172a',
                      width: `${Math.max(12, config.reportTitle.length + 1)}ch`,
                    }}
                  />
                </Box>
              ) : (
                <Box>
                  <input
                    value={config.companyName}
                    onChange={(e) => setConfig((p) => ({ ...p, companyName: e.target.value }))}
                    style={{
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      fontWeight: 800,
                      fontSize: '16px',
                      color: accentColor,
                      display: 'block',
                      width: '100%',
                    }}
                  />
                  <input
                    value={config.reportTitle}
                    onChange={(e) => {
                      setIsCustomTitle(true);
                      setConfig((p) => ({ ...p, reportTitle: e.target.value }));
                    }}
                    style={{
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      fontWeight: 600,
                      fontSize: '13px',
                      color: '#0f172a',
                      display: 'block',
                      width: '100%',
                    }}
                  />
                </Box>
              )}
            </Box>

            <Box sx={{ textAlign: 'right', fontSize: '10px', color: '#475569', minWidth: 210 }}>
              <input
                aria-label="Organization or Header Name"
                value={config.companyName}
                onChange={(e) => setConfig((p) => ({ ...p, companyName: e.target.value }))}
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontWeight: 700,
                  fontSize: '11px',
                  color: '#334155',
                  textAlign: 'right',
                  width: '100%',
                  display: 'block',
                }}
              />
              <input
                aria-label="Header Subtitle"
                value={customHeaderSubtitle ?? `${deptName} · Printed ${new Date().toLocaleDateString()}`}
                onChange={(e) => setCustomHeaderSubtitle(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: '10px',
                  color: '#475569',
                  textAlign: 'right',
                  width: '100%',
                  display: 'block',
                }}
              />
            </Box>
          </Box>
        )}

        {id === 'metadata' && (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              gap: 1.5,
              px: 1.5,
              py: 0.75,
              bgcolor: '#f8fafc',
              border: '1px solid #cbd5e1',
              fontSize: '10.5px',
              color: '#334155',
            }}
          >
            <span><strong>Period:</strong> {config.period}</span>
            <span><strong>Department:</strong> {deptName}</span>
            <span><strong>Group &amp; Formula:</strong> {config.groupBy} ({aggregateFn})</span>
            <span><strong>Rows:</strong> {items.length} / {totalCount}</span>
          </Box>
        )}

        {id === 'table' && (
          <Box sx={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: `${fontSizePx}px`,
                color: '#0f172a',
              }}
            >
              <thead>
                <tr>
                  {selectedColumns.map((col) => {
                    const isColOver = overColKey === col.key && dragColKey !== col.key;
                    return (
                      <th
                        key={col.key}
                        data-col-drag="true"
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation();
                          setDragColKey(col.key);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setOverColKey(col.key);
                        }}
                        onDrop={(e) => {
                          e.stopPropagation();
                          handleColDrop(col.key);
                        }}
                        onDragEnd={() => {
                          setDragColKey(null);
                          setOverColKey(null);
                        }}
                        title="Drag column header left/right to reorder"
                        style={{
                          background: isLegacy ? '#e5e7eb' : accentColor,
                          color: isLegacy ? '#111827' : '#ffffff',
                          border: isColOver ? '2px dashed #facc15' : '1px solid #6b7280',
                          padding: selectedColumns.length > 10 ? '4px 3px' : '5px 4px',
                          cursor: 'grab',
                          whiteSpace: selectedColumns.length > 9 ? 'normal' : 'nowrap',
                          fontSize: selectedColumns.length > 10 ? '8.5px' : 'inherit',
                          lineHeight: 1.2,
                          userSelect: 'none',
                        }}
                      >
                        {col.label}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {groupedRows.map((grp) => (
                  <React.Fragment key={grp.label}>
                    {grp.isTopSection && (
                      <tr style={{ background: '#eff6ff', fontWeight: 700, color: accentColor }}>
                        <td
                          colSpan={selectedColumns.length}
                          style={{ border: `1px solid ${accentColor}`, padding: '5px 6px' }}
                        >
                          {config.groupBy}: {grp.label} ({grp.rows.length} items)
                        </td>
                      </tr>
                    )}

                    {grp.yearSubgroups && grp.yearSubgroups.length > 0 ? (
                      <>
                        {grp.yearSubgroups.map((yg) => (
                          <React.Fragment key={`${grp.label}-${yg.label}`}>
                            {yg.rows.slice(0, 60).map((item, idx) => (
                              <tr key={item.id || `${grp.label}-${yg.label}-${idx}`} style={{ background: '#ffffff' }}>
                                {selectedColumns.map((col) => (
                                  <td
                                    key={col.key}
                                    style={{
                                      border: '1px solid #9ca3af',
                                      padding: '4px 5px',
                                      textAlign: col.align || 'left',
                                    }}
                                  >
                                    {formatCellValue(item, col.key, config.templateStyle || 'Standard')}
                                  </td>
                                ))}
                              </tr>
                            ))}
                            {aggregateFn !== 'NONE' && (
                              <tr style={{ background: '#d9d9d9', fontWeight: 700 }}>
                                {selectedColumns.map((col) => (
                                  <td
                                    key={`agg-${grp.label}-${yg.label}-${col.key}`}
                                    style={{
                                      border: '1px solid #6b7280',
                                      padding: '4px 5px',
                                      textAlign: col.align || 'left',
                                      color: '#111827',
                                    }}
                                  >
                                    {renderGroupAggregateText(col.key, yg)}
                                  </td>
                                ))}
                              </tr>
                            )}
                          </React.Fragment>
                        ))}

                        {aggregateFn !== 'NONE' && grp.isTopSection && (
                          <tr style={{ background: '#dbeafe', fontWeight: 700 }}>
                            {selectedColumns.map((col) => (
                              <td
                                key={`dept-tot-${grp.label}-${col.key}`}
                                style={{
                                  border: `1px solid ${accentColor}`,
                                  padding: '4px 5px',
                                  textAlign: col.align || 'left',
                                  color: '#0f172a',
                                }}
                              >
                                {renderGroupAggregateText(col.key, grp)}
                              </td>
                            ))}
                          </tr>
                        )}
                      </>
                    ) : (
                      <>
                        {grp.rows.slice(0, 60).map((item, idx) => (
                          <tr key={item.id || `${grp.label}-${idx}`} style={{ background: '#ffffff' }}>
                            {selectedColumns.map((col) => (
                              <td
                                key={col.key}
                                style={{
                                  border: '1px solid #9ca3af',
                                  padding: '4px 5px',
                                  textAlign: col.align || 'left',
                                }}
                              >
                                {formatCellValue(item, col.key, config.templateStyle || 'Standard')}
                              </td>
                            ))}
                          </tr>
                        ))}
                        {aggregateFn !== 'NONE' && config.groupBy !== 'None' && (
                          <tr style={{ background: '#d9d9d9', fontWeight: 700 }}>
                            {selectedColumns.map((col) => (
                              <td
                                key={`agg-${grp.label}-${col.key}`}
                                style={{
                                  border: '1px solid #6b7280',
                                  padding: '4px 5px',
                                  textAlign: col.align || 'left',
                                  color: '#111827',
                                }}
                              >
                                {renderGroupAggregateText(col.key, grp)}
                              </td>
                            ))}
                          </tr>
                        )}
                      </>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
            {items.length > 60 && (
              <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: '#64748b', mt: 0.5 }}>
                Canvas showing 60 sample rows · Print / Excel / PDF exports all {totalCount} matching rows.
              </Typography>
            )}
          </Box>
        )}

        {id === 'kpi' && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              px: 2,
              py: 1,
              bgcolor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              fontSize: '11px',
              color: '#0f172a',
            }}
          >
            <span><strong>Items:</strong> {items.length}</span>
            <span><strong>SUM(Qty):</strong> {summary.totalQty.toLocaleString()}</span>
            <span><strong>AVG(Price):</strong> ${summary.avgPrice.toFixed(2)}</span>
            <span style={{ color: accentColor }}>
              <strong>GRAND TOTAL:</strong> ${summary.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </Box>
        )}

        {id === 'notes' && (
          <Box sx={{ borderLeft: `3px solid ${accentColor}`, bgcolor: '#f8fafc', p: 1 }}>
            <Typography variant="caption" sx={{ color: '#334155', display: 'block' }}>
              {resolvedNotes}
            </Typography>
          </Box>
        )}

        {id === 'signatures' && (
          <Grid container spacing={2} sx={{ pt: 2, color: '#0f172a', fontSize: '11px' }}>
            <Grid size={{ xs: 4 }}>
              <strong>Prepared By:</strong>
              <Box sx={{ mt: 2.5, borderTop: '1px solid #94a3b8', pt: 0.5, width: '85%' }}>
                {config.preparedBy || 'Signature & Date'}
              </Box>
            </Grid>
            <Grid size={{ xs: 4 }}>
              <strong>Checked By:</strong>
              <Box sx={{ mt: 2.5, borderTop: '1px solid #94a3b8', pt: 0.5, width: '85%' }}>
                {config.checkedBy || 'Signature & Date'}
              </Box>
            </Grid>
            <Grid size={{ xs: 4 }}>
              <strong>Approved By:</strong>
              <Box sx={{ mt: 2.5, borderTop: '1px solid #94a3b8', pt: 0.5, width: '85%' }}>
                {config.approvedBy || 'Authorized Signatory'}
              </Box>
            </Grid>
          </Grid>
        )}
      </Box>
    );
  };

  return (
    <Stack spacing={2.5}>
      {/* Top WYSIWYG Studio Toolbar */}
      <Paper
        elevation={0}
        sx={{
          px: 2,
          py: 1.5,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
          <Stack direction="row" useFlexGap spacing={1.25} sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
            <ToggleButtonGroup
              size="small"
              color="primary"
              exclusive
              value={studioView}
              onChange={(_, v) => v && setStudioView(v)}
            >
              <ToggleButton value="split" sx={{ textTransform: 'none', px: 1.5, gap: 0.75, whiteSpace: 'nowrap' }}>
                <ViewSidebarIcon fontSize="small" />
                Split Studio
              </ToggleButton>
              <ToggleButton value="canvas" sx={{ textTransform: 'none', px: 1.5, gap: 0.75, whiteSpace: 'nowrap' }}>
                <ArticleIcon fontSize="small" />
                Full A4 Paper
              </ToggleButton>
            </ToggleButtonGroup>

            <ToggleButtonGroup
              size="small"
              color="primary"
              exclusive
              value={orientation}
              onChange={(_, v) => v && setOrientation(v)}
            >
              <ToggleButton value="landscape" sx={{ textTransform: 'none', px: 1.5, gap: 0.75, whiteSpace: 'nowrap' }}>
                <LandscapeIcon fontSize="small" />
                Landscape
              </ToggleButton>
              <ToggleButton value="portrait" sx={{ textTransform: 'none', px: 1.5, gap: 0.75, whiteSpace: 'nowrap' }}>
                <PortraitIcon fontSize="small" />
                Portrait
              </ToggleButton>
            </ToggleButtonGroup>

            <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />

            <FormControl size="small" sx={{ minWidth: 88 }}>
              <Select value={zoom} onChange={(e) => setZoom(Number(e.target.value))}>
                <MenuItem value={75}>75%</MenuItem>
                <MenuItem value={90}>90%</MenuItem>
                <MenuItem value={100}>100%</MenuItem>
                <MenuItem value={115}>115%</MenuItem>
              </Select>
            </FormControl>

            <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />

            <FormControl size="small" sx={{ minWidth: 138 }}>
              <InputLabel>Fleet (Motor / Car)</InputLabel>
              <Select
                label="Fleet (Motor / Car)"
                value={config.vehicleType || ''}
                onChange={(e) => setConfig((prev) => ({ ...prev, vehicleType: e.target.value }))}
              >
                {VEHICLE_FILTER_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value || 'all'} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />

            <Tooltip title="Report Accent Theme Color">
              <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', px: 0.5 }}>
                {ACCENT_COLORS.map((c) => (
                  <Box
                    key={c}
                    onClick={() => setAccentColor(c)}
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      bgcolor: c,
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      boxShadow: accentColor === c ? `0 0 0 2px #fff, 0 0 0 4px ${c}` : 'inset 0 0 0 1px rgba(0,0,0,0.15)',
                      '&:hover': { transform: 'scale(1.12)' },
                    }}
                  />
                ))}
              </Stack>
            </Tooltip>
          </Stack>

          <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadData}
              disabled={loading}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Refresh
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={handlePrintWysiwyg}
              disabled={items.length === 0}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Print
            </Button>
            <Button
              size="small"
              variant="contained"
              color="error"
              startIcon={isExporting ? <CircularProgress size={16} color="inherit" /> : <PdfIcon />}
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Export PDF
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={isExporting ? <CircularProgress size={16} color="inherit" /> : <ExcelIcon />}
              onClick={() => handleExport('excel')}
              disabled={isExporting}
              sx={{ bgcolor: '#107c41', '&:hover': { bgcolor: '#0c5a2e' }, whiteSpace: 'nowrap' }}
            >
              Export Excel
            </Button>
          </Stack>
        </Box>
      </Paper>

      <Grid container spacing={2.5} sx={{ alignItems: 'flex-start' }}>
        {/* Left Panel: Compact Tabbed Studio Inspector */}
        {studioView === 'split' && (
          <Grid size={{ xs: 12, lg: 4 }} sx={{ position: { lg: 'sticky' }, top: { lg: 84 } }}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                overflow: 'hidden',
                bgcolor: 'background.paper',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: { lg: 'calc(100vh - 108px)' },
              }}
            >
              <Tabs
                value={inspectorTab}
                onChange={(_, v) => setInspectorTab(v)}
                variant="fullWidth"
                sx={{
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  minHeight: 46,
                  bgcolor: 'action.hover',
                  '& .MuiTab-root': {
                    minHeight: 46,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    py: 1,
                  },
                }}
              >
                <Tab
                  value="design"
                  icon={<LayoutIcon fontSize="small" />}
                  iconPosition="start"
                  label="Layout"
                />
                <Tab
                  value="columns"
                  icon={<ViewColumnIcon fontSize="small" />}
                  iconPosition="start"
                  label={`Columns (${selectedColumns.length})`}
                />
                <Tab
                  value="filters"
                  icon={<TuneIcon fontSize="small" />}
                  iconPosition="start"
                  label="Filters"
                />
              </Tabs>

              <Box sx={{ p: 2, overflowY: 'auto', flex: 1 }}>
                {/* Inspector Tab 1: Templates, Functions & Sections */}
                {inspectorTab === 'design' && (
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                        Templates &amp; Saved Presets
                      </Typography>
                      <Stack direction="row" useFlexGap spacing={1} sx={{ mb: 1.5, flexWrap: 'wrap' }}>
                        <Button
                          size="small"
                          variant={config.templateStyle === 'LegacyYearlyList' ? 'contained' : 'outlined'}
                          onClick={() => applyPreset('LegacyYearlyList')}
                        >
                          Yearly Inventory List
                        </Button>
                        <Button
                          size="small"
                          variant={config.templateStyle === 'Standard' ? 'contained' : 'outlined'}
                          onClick={() => applyPreset('Standard')}
                        >
                          Executive Audit
                        </Button>
                      </Stack>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          size="small"
                          fullWidth
                          placeholder="Save layout as preset..."
                          value={newTemplateName}
                          onChange={(e) => setNewTemplateName(e.target.value)}
                        />
                        <Button size="small" variant="outlined" startIcon={<BookmarkAddIcon />} onClick={handleSaveTemplate} sx={{ whiteSpace: 'nowrap' }}>
                          Save
                        </Button>
                      </Box>
                      {savedTemplates.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1.5 }}>
                          {savedTemplates.map((tpl) => (
                            <Chip
                              key={tpl.id}
                              size="small"
                              label={tpl.name}
                              onClick={() => handleLoadTemplate(tpl)}
                              onDelete={() => handleDeleteTemplate(tpl.id)}
                            />
                          ))}
                        </Box>
                      )}
                    </Box>

                    <Divider />

                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <FunctionsIcon fontSize="small" color="primary" />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          Report Functions &amp; Grouping
                        </Typography>
                      </Box>
                      <Grid container spacing={1.5}>
                        <Grid size={{ xs: 6 }}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Group Rows By</InputLabel>
                            <Select
                              label="Group Rows By"
                              value={config.groupBy}
                              onChange={(e) =>
                                setConfig((p) => ({
                                  ...p,
                                  groupBy: e.target.value as api.CustomInventoryReportRequest['groupBy'],
                                }))
                              }
                            >
                              <MenuItem value="Year">Year (Total 2012..)</MenuItem>
                              <MenuItem value="Category">Category</MenuItem>
                              <MenuItem value="Department">Department</MenuItem>
                              <MenuItem value="None">No Grouping</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Subtotal Formula</InputLabel>
                            <Select
                              label="Subtotal Formula"
                              value={aggregateFn}
                              onChange={(e) => setAggregateFn(e.target.value as AggregateFn)}
                            >
                              <MenuItem value="SUM">SUM(Qty / Price)</MenuItem>
                              <MenuItem value="AVG">AVG(Qty / Price)</MenuItem>
                              <MenuItem value="COUNT">COUNT(Items)</MenuItem>
                              <MenuItem value="NONE">None</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Font Size</InputLabel>
                            <Select label="Font Size" value={fontSizePx} onChange={(e) => setFontSizePx(Number(e.target.value))}>
                              <MenuItem value={8.5}>Compact (8.5px)</MenuItem>
                              <MenuItem value={9.5}>Standard (9.5px)</MenuItem>
                              <MenuItem value={11}>Large (11px)</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />} fullWidth size="small" sx={{ height: 40 }}>
                            Logo
                            <input type="file" hidden accept="image/*" onChange={handleLogoUpload} />
                          </Button>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 0.5 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                              Include Total for each Year inside Dept / Category
                            </Typography>
                            <Switch
                              size="small"
                              checked={showYearlySubtotals}
                              onChange={(e) => setShowYearlySubtotals(e.target.checked)}
                            />
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <TextField
                            label="Formula Notes ({{TotalItems}}, {{TotalQty}}, {{GrandTotal}}, {{Today}})"
                            multiline
                            rows={2}
                            fullWidth
                            size="small"
                            value={notesText}
                            onChange={(e) => setNotesText(e.target.value)}
                          />
                        </Grid>
                      </Grid>
                    </Box>

                    <Divider />

                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                        Report Sections (Drag on Paper or Toggle)
                      </Typography>
                      <Stack spacing={0.5}>
                        {blockOrder.map((b) => (
                          <Box key={b} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2">{BLOCK_LABELS[b]}</Typography>
                            <Switch
                              size="small"
                              checked={!hiddenBlocks.includes(b)}
                              onChange={() => toggleBlockVisibility(b)}
                            />
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  </Stack>
                )}

                {/* Inspector Tab 2: Drag & Drop Columns */}
                {inspectorTab === 'columns' && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                      Active Table Columns ({selectedColumns.length})
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                      Drag chips to reorder, or drag directly onto the paper table headers.
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1.5 }}>
                      {selectedColumns.map((col) => (
                        <Chip
                          key={col.key}
                          size="small"
                          color="primary"
                          draggable
                          onDragStart={() => setDragColKey(col.key)}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setOverColKey(col.key);
                          }}
                          onDrop={() => handleColDrop(col.key)}
                          label={col.label}
                          onDelete={selectedColumns.length > 1 ? () => toggleColumn(col.key) : undefined}
                          sx={{ cursor: 'grab' }}
                        />
                      ))}
                    </Box>
                    {availableColumns.length > 0 && (
                      <>
                        <Divider sx={{ my: 1.5 }} />
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                          Available Columns (click or drag to add):
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                          {availableColumns.map((col) => (
                            <Chip
                              key={col.key}
                              size="small"
                              variant="outlined"
                              draggable
                              onDragStart={() => setDragColKey(col.key)}
                              label={`+ ${col.label}`}
                              onClick={() => toggleColumn(col.key)}
                              sx={{ cursor: 'grab' }}
                            />
                          ))}
                        </Box>
                      </>
                    )}
                  </Box>
                )}

                {/* Inspector Tab 3: Data Filters & Signatories */}
                {inspectorTab === 'filters' && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          Data Filters &amp; Signatories
                        </Typography>
                        {[
                          config.name,
                          config.categoryId,
                          config.departmentId,
                          config.qualityId,
                          config.productGroup,
                          config.purchaseType,
                          config.vehicleType,
                          config.invoiceStartDate,
                          config.invoiceEndDate,
                          config.minPrice !== undefined ? String(config.minPrice) : '',
                          config.maxPrice !== undefined ? String(config.maxPrice) : '',
                        ].filter(Boolean).length > 0 && (
                          <Chip
                            size="small"
                            color="primary"
                            label={`${
                              [
                                config.name,
                                config.categoryId,
                                config.departmentId,
                                config.qualityId,
                                config.productGroup,
                                config.purchaseType,
                                config.vehicleType,
                                config.invoiceStartDate,
                                config.invoiceEndDate,
                                config.minPrice !== undefined ? String(config.minPrice) : '',
                                config.maxPrice !== undefined ? String(config.maxPrice) : '',
                              ].filter(Boolean).length
                            } active`}
                          />
                        )}
                      </Stack>
                      <Button
                        size="small"
                        startIcon={<ResetIcon />}
                        onClick={() =>
                          setConfig((p) => ({
                            ...p,
                            name: '',
                            categoryId: '',
                            departmentId: '',
                            qualityId: '',
                            productGroup: '',
                            purchaseType: '',
                            vehicleType: '',
                            invoiceStartDate: '',
                            invoiceEndDate: '',
                            minPrice: undefined,
                            maxPrice: undefined,
                          }))
                        }
                      >
                        Reset
                      </Button>
                    </Box>
                    <Stack spacing={1.5}>
                      <TextField
                        label="Organization / Header Name"
                        size="small"
                        fullWidth
                        value={config.companyName}
                        onChange={(e) => setConfig((p) => ({ ...p, companyName: e.target.value }))}
                      />
                      <SearchField
                        label="Filter Name / Code"
                        fullWidth
                        value={config.name || ''}
                        onChange={(val) => setConfig((p) => ({ ...p, name: val }))}
                        onClear={() => setConfig((p) => ({ ...p, name: '' }))}
                      />
                      <Grid container spacing={1}>
                        <Grid size={{ xs: 6 }}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Category</InputLabel>
                            <Select
                              label="Category"
                              value={config.categoryId || ''}
                              onChange={(e) => setConfig((p) => ({ ...p, categoryId: e.target.value }))}
                            >
                              <MenuItem value="">All</MenuItem>
                              {categories.map((c) => (
                                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Department</InputLabel>
                            <Select
                              label="Department"
                              value={config.departmentId || ''}
                              onChange={(e) => setConfig((p) => ({ ...p, departmentId: e.target.value }))}
                            >
                              <MenuItem value="">All</MenuItem>
                              {departments.map((d) => (
                                <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Condition</InputLabel>
                            <Select
                              label="Condition"
                              value={config.qualityId || ''}
                              onChange={(e) => setConfig((p) => ({ ...p, qualityId: e.target.value }))}
                            >
                              <MenuItem value="">All</MenuItem>
                              {qualities.map((q) => (
                                <MenuItem key={q.id} value={q.id}>{q.name}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Group</InputLabel>
                            <Select
                              label="Group"
                              value={config.productGroup || ''}
                              onChange={(e) => setConfig((p) => ({ ...p, productGroup: e.target.value }))}
                            >
                              <MenuItem value="">All</MenuItem>
                              <MenuItem value="Asset">Assets (19/20)</MenuItem>
                              <MenuItem value="Inventory">Inventory</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Acquisition</InputLabel>
                            <Select
                              label="Acquisition"
                              value={config.purchaseType || ''}
                              onChange={(e) => setConfig((p) => ({ ...p, purchaseType: e.target.value }))}
                            >
                              <MenuItem value="">All</MenuItem>
                              <MenuItem value="Purchased">Purchased</MenuItem>
                              <MenuItem value="Donated">Donated</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Vehicle / Fleet</InputLabel>
                            <Select
                              label="Vehicle / Fleet"
                              value={config.vehicleType || ''}
                              onChange={(e) => setConfig((p) => ({ ...p, vehicleType: e.target.value }))}
                            >
                              {VEHICLE_FILTER_OPTIONS.map((opt) => (
                                <MenuItem key={opt.value || 'all'} value={opt.value}>
                                  {opt.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <DatePicker
                            label="Invoice From"
                            slotProps={{ textField: { size: 'small', fullWidth: true } }}
                            value={config.invoiceStartDate ? dayjs(config.invoiceStartDate) : null}
                            onChange={(newDate: Dayjs | null) =>
                              setConfig((p) => ({
                                ...p,
                                invoiceStartDate: newDate && newDate.isValid() ? newDate.format('YYYY-MM-DD') : '',
                              }))
                            }
                          />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <DatePicker
                            label="Invoice To"
                            slotProps={{ textField: { size: 'small', fullWidth: true } }}
                            value={config.invoiceEndDate ? dayjs(config.invoiceEndDate) : null}
                            onChange={(newDate: Dayjs | null) =>
                              setConfig((p) => ({
                                ...p,
                                invoiceEndDate: newDate && newDate.isValid() ? newDate.format('YYYY-MM-DD') : '',
                              }))
                            }
                          />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <TextField
                            label="Min Price ($)"
                            type="number"
                            size="small"
                            fullWidth
                            value={config.minPrice ?? ''}
                            onChange={(e) =>
                              setConfig((p) => ({
                                ...p,
                                minPrice: e.target.value === '' ? undefined : Number(e.target.value),
                              }))
                            }
                          />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <TextField
                            label="Max Price ($)"
                            type="number"
                            size="small"
                            fullWidth
                            value={config.maxPrice ?? ''}
                            onChange={(e) =>
                              setConfig((p) => ({
                                ...p,
                                maxPrice: e.target.value === '' ? undefined : Number(e.target.value),
                              }))
                            }
                          />
                        </Grid>
                      </Grid>

                      <Divider />
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                        Approval Signatories
                      </Typography>
                      <TextField
                        label="Prepared By"
                        size="small"
                        fullWidth
                        value={config.preparedBy}
                        onChange={(e) => setConfig((p) => ({ ...p, preparedBy: e.target.value }))}
                      />
                      <Grid container spacing={1}>
                        <Grid size={{ xs: 6 }}>
                          <TextField
                            label="Checked By"
                            size="small"
                            fullWidth
                            value={config.checkedBy}
                            onChange={(e) => setConfig((p) => ({ ...p, checkedBy: e.target.value }))}
                          />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <TextField
                            label="Approved By"
                            size="small"
                            fullWidth
                            value={config.approvedBy}
                            onChange={(e) => setConfig((p) => ({ ...p, approvedBy: e.target.value }))}
                          />
                        </Grid>
                      </Grid>
                    </Stack>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
        )}

        {/* Right Panel: Interactive Sticky WYSIWYG A4 Paper Canvas */}
        <Grid size={{ xs: 12, lg: studioView === 'split' ? 8 : 12 }} sx={{ position: { lg: 'sticky' }, top: { lg: 84 } }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, md: 3 },
              borderRadius: 3,
              bgcolor: '#e2e8f0',
              backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
              backgroundSize: '16px 16px',
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'auto',
              minHeight: 680,
              maxHeight: { lg: 'calc(100vh - 108px)' },
            }}
          >
            <Alert severity="info" sx={{ mb: 2, py: 0.25 }}>
              <strong>WYSIWYG Paper Canvas:</strong> Click titles on the sheet to edit inline, drag table column headers left/right to reorder, or hover any section to drag &amp; rearrange blocks.
            </Alert>

            {totalCount > items.length && (
              <Alert severity="warning" sx={{ mb: 2, py: 0.25 }}>
                Showing the first <strong>{items.length}</strong> of <strong>{totalCount}</strong> matching items in live preview. Use <strong>Export PDF</strong> or <strong>Export Excel</strong> to download the complete filtered dataset.
              </Alert>
            )}

            {loadError && (
              <Alert
                severity="error"
                sx={{ mb: 2 }}
                action={
                  <Button color="inherit" size="small" onClick={loadData} disabled={loading}>
                    Retry
                  </Button>
                }
              >
                {loadError}
              </Alert>
            )}

            {loading ? (
              <Box sx={{ py: 12, textAlign: 'center' }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box
                sx={{
                  mx: 'auto',
                  width: orientation === 'landscape' ? '1080px' : '780px',
                  maxWidth: '100%',
                  minHeight: orientation === 'landscape' ? '740px' : '1080px',
                  bgcolor: '#ffffff',
                  color: '#0f172a',
                  p: 3,
                  boxShadow: '0 12px 32px rgba(15, 23, 42, 0.22)',
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.15s ease',
                }}
              >
                {blockOrder.map(renderPaperBlock)}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
};
