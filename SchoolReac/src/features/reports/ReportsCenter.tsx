import React, { useEffect, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  Add as AddIcon,
  Assessment as AssessmentIcon,
  Business as BusinessIcon,
  CalendarMonth as CalendarMonthIcon,
  Clear as ClearIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  RestartAlt as ResetIcon,
  ScheduleSend as ScheduleSendIcon,
  TableChart as ExcelIcon,
} from '@mui/icons-material';
import * as api from '../../services/api';
import { VEHICLE_FILTER_OPTIONS, matchesProductVehicleFilter } from './vehicleFilterUtils';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../context/ToastContext';
import { WysiwygReportBuilder } from './WysiwygReportBuilder';
import { QuickBooksReconciliationTab } from './QuickBooksReconciliationTab';
import { PageTransition } from '../../components/PageTransition';
import { SearchField } from '../../components/SearchField';
import { AnimatedNavTabs } from '../../components/AnimatedNavTabs';

const triggerDownload = (blobData: Blob, filename: string) => {
  const url = URL.createObjectURL(blobData);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const ReportsCenter: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState(0);

  // Product / Equipment Assessment Form State
  const [departments, setDepartments] = useState<api.DepartmentDto[]>([]);
  const [productOptions, setProductOptions] = useState<api.ProductDto[]>([]);
  const [asmVehicleFilter, setAsmVehicleFilter] = useState('');
  const [productAssessment, setProductAssessment] = useState<api.AssessmentRequestFormDto>({
    assessmentNo: `ASM-${new Date().getFullYear()}-001`,
    assessmentDate: new Date().toISOString().slice(0, 10),
    refToTicketNo: '',
    itemCode: '',
    subject: 'New Equipment / Replacement Request',
    issueDescription: '',
    userName: user?.fullName || '',
    departmentName: '',
    brandName: '',
    modelName: '',
    checkedBy: '',
    checkedDate: new Date().toISOString().slice(0, 10),
    items: [{ description: '', quantity: 1, price: 0 }],
  });
  const [isExportingProductAsm, setIsExportingProductAsm] = useState(false);

  // Monthly Transactions State & Live Preview
  const [txYear, setTxYear] = useState(new Date().getFullYear());
  const [txMonth, setTxMonth] = useState(new Date().getMonth() + 1);
  const [txDepartmentId, setTxDepartmentId] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState('All');
  const [txVehicleType, setTxVehicleType] = useState('');
  const [txSearch, setTxSearch] = useState('');
  const [txPreviewRows, setTxPreviewRows] = useState<api.TransactionDto[]>([]);
  const [txPreviewTotal, setTxPreviewTotal] = useState(0);
  const [txPreviewLoading, setTxPreviewLoading] = useState(false);
  const [txPreviewError, setTxPreviewError] = useState<string | null>(null);
  const [isExportingMonthly, setIsExportingMonthly] = useState(false);

  useEffect(() => {
    api.getDepartments().then(setDepartments).catch(() => setDepartments([]));
  }, []);

  useEffect(() => {
    if (activeTab !== 2 || productOptions.length > 0) return;
    api
      .getProducts({ pageNumber: 1, pageSize: 250, sortBy: 'name', isAscending: true })
      .then((r) => setProductOptions(r.items || []))
      .catch(() => setProductOptions([]));
  }, [activeTab, productOptions.length]);

  useEffect(() => {
    if (activeTab !== 3) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setTxPreviewLoading(true);
      setTxPreviewError(null);
      try {
        const start = new Date(Date.UTC(txYear, txMonth - 1, 1, 0, 0, 0));
        const end = new Date(Date.UTC(txYear, txMonth, 0, 23, 59, 59));
        const res = await api.getTransactions({
          pageNumber: 1,
          pageSize: 25,
          name: txSearch || undefined,
          departmentId: txDepartmentId || undefined,
          transactionType: txTypeFilter !== 'All' ? txTypeFilter : undefined,
          vehicleType: txVehicleType || undefined,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        });
        if (!cancelled) {
          setTxPreviewRows(res.items || []);
          setTxPreviewTotal(res.totalCount || 0);
        }
      } catch (err: any) {
        if (!cancelled) {
          setTxPreviewError(
            err?.response?.data?.message || 'Could not load monthly transactions preview.'
          );
        }
      } finally {
        if (!cancelled) setTxPreviewLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [activeTab, txYear, txMonth, txDepartmentId, txTypeFilter, txVehicleType, txSearch]);

  const updateAssessmentLine = (
    setter: React.Dispatch<React.SetStateAction<any>>,
    index: number,
    field: keyof api.AssessmentLineItemDto,
    value: string | number
  ) => {
    setter((prev: any) => {
      const updated = [...prev.items];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, items: updated };
    });
  };

  const handleExportProductAssessment = async (format: 'pdf' | 'excel') => {
    setIsExportingProductAsm(true);
    try {
      const payload = {
        ...productAssessment,
        assessmentDate: new Date(productAssessment.assessmentDate).toISOString(),
        checkedDate: productAssessment.checkedDate
          ? new Date(productAssessment.checkedDate).toISOString()
          : null,
      };
      const blob =
        format === 'pdf'
          ? await api.exportProductAssessmentPdf(payload)
          : await api.exportProductAssessmentExcel(payload);
      triggerDownload(
        blob,
        `assessment-request-${productAssessment.assessmentNo || 'form'}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
      );
      showToast(`Product Assessment ${format.toUpperCase()} downloaded!`, 'success');
    } catch {
      showToast(`Failed to generate Product Assessment ${format.toUpperCase()}.`, 'error');
    } finally {
      setIsExportingProductAsm(false);
    }
  };

  const handleMonthlyReport = async (action: 'pdf' | 'excel' | 'enqueue') => {
    setIsExportingMonthly(true);
    const filters: api.MonthlyTransactionReportFilters = {
      departmentId: txDepartmentId || undefined,
      transactionType: txTypeFilter !== 'All' ? txTypeFilter : undefined,
      search: txSearch || undefined,
      vehicleType: txVehicleType || undefined,
    };
    try {
      if (action === 'pdf') {
        const blob = await api.downloadMonthlyTransactionsPdf(txYear, txMonth, filters);
        triggerDownload(blob, `monthly-transactions-${txYear}-${String(txMonth).padStart(2, '0')}.pdf`);
        showToast('Monthly Transaction PDF downloaded!', 'success');
      } else if (action === 'excel') {
        const blob = await api.downloadMonthlyTransactionsExcel(txYear, txMonth, filters);
        triggerDownload(blob, `monthly-transactions-${txYear}-${String(txMonth).padStart(2, '0')}.xlsx`);
        showToast('Monthly Transaction Excel downloaded!', 'success');
      } else {
        const res = await api.enqueueMonthlyTransactionsReport(txYear, txMonth);
        showToast(`${res.message} (Job #${res.jobId})`, 'info');
      }
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message;
      showToast(
        serverMsg || 'Monthly report request failed. Check permissions or server status.',
        err?.response?.status === 503 ? 'warning' : 'error'
      );
    } finally {
      setIsExportingMonthly(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Page Header */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Enterprise Reports & WYSIWYG Builder
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Interactive WYSIWYG report designer with live A4 canvas, drag-and-drop sections/columns, formula subtotals, PDF & multi-sheet Excel
            </Typography>
          </Box>
        </Box>

        <AnimatedNavTabs
          value={activeTab}
          onChange={(v) => setActiveTab(v)}
          layoutGroupId="reports-nav"
          ariaLabel="reports center tabs"
          sx={{ mt: 2 }}
          items={[
            { value: 0, icon: <BusinessIcon />, label: 'WYSIWYG Report Builder' },
            { value: 1, icon: <AccountBalanceIcon />, label: 'QuickBooks Reconciliation' },
            { value: 2, icon: <AssessmentIcon />, label: 'Equipment / Asset Assessment' },
            { value: 3, icon: <ExcelIcon />, label: 'Monthly Transactions' },
          ]}
        />
      </Paper>

      <PageTransition pageKey={activeTab} variant="tab">
        {/* TAB 0: WYSIWYG Report Builder Studio */}
        {activeTab === 0 && <WysiwygReportBuilder />}

        {/* TAB 1: QuickBooks Reconciliation & Monthly Department Sub-Reports */}
        {activeTab === 1 && <QuickBooksReconciliationTab />}

        {/* TAB 2: Equipment / Asset Assessment Form */}
        {activeTab === 2 && (
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Equipment / Asset Assessment Request Form
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Generates official inventory Assessment Form PDF / Excel via server reporting engine
                </Typography>
              </Box>
              <Stack direction="row" useFlexGap spacing={1.25} sx={{ flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<PdfIcon />}
                  disabled={isExportingProductAsm}
                  onClick={() => handleExportProductAssessment('pdf')}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Export PDF
                </Button>
                <Button
                  variant="contained"
                  startIcon={<ExcelIcon />}
                  disabled={isExportingProductAsm}
                  onClick={() => handleExportProductAssessment('excel')}
                  sx={{ bgcolor: '#107c41', '&:hover': { bgcolor: '#0c5a2e' }, whiteSpace: 'nowrap' }}
                >
                  Export Excel
                </Button>
              </Stack>
            </Box>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField label="Assessment No" fullWidth size="small" value={productAssessment.assessmentNo} onChange={(e) => setProductAssessment((p) => ({ ...p, assessmentNo: e.target.value }))} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <DatePicker
                  label="Assessment Date"
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  value={productAssessment.assessmentDate ? dayjs(productAssessment.assessmentDate) : null}
                  onChange={(newDate: Dayjs | null) =>
                    setProductAssessment((p) => ({
                      ...p,
                      assessmentDate: newDate && newDate.isValid() ? newDate.format('YYYY-MM-DD') : '',
                    }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField label="Ref to Ticket No" fullWidth size="small" value={productAssessment.refToTicketNo} onChange={(e) => setProductAssessment((p) => ({ ...p, refToTicketNo: e.target.value }))} />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Vehicle / Fleet Filter</InputLabel>
                  <Select
                    label="Vehicle / Fleet Filter"
                    value={asmVehicleFilter}
                    onChange={(e) => setAsmVehicleFilter(e.target.value)}
                  >
                    {VEHICLE_FILTER_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value || 'all'} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 5 }}>
                <Autocomplete
                  freeSolo
                  size="small"
                  options={productOptions.filter((p) => matchesProductVehicleFilter(p, asmVehicleFilter))}
                  getOptionLabel={(opt) =>
                    typeof opt === 'string'
                      ? opt
                      : `${opt.codeNumber || 'No Code'} — ${opt.name}${opt.plateNumber ? ` [Plate: ${opt.plateNumber}]` : ''}`
                  }
                  inputValue={productAssessment.itemCode}
                  onInputChange={(_, val) =>
                    setProductAssessment((p) => ({ ...p, itemCode: val }))
                  }
                  onChange={(_, selected) => {
                    if (!selected || typeof selected === 'string') return;
                    const vehicleMeta = [
                      selected.attributes,
                      selected.plateNumber ? `Plate: ${selected.plateNumber}` : '',
                      selected.engineNumber ? `Engine/Serial: ${selected.engineNumber}` : '',
                    ]
                      .filter(Boolean)
                      .join(' · ');
                    setProductAssessment((p) => {
                      const nextItems = [...p.items];
                      if (nextItems.length > 0 && !nextItems[0].description.trim()) {
                        nextItems[0] = {
                          description: `${selected.name}${vehicleMeta ? ` (${vehicleMeta})` : ''}`,
                          quantity: 1,
                          price: selected.price ?? 0,
                        };
                      }
                      return {
                        ...p,
                        itemCode: selected.codeNumber || selected.name,
                        departmentName: selected.departmentName || p.departmentName,
                        brandName: selected.brandName || p.brandName,
                        modelName: vehicleMeta || p.modelName,
                        items: nextItems,
                      };
                    });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Item Code / Lookup Product"
                      placeholder="Search code or item..."
                      fullWidth
                      slotProps={{
                        ...params.slotProps,
                        input: {
                          ...params.slotProps?.input,
                          endAdornment: (
                            <>
                              {productAssessment.itemCode && (
                                <InputAdornment position="end">
                                  <IconButton
                                    size="small"
                                    aria-label="Clear product lookup"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => setProductAssessment((p) => ({ ...p, itemCode: '' }))}
                                  >
                                    <ClearIcon fontSize="small" />
                                  </IconButton>
                                </InputAdornment>
                              )}
                              {params.slotProps?.input?.endAdornment}
                            </>
                          ),
                        },
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField label="User Name" fullWidth size="small" value={productAssessment.userName} onChange={(e) => setProductAssessment((p) => ({ ...p, userName: e.target.value }))} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Autocomplete
                  freeSolo
                  size="small"
                  options={departments.map((d) => d.name)}
                  inputValue={productAssessment.departmentName}
                  onInputChange={(_, val) =>
                    setProductAssessment((p) => ({ ...p, departmentName: val }))
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="Department" fullWidth />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField label="Brand" fullWidth size="small" value={productAssessment.brandName} onChange={(e) => setProductAssessment((p) => ({ ...p, brandName: e.target.value }))} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField label="Model / Specs" fullWidth size="small" value={productAssessment.modelName} onChange={(e) => setProductAssessment((p) => ({ ...p, modelName: e.target.value }))} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField label="Subject" fullWidth size="small" value={productAssessment.subject} onChange={(e) => setProductAssessment((p) => ({ ...p, subject: e.target.value }))} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Checked By" fullWidth size="small" value={productAssessment.checkedBy} onChange={(e) => setProductAssessment((p) => ({ ...p, checkedBy: e.target.value }))} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DatePicker
                  label="Checked Date"
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  value={productAssessment.checkedDate ? dayjs(productAssessment.checkedDate) : null}
                  onChange={(newDate: Dayjs | null) =>
                    setProductAssessment((p) => ({
                      ...p,
                      checkedDate: newDate && newDate.isValid() ? newDate.format('YYYY-MM-DD') : '',
                    }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField label="Issue Description" multiline rows={2} fullWidth size="small" value={productAssessment.issueDescription} onChange={(e) => setProductAssessment((p) => ({ ...p, issueDescription: e.target.value }))} />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Requested / Assessment Items</Typography>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() =>
                  setProductAssessment((p) => ({
                    ...p,
                    items: [...p.items, { description: '', quantity: 1, price: 0 }],
                  }))
                }
              >
                Add Line Item
              </Button>
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Description</TableCell>
                  <TableCell width={110}>Quantity</TableCell>
                  <TableCell width={130}>Unit Price ($)</TableCell>
                  <TableCell width={120} align="right">Total</TableCell>
                  <TableCell width={60} />
                </TableRow>
              </TableHead>
              <TableBody>
                {productAssessment.items.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        value={row.description}
                        onChange={(e) => updateAssessmentLine(setProductAssessment, idx, 'description', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={row.quantity}
                        onChange={(e) => updateAssessmentLine(setProductAssessment, idx, 'quantity', Math.max(1, Number(e.target.value)))}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={row.price}
                        onChange={(e) => updateAssessmentLine(setProductAssessment, idx, 'price', Math.max(0, Number(e.target.value)))}
                      />
                    </TableCell>
                    <TableCell align="right">${(row.quantity * row.price).toFixed(2)}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="error"
                        disabled={productAssessment.items.length === 1}
                        onClick={() =>
                          setProductAssessment((p) => ({
                            ...p,
                            items: p.items.filter((_, i) => i !== idx),
                          }))
                        }
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}

        {/* TAB 3: Monthly Transaction Report */}
        {activeTab === 3 && (
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: 2,
                    bgcolor: 'primary.50',
                    color: 'primary.main',
                    border: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CalendarMonthIcon />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.25 }}>
                    Monthly Transactions Report
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Generate or queue monthly purchase and donation transaction summaries for accounting audit
                  </Typography>
                </Box>
              </Box>

              <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
                <Chip
                  size="small"
                  color="primary"
                  variant="outlined"
                  label={`Period: ${new Date(txYear, txMonth - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })}`}
                  sx={{ fontWeight: 600 }}
                />
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    const now = new Date();
                    setTxYear(now.getFullYear());
                    setTxMonth(now.getMonth() + 1);
                  }}
                >
                  This Month
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    const prev = new Date();
                    prev.setMonth(prev.getMonth() - 1);
                    setTxYear(prev.getFullYear());
                    setTxMonth(prev.getMonth() + 1);
                  }}
                >
                  Last Month
                </Button>
              </Stack>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Stack direction="row" useFlexGap spacing={2} sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
                <DatePicker
                  label="Reporting Month"
                  views={['year', 'month']}
                  openTo="month"
                  value={dayjs(`${txYear}-${String(txMonth).padStart(2, '0')}-01`)}
                  onChange={(newVal: Dayjs | null) => {
                    if (newVal && newVal.isValid()) {
                      setTxYear(newVal.year());
                      setTxMonth(newVal.month() + 1);
                    }
                  }}
                  slotProps={{ textField: { size: 'small', sx: { width: 205 } } }}
                />

                <FormControl size="small" sx={{ minWidth: 155 }}>
                  <InputLabel>Month</InputLabel>
                  <Select label="Month" value={txMonth} onChange={(e) => setTxMonth(Number(e.target.value))}>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <MenuItem key={m} value={m}>
                        {new Date(2000, m - 1, 1).toLocaleString('en-US', { month: 'long' })} ({m})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 165 }}>
                  <InputLabel>Department</InputLabel>
                  <Select
                    label="Department"
                    value={txDepartmentId}
                    onChange={(e) => setTxDepartmentId(e.target.value)}
                  >
                    <MenuItem value="">All Departments</MenuItem>
                    {departments.map((d) => (
                      <MenuItem key={d.id} value={d.id}>
                        {d.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Transaction Type</InputLabel>
                  <Select
                    label="Transaction Type"
                    value={txTypeFilter}
                    onChange={(e) => setTxTypeFilter(e.target.value)}
                  >
                    <MenuItem value="All">All Types</MenuItem>
                    <MenuItem value="Purchase">Purchase</MenuItem>
                    <MenuItem value="Donate">Donate</MenuItem>
                    <MenuItem value="Resource">Resource</MenuItem>
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 175 }}>
                  <InputLabel>Vehicle / Fleet</InputLabel>
                  <Select
                    label="Vehicle / Fleet"
                    value={txVehicleType}
                    onChange={(e) => setTxVehicleType(e.target.value)}
                  >
                    {VEHICLE_FILTER_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value || 'all'} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <SearchField
                  label="Search Product / Donor / Ref"
                  value={txSearch}
                  onChange={(val) => setTxSearch(val)}
                  onClear={() => setTxSearch('')}
                  sx={{ width: 245 }}
                />

                {(txDepartmentId || txTypeFilter !== 'All' || txVehicleType || txSearch) && (
                  <Button
                    size="small"
                    color="inherit"
                    startIcon={<ResetIcon />}
                    onClick={() => {
                      setTxDepartmentId('');
                      setTxTypeFilter('All');
                      setTxVehicleType('');
                      setTxSearch('');
                    }}
                  >
                    Reset
                  </Button>
                )}
              </Stack>

              <Stack direction="row" useFlexGap spacing={1.25} sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<DownloadIcon />}
                  disabled={isExportingMonthly}
                  onClick={() => handleMonthlyReport('pdf')}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Download PDF
                </Button>
                <Button
                  variant="contained"
                  startIcon={<ExcelIcon />}
                  disabled={isExportingMonthly}
                  onClick={() => handleMonthlyReport('excel')}
                  sx={{ bgcolor: '#107c41', '&:hover': { bgcolor: '#0c5a2e' }, whiteSpace: 'nowrap' }}
                >
                  Download Excel
                </Button>
                <Tooltip title="Requires Hangfire background workers enabled on the API server">
                  <Button
                    variant="outlined"
                    startIcon={<ScheduleSendIcon />}
                    disabled={isExportingMonthly}
                    onClick={() => handleMonthlyReport('enqueue')}
                    sx={{ whiteSpace: 'nowrap' }}
                  >
                    Queue Background Job
                  </Button>
                </Tooltip>
              </Stack>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Monthly Transactions Preview
              </Typography>
              <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: 'wrap' }}>
                <Chip size="small" variant="outlined" label={`Total Records: ${txPreviewTotal}`} />
                <Chip
                  size="small"
                  color="primary"
                  variant="outlined"
                  label={`Preview Cost: $${txPreviewRows
                    .reduce((s, r) => s + (r.totalCost || 0), 0)
                    .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                />
              </Stack>
            </Box>

            {txPreviewError && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {txPreviewError}
              </Alert>
            )}

            {txPreviewLoading ? (
              <Box sx={{ py: 5, textAlign: 'center' }}>
                <CircularProgress size={28} />
              </Box>
            ) : (() => {
              const showTxVehicleCols =
                Boolean(txVehicleType) ||
                txPreviewRows.some((r) => Boolean(r.plateNumber || r.engineNumber));
              const txEmptyColSpan = showTxVehicleCols ? 9 : 7;
              return (
                <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'action.hover' }}>
                        <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
                        {showTxVehicleCols && (
                          <>
                            <TableCell sx={{ fontWeight: 700 }}>Plate #</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Engine / Serial #</TableCell>
                          </>
                        )}
                        <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Source / Donor</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Qty</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Total Cost ($)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {txPreviewRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={txEmptyColSpan} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                            No transactions found for {new Date(txYear, txMonth - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })}.
                          </TableCell>
                        </TableRow>
                      ) : (
                        txPreviewRows.map((row) => (
                          <TableRow key={row.id} hover>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                              {row.createdDate ? new Date(row.createdDate).toLocaleDateString() : '-'}
                            </TableCell>
                            <TableCell>
                              <Chip size="small" label={row.transactionType} variant="outlined" />
                            </TableCell>
                            <TableCell>{row.productName || '-'}</TableCell>
                            {showTxVehicleCols && (
                              <>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.plateNumber || '-'}</TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.engineNumber || '-'}</TableCell>
                              </>
                            )}
                            <TableCell>{row.departmentName || '-'}</TableCell>
                            <TableCell>{row.donorName || row.providerName || '-'}</TableCell>
                            <TableCell align="right">{row.quantity}</TableCell>
                            <TableCell align="right">
                              ${(row.totalCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              );
            })()}
          </Paper>
        )}
      </PageTransition>
    </Box>
  );
};
