import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  PictureAsPdf as PdfIcon,
  Print as PrintIcon,
  Refresh as RefreshIcon,
  RestartAlt as ResetIcon,
  Settings as SettingsIcon,
  TableChart as ExcelIcon,
} from '@mui/icons-material';
import * as api from '../../services/api';
import { VEHICLE_FILTER_OPTIONS } from './vehicleFilterUtils';
import { SearchField } from '../../components/SearchField';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../context/ToastContext';

const formatCurrency = (val: number) =>
  val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const getQuarterRange = (year: number, quarter: number) => {
  const startMonth = (quarter - 1) * 3;
  const start = new Date(Date.UTC(year, startMonth, 1));
  const end = new Date(Date.UTC(year, startMonth + 3, 0));
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    periodLabel: `${monthNames[startMonth]}–${monthNames[startMonth + 2]} ${year}`,
  };
};

const triggerDownload = (blobData: Blob, filename: string) => {
  const url = URL.createObjectURL(blobData);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const QB_PREFS_STORAGE_KEY = 'qb_reconciliation_prefs_v1';

interface SavedQbPrefs {
  preparedBy?: string;
  preparedRole?: string;
  reviewedBy?: string;
  reviewedRole?: string;
  accountMappings?: Record<string, string>;
}

const loadSavedPrefs = (): SavedQbPrefs => {
  try {
    const raw = localStorage.getItem(QB_PREFS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const formatDateRangeLabel = (startStr: string, endStr: string) => {
  if (!startStr || !endStr) return 'Selected Period';
  const s = dayjs(startStr);
  const e = dayjs(endStr);
  if (!s.isValid() || !e.isValid()) return `${startStr} – ${endStr}`;
  if (s.year() === e.year() && s.month() === e.month()) return s.format('MMMM YYYY');
  if (s.year() === e.year()) return `${s.format('MMMM')}–${e.format('MMMM YYYY')}`;
  return `${s.format('MMM YYYY')} – ${e.format('MMM YYYY')}`;
};

export const QuickBooksReconciliationTab: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.floor(new Date().getMonth() / 3) + 1;
  const initialQuarter = getQuarterRange(currentYear, currentQuarter);
  const savedPrefs = loadSavedPrefs();

  const [departments, setDepartments] = useState<api.DepartmentDto[]>([]);
  const [categories, setCategories] = useState<api.CategoryDto[]>([]);
  const [showAdvancedMappings, setShowAdvancedMappings] = useState(false);

  const [startDate, setStartDate] = useState(initialQuarter.startDate);
  const [endDate, setEndDate] = useState(initialQuarter.endDate);
  const [periodLabel, setPeriodLabel] = useState(initialQuarter.periodLabel);
  const [isCustomPeriodLabel, setIsCustomPeriodLabel] = useState(false);
  const [departmentId, setDepartmentId] = useState('');
  const [purchaseType, setPurchaseType] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [accountGroupFilter, setAccountGroupFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [preparedBy, setPreparedBy] = useState(savedPrefs.preparedBy ?? (user?.fullName || ''));
  const [preparedRole, setPreparedRole] = useState(savedPrefs.preparedRole ?? 'Management Assistant');
  const [reviewedBy, setReviewedBy] = useState(savedPrefs.reviewedBy ?? '');
  const [reviewedRole, setReviewedRole] = useState(savedPrefs.reviewedRole ?? 'Co-Director');
  const [qbReferenceInput, setQbReferenceInput] = useState('');
  const [includeMonthlyDepartmentSubReport, setIncludeMonthlyDepartmentSubReport] = useState(true);
  const [accountMappings, setAccountMappings] = useState<Record<string, string>>(savedPrefs.accountMappings ?? {});

  const [data, setData] = useState<api.QuickBooksReconciliationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const requestSeqRef = useRef(0);

  useEffect(() => {
    try {
      localStorage.setItem(
        QB_PREFS_STORAGE_KEY,
        JSON.stringify({
          preparedBy,
          preparedRole,
          reviewedBy,
          reviewedRole,
          accountMappings,
        })
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [preparedBy, preparedRole, reviewedBy, reviewedRole, accountMappings]);

  useEffect(() => {
    if (!isCustomPeriodLabel) {
      setPeriodLabel(formatDateRangeLabel(startDate, endDate));
    }
  }, [startDate, endDate, isCustomPeriodLabel]);

  useEffect(() => {
    Promise.all([
      api.getDepartments().catch(() => []),
      api.getCategories().catch(() => []),
    ]).then(([depts, cats]) => {
      setDepartments(depts);
      setCategories(cats);
    });
  }, []);

  const buildPayload = (): api.QuickBooksReconciliationRequest => {
    const parsedRef = qbReferenceInput.trim() === '' ? null : Number(qbReferenceInput);
    const cleanMappings: Record<string, string> = {};
    Object.entries(accountMappings).forEach(([cat, acct]) => {
      if (acct.trim()) cleanMappings[cat] = acct.trim();
    });

    return {
      startDate: startDate ? new Date(`${startDate}T00:00:00Z`).toISOString() : null,
      endDate: endDate ? new Date(`${endDate}T23:59:59Z`).toISOString() : null,
      periodLabel,
      departmentId: departmentId || null,
      purchaseType: purchaseType || null,
      vehicleType: vehicleType || null,
      preparedBy,
      preparedRole,
      reviewedBy,
      reviewedRole,
      quickBooksReferenceTotal: parsedRef !== null && !Number.isNaN(parsedRef) ? parsedRef : null,
      accountMappings: Object.keys(cleanMappings).length > 0 ? cleanMappings : undefined,
      includeMonthlyDepartmentSubReport,
    };
  };

  const loadReconciliation = async () => {
    const seq = ++requestSeqRef.current;
    setLoading(true);
    setLoadError(null);
    try {
      const res = await api.previewQuickBooksReconciliation(buildPayload());
      if (seq !== requestSeqRef.current) return;
      setData(res);
    } catch (err: any) {
      if (seq !== requestSeqRef.current) return;
      const msg = !err?.response
        ? `Cannot reach Inventory API server (${api.BASE_URL}). Verify the backend service is running.`
        : err.response.data?.message || `Failed to load reconciliation report (HTTP ${err.response.status}).`;
      setLoadError(msg);
      showToast(msg, 'error');
    } finally {
      if (seq === requestSeqRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadReconciliation();
    return () => {
      requestSeqRef.current += 1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, departmentId, purchaseType, vehicleType, includeMonthlyDepartmentSubReport]);

  const filteredAccountGroups = useMemo(() => {
    const groups = data?.accountGroups || [];
    const term = searchFilter.trim().toLowerCase();
    return groups
      .filter((g) => !accountGroupFilter || g.accountGroup === accountGroupFilter)
      .map((g) => {
        if (!term) return g;
        const matched = g.rows.filter(
          (r) =>
            r.reference.toLowerCase().includes(term) ||
            r.description.toLowerCase().includes(term) ||
            r.department.toLowerCase().includes(term) ||
            r.className.toLowerCase().includes(term)
        );
        return {
          ...g,
          rows: matched,
          subtotal: matched.reduce((s, r) => s + r.amount, 0),
        };
      })
      .filter((g) => g.rows.length > 0);
  }, [data, accountGroupFilter, searchFilter]);

  const applyQuarterPreset = (quarter: number) => {
    const q = getQuarterRange(currentYear, quarter);
    setIsCustomPeriodLabel(false);
    setStartDate(q.startDate);
    setEndDate(q.endDate);
    setPeriodLabel(q.periodLabel);
  };

  const applyThisMonthPreset = () => {
    const now = new Date();
    const s = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    const e = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0));
    setIsCustomPeriodLabel(false);
    setStartDate(s.toISOString().slice(0, 10));
    setEndDate(e.toISOString().slice(0, 10));
    setPeriodLabel(now.toLocaleString('en-US', { month: 'long', year: 'numeric' }));
  };

  const handleResetFilters = () => {
    const q = getQuarterRange(currentYear, currentQuarter);
    setIsCustomPeriodLabel(false);
    setStartDate(q.startDate);
    setEndDate(q.endDate);
    setPeriodLabel(q.periodLabel);
    setDepartmentId('');
    setPurchaseType('');
    setVehicleType('');
    setAccountGroupFilter('');
    setSearchFilter('');
    setQbReferenceInput('');
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    setIsExporting(true);
    try {
      const payload = buildPayload();
      const blob =
        format === 'pdf'
          ? await api.exportQuickBooksReconciliationPdf(payload)
          : await api.exportQuickBooksReconciliationExcel(payload);
      triggerDownload(
        blob,
        `quickbooks-reconciliation-${startDate || 'period'}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
      );
      showToast(`Reconciliation ${format.toUpperCase()} downloaded!`, 'success');
    } catch {
      showToast(`Failed to generate Reconciliation ${format.toUpperCase()}.`, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    if (!data) return;
    const win = window.open('', '_blank', 'width=1020,height=840');
    if (!win) {
      showToast('Please allow pop-ups to print this reconciliation sheet.', 'warning');
      return;
    }

    const showVehicleCols = Boolean(vehicleType) || Boolean(data.includeVehicleColumns);
    const totalCols = showVehicleCols ? 8 : 6;
    const labelCols = totalCols - 1;

    const accountHtml = data.accountGroups
      .map(
        (grp) => `
        <tr class="grp"><td colspan="${totalCols}">${grp.accountGroup}</td></tr>
        ${grp.rows
          .map(
            (r) => `
          <tr>
            <td>${r.date}</td>
            <td>${r.reference}</td>
            <td>${r.department}</td>
            <td>${r.description}</td>
            ${showVehicleCols ? `<td>${r.plateNumber || '-'}</td><td>${r.engineNumber || '-'}</td>` : ''}
            <td>${r.className}</td>
            <td class="num">${formatCurrency(r.amount)}</td>
          </tr>`
          )
          .join('')}
        <tr class="sub">
          <td colspan="${labelCols}" class="num"><em>Subtotal (${grp.accountGroup})</em></td>
          <td class="num subval">${formatCurrency(grp.subtotal)}</td>
        </tr>`
      )
      .join('');

    const summaryHtml = data.recordedSummary
      .map(
        (s) => `
        <tr>
          <td>* ${s.categoryLabel}</td>
          <td style="text-align:center;width:28px;">$</td>
          <td class="num" style="width:110px;">${formatCurrency(s.amount)}</td>
        </tr>`
      )
      .join('');

    const deptSubHtml =
      includeMonthlyDepartmentSubReport && data.departmentMonthlySubReport.length > 0
        ? `
      <h4 style="margin:20px 0 6px;">Sub-Report: New Product Amount by Month &amp; Department (${data.periodLabel})</h4>
      <table class="grid">
        <thead>
          <tr>
            <th>Department</th>
            ${data.months.map((m) => `<th class="num">${m}</th>`).join('')}
            <th class="num">Qty</th>
            <th class="num">Total ($)</th>
          </tr>
        </thead>
        <tbody>
          ${data.departmentMonthlySubReport
            .map(
              (d) => `
            <tr>
              <td>${d.department}</td>
              ${data.months
                .map((m) => `<td class="num">${(d.monthlyAmounts[m] || 0) > 0 ? formatCurrency(d.monthlyAmounts[m]) : '-'}</td>`)
                .join('')}
              <td class="num">${d.totalQuantity}</td>
              <td class="num"><strong>${formatCurrency(d.totalAmount)}</strong></td>
            </tr>`
            )
            .join('')}
          <tr style="background:#eef2f7;font-weight:700;">
            <td>Monthly Total</td>
            ${data.months.map((m) => `<td class="num">${formatCurrency(data.monthColumnTotals[m] || 0)}</td>`).join('')}
            <td class="num">${data.totalQuantity}</td>
            <td class="num">$ ${formatCurrency(data.grandTotal)}</td>
          </tr>
        </tbody>
      </table>`
        : '';

    win.document.write(`<!DOCTYPE html><html><head><title>Inventory/Fixed asset RECONCILIATION to Quick Book</title>
      <style>
        body { font-family: Arial, sans-serif; color:#111; margin:24px; font-size:12px; }
        h2 { margin:0 0 4px; font-size:16px; }
        .period { font-weight:600; margin-bottom:10px; border-bottom:1.5px solid #111; padding-bottom:6px; }
        table { width:100%; border-collapse:collapse; margin-top:6px; }
        th, td { padding:5px 6px; text-align:left; font-size:11.5px; }
        thead th { border-bottom:1.2px solid #111; }
        .num { text-align:right; }
        .grp td { font-weight:700; background:#f8fafc; padding-top:8px; }
        .subval { border-top:1px solid #111; border-bottom:1px solid #111; font-weight:700; }
        .grand td { border-top:1.2px solid #111; border-bottom:2px double #111; font-weight:700; padding:7px 6px; }
        .box { width:360px; margin:18px auto 0; border-collapse:collapse; }
        .box td { border:1px solid #111; padding:5px 8px; }
        .grid th, .grid td { border:1px solid #94a3b8; padding:4px 6px; }
        .sigs { display:flex; justify-content:space-between; margin-top:42px; }
        @media print { body { margin:10mm; } }
      </style></head><body>
      <h2>Inventory/Fixed asset RECONCILIATION to Quick Book</h2>
      <div class="period">For the Month of : ${data.periodLabel}</div>
      <strong>Quick Book Report</strong>
      <table>
        <thead><tr><th>Date</th><th>Reference</th><th>Department</th><th>Description</th>${showVehicleCols ? '<th>Plate #</th><th>Engine/Serial #</th>' : ''}<th>Class</th><th class="num">Amount</th></tr></thead>
        <tbody>
          ${accountHtml || `<tr><td colspan="${totalCols}" style="text-align:center;padding:18px;">No new products recorded in this period.</td></tr>`}
          <tr class="grand"><td colspan="${labelCols}">Total Ending amount to Quick Book ${data.periodLabel}</td><td class="num">$ ${formatCurrency(data.grandTotal)}</td></tr>
        </tbody>
      </table>
      <div style="text-align:center;margin-top:20px;"><strong>Ending amount according to inventory/Fixed asset recorded ${data.periodLabel}</strong></div>
      <table class="box">
        <tbody>
          ${summaryHtml}
          <tr style="background:#f1f5f9;font-weight:700;"><td>Total</td><td style="text-align:center;">$</td><td class="num">${formatCurrency(data.grandTotal)}</td></tr>
        </tbody>
      </table>
      ${deptSubHtml}
      <div class="sigs">
        <div><div><strong>Prepared by:</strong></div><div style="margin-top:38px;"><strong>${preparedBy ? `${preparedBy} (${preparedRole})` : preparedRole}</strong></div></div>
        <div style="text-align:right;"><div><strong>Reviewed by:</strong></div><div style="margin-top:38px;"><strong>${reviewedBy ? `${reviewedBy} (${reviewedRole})` : reviewedRole}</strong></div></div>
      </div>
      <script>window.onload=function(){window.focus();window.print();};</script>
    </body></html>`);
    win.document.close();
  };

  return (
    <Stack spacing={2.5}>
      {/* Controls & Quick Presets */}
      <Card variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <AccountBalanceIcon color="primary" />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                QuickBooks Reconciliation &amp; Monthly Department Sub-Reports
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Reconciles newly acquired products/assets by invoice month &amp; department against QuickBooks accounts
              </Typography>
            </Box>
          </Box>

          <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: 'wrap' }}>
            <Button size="small" variant="outlined" onClick={applyThisMonthPreset} sx={{ whiteSpace: 'nowrap' }}>
              This Month
            </Button>
            {[1, 2, 3, 4].map((q) => (
              <Button key={q} size="small" variant="outlined" onClick={() => applyQuarterPreset(q)} sx={{ whiteSpace: 'nowrap' }}>
                Q{q} {currentYear}
              </Button>
            ))}
          </Stack>
        </Box>

        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, sm: 3, md: 2 }}>
            <DatePicker
              label="From Date"
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
              value={startDate ? dayjs(startDate) : null}
              onChange={(newDate: Dayjs | null) =>
                setStartDate(newDate && newDate.isValid() ? newDate.format('YYYY-MM-DD') : '')
              }
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3, md: 2 }}>
            <DatePicker
              label="To Date"
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
              value={endDate ? dayjs(endDate) : null}
              onChange={(newDate: Dayjs | null) =>
                setEndDate(newDate && newDate.isValid() ? newDate.format('YYYY-MM-DD') : '')
              }
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              label="Period Label (Shown on Report)"
              size="small"
              fullWidth
              value={periodLabel}
              onChange={(e) => {
                setIsCustomPeriodLabel(true);
                setPeriodLabel(e.target.value);
              }}
              placeholder="e.g. April–June 2026"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Department</InputLabel>
              <Select label="Department" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                <MenuItem value="">All Departments</MenuItem>
                {departments.map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 4, md: 1.5 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Acquisition</InputLabel>
              <Select label="Acquisition" value={purchaseType} onChange={(e) => setPurchaseType(e.target.value)}>
                <MenuItem value="">All (Purchased &amp; Donated)</MenuItem>
                <MenuItem value="Purchased">Purchased Only</MenuItem>
                <MenuItem value="Donated">Donated Only</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 4, md: 1.5 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Vehicle / Fleet</InputLabel>
              <Select label="Vehicle / Fleet" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
                {VEHICLE_FILTER_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value || 'all'} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mt: 2 }}>
          <Stack direction="row" useFlexGap spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 185 }}>
              <InputLabel>Account Group</InputLabel>
              <Select
                label="Account Group"
                value={accountGroupFilter}
                onChange={(e) => setAccountGroupFilter(e.target.value)}
              >
                <MenuItem value="">All Account Groups</MenuItem>
                {(data?.accountGroups || []).map((g) => (
                  <MenuItem key={g.accountGroup} value={g.accountGroup}>
                    {g.accountGroup}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <SearchField
              label="Search Reference / Desc"
              value={searchFilter}
              onChange={(val) => setSearchFilter(val)}
              onClear={() => setSearchFilter('')}
              sx={{ width: 225 }}
            />
            <TextField
              label="QuickBooks Ledger Total ($ optional)"
              size="small"
              type="number"
              value={qbReferenceInput}
              onChange={(e) => setQbReferenceInput(e.target.value)}
              sx={{ width: 225 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={includeMonthlyDepartmentSubReport}
                  onChange={(e) => setIncludeMonthlyDepartmentSubReport(e.target.checked)}
                  size="small"
                />
              }
              label={<Typography variant="body2">Monthly × Dept Sub-Report</Typography>}
            />
            <Button
              size="small"
              startIcon={<SettingsIcon />}
              onClick={() => setShowAdvancedMappings((prev) => !prev)}
              sx={{ whiteSpace: 'nowrap' }}
            >
              {showAdvancedMappings ? 'Hide' : 'Account Code & Signatory Setup'}
            </Button>
            <Button
              size="small"
              color="inherit"
              startIcon={<ResetIcon />}
              onClick={handleResetFilters}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Reset
            </Button>
          </Stack>

          <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
            <Button size="small" variant="outlined" startIcon={<RefreshIcon />} onClick={loadReconciliation} disabled={loading} sx={{ whiteSpace: 'nowrap' }}>
              Refresh
            </Button>
            <Button size="small" variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint} disabled={!data} sx={{ whiteSpace: 'nowrap' }}>
              Print
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={<ExcelIcon />}
              disabled={isExporting}
              onClick={() => handleExport('excel')}
              sx={{ bgcolor: '#107c41', '&:hover': { bgcolor: '#0c5a2e' }, whiteSpace: 'nowrap' }}
            >
              Export Excel
            </Button>
            <Button
              size="small"
              variant="contained"
              color="error"
              startIcon={<PdfIcon />}
              disabled={isExporting}
              onClick={() => handleExport('pdf')}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Export PDF
            </Button>
          </Stack>
        </Box>

        <Collapse in={showAdvancedMappings}>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField label="Prepared By Name" size="small" fullWidth value={preparedBy} onChange={(e) => setPreparedBy(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField label="Prepared By Role" size="small" fullWidth value={preparedRole} onChange={(e) => setPreparedRole(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField label="Reviewed By Name" size="small" fullWidth value={reviewedBy} onChange={(e) => setReviewedBy(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField label="Reviewed By Role" size="small" fullWidth value={reviewedRole} onChange={(e) => setReviewedRole(e.target.value)} />
            </Grid>
          </Grid>

          {categories.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>
                Optional QuickBooks Account Group Overrides per Category (e.g. &quot;2401 · IT/Computers&quot;, &quot;2405 · Intangible Assets&quot;, &quot;2406 · Inventory&quot;):
              </Typography>
              <Grid container spacing={1.5}>
                {categories.map((cat) => (
                  <Grid key={cat.id} size={{ xs: 12, sm: 4, md: 3 }}>
                    <TextField
                      label={cat.name}
                      size="small"
                      fullWidth
                      placeholder="Auto-detected"
                      value={accountMappings[cat.name] || ''}
                      onChange={(e) =>
                        setAccountMappings((prev) => ({
                          ...prev,
                          [cat.name]: e.target.value,
                        }))
                      }
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Collapse>
      </Card>

      {loadError && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={loadReconciliation}>
              Retry
            </Button>
          }
        >
          {loadError}
        </Alert>
      )}

      {/* Paper Canvas Preview */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 3.5 },
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: '#ffffff',
          color: '#0f172a',
        }}
      >
        {loading ? (
          <Box sx={{ py: 10, textAlign: 'center' }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={3}>
            {/* Sheet Title & Variance Badge */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, borderBottom: '2px solid #0f172a', pb: 1.5 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 0.2 }}>
                  Inventory/Fixed asset RECONCILIATION to Quick Book
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mt: 0.25 }}>
                  For the Month of : {data?.periodLabel || periodLabel}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Chip
                  label={`New Items: ${data?.totalItems ?? 0} (Qty: ${data?.totalQuantity ?? 0})`}
                  size="small"
                  variant="outlined"
                />
                {data?.varianceAmount != null && (
                  <Chip
                    label={
                      Math.abs(data.varianceAmount) < 0.01
                        ? 'Reconciled ($0.00 Variance)'
                        : `Variance: $${formatCurrency(data.varianceAmount)}`
                    }
                    color={Math.abs(data.varianceAmount) < 0.01 ? 'success' : 'warning'}
                    size="small"
                  />
                )}
              </Stack>
            </Box>

            {/* Quick Book Report Table */}
            {(() => {
              const showVehicleCols = Boolean(vehicleType) || Boolean(data?.includeVehicleColumns);
              const totalCols = showVehicleCols ? 8 : 6;
              const labelCols = totalCols - 1;
              return (
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                    Quick Book Report
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ borderBottom: '1.5px solid #0f172a' }}>
                          <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Reference</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                          {showVehicleCols && (
                            <>
                              <TableCell sx={{ fontWeight: 700 }}>Plate #</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Engine / Serial #</TableCell>
                            </>
                          )}
                          <TableCell sx={{ fontWeight: 700 }}>Class</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            Amount
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {!data || filteredAccountGroups.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={totalCols} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                              {data && data.accountGroups.length > 0
                                ? 'No reconciliation rows match the selected Account Group or Search filter.'
                                : `No newly acquired products/assets recorded between ${startDate} and ${endDate}.`}
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredAccountGroups.map((grp) => (
                            <React.Fragment key={grp.accountGroup}>
                              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                <TableCell colSpan={totalCols} sx={{ fontWeight: 700, py: 0.9 }}>
                                  {grp.accountGroup}
                                </TableCell>
                              </TableRow>
                              {grp.rows.map((r) => (
                                <TableRow key={r.productId} hover>
                                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{r.date}</TableCell>
                                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{r.reference}</TableCell>
                                  <TableCell>{r.department}</TableCell>
                                  <TableCell>{r.description}</TableCell>
                                  {showVehicleCols && (
                                    <>
                                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{r.plateNumber || '-'}</TableCell>
                                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{r.engineNumber || '-'}</TableCell>
                                    </>
                                  )}
                                  <TableCell>{r.className}</TableCell>
                                  <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                                    {formatCurrency(r.amount)}
                                  </TableCell>
                                </TableRow>
                              ))}
                              <TableRow>
                                <TableCell colSpan={labelCols} align="right" sx={{ fontStyle: 'italic', color: '#475569' }}>
                                  Subtotal ({grp.accountGroup})
                                </TableCell>
                                <TableCell
                                  align="right"
                                  sx={{
                                    fontWeight: 700,
                                    borderTop: '1px solid #0f172a',
                                    borderBottom: '1px solid #0f172a',
                                    fontVariantNumeric: 'tabular-nums',
                                  }}
                                >
                                  {formatCurrency(grp.subtotal)}
                                </TableCell>
                              </TableRow>
                            </React.Fragment>
                          ))
                        )}

                        {/* Total Ending amount to Quick Book */}
                        <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                          <TableCell
                            colSpan={labelCols}
                            sx={{ fontWeight: 800, borderTop: '1.5px solid #0f172a', borderBottom: '2px double #0f172a' }}
                          >
                            Total Ending amount to Quick Book {data?.periodLabel || periodLabel}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              fontWeight: 800,
                              borderTop: '1.5px solid #0f172a',
                              borderBottom: '2px double #0f172a',
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            $ {formatCurrency(data?.grandTotal ?? 0)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              );
            })()}

            {/* Sub-Report 1: Centered Summary Box matching Photo #1 */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, textAlign: 'center' }}>
                Ending amount according to inventory/Fixed asset recorded {data?.periodLabel || periodLabel}
              </Typography>
              <Table
                size="small"
                sx={{
                  maxWidth: 420,
                  border: '1px solid #0f172a',
                  '& td': { borderColor: '#0f172a', borderBottom: '1px solid #0f172a' },
                }}
              >
                <TableBody>
                  {(data?.recordedSummary || []).map((s) => (
                    <TableRow key={s.categoryLabel}>
                      <TableCell sx={{ fontWeight: 500 }}>* {s.categoryLabel}</TableCell>
                      <TableCell align="center" sx={{ width: 32 }}>
                        $
                      </TableCell>
                      <TableCell align="right" sx={{ width: 120, fontVariantNumeric: 'tabular-nums' }}>
                        {formatCurrency(s.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                    <TableCell sx={{ fontWeight: 800 }}>Total</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800 }}>
                      $
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                      {formatCurrency(data?.grandTotal ?? 0)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>

            {/* Sub-Report 2: Monthly New Product Amount by Department */}
            {includeMonthlyDepartmentSubReport && data && data.departmentMonthlySubReport.length > 0 && (
              <Box sx={{ pt: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                  Sub-Report: New Product Amount by Month &amp; Department ({data.periodLabel})
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#e2e8f0' }}>
                        <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                        {data.months.map((m) => (
                          <TableCell key={m} align="right" sx={{ fontWeight: 700 }}>
                            {m}
                          </TableCell>
                        ))}
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          Items
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          Qty
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          Total ($)
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.departmentMonthlySubReport.map((dRow) => (
                        <TableRow key={dRow.department} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{dRow.department}</TableCell>
                          {data.months.map((m) => {
                            const amt = dRow.monthlyAmounts[m] || 0;
                            return (
                              <TableCell key={m} align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                                {amt > 0 ? formatCurrency(amt) : '-'}
                              </TableCell>
                            );
                          })}
                          <TableCell align="right">{dRow.totalItems}</TableCell>
                          <TableCell align="right">{dRow.totalQuantity}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                            {formatCurrency(dRow.totalAmount)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow sx={{ bgcolor: '#dbeafe' }}>
                        <TableCell sx={{ fontWeight: 800 }}>Monthly Total</TableCell>
                        {data.months.map((m) => (
                          <TableCell key={m} align="right" sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                            {formatCurrency(data.monthColumnTotals[m] || 0)}
                          </TableCell>
                        ))}
                        <TableCell align="right" sx={{ fontWeight: 800 }}>
                          {data.totalItems}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800 }}>
                          {data.totalQuantity}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                          $ {formatCurrency(data.grandTotal)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* Signature Footer matching Photo #1 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 4, px: { xs: 1, sm: 4 } }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Prepared by:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, mt: 5 }}>
                  {preparedBy ? `${preparedBy} (${preparedRole})` : preparedRole}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Reviewed by:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, mt: 5 }}>
                  {reviewedBy ? `${reviewedBy} (${reviewedRole})` : reviewedRole}
                </Typography>
              </Box>
            </Box>
          </Stack>
        )}
      </Paper>
    </Stack>
  );
};
