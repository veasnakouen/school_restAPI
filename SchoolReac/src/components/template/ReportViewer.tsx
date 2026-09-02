import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  createTheme, ThemeProvider, CssBaseline, Box, Container, Typography, Paper, Grid, TextField, Button, Select, MenuItem, FormControl, InputLabel, Divider, Tabs, Tab, Chip, Alert, CircularProgress, IconButton, Tooltip, Card, CardContent, List, ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction, Switch, FormControlLabel, Stack, Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText, useMediaQuery, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, TableSortLabel, Collapse, Avatar, Badge
} from '@mui/material';
import {
  FilterList as FilterIcon,
  ViewColumn as ColumnIcon,
  SaveAlt as SaveIcon,
  Folder as FolderIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  ArrowUpward as UpIcon,
  ArrowDownward as DownIcon,
  DragIndicator as DragIcon,
  FormatPaint as PaintIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Close as CloseIcon,
  Settings as SettingsIcon,
  CloudDownload as ExportIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  TextSnippet as CsvIcon,
  AutoAwesome as AutoIcon,
  Code as CodeIcon
} from '@mui/icons-material';

// ==========================================
// UTILITIES & HELPERS
// ==========================================

// Robust path resolver for nested objects (e.g., "user.profile.age")
const resolvePath = (obj, path) => {
  if (!path) return undefined;
  return path.split('.').reduce((acc, part) => (acc != null ? acc[part] : undefined), obj);
};

// Deep clone helper
const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

// Auto-generate columns from data sample
const detectSchema = (data, maxCols = 15) => {
  if (!data || !Array.isArray(data) || data.length === 0) return [];
  const cols = new Set();
  data.slice(0, 20).forEach(item => {
    const stack = [{ path: '', item }];
    while (stack.length > 0) {
      const { path, item: curr } = stack.pop();
      if (curr == null || typeof curr !== 'object') continue;
      Object.keys(curr).forEach(key => {
        const fullPath = path ? `${path}.${key}` : key;
        const val = curr[key];
        if (typeof val === 'object' && val !== null && !Array.isArray(val) && fullPath.split('.').length < 3) {
          stack.push({ path: fullPath, item: val });
        } else if (!cols.has(fullPath) && typeof val !== 'function') {
          cols.add(fullPath);
        }
      });
    }
  });
  
  return Array.from(cols).slice(0, maxCols).map(key => {
    const sampleVal = resolvePath(data[0], key);
    let format = 'string';
    if (typeof sampleVal === 'number') format = 'number';
    else if (typeof sampleVal === 'boolean') format = 'boolean';
    else if (typeof sampleVal === 'object' && sampleVal !== null) format = 'json';
    else if (String(sampleVal).match(/^\d{4}-\d{2}-\d{2}/)) format = 'date';
    
    return {
      key,
      label: key.split('.').pop().replace(/([A-Z])/g, ' $1').trim(),
      visible: true,
      sortable: format !== 'json',
      filterable: format !== 'json',
      format
    };
  });
};

// CDN Loader
const useDynamicScript = (scripts) => {
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      for (const src of scripts) {
        if (document.querySelector(`script[src="${src}"]`)) continue;
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        document.head.appendChild(script);
      }
      const checkReady = setInterval(() => {
        if ((window.jspdf && window.jspdfAutoTable) || window.XLSX) {
          clearInterval(checkReady);
          if (isMounted) { setLoaded(true); setLoading(false); }
        }
      }, 50);
      setTimeout(() => clearInterval(checkReady), 10000);
    };
    load().then(cleanup => cleanup());
    return () => { isMounted = false; };
  }, [scripts]);

  return { loaded, loading };
};

