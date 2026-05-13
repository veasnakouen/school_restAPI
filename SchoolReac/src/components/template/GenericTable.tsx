import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import {
  createTheme,
  ThemeProvider,
  CssBaseline,
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Tooltip,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Avatar,
  Divider,
  Badge,
  Snackbar,
  Alert,
  InputAdornment,
  Tabs,
  Tab,
  Grid,
  Switch,
  FormControlLabel,
  CircularProgress,
  useMediaQuery,
  TableSortLabel,
  Paper as MuiPaper,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  FileUpload as ImportIcon,
  FileDownload as ExportIcon,
  Print as PrintIcon,
  ViewColumn as ColumnIcon,
  DragIndicator as DragIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Receipt as InvoiceIcon,
  Assessment as ReportIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
const generateCSV = (data, columns) => {
  const visibleCols = columns.filter((c) => c.visible);
  const header = visibleCols.map((c) => c.header).join(",");
  const rows = data
    .map((row) =>
      visibleCols
        .map(
          (c) => `"${(row[c.accessor] || "").toString().replace(/"/g, '""')}"`,
        )
        .join(","),
    )
    .join("\n");
  return `${header}\n${rows}`;
};

const generateInvoiceHTML = (row, companyName = "TechCorp Solutions") => `
  <!DOCTYPE html><html><head><style>
    body{font-family:Arial,sans-serif;padding:40px;color:#333} .header{display:flex;justify-content:space-between;border-bottom:2px solid #1976d2;padding-bottom:20px}
    .items{width:100%;border-collapse:collapse;margin:20px 0} th,td{border:1px solid #ddd;padding:12px;text-align:left} th{background:#f5f5f5}
    .total{text-align:right;font-size:1.2rem;font-weight:bold;margin-top:20px} .btn{display:none}
  </style></head><body>
    <div class="header"><h1>INVOICE</h1><div><p>${companyName}</p><p>Date: ${new Date().toLocaleDateString()}</p></div></div>
    <h3>Bill To: ${row.customerName || "N/A"}</h3>
    <table class="items"><thead><tr><th>Item</th><th>Category</th><th>Price</th><th>Quantity</th><th>Total</th></tr></thead>
    <tbody><tr><td>${row.name || "Product"}</td><td>${row.category || "-"}</td><td>$${(row.price || 0).toFixed(2)}</td><td>${row.quantity || 1}</td><td>$${((row.price || 0) * (row.quantity || 1)).toFixed(2)}</td></tr></tbody></table>
    <p class="total">Total Due: $${((row.price || 0) * (row.quantity || 1)).toFixed(2)}</p>
    <script>window.onload=window.print</script></body></html>
`;

const downloadFile = (content, filename, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const parseImportFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        if (file.name.endsWith(".json")) resolve(JSON.parse(e.target.result));
        else {
          const lines = e.target.result.split("\n").filter((l) => l.trim());
          const headers = lines[0]
            .split(",")
            .map((h) => h.replace(/"/g, "").trim().toLowerCase());
          resolve(
            lines.slice(1).map((line) => {
              const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
              const obj = {};
              headers.forEach(
                (h, i) => (obj[h] = values[i]?.replace(/"/g, "") || ""),
              );
              return obj;
            }),
          );
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

// ==========================================
// REUSABLE ADVANCED DATA TABLE
// ==========================================
const AdvancedDataTable = ({
  title = "Data Management",
  columns: initialColumns,
  data: initialData,
  onChange,
  idKey = "id",
  onAdd,
  onDelete,
  onUpdate,
}) => {
  const isMobile = useMediaQuery("(max-width: 700px)");
  const [data, setData] = useState(initialData);
  const [columns, setColumns] = useState(initialColumns);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});
  const [columnMenuAnchor, setColumnMenuAnchor] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [draggedRow, setDraggedRow] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [modalState, setModalState] = useState({
    open: false,
    mode: "add",
    data: null,
  });
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    msg: "",
    type: "info",
  });
  const fileInputRef = useRef();

  useEffect(() => {
    if (initialData) setData(initialData);
  }, [initialData]);

  // Filtering & Sorting
  const processedData = useMemo(() => {
    let filtered = data.filter((row) => {
      const matchSearch = Object.values(row).some((v) =>
        String(v).toLowerCase().includes(search.toLowerCase()),
      );
      const matchFilters = Object.entries(filters).every(
        ([key, val]) =>
          !val || String(row[key]).toLowerCase().includes(val.toLowerCase()),
      );
      return matchSearch && matchFilters;
    });
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.key],
          bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [data, search, filters, sortConfig]);

  const paginatedData = useMemo(
    () =>
      processedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [processedData, page, rowsPerPage],
  );

  // Handlers
  const handleSort = (key) =>
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  const toggleVisibility = (idx) =>
    setColumns((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, visible: !c.visible } : c)),
    );
  const handleDragStart = (e, idx) => {
    e.dataTransfer.setData("text/plain", idx);
    setDraggedRow(idx);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const handleDrop = (e, targetIdx) => {
    e.preventDefault();
    const dragIdx = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (dragIdx === targetIdx) return;
    const newData = [...data];
    const [moved] = newData.splice(dragIdx, 1);
    newData.splice(targetIdx, 0, moved);
    setData(newData);
    onChange?.(newData);
    setSnackbar({ open: true, msg: "Row order updated", type: "success" });
  };

  const startInlineEdit = (row, accessor) => {
    setEditingCell({ rowId: row[idKey], accessor });
    setEditValue(row[accessor]);
  };
  const saveInlineEdit = () => {
    if (!editingCell) return;
    const newData = data.map((r) =>
      r[idKey] === editingCell.rowId
        ? { ...r, [editingCell.accessor]: editValue }
        : r,
    );
    setData(newData);
    onUpdate?.(newData.find((r) => r[idKey] === editingCell.rowId));
    setEditingCell(null);
    setSnackbar({ open: true, msg: "Cell updated", type: "success" });
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const imported = await parseImportFile(file);
      setData((prev) => [
        ...prev,
        ...imported.map((i) => ({
          ...i,
          id: Math.random().toString(36).substr(2, 9),
        })),
      ]);
      setSnackbar({
        open: true,
        msg: `Imported ${imported.length} records`,
        type: "success",
      });
    } catch (err) {
      setSnackbar({ open: true, msg: "Import failed", type: "error" });
    }
  };

  const handlePrint = () => window.print();

  // Render
  const visibleColumns = columns.filter((c) => c.visible);
  return (
    <Box sx={{ p: 3 }}>
      <PrintStyles />
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
          mb: 3,
        }}
      >
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, color: "primary.main" }}
        >
          {title}
        </Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Tooltip title="Search">
            <TextField
              size="small"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <SearchIcon /> }}
              sx={{ maxWidth: 250 }}
            />
          </Tooltip>
          <Tooltip title="Columns">
            <Button
              size="small"
              variant="outlined"
              startIcon={<ColumnIcon />}
              onClick={(e) => setColumnMenuAnchor(e.currentTarget)}
            >
              Display
            </Button>
          </Tooltip>
          <Tooltip title="Export">
            <Button
              size="small"
              variant="outlined"
              startIcon={<ExportIcon />}
              onClick={(e) => setExportMenuAnchor(e.currentTarget)}
            >
              Export
            </Button>
          </Tooltip>
          <Tooltip title="Import">
            <input
              type="file"
              accept=".csv,.json"
              hidden
              ref={fileInputRef}
              onChange={handleImport}
            />
            <Button
              size="small"
              variant="outlined"
              startIcon={<ImportIcon />}
              onClick={() => fileInputRef.current.click()}
            >
              Import
            </Button>
          </Tooltip>
          <Tooltip title="Print">
            <IconButton size="small" onClick={handlePrint}>
              <PrintIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setModalState({ open: true, mode: "add", data: {} })}
          >
            Add New
          </Button>
        </Box>
      </Box>

      <Paper elevation={3} sx={{ borderRadius: 2, overflow: "hidden" }}>
        <TableContainer sx={{ maxHeight: 600, overflow: "auto" }}>
          <Table stickyHeader size="medium">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" sx={{ minWidth: 40 }}></TableCell>
                {visibleColumns.map((col) => (
                  <TableCell
                    key={col.accessor}
                    sortDirection={
                      sortConfig.key === col.accessor
                        ? sortConfig.direction
                        : false
                    }
                  >
                    <TableSortLabel
                      active={sortConfig.key === col.accessor}
                      direction={
                        sortConfig.key === col.accessor
                          ? sortConfig.direction
                          : "asc"
                      }
                      onClick={() => handleSort(col.accessor)}
                    >
                      {col.header}
                    </TableSortLabel>
                  </TableCell>
                ))}
                <TableCell align="right">Actions</TableCell>
              </TableRow>
              {/* Filter Row */}
              <TableRow sx={{ bgcolor: "#f8f9fa" }}>
                <TableCell></TableCell>
                {visibleColumns.map((col) =>
                  col.filterable ? (
                    <TableCell key={`filter-${col.accessor}`}>
                      <TextField
                        size="small"
                        fullWidth
                        placeholder={`Filter ${col.header}`}
                        value={filters[col.accessor] || ""}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            [col.accessor]: e.target.value,
                          }))
                        }
                      />
                    </TableCell>
                  ) : (
                    <TableCell key={`filter-${col.accessor}`}></TableCell>
                  ),
                )}
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumns.length + 2}
                    align="center"
                    sx={{ py: 6, color: "text.secondary" }}
                  >
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row, idx) => (
                  <TableRow
                    key={row[idKey]}
                    draggable
                    hover
                    sx={{
                      "&:last-child td, &:last-child th": { border: 0 },
                      cursor: "grab",
                      "&:hover .drag-handle": { opacity: 1 },
                    }}
                    onDragStart={(e) =>
                      handleDragStart(e, page * rowsPerPage + idx)
                    }
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, page * rowsPerPage + idx)}
                  >
                    <TableCell
                      padding="checkbox"
                      sx={{ opacity: 0.5, cursor: "grab" }}
                    >
                      <DragIcon
                        className="drag-handle"
                        sx={{ opacity: 0.3, transition: "opacity 0.2s" }}
                      />
                    </TableCell>
                    {visibleColumns.map((col) => (
                      <TableCell
                        key={col.accessor}
                        sx={{
                          cursor: col.editable ? "pointer" : "default",
                          bgcolor:
                            editingCell?.rowId === row[idKey] &&
                            editingCell.accessor === col.accessor
                              ? "rgba(25,118,210,0.05)"
                              : "inherit",
                        }}
                        onDoubleClick={() =>
                          col.editable && startInlineEdit(row, col.accessor)
                        }
                      >
                        {editingCell?.rowId === row[idKey] &&
                        editingCell.accessor === col.accessor ? (
                          <TextField
                            autoFocus
                            size="small"
                            fullWidth
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === "Enter" && saveInlineEdit()
                            }
                            InputProps={{
                              endAdornment: (
                                <Box sx={{ display: "flex", gap: 0.5 }}>
                                  <IconButton
                                    size="small"
                                    onClick={saveInlineEdit}
                                  >
                                    <CheckIcon
                                      fontSize="small"
                                      color="primary"
                                    />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() => setEditingCell(null)}
                                  >
                                    <CloseIcon fontSize="small" color="error" />
                                  </IconButton>
                                </Box>
                              ),
                            }}
                          />
                        ) : col.render ? (
                          col.render(row)
                        ) : (
                          row[col.accessor]
                        )}
                      </TableCell>
                    ))}
                    <TableCell align="right">
                      <Tooltip title="View">
                        <IconButton
                          size="small"
                          onClick={() =>
                            setModalState({
                              open: true,
                              mode: "view",
                              data: row,
                            })
                          }
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() =>
                            setModalState({
                              open: true,
                              mode: "edit",
                              data: row,
                            })
                          }
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() =>
                            setModalState({
                              open: true,
                              mode: "delete",
                              data: row,
                            })
                          }
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={processedData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* Column Visibility Menu */}
      <Menu
        anchorEl={columnMenuAnchor}
        open={Boolean(columnMenuAnchor)}
        onClose={() => setColumnMenuAnchor(null)}
      >
        <Typography
          variant="subtitle2"
          sx={{ px: 2, py: 1, color: "text.secondary" }}
        >
          Toggle Columns
        </Typography>
        <Divider />
        {columns.map((c, i) => (
          <MenuItem key={i} onClick={() => toggleVisibility(i)} sx={{ gap: 2 }}>
            <Switch size="small" checked={c.visible} /> {c.header}
          </MenuItem>
        ))}
      </Menu>

      {/* Export Menu */}
      <Menu
        anchorEl={exportMenuAnchor}
        open={Boolean(exportMenuAnchor)}
        onClose={() => setExportMenuAnchor(null)}
      >
        <MenuItem
          onClick={() => {
            downloadFile(
              generateCSV(processedData, columns),
              "data.csv",
              "text/csv",
            );
            setExportMenuAnchor(null);
          }}
        >
          <ReportIcon sx={{ mr: 2 }} /> CSV Export
        </MenuItem>
        <MenuItem
          onClick={() => {
            downloadFile(
              JSON.stringify(processedData, null, 2),
              "data.json",
              "application/json",
            );
            setExportMenuAnchor(null);
          }}
        >
          <ExportIcon sx={{ mr: 2 }} /> JSON Export
        </MenuItem>
        <MenuItem
          onClick={() => {
            const row = processedData[0] || {};
            downloadFile(generateInvoiceHTML(row), "invoice.html", "text/html");
            setExportMenuAnchor(null);
          }}
        >
          <InvoiceIcon sx={{ mr: 2 }} /> Invoice Template
        </MenuItem>
      </Menu>

      {/* CRUD Modal */}
      <Dialog
        open={modalState.open}
        onClose={() => setModalState({ open: false, mode: "add", data: {} })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {modalState.mode === "add"
            ? "Add Record"
            : modalState.mode === "edit"
              ? "Edit Record"
              : modalState.mode === "delete"
                ? "Confirm Deletion"
                : "Record Details"}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {modalState.mode === "delete" ? (
            <DialogContentText>
              Are you sure you want to delete{" "}
              <strong>{modalState.data?.name || "this record"}</strong>? This
              action cannot be undone.
            </DialogContentText>
          ) : modalState.mode === "view" ? (
            <Grid container spacing={2}>
              {columns
                .filter((c) => c.visible)
                .map((c) => (
                  <Grid item xs={12} sm={6} key={c.accessor}>
                    <Typography variant="caption" color="text.secondary">
                      {c.header}
                    </Typography>
                    <Typography>
                      {c.render
                        ? c.render(modalState.data)
                        : modalState.data?.[c.accessor]}
                    </Typography>
                  </Grid>
                ))}
            </Grid>
          ) : (
            <Grid container spacing={2}>
              {columns
                .filter((c) => c.editable || modalState.mode === "add")
                .map((c) => (
                  <Grid item xs={12} key={c.accessor}>
                    <TextField
                      label={c.header}
                      fullWidth
                      value={modalState.data?.[c.accessor] || ""}
                      onChange={(e) =>
                        setModalState((p) => ({
                          ...p,
                          data: { ...p.data, [c.accessor]: e.target.value },
                        }))
                      }
                    />
                  </Grid>
                ))}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setModalState({ open: false, mode: "add", data: {} })
            }
          >
            Cancel
          </Button>
          {modalState.mode === "delete" && (
            <Button
              onClick={() => {
                setData((p) =>
                  p.filter((r) => r[idKey] !== modalState.data[idKey]),
                );
                onDelete?.(modalState.data);
                setModalState({ open: false, mode: "add", data: {} });
                setSnackbar({
                  open: true,
                  msg: "Deleted successfully",
                  type: "success",
                });
              }}
              color="error"
              variant="contained"
            >
              Delete
            </Button>
          )}
          {(modalState.mode === "add" || modalState.mode === "edit") && (
            <Button
              onClick={() => {
                const updated =
                  modalState.mode === "add"
                    ? [
                        ...data,
                        {
                          ...modalState.data,
                          id: Math.random().toString(36).substr(2, 9),
                        },
                      ]
                    : data.map((r) =>
                        r[idKey] === modalState.data[idKey]
                          ? { ...r, ...modalState.data }
                          : r,
                      );
                setData(updated);
                onUpdate?.(modalState.data);
                onAdd?.(modalState.data);
                setModalState({ open: false, mode: "add", data: {} });
                setSnackbar({
                  open: true,
                  msg:
                    modalState.mode === "add"
                      ? "Added successfully"
                      : "Updated successfully",
                  type: "success",
                });
              }}
              variant="contained"
            >
              <SaveIcon sx={{ mr: 1, fontSize: 18 }} />
              Save
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snackbar.type} sx={{ width: "100%" }}>
          {snackbar.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Print Styles
const PrintStyles = () => (
  <style>{`
    @media print {
      body * { visibility: hidden; }
      table, table * { visibility: visible; }
      table { position: absolute; left: 0; top: 0; width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #000 !important; padding: 8px !important; color: #000 !important; }
      .no-print, button, input, .MuiTablePagination-root, .MuiSvgIcon-root { display: none !important; }
    }
  `}</style>
);

// ==========================================
// DEMO APP
// ==========================================
const App = () => {
  const theme = createTheme({
    palette: {
      primary: { main: "#2563eb" },
      background: { default: "#f1f5f9" },
    },
  });

  const columns = [
    {
      header: "ID",
      accessor: "id",
      visible: false,
      editable: false,
      filterable: false,
    },
    {
      header: "Product Name",
      accessor: "name",
      visible: true,
      editable: true,
      filterable: true,
    },
    {
      header: "Category",
      accessor: "category",
      visible: true,
      editable: true,
      filterable: true,
    },
    {
      header: "Price",
      accessor: "price",
      visible: true,
      editable: true,
      filterable: true,
      render: (r) => `$${Number(r.price).toFixed(2)}`,
    },
    {
      header: "Stock",
      accessor: "stock",
      visible: true,
      editable: true,
      filterable: true,
    },
    {
      header: "Status",
      accessor: "status",
      visible: true,
      editable: true,
      filterable: true,
      render: (r) => (
        <Chip
          label={r.status}
          size="small"
          color={
            r.status === "Active"
              ? "success"
              : r.status === "Low"
                ? "warning"
                : "error"
          }
        />
      ),
    },
    {
      header: "Created",
      accessor: "created",
      visible: false,
      editable: false,
      filterable: true,
    },
  ];

  const mockData = Array.from({ length: 25 }, (_, i) => ({
    id: `PROD-${1000 + i}`,
    name: [
      "Wireless Mouse",
      "Mechanical Keyboard",
      "USB-C Hub",
      "Monitor Stand",
      "Webcam HD",
    ][i % 5],
    category: ["Electronics", "Accessories", "Peripherals"][i % 3],
    price: (Math.random() * 100 + 10).toFixed(2),
    stock: Math.floor(Math.random() * 200),
    status: ["Active", "Low", "Out"][i % 3],
    created: new Date(Date.now() - Math.random() * 1e10)
      .toISOString()
      .split("T")[0],
  }));

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
        <AdvancedDataTable
          title="Inventory Manager"
          columns={columns}
          data={mockData}
          onChange={() => {}}
          onAdd={() => {}}
          onUpdate={() => {}}
          onDelete={() => {}}
        />
      </Box>
    </ThemeProvider>
  );
};

export default App;
