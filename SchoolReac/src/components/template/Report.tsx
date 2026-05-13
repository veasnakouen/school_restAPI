import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  createTheme, ThemeProvider, CssBaseline, Box, Container, Typography, Paper, Grid, TextField, Button, Divider, Tabs, Tab, Chip, Alert, CircularProgress, Switch, FormControlLabel, Stack
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Preview as PreviewIcon,
  Settings as SettingsIcon,
  Business as BusinessIcon,
  DateRange as DateIcon,
  Description as DocIcon,
  CloudUpload as UploadIcon
} from '@mui/icons-material';

// ==========================================
// CDN LOADER HOOK
// ==========================================
const useCdnLoader = (scripts: { src: string, globalName: string }[]) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadAll = async () => {
      for (const { src, globalName } of scripts) {
        if ((window as any)[globalName]) continue;
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = src;
          script.async = true;
          script.onload = resolve;
          script.onerror = () => reject(new Error(`Failed to load ${src}`));
          document.head.appendChild(script);
        });
      }
      if (isMounted) setLoaded(true);
    };
    loadAll().catch((err: any) => {
      if (isMounted) setError(err);
    });
    return () => { isMounted = false; };
  }, [scripts]);

  return { loaded, error };
};

// ==========================================
// EXPORT UTILITIES
// ==========================================
const generateFormalPDF = (config: any, data: any[], columns: any[]) => {
  const { jsPDF } = (window as any).jspdf;
  (window as any).jspdf.jsPDF.API.autoTable = (window as any).jspdfAutoTable.autoTable;
  const doc: any = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const primaryColor = '#2563eb';
  const grayColor = '#64748b';

  // Header
  doc.setFillColor(241, 245, 249);
  doc.rect(0, 0, pageWidth, 40, 'F');

  let textStartX = 14;
  if (config.logoBase64) {
    // Parameters: Base64 Image, Format, X, Y, Width, Height
    doc.addImage(config.logoBase64, 'PNG', 14, 8, 24, 24);
    textStartX = 42; // Shift text right to make room for logo
  }

  doc.setFontSize(22);
  doc.setTextColor(primaryColor);
  doc.text(config.companyName, textStartX, 18);
  doc.setFontSize(11);
  doc.setTextColor(grayColor);
  doc.text(`Report ID: RPT-${Date.now().toString(36).toUpperCase()}`, textStartX, 28);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - 14, 28, { align: 'right' });

  // Report Title & Metadata
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(config.title, 14, 55);
  doc.autoTable({
    startY: 62,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 3, textColor: grayColor },
    columnStyles: { 0: { fontStyle: 'bold', textColor: '#1e293b', cellWidth: 35 }, 1: { cellWidth: 100 } },
    body: [
      ['Period:', config.period || 'All Time'],
      ['Department:', config.department || 'General'],
      ['Prepared By:', config.preparedBy || 'System'],
    ]
  });

  // Data Table
  const tableCols = columns.filter(c => c.visible).map(c => ({ header: c.header, dataKey: c.accessor, format: c.format }));
  const tableRows = data.map(row => {
    const r: any = {};
    tableCols.forEach(c => {
      let val = row[c.dataKey] || '';
      if (c.format === 'currency') val = `$${Number(val).toFixed(2)}`;
      else if (c.format === 'date') val = new Date(val).toLocaleDateString();
      r[c.dataKey] = val;
    });
    return r;
  });

  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 8,
    head: [tableCols.map(c => c.header)],
    body: tableRows.map(r => tableCols.map(c => r[c.dataKey])),
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 4, lineColor: '#cbd5e1', lineWidth: 0.1 },
    headStyles: { fillColor: primaryColor, textColor: '#ffffff', fontStyle: 'bold', halign: 'center' },
    alternateRowStyles: { fillColor: '#f8fafc' },
    columnStyles: {
      ...(columns.find(c => c.format === 'currency') && { 
        [columns.filter(c=>c.visible).findIndex(c=>c.format==='currency')]: { halign: 'right' } 
      })
    },
    didDrawPage: (hookData: any) => {
      doc.setFontSize(8);
      doc.setTextColor(grayColor);
      doc.text('CONFIDENTIAL', pageWidth - 14, hookData.settings.margin.top - 5, { align: 'right' });
      doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageWidth - 14, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
      doc.line(14, doc.internal.pageSize.getHeight() - 15, pageWidth - 14, doc.internal.pageSize.getHeight() - 15);
    }
  });

  // Summary & Signatures
  const finalY = doc.lastAutoTable.finalY + 12;
  doc.setFontSize(11);
  doc.setTextColor('#1e293b');
  doc.text('Summary & Authorization', 14, finalY);
  doc.autoTable({
    startY: finalY + 4,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 4 },
    body: [
      ['Total Records:', `${data.length} items`],
      ['Grand Total:', data.reduce((s, r) => s + Number(r.total || r.amount || r.price || 0), 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })],
      ['Verified By:', '_________________________'],
      ['Authorized Signature:', '_________________________']
    ],
    margin: { left: 14, right: 14 }
  });

  doc.save(`${config.title.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
  return true;
};

const generateFormalExcel = (config: any, data: any[], columns: any[]) => {
  const XLSX = (window as any).XLSX;
  const visibleCols = columns.filter(c => c.visible);
  
  const wsData = [
    [config.companyName],
    [config.title],
    [`Period: ${config.period}`, `Generated: ${new Date().toLocaleString()}`],
    [`Department: ${config.department}`, `Prepared By: ${config.preparedBy}`],
    [],
    visibleCols.map(c => c.header),
    ...data.map(row => visibleCols.map(c => {
      let val = row[c.accessor] || '';
      if (c.format === 'currency') return parseFloat(val);
      return val;
    }))
  ];

  // Add totals row
  const sumColIdx = visibleCols.findIndex(c => c.format === 'currency');
  if (sumColIdx !== -1) {
    wsData.push([]);
    const totalRow = new Array(visibleCols.length).fill('');
    totalRow[0] = 'TOTAL';
    totalRow[sumColIdx] = data.reduce((s, r) => s + Number(r.total || r.amount || r.price || 0), 0);
    wsData.push(totalRow);
  }

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Merge header cells
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: visibleCols.length - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: visibleCols.length - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 1 } }
  ];

  // Column widths
  ws['!cols'] = visibleCols.map(c => ({ wch: c.format === 'currency' ? 15 : 20 }));

  // Styling (XLSX styling is limited without pro version, we use standard formatting)
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let R = 0; R <= range.e.r; ++R) {
    for (let C = 0; C <= range.e.c; ++C) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
      if (ws[cellRef]) {
        ws[cellRef].t = typeof ws[cellRef].v === 'number' ? 'n' : 's';
        if (R >= 5 && R < 5 + data.length && visibleCols[C]?.format === 'currency') {
          ws[cellRef].z = '$#,##0.00';
        }
      }
    }
  }

  // Print setup
  ws['!print'] = { orientation: 'landscape', paperSize: 'a4', margins: { left: 0.7, right: 0.7, top: 0.75, bottom: 0.75 } };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Formal Report');
  XLSX.writeFile(wb, `${config.title.replace(/\s+/g, '_')}_${Date.now()}.xlsx`);
  return true;
};

// ==========================================
// MAIN APP COMPONENT
// ==========================================
const App = () => {
  const { loaded } = useCdnLoader([
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', globalName: 'jspdf' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js', globalName: 'jspdfAutoTable' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', globalName: 'XLSX' }
  ]);

  const [activeTab, setActiveTab] = useState(0);
  const [config, setConfig] = useState({
    companyName: 'Global Tech Solutions Inc.',
    logoBase64: '', // Paste your Base64 encoded image string here
    title: 'Quarterly Financial Audit Report',
    period: 'Q4 2025',
    department: 'Finance & Operations',
    preparedBy: 'Jane Doe, Senior Auditor'
  });
  const [columns, setColumns] = useState([
    { header: 'Transaction ID', accessor: 'id', visible: true, format: 'string' },
    { header: 'Date', accessor: 'date', visible: true, format: 'date' },
    { header: 'Vendor/Client', accessor: 'vendor', visible: true, format: 'string' },
    { header: 'Category', accessor: 'category', visible: true, format: 'string' },
    { header: 'Amount', accessor: 'amount', visible: true, format: 'currency' },
    { header: 'Status', accessor: 'status', visible: true, format: 'string' },
    { header: 'Approval', accessor: 'approval', visible: false, format: 'string' }
  ]);
  const [data] = useState<any[]>(() => {
    return Array.from({ length: 15 }, (_, i) => ({
      id: `TXN-${1000 + i}`,
      date: new Date(2025, 11, i + 1).toISOString(),
      vendor: ['CloudServ Ltd', 'OfficeSupplies Co', 'Legal Advisors', 'Marketing Agency', 'IT Infrastructure'][i % 5],
      category: ['Software', 'Operations', 'Consulting', 'Advertising', 'Hardware'][i % 5],
      amount: (Math.random() * 50000 + 500).toFixed(2),
      status: ['Approved', 'Pending', 'Rejected'][i % 3],
      approval: i % 2 === 0 ? 'CFO Signed' : 'Pending Review'
    }));
  });

  const [isExporting, setIsExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState('');

  // Fetch the logo dynamically from your API when the component mounts
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        // Adjust the URL to match your actual backend endpoint
        const response = await fetch('http://localhost:5001/api/settings/logo');
        if (response.ok) {
          const result = await response.json();
          // Assuming the API returns an object like { base64String: "data:image/png;base64,..." }
          if (result && result.base64String) {
            setConfig(prev => ({ ...prev, logoBase64: result.base64String }));
          }
        }
      } catch (err: any) {
        console.error("Failed to load organization logo from API", err);
      }
    };
    void fetchLogo();
  }, []);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setConfig(prev => ({ ...prev, logoBase64: base64String }));
      
      // Optionally, push the new logo to your backend to save it permanently
      try {
        const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
        const response = await fetch('http://localhost:5001/api/settings/branding', {
          method: 'POST', 
          headers: { 
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify({ base64String })
        });
        if (!response.ok) {
          const errorResult = await response.json().catch(() => ({ title: 'Failed to save logo.' }));
          throw new Error(errorResult.title || 'Permission denied.');
        }
        setExportMsg('Logo updated successfully!');
      } catch (err: any) {
        console.error("Failed to save logo to server:", err);
        setExportMsg(`Error: ${err.message}`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleExport = useCallback((type: 'pdf' | 'excel') => {
    if (!loaded) return;
    setIsExporting(true);
    setExportMsg('');
    setTimeout(() => {
      try {
        if (type === 'pdf') generateFormalPDF(config, data, columns);
        else generateFormalExcel(config, data, columns);
        setExportMsg(`Successfully exported as ${type.toUpperCase()}`);
      } catch (err: any) {
        setExportMsg(`Export failed: ${err.message}`);
      } finally {
        setIsExporting(false);
      }
    }, 800);
  }, [config, data, columns, loaded]);

  const handleConfigChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => setConfig(prev => ({ ...prev, [field]: e.target.value }));

  if (!loaded) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f1f5f9' }}>
        <CircularProgress size={48} />
        <Typography variant="body1" sx={{ ml: 2 }}>Loading report engine...</Typography>
      </Box>
    );
  }

  return (
    <ThemeProvider theme={createTheme({ palette: { primary: { main: '#2563eb' }, secondary: { main: '#64748b' }, background: { default: '#f8fafc' } } })}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>Formal Report Generator</Typography>
              <Typography variant="body2" color="text.secondary">PDF & Excel export with enterprise-grade templates</Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" startIcon={<PdfIcon />} disabled={isExporting} onClick={() => handleExport('pdf')} color="error">
                {isExporting ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Export PDF'}
              </Button>
              <Button variant="contained" startIcon={<ExcelIcon />} disabled={isExporting} onClick={() => handleExport('excel')} sx={{ bgcolor: '#107c41', '&:hover': { bgcolor: '#0c5a2e' } }}>
                Export Excel
              </Button>
            </Stack>
          </Box>
          {exportMsg && (
            <Alert severity={exportMsg.includes('failed') ? 'error' : 'success'} sx={{ mt: 2 }} onClose={() => setExportMsg('')}>
              {exportMsg}
            </Alert>
          )}
        </Paper>

        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Tab icon={<SettingsIcon />} label="Configuration" />
          <Tab icon={<PreviewIcon />} label="Live Preview" />
        </Tabs>

        {activeTab === 0 ? (
          <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField label="Company Name" fullWidth value={config.companyName} onChange={handleConfigChange('companyName')} margin="normal" InputProps={{ startAdornment: <BusinessIcon sx={{ mr: 1, color: 'text.secondary' }} /> }} />
                <Box sx={{ mt: 1, mb: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button variant="outlined" component="label" startIcon={<UploadIcon />} size="small">
                    Upload Logo
                    <input type="file" hidden accept="image/*" onChange={handleLogoUpload} />
                  </Button>
                  {config.logoBase64 && (
                    <Button variant="text" color="error" size="small" onClick={() => setConfig(prev => ({ ...prev, logoBase64: '' }))}>Remove</Button>
                  )}
                </Box>
                <TextField label="Report Title" fullWidth value={config.title} onChange={handleConfigChange('title')} margin="normal" InputProps={{ startAdornment: <DocIcon sx={{ mr: 1, color: 'text.secondary' }} /> }} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Reporting Period" fullWidth value={config.period} onChange={handleConfigChange('period')} margin="normal" InputProps={{ startAdornment: <DateIcon sx={{ mr: 1, color: 'text.secondary' }} /> }} />
                <TextField label="Department / Division" fullWidth value={config.department} onChange={handleConfigChange('department')} margin="normal" />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Prepared By / Authorized Signatory" fullWidth value={config.preparedBy} onChange={handleConfigChange('preparedBy')} margin="normal" />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Visible Columns</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  {columns.map((col, idx) => (
                    <FormControlLabel key={idx} control={<Switch checked={col.visible} onChange={() => { const newCols = [...columns]; newCols[idx].visible = !newCols[idx].visible; setColumns(newCols); }} />} label={col.header} />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Paper>
        ) : (
          <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff', minHeight: 600 }}>
            {/* Preview Header */}
        <Box sx={{ bgcolor: '#f1f5f9', p: 3, borderRadius: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          {config.logoBase64 && (
            <img src={config.logoBase64} alt="Company Logo" style={{ width: 48, height: 48, objectFit: 'contain' }} />
          )}
          <Box>
            <Typography variant="h5" color="primary" sx={{ fontWeight: 800 }}>{config.companyName}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Report ID: RPT-PREVIEW • Generated: {new Date().toLocaleString()}</Typography>
          </Box>
        </Box>
            {/* Preview Title & Meta */}
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: '#0f172a' }}>{config.title}</Typography>
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={6} sm={3}><Typography variant="caption" color="text.secondary">Period</Typography><Typography variant="body2" sx={{ fontWeight: 600 }}>{config.period}</Typography></Grid>
              <Grid item xs={6} sm={3}><Typography variant="caption" color="text.secondary">Department</Typography><Typography variant="body2" sx={{ fontWeight: 600 }}>{config.department}</Typography></Grid>
              <Grid item xs={6} sm={3}><Typography variant="caption" color="text.secondary">Prepared By</Typography><Typography variant="body2" sx={{ fontWeight: 600 }}>{config.preparedBy}</Typography></Grid>
              <Grid item xs={6} sm={3}><Typography variant="caption" color="text.secondary">Status</Typography><Chip label="Final Draft" size="small" color="success" sx={{ mt: 0.5 }} /></Grid>
            </Grid>
            {/* Preview Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', marginBottom: 30 }}>
              <thead>
                <tr style={{ backgroundColor: '#2563eb', color: 'white', textAlign: 'left' }}>
                  {columns.filter(c => c.visible).map(c => <th key={c.accessor} style={{ padding: '12px 10px', fontWeight: 600, borderRight: '1px solid #3b82f6' }}>{c.header}</th>)}
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 8).map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    {columns.filter(c => c.visible).map(c => (
                      <td key={c.accessor} style={{ padding: '10px', textAlign: c.format === 'currency' ? 'right' : 'left' }}>
                        {c.format === 'currency' ? `$${Number(row[c.accessor]).toFixed(2)}` : c.format === 'date' ? new Date(row[c.accessor]).toLocaleDateString() : row[c.accessor]}
                      </td>
                    ))}
                  </tr>
                ))}
                {data.length > 8 && <tr><td colSpan={columns.filter(c => c.visible).length} style={{ textAlign: 'center', padding: 10, color: '#64748b', fontStyle: 'italic' }}>... {data.length - 8} more records</td></tr>}
              </tbody>
            </table>
            {/* Preview Summary */}
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={2} sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px dashed #cbd5e1' }}>
              <Grid item xs={6}><Typography variant="body2" color="text.secondary">Total Records</Typography><Typography variant="h6" sx={{ fontWeight: 700 }}>{data.length}</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2" color="text.secondary">Grand Total</Typography><Typography variant="h6" sx={{ fontWeight: 700, color: '#2563eb' }}>${data.reduce((s, r) => s + Number(r.amount), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Typography></Grid>
            </Grid>
            <Box sx={{ mt: 6, display: 'flex', justifyContent: 'space-between' }}>
              <Box><Typography variant="body2" sx={{ mb: 4 }}>Verified By: _______________________</Typography><Typography variant="body2">Signature: _______________________</Typography></Box>
              <Box sx={{ textAlign: 'right' }}><Typography variant="caption" color="text.secondary">CONFIDENTIAL</Typography></Box>
            </Box>
          </Paper>
        )}
      </Container>
    </ThemeProvider>
  );
};

export default App;
