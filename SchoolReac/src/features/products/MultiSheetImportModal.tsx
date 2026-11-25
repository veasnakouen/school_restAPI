import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  Download as DownloadIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Layers as LayersIcon,
  SkipNext as SkipNextIcon,
  TableChart as TableChartIcon,
  WarningAmber as WarningAmberIcon,
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import * as api from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface MultiSheetImportModalProps {
  open: boolean;
  onClose: () => void;
  onImportSuccess: () => Promise<void> | void;
}

const STEPS = ['Upload Workbook', 'Select Sheets & Preview', 'Import Summary'];

export const MultiSheetImportModal: React.FC<MultiSheetImportModalProps> = ({
  open,
  onClose,
  onImportSuccess,
}) => {
  const { showToast } = useToast();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [preview, setPreview] = useState<api.ExcelImportPreviewResponse | null>(null);
  const [selectedSheets, setSelectedSheets] = useState<string[]>([]);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [departments, setDepartments] = useState<api.DepartmentDto[]>([]);
  const [sheetDepartments, setSheetDepartments] = useState<Record<string, string>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [expandedSheet, setExpandedSheet] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<api.ExcelImportResultDto | null>(null);
  const [showAllErrors, setShowAllErrors] = useState(false);

  useEffect(() => {
    if (!open) return;
    api
      .getDepartments()
      .then((list) => setDepartments(list || []))
      .catch(() => setDepartments([]));
  }, [open]);

  const resetState = () => {
    setActiveStep(0);
    setSelectedFile(null);
    setIsAnalyzing(false);
    setIsImporting(false);
    setPreview(null);
    setSelectedSheets([]);
    setSkipDuplicates(true);
    setSheetDepartments({});
    setIsDragging(false);
    setExpandedSheet(null);
    setImportResult(null);
    setShowAllErrors(false);
  };

  const handleClose = () => {
    if (isAnalyzing || isImporting) return;
    resetState();
    onClose();
  };

  const processSelectedFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'xlsm') {
      showToast('Please upload an .xlsx or .xlsm Excel workbook (save older .xls files as .xlsx first).', 'warning');
      return;
    }

    setSelectedFile(file);
    setIsAnalyzing(true);
    try {
      const response = await api.previewImportProducts(file);
      setPreview(response);
      const autoSelected = response.sheets
        .filter((s) => s.isImportable)
        .map((s) => s.sheetName);
      const initialDepts: Record<string, string> = {};
      response.sheets.forEach((s) => {
        if (s.suggestedDepartment) {
          initialDepts[s.sheetName] = s.suggestedDepartment;
        }
      });
      setSheetDepartments(initialDepts);
      setSelectedSheets(autoSelected);
      if (autoSelected.length > 0) {
        setExpandedSheet(autoSelected[0]);
      }
      setActiveStep(1);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        'Failed to inspect Excel workbook. Ensure it is a valid .xlsx file and the API server is running.';
      showToast(msg, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    await processSelectedFile(file);
  };

  const handleDropFile = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (isAnalyzing) return;
    const file = event.dataTransfer.files?.[0];
    if (file) {
      await processSelectedFile(file);
    }
  };

  const handleDownloadSampleTemplate = () => {
    const wb = XLSX.utils.book_new();
    const itRows = [
      ['Code No', 'Item Name', 'Category', 'Brand', 'Department', 'Location', '% New', 'Q.Ty', 'Unit Price', 'Invoice Date', 'Size/Color', 'Responsible Person', 'Suppliers', 'Voucher #', 'Donor'],
      ['2024-01-001', 'ThinkPad L14 Laptop', 'Laptop', 'Lenovo', 'IT', 'IT Office', '80%', 2, 750.00, '2024-03-15', '14" / 16GB RAM / 512GB SSD', 'Vannak', 'ABC Computer Co., Tel: 012 345 678', 'VCH-2401', ''],
      ['2024-01-002', 'LaserJet Pro Printer', 'Printer', 'HP', 'IT', 'Admin Room', '100%', 1, 320.00, '2024-04-02', 'WiFi / Duplex', 'Sokha', 'Donation', 'N/A', 'Global Aid'],
    ];
    const vehicleRows = [
      ['Code No', 'Item Name', 'Category', 'Brand', 'Department', 'Plate #', 'Engine/Serial #', '% New', 'Q.Ty', 'Unit Price', 'Invoice Date', 'Responsible Person', 'Suppliers', 'Voucher #', 'Donor'],
      ['VH-2024-001', 'Utility Van', 'Vehicle', 'Toyota', 'Vehicle', 'PP-2A-9911', 'ENG-884210', '60%', 1, 24500.00, '2024-01-20', 'Dara', 'Toyota Cambodia', 'VCH-8812', ''],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(itRows), 'IT');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(vehicleRows), 'Vehicle');
    XLSX.writeFile(wb, 'inventory-multi-sheet-template.xlsx');
    showToast('Sample multi-sheet template downloaded.', 'info');
  };

  const toggleSheet = (sheetName: string) => {
    setSelectedSheets((prev) =>
      prev.includes(sheetName)
        ? prev.filter((name) => name !== sheetName)
        : [...prev, sheetName]
    );
  };

  const selectAllImportable = () => {
    if (!preview) return;
    setSelectedSheets(preview.sheets.filter((s) => s.isImportable).map((s) => s.sheetName));
  };

  const clearAllSheets = () => setSelectedSheets([]);

  const handleStartImport = async () => {
    if (!selectedFile || selectedSheets.length === 0) return;
    setIsImporting(true);
    try {
      const activeDeptOverrides: Record<string, string> = {};
      selectedSheets.forEach((sheetName) => {
        const val = sheetDepartments[sheetName]?.trim();
        if (val) activeDeptOverrides[sheetName] = val;
      });
      const res = await api.importProducts(
        selectedFile,
        selectedSheets,
        skipDuplicates,
        activeDeptOverrides
      );
      setImportResult(res);
      setActiveStep(2);
      if (res.importedCount > 0) {
        await onImportSuccess();
      }
      showToast(res.message || `Imported ${res.importedCount} products.`, res.errors?.length ? 'warning' : 'success');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Excel import failed on server.';
      showToast(msg, 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const totalEstimatedRows = preview
    ? preview.sheets
        .filter((s) => selectedSheets.includes(s.sheetName))
        .reduce((acc, s) => acc + s.estimatedRowCount, 0)
    : 0;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <LayersIcon color="primary" />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Multi-Sheet Legacy Excel Importer
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Inspect worksheets, verify mapped columns, skip duplicate codes, and import cleanly
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={handleClose} disabled={isAnalyzing || isImporting} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <Box sx={{ px: 3, pt: 2.5, pb: 1 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      <DialogContent dividers sx={{ minHeight: 380 }}>
        {/* Step 0: Upload Workbook */}
        {activeStep === 0 && (
          <Box
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!isAnalyzing) setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
            }}
            onDrop={handleDropFile}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 6,
              px: 3,
              border: '2px dashed',
              borderColor: isDragging ? 'primary.main' : 'divider',
              borderRadius: 3,
              bgcolor: isDragging ? 'action.hover' : 'background.default',
              transition: 'all 0.15s ease',
              textAlign: 'center',
            }}
          >
            {isAnalyzing ? (
              <Stack spacing={2} sx={{ alignItems: 'center' }}>
                <CircularProgress size={44} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Scanning worksheets and detecting column headers...
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Large legacy workbooks with many sheets may take a few seconds.
                </Typography>
              </Stack>
            ) : (
              <>
                <CloudUploadIcon sx={{ fontSize: 56, color: 'primary.main', mb: 1.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }} gutterBottom>
                  Drag &amp; Drop or Select Excel Workbook (.xlsx)
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 560, mb: 3 }}>
                  Supports workbooks with multiple department or category tabs (e.g., IT, Admin, Vehicle,
                  Furniture, I14–I25), Khmer/English headers, section sub-headers, donation pricing, and automatic
                  skipping of yearly total/summary rows.
                </Typography>
                <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Button variant="contained" component="label" startIcon={<TableChartIcon />} size="large">
                    Choose Excel File
                    <input type="file" hidden accept=".xlsx,.xlsm" onChange={handleFileChange} />
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    size="large"
                    onClick={handleDownloadSampleTemplate}
                  >
                    Download Sample Template
                  </Button>
                </Stack>
              </>
            )}
          </Box>
        )}

        {/* Step 1: Sheet Selection & Preview */}
        {activeStep === 1 && preview && (
          <Stack spacing={2.5}>
            {isImporting && <LinearProgress />}

            <Paper variant="outlined" sx={{ p: 2, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {preview.fileName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Detected <strong>{preview.totalSheets}</strong> worksheets ({preview.importableSheets} importable).{' '}
                  Selected <strong>{selectedSheets.length}</strong> sheet(s) · ~<strong>{totalEstimatedRows.toLocaleString()}</strong> rows.
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={skipDuplicates}
                      onChange={(e) => setSkipDuplicates(e.target.checked)}
                      size="small"
                    />
                  }
                  label={<Typography variant="body2">Skip duplicate Code Numbers</Typography>}
                />
                <Button size="small" onClick={selectAllImportable}>
                  Select Importable
                </Button>
                <Button size="small" color="inherit" onClick={clearAllSheets}>
                  Clear
                </Button>
              </Stack>
            </Paper>

            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 380 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" />
                    <TableCell>Worksheet Name</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell>Target Department</TableCell>
                    <TableCell align="right">Est. Rows</TableCell>
                    <TableCell>Detected Field Mappings</TableCell>
                    <TableCell align="center">Sample</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {preview.sheets.map((sheet) => {
                    const isChecked = selectedSheets.includes(sheet.sheetName);
                    const isExpanded = expandedSheet === sheet.sheetName;
                    const mappedEntries = Object.entries(sheet.mappedFields);
                    const deptOptions = Array.from(
                      new Set(
                        [
                          ...(sheet.suggestedDepartment ? [sheet.suggestedDepartment] : []),
                          ...departments.map((d) => d.name),
                        ].filter(Boolean)
                      )
                    );
                    const currentDept = sheetDepartments[sheet.sheetName] ?? '';
                    return (
                      <React.Fragment key={sheet.sheetName}>
                        <TableRow hover selected={isChecked}>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={isChecked}
                              disabled={!sheet.isImportable || isImporting}
                              onChange={() => toggleSheet(sheet.sheetName)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {sheet.sheetIndex}. {sheet.sheetName}
                            </Typography>
                            {!sheet.isImportable && sheet.skipReason && (
                              <Typography variant="caption" color="text.secondary">
                                {sheet.skipReason}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {sheet.isImportable ? (
                              <Chip label="Ready" color="success" size="small" variant="outlined" />
                            ) : (
                              <Chip label="Skipped" color="default" size="small" icon={<SkipNextIcon />} />
                            )}
                          </TableCell>
                          <TableCell sx={{ minWidth: 170 }}>
                            {sheet.isImportable ? (
                              <FormControl size="small" fullWidth>
                                <Select
                                  value={currentDept}
                                  displayEmpty
                                  disabled={!isChecked || isImporting}
                                  onChange={(e) =>
                                    setSheetDepartments((prev) => ({
                                      ...prev,
                                      [sheet.sheetName]: e.target.value,
                                    }))
                                  }
                                  sx={{ fontSize: '0.78rem' }}
                                >
                                  <MenuItem value="">
                                    <em>Auto (Sheet Column)</em>
                                  </MenuItem>
                                  {deptOptions.map((deptName) => (
                                    <MenuItem key={deptName} value={deptName}>
                                      {deptName}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                —
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {sheet.estimatedRowCount.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {mappedEntries.slice(0, 6).map(([field, col]) => (
                                <Chip
                                  key={field}
                                  label={`${field}: ${col}`}
                                  size="small"
                                  sx={{ fontSize: '0.7rem', height: 22 }}
                                />
                              ))}
                              {mappedEntries.length > 6 && (
                                <Tooltip
                                  title={mappedEntries
                                    .slice(6)
                                    .map(([f, c]) => `${f}: ${c}`)
                                    .join(' · ')}
                                >
                                  <Chip
                                    label={`+${mappedEntries.length - 6} more`}
                                    size="small"
                                    variant="outlined"
                                    sx={{ fontSize: '0.7rem', height: 22 }}
                                  />
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            {sheet.sampleRows.length > 0 && (
                              <IconButton
                                size="small"
                                onClick={() => setExpandedSheet(isExpanded ? null : sheet.sheetName)}
                              >
                                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>

                        {sheet.sampleRows.length > 0 && (
                          <TableRow>
                            <TableCell colSpan={7} sx={{ p: 0, borderBottom: isExpanded ? undefined : 'none' }}>
                              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                <Box sx={{ p: 1.5, bgcolor: 'action.hover' }}>
                                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>
                                    Sample Parsed Rows (Header Row #{sheet.headerRowNumber}):
                                  </Typography>
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow>
                                        {Object.keys(sheet.sampleRows[0]).map((k) => (
                                          <TableCell key={k} sx={{ fontWeight: 700, fontSize: '0.72rem' }}>
                                            {k}
                                          </TableCell>
                                        ))}
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {sheet.sampleRows.map((sample, idx) => (
                                        <TableRow key={idx}>
                                          {Object.keys(sheet.sampleRows[0]).map((k) => (
                                            <TableCell key={k} sx={{ fontSize: '0.72rem' }}>
                                              {sample[k] || '-'}
                                            </TableCell>
                                          ))}
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        )}

        {/* Step 2: Summary Report */}
        {activeStep === 2 && importResult && (
          <Stack spacing={2.5}>
            <Alert
              severity={importResult.errors.length > 0 ? 'warning' : 'success'}
              icon={importResult.errors.length > 0 ? <WarningAmberIcon /> : <CheckCircleIcon />}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {importResult.message}
              </Typography>
              <Typography variant="body2">
                Imported: <strong>{importResult.importedCount}</strong> · Skipped Duplicates:{' '}
                <strong>{importResult.skippedDuplicateCount}</strong> · Errors:{' '}
                <strong>{importResult.errors.length}</strong>
              </Typography>
            </Alert>

            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Sheet Name</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="right">Imported</TableCell>
                    <TableCell align="right">Skipped Duplicates</TableCell>
                    <TableCell align="right">Errors</TableCell>
                    <TableCell>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {importResult.sheetResults.map((sr) => (
                    <TableRow key={sr.sheetName}>
                      <TableCell sx={{ fontWeight: 600 }}>{sr.sheetName}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={sr.status}
                          size="small"
                          color={sr.status === 'Imported' ? 'success' : 'default'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">{sr.importedCount}</TableCell>
                      <TableCell align="right">{sr.skippedDuplicateCount}</TableCell>
                      <TableCell align="right">{sr.errorCount}</TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {sr.notes || '-'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {importResult.errors.length > 0 && (
              <Box>
                <Button size="small" color="warning" onClick={() => setShowAllErrors(!showAllErrors)}>
                  {showAllErrors ? 'Hide' : 'Show'} Row Error Details ({importResult.errors.length})
                </Button>
                <Collapse in={showAllErrors}>
                  <Paper variant="outlined" sx={{ mt: 1, p: 1.5, maxHeight: 150, overflow: 'auto', bgcolor: 'background.default' }}>
                    {importResult.errors.map((err, idx) => (
                      <Typography key={idx} variant="caption" color="error" sx={{ display: 'block' }}>
                        • {err}
                      </Typography>
                    ))}
                  </Paper>
                </Collapse>
              </Box>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        {activeStep === 1 && (
          <>
            <Button onClick={resetState} disabled={isImporting} color="inherit">
              Choose Another File
            </Button>
            <Box sx={{ flexGrow: 1 }} />
            <Button onClick={handleClose} disabled={isImporting}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleStartImport}
              disabled={selectedSheets.length === 0 || isImporting}
              startIcon={isImporting ? <CircularProgress size={18} color="inherit" /> : <CloudUploadIcon />}
            >
              {isImporting
                ? 'Importing...'
                : `Import ${selectedSheets.length} Sheet(s)`}
            </Button>
          </>
        )}
        {activeStep === 2 && (
          <>
            <Button onClick={resetState} color="inherit">
              Import Another Workbook
            </Button>
            <Box sx={{ flexGrow: 1 }} />
            <Button variant="contained" onClick={handleClose}>
              Done
            </Button>
          </>
        )}
        {activeStep === 0 && (
          <Button variant="outlined" onClick={handleClose} disabled={isAnalyzing}>
            Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