// ==========================================
// EXPORT ENGINES (Universal)
// ==========================================
const exportToCSV = (data, columns, filename) => {
  const visible = columns.filter(c => c.visible);
  const header = visible.map(c => c.label).join(',');
  const rows = data.map(row => visible.map(c => {
    const val = resolvePath(row, c.key);
    const fmt = val === null || val === undefined ? '' :
      typeof val === 'object' ? JSON.stringify(val).replace(/"/g, '""') :
      String(val).replace(/"/g, '""');
    return `"${fmt}"`;
  }).join(',')).join('\n');
  const blob = new Blob([`\uFEFF${header}\n${rows}`], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `${filename}.csv`; link.click();
};

const exportToExcel = (data, columns, filename) => {
  const XLSX = window.XLSX;
  if (!XLSX) return false;
  const visible = columns.filter(c => c.visible);
  const wsData = [visible.map(c => c.label)];
  data.forEach(row => {
    const r = {};
    visible.forEach(c => {
      const val = resolvePath(row, c.key);
      r[c.key] = (typeof val === 'object' && val !== null) ? JSON.stringify(val) : val;
    });
    wsData.push(visible.map(c => r[c.key]));
  });
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  XLSX.writeFile(wb, `${filename}.xlsx`);
  return true;
};

const exportToPDF = (data, columns, config, title, filename) => {
  const { jsPDF } = window.jspdf;
  if (!window.jspdfAutoTable) return false;
  window.jspdf.jsPDF.API.autoTable = window.jspdfAutoTable.autoTable;
  const doc = new jsPDF();
  const visible = columns.filter(c => c.visible);

  doc.setFontSize(18); doc.setTextColor(37, 99, 235);
  doc.text(title, 14, 15);
  doc.setFontSize(10); doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${new Date().toLocaleString()} | Period: ${config.period || 'All'}`, 14, 22);
  doc.line(14, 25, doc.internal.pageSize.getWidth() - 14, 25);

  const rows = data.map(row => visible.map(c => {
    const val = resolvePath(row, c.key);
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') return '[Object/Array]';
    if (c.format === 'currency') return `$${Number(val).toFixed(2)}`;
    if (c.format === 'date') return new Date(val).toLocaleDateString();
    return String(val);
  }));

  doc.autoTable({
    startY: 30,
    head: [visible.map(c => c.label)],
    body: rows,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, halign: 'center', fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didDrawPage: (d) => {
      doc.setFontSize(8); doc.setTextColor(148, 163, 184);
      doc.text(`Page ${doc.internal.getNumberOfPages()}`, doc.internal.pageSize.getWidth() - 14, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
    }
  });

  doc.save(`${filename}.pdf`);
  return true;
};

// ==========================================
// MAIN COMPONENT
// ==========================================
const UniversalReportViewer = ({ data = [], columns: initialColumns = [], title = 'Universal Report Viewer', onExport }) => {
  const { loaded, loading: scriptsLoading } = useDynamicScript([
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
  ]);
  
  const [columns, setColumns] = useState(initialColumns.length ? initialColumns : detectSchema(data));
  const [filters, setFilters] = useState([]);
  const [sorting, setSorting] = useState({ key: null, direction: 'asc' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [density, setDensity] = useState('standard');
  const [templates, setTemplates] = useState(() => {
    try { return JSON.parse(localStorage.getItem('universal_report_templates')) || []; } catch { return []; }
  });
  const [activeTab, setActiveTab] = useState('viewer');
  const [config, setConfig] = useState({ period: 'All Time' });
  const [dialogState, setDialogState] = useState({ save: false, export: false, templates: false });
  const [newTemplate, setNewTemplate] = useState({ name: '' });
  const [snackbar, setSnackbar] = useState({ open: false, msg: '', severity: 'info' });

  // Filter Logic
  const matchesFilter = (row, filter) => {
    if (!filter.key || !filter.value) return true;
    const val = resolvePath(row, filter.key);
    const target = String(filter.value).toLowerCase();
    const text = val === null || val === undefined ? '' : typeof val === 'object' ? JSON.stringify(val).toLowerCase() : String(val).toLowerCase();
    
    switch (filter.operator) {
      case 'contains': return text.includes(target);
      case 'eq': return text === target;
      case 'ne': return text !== target;
      case 'starts': return text.startsWith(target);
      case 'gt': return Number(val) > Number(filter.value);
      case 'lt': return Number(val) < Number(filter.value);
      default: return true;
    }
  };

  const processedData = useMemo(() => {
    let d = data.filter(row => filters.every(f => matchesFilter(row, f)));
    if (sorting.key) {
      d.sort((a, b) => {
        const aVal = resolvePath(a, sorting.key);
        const bVal = resolvePath(b, sorting.key);
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        const type = typeof aVal === 'number' && typeof bVal === 'number' ? 'number' : 'string';
        if (type === 'number') return sorting.direction === 'asc' ? aVal - bVal : bVal - aVal;
        return sorting.direction === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
      });
    }
    return d;
  }, [data, filters, sorting]);

  const paginatedData = useMemo(() => processedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage), [processedData, page, rowsPerPage]);

  // Handlers
  const handleSaveTemplate = () => {
    if (!newTemplate.name.trim()) return;
    const tpl = { id: Date.now(), name: newTemplate.name, config, columns, filters, sorting, rowsPerPage, density, date: new Date().toISOString() };
    const updated = [...templates, tpl];
    setTemplates(updated);
    localStorage.setItem('universal_report_templates', JSON.stringify(updated));
    setNewTemplate({ name: '' });
    setDialogState(p => ({ ...p, save: false }));
    setSnackbar({ open: true, msg: 'Template Saved', severity: 'success' });
  };

  const loadTemplate = (tpl) => {
    setConfig(tpl.config); setColumns(tpl.columns); setFilters(tpl.filters); setSorting(tpl.sorting);
    setRowsPerPage(tpl.rowsPerPage); setDensity(tpl.density || 'standard'); setPage(0);
    setDialogState(p => ({ ...p, templates: false }));
    setSnackbar({ open: true, msg: `Loaded "${tpl.name}"`, severity: 'success' });
  };

  const deleteTemplate = (id) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    localStorage.setItem('universal_report_templates', JSON.stringify(updated));
  };

  const handleExport = (type) => {
    if (type !== 'print' && !loaded) { setSnackbar({ open: true, msg: 'Loading libraries...', severity: 'warning' }); return; }
    const filename = `${title.replace(/\s+/g, '_')}_${Date.now()}`;
    let success = false;
    if (type === 'csv') exportToCSV(processedData, columns, filename);
    else if (type === 'excel') success = exportToExcel(processedData, columns, filename);
    else if (type === 'pdf') success = exportToPDF(processedData, columns, config, title, filename);
    else if (type === 'print') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const tableHtml = document.querySelector('.print-table').outerHTML;
        printWindow.document.write(`<html><head><title>${title}</title><style>body{font-family:sans-serif;padding:20px;} table{width:100%;border-collapse:collapse;font-size:12px;} th,td{border:1px solid #ddd;padding:8px;} th{background:#f8fafc;} tr:nth-child(even){background:#f9f9f9;}</style></head><body><h1>${title}</h1>${tableHtml}</body></html>`);
        printWindow.document.close();
        printWindow.print();
        success = true;
      }
    }
    if (success) { setDialogState(p => ({ ...p, export: false })); setSnackbar({ open: true, msg: `Exported as ${type.toUpperCase()}`, severity: 'success' }); onExport?.(type); }
  };

  // Render Cell Value
  const renderCell = (val, format) => {
    if (val === null || val === undefined) return <Typography variant="caption" color="text.secondary">-</Typography>;
    if (typeof val === 'object') return <Typography variant="caption" sx={{ bgcolor: '#f1f5f9', px: 1, borderRadius: 1, fontSize: '0.7rem' }}>Object</Typography>;
    if (format === 'boolean') return val ? <CheckIcon color="success" fontSize="small" /> : <CloseIcon color="error" fontSize="small" />;
    if (format === 'currency') return <Typography variant="inherit" sx={{ fontFeatureSettings: '"tnum"', fontVariantNumeric: 'tabular-nums' }}>${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>;
    if (format === 'date') return new Date(val).toLocaleDateString();
    return <Typography variant="inherit" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(val)}</Typography>;
  };

  // Styles
  const densityStyle = { compact: '4px 8px', standard: '10px 14px', comfortable: '16px 20px' };

  return (
    <Box sx={{ p: 3, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Container maxWidth="xl" sx={{ p: 0 }}>
        {/* Header */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', borderRadius: 2, color: 'white' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{title}</Typography>
          <Stack direction="row" spacing={1}>
            <Button size="small" startIcon={<AutoIcon />} onClick={() => setColumns(detectSchema(data))} sx={{ color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>Auto-Detect</Button>
            <Button size="small" startIcon={<FilterIcon />} onClick={() => setActiveTab('filters')} variant={activeTab === 'filters' ? 'contained' : 'outlined'} sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>Filters {filters.length > 0 && <Badge badgeContent={filters.length} color="secondary" sx={{ ml: 1 }} />}</Button>
            <Button size="small" startIcon={<ColumnIcon />} onClick={() => setActiveTab('customize')} variant={activeTab === 'customize' ? 'contained' : 'outlined'} sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>Customize</Button>
            <Button size="small" startIcon={<FolderIcon />} onClick={() => setDialogState(p => ({ ...p, templates: true }))} sx={{ color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>Templates</Button>
            <Button size="small" startIcon={<ExportIcon />} onClick={() => setDialogState(p => ({ ...p, export: true }))} variant="contained" sx={{ bgcolor: 'white', color: '#1e40af', '&:hover': { bgcolor: '#f1f5f9' } }}>Export</Button>
          </Stack>
        </Paper>

        {/* Panels */}
        <Collapse in={activeTab === 'filters'}>
          <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2, borderLeft: '4px solid #10b981' }}>
            <Grid container spacing={2} alignItems="center">
              {filters.map((f, i) => (
                <Grid key={i} size={{ xs: 12, md: 12 }}>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                    <Select size="small" value={f.key} onChange={e => { const n=[...filters]; n[i].key=e.target.value; n[i].value=''; n[i].operator='contains'; setFilters(n); }} sx={{ minWidth: 140 }}>
                      <MenuItem value="">Select Field</MenuItem>
                      {columns.filter(c => c.visible).map(c => <MenuItem key={c.key} value={c.key}>{c.label}</MenuItem>)}
                    </Select>
                    <Select size="small" value={f.operator} onChange={e => { const n=[...filters]; n[i].operator=e.target.value; setFilters(n); }} sx={{ minWidth: 100 }}>
                      <MenuItem value="contains">Contains</MenuItem><MenuItem value="eq">Equals</MenuItem><MenuItem value="gt">{">"}</MenuItem><MenuItem value="lt">{"<"}</MenuItem>
                    </Select>
                    <TextField size="small" placeholder="Value" value={f.value} onChange={e => { const n=[...filters]; n[i].value=e.target.value; setFilters(n); }} sx={{ flex: 1 }} />
                    <IconButton size="small" color="error" onClick={() => setFilters(p => p.filter((_,idx) => idx !== i))}><CloseIcon /></IconButton>
                  </Box>
                </Grid>
              ))}
              <Grid item><Button startIcon={<AddIcon />} onClick={() => setFilters([...filters, { key: '', operator: 'contains', value: '' }])} variant="outlined" size="small">Add Filter</Button></Grid>
            </Grid>
          </Paper>
        </Collapse>

        <Collapse in={activeTab === 'customize'}>
          <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 8 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>Visible Columns</Typography>
                <Grid container spacing={1}>
                  {columns.map((c, i) => (
                    <Grid key={i}><Chip label={c.label} onClick={() => { const n=[...columns]; n[i].visible=!n[i].visible; setColumns(n); }} color={c.visible ? 'primary' : 'default'} variant={c.visible ? 'filled' : 'outlined'} sx={{ cursor: 'pointer' }} /></Grid>
                  ))}
                </Grid>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>View Density</Typography>
                <Stack direction="row" spacing={1}>
                  {['compact', 'standard', 'comfortable'].map(d => (
                    <Button size="small" variant={density === d ? 'contained' : 'outlined'} onClick={() => setDensity(d)}>{d.charAt(0).toUpperCase() + d.slice(1)}</Button>
                  ))}
                </Stack>
              </Grid>
            </Grid>
          </Paper>
        </Collapse>

        {/* Main Table */}
        <Paper elevation={2} className="print-table" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 600, overflow: 'auto' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {columns.filter(c => c.visible).map(col => (
                    <TableCell key={col.key} sx={{ padding: densityStyle[density] }}>
                      {col.sortable !== false ? (
                        <TableSortLabel active={sorting.key === col.key} direction={sorting.key === col.key ? sorting.direction : 'asc'} onClick={() => setSorting(p => ({ key: col.key, direction: p.key === col.key && p.direction === 'asc' ? 'desc' : 'asc' }))}>
                          {col.label}
                        </TableSortLabel>
                      ) : col.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow><TableCell colSpan={columns.filter(c => c.visible).length} align="center" sx={{ py: 10, color: 'text.secondary' }}>No records found.</TableCell></TableRow>
                ) : paginatedData.map((row, i) => (
                  <TableRow key={i} hover sx={{ '&:last-child td': { border: 0 } }}>
                    {columns.filter(c => c.visible).map(col => (
                      <TableCell key={col.key} sx={{ padding: densityStyle[density], maxWidth: 300 }}>
                        {renderCell(resolvePath(row, col.key), col.format)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination rowsPerPageOptions={[10, 25, 50, 100]} component="div" count={processedData.length} rowsPerPage={rowsPerPage} page={page} onPageChange={(_, p) => setPage(p)} onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} />
        </Paper>

        {/* Dialogs */}
        {/* Save Template */}
        <Dialog open={dialogState.save} onClose={() => setDialogState(p => ({ ...p, save: false }))} maxWidth="xs" fullWidth>
          <DialogTitle>Save Template</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <TextField autoFocus label="Template Name" fullWidth value={newTemplate.name} onChange={e => setNewTemplate({ name: e.target.value })} size="small" />
          </DialogContent>
          <DialogActions><Button onClick={() => setDialogState(p => ({ ...p, save: false }))}>Cancel</Button><Button onClick={handleSaveTemplate} variant="contained" disabled={!newTemplate.name}>Save</Button></DialogActions>
        </Dialog>

        {/* Export */}
        <Dialog open={dialogState.export} onClose={() => setDialogState(p => ({ ...p, export: false }))} maxWidth="xs" fullWidth>
          <DialogTitle>Export Report</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 2 }}>
            <Button fullWidth variant="outlined" startIcon={<PdfIcon />} onClick={() => handleExport('pdf')} color="error">PDF Document</Button>
            <Button fullWidth variant="outlined" startIcon={<ExcelIcon />} onClick={() => handleExport('excel')} sx={{ color: '#107c41' }}>Excel Spreadsheet</Button>
            <Button fullWidth variant="outlined" startIcon={<CsvIcon />} onClick={() => handleExport('csv')}>CSV File</Button>
            <Button fullWidth variant="outlined" startIcon={<PrintIcon />} onClick={() => handleExport('print')}>Browser Print</Button>
          </DialogContent>
          <DialogActions><Button onClick={() => setDialogState(p => ({ ...p, export: false }))}>Cancel</Button></DialogActions>
        </Dialog>

        {/* Templates */}
        <Dialog open={dialogState.templates} onClose={() => setDialogState(p => ({ ...p, templates: false }))} maxWidth="sm" fullWidth>
          <DialogTitle>Manage Templates</DialogTitle>
          <DialogContent sx={{ display: 'flex', gap: 1, pt: 2 }}>
            <TextField fullWidth size="small" placeholder="New Template Name..." value={newTemplate.name} onChange={e => setNewTemplate({ name: e.target.value })} />
            <Button variant="contained" size="small" onClick={() => setDialogState(p => ({ ...p, templates: false, save: true }))} disabled={!newTemplate.name}><SaveIcon /></Button>
          </DialogContent>
          <DialogContent>
            {templates.length === 0 ? <Typography color="text.secondary" align="center">No saved templates</Typography> : (
              <List>
                {templates.map(t => (
                  <ListItem key={t.id} secondaryAction={<IconButton size="small" onClick={() => deleteTemplate(t.id)}><DeleteIcon fontSize="small" /></IconButton>}>
                    <ListItemText primary={t.name} secondary={`Saved: ${new Date(t.date).toLocaleDateString()}`} />
                    <Button size="small" onClick={() => loadTemplate(t)}>Load</Button>
                  </ListItem>
                ))}
              </List>
            )}
          </DialogContent>
          <DialogActions><Button onClick={() => setDialogState(p => ({ ...p, templates: false }))}>Close</Button></DialogActions>
        </Dialog>

        <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar(p => ({ ...p, open: false }))} message={snackbar.msg} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
      </Container>
    </Box>
  );
};

// ==========================================
// DEMO APP
// ==========================================
const App = () => {
  const theme = createTheme({ palette: { primary: { main: '#2563eb' }, background: { default: '#f1f5f9' } } });

  // Example 1: Nested complex data
  const userData = Array.from({ length: 20 }, (_, i) => ({
    id: `USR-${i + 100}`,
    profile: { name: `User ${i + 1}`, age: 20 + i % 40, role: i % 3 === 0 ? 'Admin' : 'Viewer' },
    stats: { revenue: (Math.random() * 50000).toFixed(2), active: Math.random() > 0.3 },
    meta: { created: new Date(Date.now() - Math.random() * 1e10).toISOString(), tags: ['user', i % 2 === 0 ? 'vip' : 'standard'] }
  }));

  const userCols = [
    { key: 'id', label: 'User ID', visible: true },
    { key: 'profile.name', label: 'Full Name', visible: true, format: 'string' },
    { key: 'profile.role', label: 'Role', visible: true, format: 'string' },
    { key: 'stats.revenue', label: 'Total Revenue', visible: true, format: 'currency' },
    { key: 'stats.active', label: 'Is Active', visible: true, format: 'boolean' },
    { key: 'meta.created', label: 'Joined Date', visible: true, format: 'date' }
  ];

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ p: 2 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 800, color: '#0f172a', mb: 4, textAlign: 'center' }}>Universal Data Report Engine</Typography>
        <UniversalReportViewer data={userData} columns={userCols} title="User Analytics Report" />
      </Box>
    </ThemeProvider>
  );
};

export default App;
