import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  Box, Typography, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TablePagination, CircularProgress, Alert, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Chip, Avatar, FormControl, Select, MenuItem, Checkbox, TableSortLabel, Menu, Tooltip, Autocomplete, TableFooter, createFilterOptions,
  Grid, Divider, ListItemText
} from '@mui/material';
import {
  Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, MoreVert as MoreVertIcon,
  Image as ImageIcon, BrokenImage as BrokenImageIcon, CloudUpload as CloudUploadIcon,
  DeleteForever as DeleteForeverIcon, Close as CloseIcon, Visibility as VisibilityIcon,
  FileDownload as FileDownloadIcon, ViewColumn as ViewColumnIcon
} from '@mui/icons-material';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const ALL_COLUMNS = [
  { id: 'name', label: 'Name' },
  { id: 'codeNumber', label: 'Code Number' },
  { id: 'year', label: 'Year' },
  { id: 'categoryName', label: 'Category' },
  { id: 'brandName', label: 'Brand' },
  { id: 'quality', label: 'Condition' },
  { id: 'departmentName', label: 'Dept' },
  { id: 'responsiblePerson', label: 'Responsible Person' },
  { id: 'price', label: 'Price' }
];

export const Products: React.FC = () => {
  // Data State
  const [products, setProducts] = useState<api.ProductDto[]>([]);
  const [categories, setCategories] = useState<api.CategoryDto[]>([]);
  const [brands, setBrands] = useState<api.BrandDto[]>([]);
  const [departments, setDepartments] = useState<api.DepartmentDto[]>([]);
  const [persons, setPersons] = useState<api.PersonDto[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();

  // UI & Control State
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [filterDepartment, setFilterDepartment] = useState(searchParams.get('department') || '');
  const [filterCategory, setFilterCategory] = useState(searchParams.get('category') || '');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1', 10) - 1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<keyof api.ProductDto>('name');
  const [isAscending, setIsAscending] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);

  // Modal & Form State
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view' | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<api.ProductDto | null>(null);
  const [contacts, setContacts] = useState<{type: string, value: string}[]>([{ type: 'Phone', value: '' }]);
  const [productToDelete, setProductToDelete] = useState<api.ProductDto | null>(null);
  const [productsToDelete, setProductsToDelete] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Purchase History State
  const [purchaseHistory, setPurchaseHistory] = useState<api.ProductPurchaseHistoryDto[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Image State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Local state for free-text entry fields that can be expanded
  const [qualities, setQualities] = useState(['Excellent', 'Good', 'Fair', 'Poor']);

  // Image Cropping State
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImgSrc, setCropImgSrc] = useState<string>('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Menu State
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [columnMenuAnchorEl, setColumnMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(ALL_COLUMNS.map(c => c.id));
  const viewModalContentRef = useRef<HTMLDivElement>(null);

  const filter = createFilterOptions<any>();

  const { showToast } = useToast();

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Map to the generic filtering parameters expected by the backend
      let filterOn = undefined;
      let filterQuery = undefined;

      if (filterCategory) {
        filterOn = 'category';
        filterQuery = filterCategory;
      } else if (filterDepartment) {
        filterOn = 'department';
        filterQuery = filterDepartment;
      } else if (searchQuery) {
        filterOn = 'name';
        filterQuery = searchQuery;
      }

      const params: api.QueryOptions = {
        pageNumber: currentPage + 1,
        pageSize,
        sortBy,
        isAscending,
        name: searchQuery || undefined,
        filterOn,
        filterQuery
      };
      const result = await api.getProducts(params);
      setProducts(result.items ?? []);
      setTotalItems(result.totalCount ?? 0);
    } catch (err: any) {
      const message = err.response?.data?.title || 'Failed to load products.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, sortBy, isAscending, filterCategory, filterDepartment, searchQuery, showToast]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // This effect syncs the component's filter and pagination state to the URL search params.
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) {
      params.set('search', searchQuery);
    } else {
      params.delete('search');
    }
    if (filterCategory) {
      params.set('category', filterCategory);
    } else {
      params.delete('category');
    }
    if (filterDepartment) {
      params.set('department', filterDepartment);
    } else {
      params.delete('department');
    }
    params.set('page', (currentPage + 1).toString());

    // Using replace to not pollute browser history on every filter change
    setSearchParams(params, { replace: true });
  }, [searchQuery, filterCategory, filterDepartment, currentPage, setSearchParams]);

  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [cats, brnds, depts, pers] = await Promise.all([
          api.getCategories(), 
          api.getBrands(), 
          api.getDepartments(),
          api.getPersons()
        ]);
        setCategories(cats.sort((a, b) => a.name.localeCompare(b.name)));
        setBrands(brnds.sort((a, b) => a.name.localeCompare(b.name)));
        setDepartments(depts.sort((a, b) => a.name.localeCompare(b.name)));
        setPersons(pers.sort((a, b) => a.fullName.localeCompare(b.fullName)));
      } catch (err) {
        console.error("Failed to load lookups", err);
      }
    };
    void fetchLookups();
  }, []);

  const handleSort = (property: keyof api.ProductDto) => {
    const isAsc = sortBy === property && isAscending;
    setSortBy(property);
    setIsAscending(!isAsc);
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelecteds = products.map((n) => n.id!).filter(Boolean);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event: React.MouseEvent<unknown>, id: string) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected: string[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }
    setSelected(newSelected);
  };

  const addContact = () => {
    setContacts([...contacts, { type: 'Phone', value: '' }]);
  };

  const handleContactChange = (index: number, field: 'type' | 'value', val: string) => {
    const newContacts = [...contacts];
    newContacts[index][field] = val;
    setContacts(newContacts);
    updateSupplierContact(newContacts);
  };

  const removeContact = (index: number) => {
    const newContacts = contacts.filter((_, i) => i !== index);
    setContacts(newContacts);
    updateSupplierContact(newContacts);
  };

  const updateSupplierContact = (currentContacts: {type: string, value: string}[]) => {
    const combined = currentContacts.filter(c => c.value.trim() !== '').map(c => `${c.type}: ${c.value}`).join(' | ');
    setSelectedProduct(p => p ? { ...p, supplierContact: combined } : null);
  };

  const handleOpenModal = (mode: 'create' | 'edit' | 'view', product?: api.ProductDto) => {
    setModalMode(mode);
    if (mode === 'create') {
      setSelectedProduct({ id: null, name: '', price: 0, departmentName: '', codeNumber: '', attributes: '', purchaseType: 'None', initialQuantity: null, supplierName: '', donorName: '', voucherNumber: '', supplierContact: '', invoiceDate: '', responsiblePerson: '' } as api.ProductDto);
      setContacts([{ type: 'Phone', value: '' }]);
    } else {
      // Set initial data from the list for a responsive UI
      setSelectedProduct(product || null);
      setImagePreview(product?.imageUrl || null);
      
      if ((mode === 'view' || mode === 'edit') && product?.id) {
        setHistoryLoading(true);
        setPurchaseHistory([]); // Clear old history
        
        // Fetch full product details including purchase history
        api.getProductById(product.id)
          .then(fullProduct => {
            if (mode === 'edit') {
              // Reset the acquisition fields in the form for Edit mode
              setSelectedProduct({
                ...fullProduct,
                purchaseType: 'None',
                initialQuantity: null,
                supplierName: '',
                donorName: '',
                voucherNumber: '',
                invoiceDate: '',
                supplierContact: ''
              });
              setContacts([{ type: 'Phone', value: '' }]);
            } else {
              setSelectedProduct(fullProduct);
            }
            setPurchaseHistory(fullProduct.purchaseHistory || []);
          })
          .catch(err => {
            console.error("Failed to load complete product details", err);
            showToast('Could not load purchase history.', 'error');
          })
          .finally(() => setHistoryLoading(false));
      }
    }
  };

  const handleCloseModal = () => {
    setModalMode(null);
    setSelectedProduct(null);
    setImageFile(null);
    setImagePreview(null);
    setCropImgSrc('');
    setCompletedCrop(null);
    setCrop(undefined);
    setPurchaseHistory([]);
  };

  const isVehicleCategory = useMemo(() => {
    const catName = (
      selectedProduct?.categoryName || 
      categories.find(c => c.id === selectedProduct?.categoryId)?.name || 
      ''
    ).toLowerCase();
    return catName.includes('car') || catName.includes('motor') || catName.includes('moto') || catName.includes('bike') || catName.includes('vehicle');
  }, [selectedProduct, categories]);

  const isFormValid = useMemo(() => {
    if (!selectedProduct) return false;
    if (!selectedProduct.name || selectedProduct.name.trim() === '') return false;
    if (selectedProduct.price === null || selectedProduct.price === undefined || selectedProduct.price < 0) return false;
    if (selectedProduct.purchaseType && selectedProduct.purchaseType !== 'None') {
      if (!selectedProduct.initialQuantity || selectedProduct.initialQuantity <= 0) return false;
    }
    return true;
  }, [selectedProduct, modalMode]);

  const handleSaveProduct = async () => {
    if (!selectedProduct) return;
    setIsSaving(true);

    try {
      let savedProduct: api.ProductDto;
      if (modalMode === 'edit' && selectedProduct.id) {
        savedProduct = await api.updateProduct(selectedProduct.id, selectedProduct);
      } else {
        savedProduct = await api.createProduct(selectedProduct as api.CreateProductRequest);
      }

      if (imageFile && savedProduct.id) {
        await api.uploadProductImage(savedProduct.id, imageFile);
      } else if (!imagePreview && modalMode === 'edit' && savedProduct.id && selectedProduct.imageUrl) {
        await api.deleteProductImage(savedProduct.id);
      }

        showToast(
          <Box>
            <Typography variant="subtitle2" fontWeight="bold">
              {modalMode === 'edit' ? 'Product Updated' : 'Product Created'}
            </Typography>
            <Typography variant="body2">
              <strong>{savedProduct.name}</strong> was successfully {modalMode === 'edit' ? 'updated' : 'added to the catalog'}.
            </Typography>
          </Box>,
          'success'
        );

        if (modalMode === 'edit') {
          // Fetch the updated product to show the newly added history immediately
          const updatedProduct = await api.getProductById(savedProduct.id!);
          setPurchaseHistory(updatedProduct.purchaseHistory || []);
          setSelectedProduct({
            ...updatedProduct,
            purchaseType: 'None',
            initialQuantity: null,
            supplierName: '',
            donorName: '',
            voucherNumber: '',
            invoiceDate: '',
            supplierContact: ''
          });
          setContacts([{ type: 'Phone', value: '' }]);
          await loadProducts(); // Refresh the background table silently
        } else {
          handleCloseModal();
          await loadProducts();
        }
    } catch (err: any) {
      const message = err.response?.data?.title || `Failed to ${modalMode} product.`;
      showToast(message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (ids: string[]) => {
    const isBulk = ids.length > 1;
    try {
      await Promise.all(ids.map(id => api.deleteProduct(id)));
      showToast(`${isBulk ? `${ids.length} products` : 'Product'} deleted successfully!`, 'success');
      await loadProducts();
    } catch (err: any) {
      const message = err.response?.data?.title || `Failed to delete ${isBulk ? 'products' : 'product'}.`;
      showToast(message, 'error');
    } finally {
      setProductToDelete(null);
      setProductsToDelete([]);
      setSelected([]);
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setCropImgSrc(reader.result?.toString() || '');
        setCropModalOpen(true);
      });
      reader.readAsDataURL(file);
      event.target.value = ''; // Reset input to allow selecting the same file again
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSaveCrop = async () => {
    if (imgRef.current && completedCrop?.width && completedCrop?.height) {
      const canvas = document.createElement('canvas');
      const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
      canvas.width = completedCrop.width;
      canvas.height = completedCrop.height;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(
          imgRef.current,
          completedCrop.x * scaleX,
          completedCrop.y * scaleY,
          completedCrop.width * scaleX,
          completedCrop.height * scaleY,
          0,
          0,
          completedCrop.width,
          completedCrop.height
        );

        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });
            setImageFile(file);
            setImagePreview(URL.createObjectURL(blob));
            setCropModalOpen(false);
          }
        }, 'image/jpeg', 1);
      }
    } else {
      setCropModalOpen(false);
    }
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    const timestamp = new Date().toISOString().slice(0, 10);
    const activeColumns = ALL_COLUMNS.filter(col => visibleColumns.includes(col.id));
    const headers = activeColumns.map(col => col.label);

    const getColumnValue = (p: api.ProductDto, colId: string, isCsv: boolean = false): string => {
      const fallback = isCsv ? '' : '-';
      switch (colId) {
        case 'name': return p.name || fallback;
        case 'codeNumber': return p.codeNumber || fallback;
        case 'year': return p.year ? p.year.substring(0, 4) : fallback;
        case 'categoryName': return p.categoryName || fallback;
        case 'brandName': return p.brandName || fallback;
        case 'quality': return p.quality || fallback;
        case 'departmentName': return p.departmentName || fallback;
        case 'responsiblePerson': return p.responsiblePerson || fallback;
        case 'price': return p.price != null ? (isCsv ? p.price.toString() : `$${p.price.toFixed(2)}`) : fallback;
        default: return fallback;
      }
    };

    if (format === 'csv') {
      const rows = products.map(p => activeColumns.map(col => escapeCsvValue(getColumnValue(p, col.id, true))).join(','));
      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `products_${timestamp}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } else {
      const doc = new jsPDF();
      doc.text("Products Report", 14, 15);
      (doc as any).autoTable({
        head: [headers],
        body: products.map(p => activeColumns.map(col => getColumnValue(p, col.id, false))),
      });
      doc.save(`products_${timestamp}.pdf`);
    }
    setAnchorEl(null);
  };

  const escapeCsvValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const isSelected = (id: string) => selected.indexOf(id) !== -1;

  const renderProductField = (label: string, value: any) => (
    <Box>
      <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
      <Typography variant="body1">{value || '-'}</Typography>
    </Box>
  );

  const handleExportSingleProduct = (product: api.ProductDto) => {
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.text(product.name, 14, 22);

    doc.setFontSize(12);
    doc.setTextColor(100); // a gray color
    doc.text(`Product Details - ${product.codeNumber || 'N/A'}`, 14, 30);

    const productData = [
      ['Category', product.categoryName || '-'],
      ['Brand', product.brandName || '-'],
      ['Price', product.price ? `$${product.price.toFixed(2)}` : '-'],
      ['Quality', product.quality || '-'],
      ['Department', product.departmentName || '-'],
      ['Created Date', product.createdDate ? new Date(product.createdDate).toLocaleDateString() : '-'],
    ];

    if (product.description) {
      // autoTable can handle multiline text if it's an array of strings
      const splitDescription = doc.splitTextToSize(product.description, 180);
      productData.push(['Description', splitDescription]);
    }

    if (product.attributes) {
      const splitSpecs = doc.splitTextToSize(product.attributes, 180);
      productData.push(['Specs', splitSpecs]);
    }

    (doc as any).autoTable({
      startY: 40,
      body: productData,
      theme: 'striped',
      styles: { cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40 },
        1: { cellWidth: 'auto' },
      },
    });

    doc.save(`product_${product.name.replace(/\s/g, '_')}.pdf`);
  };

  const handleExportSingleProductAsImage = async (product: api.ProductDto) => {
    if (!viewModalContentRef.current) {
      showToast('Could not capture product details.', 'error');
      return;
    }

    const canvas = await html2canvas(viewModalContentRef.current, { useCORS: true, scale: 2 });
    const image = canvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    link.download = `product_${product.name.replace(/\s/g, '_')}.png`;
    link.href = image;
    link.click();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Products</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Manage your inventory items.</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<ViewColumnIcon />} onClick={(e) => setColumnMenuAnchorEl(e.currentTarget)}>
            Columns
          </Button>
          <Menu anchorEl={columnMenuAnchorEl} open={Boolean(columnMenuAnchorEl)} onClose={() => setColumnMenuAnchorEl(null)}>
            {ALL_COLUMNS.map(col => (
              <MenuItem key={col.id} onClick={() => {
                setVisibleColumns(prev => prev.includes(col.id) ? prev.filter(c => c !== col.id) : [...prev, col.id])
              }}>
                <Checkbox checked={visibleColumns.includes(col.id)} size="small" />
                <ListItemText primary={col.label} />
              </MenuItem>
            ))}
          </Menu>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={(e) => setAnchorEl(e.currentTarget)}
            disabled={products.length === 0}
          >
            Export
          </Button>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <MenuItem onClick={() => handleExport('csv')}>Export as CSV</MenuItem>
            <MenuItem onClick={() => handleExport('pdf')}>Export as PDF</MenuItem>
          </Menu>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal('create')}>
            Add Product
          </Button>
        </Box>
      </Box>

      {/* Table Card */}
      <Paper sx={{ width: '100%', overflow: 'hidden', boxShadow: 3 }}>
        {/* Filter Bar */}
        <Box sx={{ p: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
          <TextField
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(0); }}
            placeholder="Search products..."
            variant="outlined"
            size="small"
            sx={{ width: { xs: '100%', sm: 300 } }}
          />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <Select
              value={filterCategory} // This now holds the category Name
              onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(0); }}
              displayEmpty
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map(cat => <MenuItem key={cat.id} value={cat.name}>{cat.name}</MenuItem>)}
            </Select>
          </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <Select
            value={filterDepartment} // This now holds the department Name
            onChange={(e) => { setFilterDepartment(e.target.value); setCurrentPage(0); }}
            displayEmpty sx={{ width: { xs: '100%', sm: 180 } }}
          >
            <MenuItem value="">All Depts</MenuItem>
            {departments.map(dept => <MenuItem key={dept.id} value={dept.name}>{dept.name}</MenuItem>)}
          </Select>
        </FormControl>
        </Box>

        {/* Bulk Actions Toolbar */}
        {selected.length > 0 && (
          <Box sx={{ p: 2, bgcolor: 'primary.lighter', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="subtitle1" fontWeight="bold">{selected.length} selected</Typography>
            <Tooltip title="Delete Selected">
              <IconButton color="error" onClick={() => setProductsToDelete(selected)}>
                <DeleteForeverIcon />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {/* Table */}
        <TableContainer>
          <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle">
            <TableHead>
              <TableRow sx={{ '& .MuiTableCell-head': { fontWeight: 'bold' } }}>
                <TableCell padding="checkbox">
                  <Checkbox
                    color="primary"
                    indeterminate={selected.length > 0 && selected.length < products.length}
                    checked={products.length > 0 && selected.length === products.length}
                    onChange={handleSelectAllClick}
                  />
                </TableCell>
                {visibleColumns.includes('name') && (
                  <TableCell>
                    <TableSortLabel active={sortBy === 'name'} direction={isAscending ? 'asc' : 'desc'} onClick={() => handleSort('name')}>
                      Name
                    </TableSortLabel>
                  </TableCell>
                )}
                {visibleColumns.includes('codeNumber') && (
                  <TableCell>
                    <TableSortLabel active={sortBy === 'codeNumber'} direction={isAscending ? 'asc' : 'desc'} onClick={() => handleSort('codeNumber')}>
                      Code Number
                    </TableSortLabel>
                  </TableCell>
                )}
                {visibleColumns.includes('year') && (
                  <TableCell>
                    <TableSortLabel active={sortBy === 'year'} direction={isAscending ? 'asc' : 'desc'} onClick={() => handleSort('year')}>
                      Year
                    </TableSortLabel>
                  </TableCell>
                )}
                {visibleColumns.includes('categoryName') && (
                  <TableCell>
                    <TableSortLabel active={sortBy === 'categoryName'} direction={isAscending ? 'asc' : 'desc'} onClick={() => handleSort('categoryName')}>
                      Category
                    </TableSortLabel>
                  </TableCell>
                )}
                {visibleColumns.includes('brandName') && (
                  <TableCell>
                    <TableSortLabel active={sortBy === 'brandName'} direction={isAscending ? 'asc' : 'desc'} onClick={() => handleSort('brandName')}>
                      Brand
                    </TableSortLabel>
                  </TableCell>
                )}
                {visibleColumns.includes('quality') && (
                  <TableCell>
                    <TableSortLabel active={sortBy === 'quality'} direction={isAscending ? 'asc' : 'desc'} onClick={() => handleSort('quality')}>
                      Condition
                    </TableSortLabel>
                  </TableCell>
                )}
                {visibleColumns.includes('departmentName') && (
                  <TableCell>
                    <TableSortLabel active={sortBy === 'departmentName'} direction={isAscending ? 'asc' : 'desc'} onClick={() => handleSort('departmentName')}>
                      Dept
                    </TableSortLabel>
                  </TableCell>
                )}
                {visibleColumns.includes('responsiblePerson') && (
                  <TableCell>
                    <TableSortLabel active={sortBy === 'responsiblePerson'} direction={isAscending ? 'asc' : 'desc'} onClick={() => handleSort('responsiblePerson')}>
                      Responsible Person
                    </TableSortLabel>
                  </TableCell>
                )}
                {visibleColumns.includes('price') && (
                  <TableCell align="right">
                    <TableSortLabel active={sortBy === 'price'} direction={isAscending ? 'asc' : 'desc'} onClick={() => handleSort('price')}>
                      Price
                    </TableSortLabel>
                  </TableCell>
                )}
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
            <TableRow><TableCell colSpan={visibleColumns.length + 2} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
              ) : error ? (
            <TableRow><TableCell colSpan={visibleColumns.length + 2} align="center" sx={{ py: 4 }}><Alert severity="error">{error}</Alert></TableCell></TableRow>
              ) : products.length === 0 ? (
            <TableRow><TableCell colSpan={visibleColumns.length + 2} align="center" sx={{ py: 4 }}>No products match your filters.</TableCell></TableRow>
              ) : (
                products.map((product) => {
                  const isItemSelected = isSelected(product.id!);
                  return (
                    <TableRow hover onClick={(event) => handleClick(event, product.id!)} role="checkbox" tabIndex={-1} key={product.id} selected={isItemSelected}>
                      <TableCell padding="checkbox">
                        <Checkbox color="primary" checked={isItemSelected} />
                      </TableCell>
                      {visibleColumns.includes('name') && (
                        <TableCell component="th" scope="row">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar variant="rounded" src={product.imageUrl || undefined}>
                              <ImageIcon />
                            </Avatar>
                            <Typography variant="body2" fontWeight="medium">{product.name}</Typography>
                          </Box>
                        </TableCell>
                      )}
                      {visibleColumns.includes('codeNumber') && <TableCell>{product.codeNumber || '-'}</TableCell>}
                      {visibleColumns.includes('year') && <TableCell>{product.year ? product.year.substring(0, 4) : '-'}</TableCell>}
                      {visibleColumns.includes('categoryName') && <TableCell>{product.categoryName || '-'}</TableCell>}
                      {visibleColumns.includes('brandName') && <TableCell>{product.brandName || '-'}</TableCell>}
                      {visibleColumns.includes('quality') && <TableCell>{product.quality || '-'}</TableCell>}
                      {visibleColumns.includes('departmentName') && <TableCell>{product.departmentName || '-'}</TableCell>}
                      {visibleColumns.includes('responsiblePerson') && <TableCell>{product.responsiblePerson || '-'}</TableCell>}
                      {visibleColumns.includes('price') && <TableCell align="right">${product.price?.toFixed(2) || '0.00'}</TableCell>}
                      <TableCell align="center">
                        <Tooltip title="View">
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleOpenModal('view', product); }}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleOpenModal('edit', product); }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setProductToDelete(product); }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalItems}
          rowsPerPage={pageSize}
          page={currentPage}
          onPageChange={(e, newPage) => setCurrentPage(newPage)}
          onRowsPerPageChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setCurrentPage(0); }}
        />
      </Paper>

      {/* Create/Edit Modal */}
      <Dialog open={modalMode === 'create' || modalMode === 'edit'} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle>{modalMode === 'create' ? 'Create New Product' : 'Edit Product'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3} sx={{ pt: 1 }}>
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField label="Product Name" value={selectedProduct?.name || ''} onChange={(e) => setSelectedProduct(p => p ? { ...p, name: e.target.value } : null)} required fullWidth />
                <TextField label="Code Number" value={selectedProduct?.codeNumber || ''} onChange={(e) => setSelectedProduct(p => p ? { ...p, codeNumber: e.target.value } : null)} fullWidth />
                <TextField label="Product Specs" value={selectedProduct?.attributes || ''} onChange={(e) => setSelectedProduct(p => p ? { ...p, attributes: e.target.value } : null)} multiline rows={3} placeholder="E.g. Dimensions: 10x10, Weight: 1kg" fullWidth />
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Box sx={{ position: 'relative', width: '100%', maxWidth: 160, mx: 'auto', aspectRatio: '1 / 1' }}>
                  <Avatar src={imagePreview || undefined} variant="rounded" sx={{ width: '100%', height: '100%', bgcolor: 'grey.200' }}>
                    <ImageIcon sx={{ fontSize: 40, color: 'grey.500' }} />
                  </Avatar>
                  {isSaving && (
                    <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', bgcolor: 'rgba(255, 255, 255, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, borderRadius: 1 }}>
                      <CircularProgress />
                    </Box>
                  )}
                </Box>
                <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />} disabled={isSaving}>
                  Upload Image
                  <input type="file" hidden accept="image/*" onChange={handleImageChange} disabled={isSaving} />
                </Button>
                {imagePreview && (
                  <Button size="small" color="error" onClick={handleRemoveImage} disabled={isSaving}>Remove Image</Button>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                freeSolo
                options={categories}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') return option;
                  if ((option as any).inputValue) return (option as any).inputValue;
                  return (option as any).name;
                }}
                filterOptions={(options, params) => {
                  const filtered = filter(options, params);
                  const { inputValue } = params;
                  const isExisting = options.some((option) => inputValue === option.name);
                  if (inputValue !== '' && !isExisting) {
                    filtered.push({ inputValue, name: `Add "${inputValue}"` } as any);
                  }
                  return filtered;
                }}
                value={categories.find(c => c.id === selectedProduct?.categoryId) || selectedProduct?.categoryName || null}
                onChange={(event, newValue) => {
                  if (typeof newValue === 'string') {
                    setSelectedProduct(p => p ? { ...p, categoryId: null, categoryName: newValue } : null);
                  } else if (newValue && (newValue as any).inputValue) {
                    setSelectedProduct(p => p ? { ...p, categoryId: null, categoryName: (newValue as any).inputValue } : null);
                  } else if (newValue) {
                    setSelectedProduct(p => p ? { ...p, categoryId: (newValue as any).id, categoryName: (newValue as any).name } : null);
                  } else {
                    setSelectedProduct(p => p ? { ...p, categoryId: null, categoryName: null } : null);
                  }
                }}
                onInputChange={(event, newInputValue) => {
                  setSelectedProduct(p => p ? { ...p, categoryName: newInputValue } : null);
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Category" placeholder="Select or type to create" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                freeSolo
                options={brands}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') return option;
                  if ((option as any).inputValue) return (option as any).inputValue;
                  return (option as any).name;
                }}
                filterOptions={(options, params) => {
                  const filtered = filter(options, params);
                  const { inputValue } = params;
                  const isExisting = options.some((option) => inputValue === option.name);
                  if (inputValue !== '' && !isExisting) {
                    filtered.push({ inputValue, name: `Add "${inputValue}"` } as any);
                  }
                  return filtered;
                }}
                value={brands.find(b => b.id === selectedProduct?.brandId) || selectedProduct?.brandName || null}
                onChange={(event, newValue) => {
                  if (typeof newValue === 'string') {
                    setSelectedProduct(p => p ? { ...p, brandId: null, brandName: newValue } : null);
                  } else if (newValue && (newValue as any).inputValue) {
                    setSelectedProduct(p => p ? { ...p, brandId: null, brandName: (newValue as any).inputValue } : null);
                  } else if (newValue) {
                    setSelectedProduct(p => p ? { ...p, brandId: (newValue as any).id, brandName: (newValue as any).name } : null);
                  } else {
                    setSelectedProduct(p => p ? { ...p, brandId: null, brandName: null } : null);
                  }
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Brand" placeholder="Select or type to create" />
                )}
              />
            </Grid>
            {isVehicleCategory && (
              <>
                <Grid item xs={12} sm={4}>
                  <TextField
                    select
                    label="Year"
                    value={selectedProduct?.year ? selectedProduct.year.substring(0, 4) : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedProduct(p => p ? { ...p, year: val ? `${val}-01-01T00:00:00Z` : null } : null);
                    }}
                    fullWidth
                  >
                    <MenuItem value=""><em>Select year...</em></MenuItem>
                    {Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - i).map(y => (
                      <MenuItem key={y} value={y.toString()}>{y}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Plate Number"
                    value={selectedProduct?.plateNumber || ''}
                    onChange={(e) => setSelectedProduct(p => p ? { ...p, plateNumber: e.target.value } : null)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Engine / Serial Number"
                    value={selectedProduct?.engineNumber || ''}
                    onChange={(e) => setSelectedProduct(p => p ? { ...p, engineNumber: e.target.value } : null)}
                    fullWidth
                  />
                </Grid>
              </>
            )}
            <Grid item xs={12} sm={6}>
              <Autocomplete
                freeSolo
                options={departments}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') return option;
                  if ((option as any).inputValue) return (option as any).inputValue;
                  return (option as any).name;
                }}
                filterOptions={(options, params) => {
                  const filtered = filter(options, params);
                  const { inputValue } = params;
                  const isExisting = options.some((option) => inputValue === option.name);
                  if (inputValue !== '' && !isExisting) {
                    filtered.push({ inputValue, name: `Add "${inputValue}"` } as any);
                  }
                  return filtered;
                }}
                value={departments.find(d => d.id === selectedProduct?.departmentId) || selectedProduct?.departmentName || null}
                onChange={(event, newValue) => {
                  if (typeof newValue === 'string') {
                    setSelectedProduct(p => p ? { ...p, departmentId: null, departmentName: newValue } : null);
                  } else if (newValue && (newValue as any).inputValue) {
                    setSelectedProduct(p => p ? { ...p, departmentId: null, departmentName: (newValue as any).inputValue } : null);
                  } else if (newValue) {
                    setSelectedProduct(p => p ? { ...p, departmentId: (newValue as any).id, departmentName: (newValue as any).name } : null);
                  } else {
                    setSelectedProduct(p => p ? { ...p, departmentId: null, departmentName: null } : null);
                  }
                }}
                renderInput={(params) => <TextField {...params} label="Department" placeholder="Select or type to create" />}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Price" type="number" value={selectedProduct?.price || 0} onChange={(e) => setSelectedProduct(p => p ? { ...p, price: parseFloat(e.target.value) } : null)} required fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                freeSolo
                options={qualities}
                filterOptions={(options, params) => {
                  const filtered = filter(options, params);
                  const { inputValue } = params;
                  const isExisting = options.includes(inputValue);
                  if (inputValue !== '' && !isExisting) {
                    filtered.push(`Add "${inputValue}"`);
                  }
                  return filtered;
                }}
                value={selectedProduct?.quality || ''}
                onChange={(event, newValue) => {
                  let val = newValue as string | null;
                  if (typeof newValue === 'string' && newValue.startsWith('Add "')) {
                    val = newValue.substring(5, newValue.length - 1);
                  }
                  setSelectedProduct(p => p ? { ...p, quality: val } : null);
                  if (val && !qualities.includes(val)) {
                    setQualities(prev => [...prev, val as string]);
                  }
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Quality" placeholder="Select or type to create" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                freeSolo
                options={persons}
                getOptionLabel={(option) => typeof option === 'string' ? option : option.fullName}
                value={selectedProduct?.responsiblePerson || ''}
                onInputChange={(event, newInputValue) => {
                  setSelectedProduct(p => p ? { ...p, responsiblePerson: newInputValue } : null);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Responsible Person"
                    placeholder="Select or type to assign"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Description" value={selectedProduct?.description || ''} onChange={(e) => setSelectedProduct(p => p ? { ...p, description: e.target.value } : null)} multiline rows={4} fullWidth />
            </Grid>

            {/* Stock Acquisition */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2, color: 'text.secondary' }}>{modalMode === 'edit' ? 'Add New Stock (Optional)' : 'Initial Stock / Acquisition'}</Divider>
                 {/* bgcolor: (theme) => theme.palette.mode === 'dark' ? 'background.default' : 'grey.50',  */}
                <Box sx={{ 
                  p: 3, 
                  borderRadius: 2, 
                  border: '1px solid', 
                  borderColor: 'divider' 
                }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        select
                        label="Acquisition Type"
                        value={selectedProduct?.purchaseType || 'None'}
                        onChange={(e) => setSelectedProduct(p => p ? { ...p, purchaseType: e.target.value } : null)}
                        fullWidth
                      >
                        <MenuItem value="None">None (Just setup product catalog)</MenuItem>
                        <MenuItem value="Purchased">Purchased</MenuItem>
                        <MenuItem value="Donated">Donated</MenuItem>
                      </TextField>
                    </Grid>
                    {selectedProduct?.purchaseType && selectedProduct.purchaseType !== 'None' && (
                      <>
                        <Grid item xs={12} sm={4}>
                          <TextField label="Initial Quantity *" type="number" value={selectedProduct?.initialQuantity ?? ''} onChange={(e) => setSelectedProduct(p => p ? { ...p, initialQuantity: e.target.value ? Number(e.target.value) : null } : null)} inputProps={{ min: 1 }} required fullWidth />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField label="Invoice Date" type="date" value={selectedProduct?.invoiceDate ? selectedProduct.invoiceDate.split('T')[0] : ''} onChange={(e) => setSelectedProduct(p => p ? { ...p, invoiceDate: e.target.value } : null)} fullWidth InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField label="Voucher Number" value={selectedProduct?.voucherNumber || ''} onChange={(e) => setSelectedProduct(p => p ? { ...p, voucherNumber: e.target.value } : null)} fullWidth placeholder="e.g. INV-12345" />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Autocomplete
                            freeSolo
                            options={suppliers}
                            getOptionLabel={(option) => {
                              if (typeof option === 'string') return option;
                              if ((option as any).inputValue) return (option as any).inputValue;
                              return (option as any).name;
                            }}
                            filterOptions={(options, params) => {
                              const filtered = filter(options, params);
                              const { inputValue } = params;
                              const isExisting = options.some((option) => inputValue === option.name);
                              if (inputValue !== '' && !isExisting) {
                                filtered.push({ inputValue, name: `Add "${inputValue}"` } as any);
                              }
                              return filtered;
                            }}
                            value={suppliers.find(s => s.name === selectedProduct?.supplierName) || selectedProduct?.supplierName || null}
                            onChange={(event, newValue) => {
                              if (typeof newValue === 'string') {
                                setSelectedProduct(p => p ? { ...p, supplierName: newValue } : null);
                              } else if (newValue && (newValue as any).inputValue) {
                                setSelectedProduct(p => p ? { ...p, supplierName: (newValue as any).inputValue } : null);
                              } else if (newValue) {
                                setSelectedProduct(p => p ? { ...p, supplierName: (newValue as any).name } : null);
                              } else {
                                setSelectedProduct(p => p ? { ...p, supplierName: null } : null);
                              }
                            }}
                            renderInput={(params) => (
                              <TextField {...params} label="Supplier Name" placeholder="e.g. ABC Tech" />
                            )}
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField label="Donor Name" value={selectedProduct?.donorName || ''} onChange={(e) => setSelectedProduct(p => p ? { ...p, donorName: e.target.value } : null)} fullWidth placeholder="e.g. John Doe" />
                        </Grid>
                        <Grid item xs={12}> 
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" fontWeight="bold" color="text.secondary">Contact Info</Typography>
                              <Button size="small" variant="outlined" onClick={addContact}>+ Add Contact</Button>
                            </Box>
                            {contacts.map((contact, index) => {
                              const isPredefined = ['Phone', 'Email'].includes(contact.type);
                              const selectValue = isPredefined ? contact.type : 'Other';
                              return (
                                <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                  <TextField
                                    select
                                    size="small"
                                    value={selectValue}
                                    onChange={(e) => {
                                      const newType = e.target.value === 'Other' ? '' : e.target.value;
                                      handleContactChange(index, 'type', newType);
                                    }}
                                    sx={{ width: 120, flexShrink: 0 }}
                                  >
                                    <MenuItem value="Phone">Phone</MenuItem>
                                    <MenuItem value="Email">Email</MenuItem>
                                    <MenuItem value="Other">Other...</MenuItem>
                                  </TextField>
                                  {selectValue === 'Other' && (
                                    <TextField
                                      size="small"
                                      placeholder="Custom Label"
                                      value={contact.type}
                                      onChange={(e) => handleContactChange(index, 'type', e.target.value)}
                                      sx={{ width: 150, flexShrink: 0 }}
                                    />
                                  )}
                                  <TextField
                                    size="small"
                                    fullWidth
                                    placeholder={contact.type === 'Email' ? 'e.g. mail@example.com' : 'e.g. 012 345 678'}
                                    value={contact.value}
                                    onChange={(e) => handleContactChange(index, 'value', e.target.value)}
                                  />
                                  {contacts.length > 1 && (
                                    <IconButton size="small" color="error" onClick={() => removeContact(index)}><CloseIcon fontSize="small" /></IconButton>
                                  )}
                                </Box>
                              );
                            })}
                        </Box>
                        </Grid>
                      </>
                    )}
                  </Grid>
                </Box>
            </Grid>
            
            {/* Purchase History Table for Edit Modal */}
            {modalMode === 'edit' && (
              <Grid item xs={12}>
                <Divider sx={{ my: 2, color: 'text.secondary' }}>Purchase History</Divider>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Voucher #</TableCell>
                        <TableCell>Supplier</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell align="right">Unit Price</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {historyLoading ? (
                        <TableRow><TableCell colSpan={6} align="center"><CircularProgress size={24} /></TableCell></TableRow>
                      ) : purchaseHistory.length === 0 ? (
                        <TableRow><TableCell colSpan={6} align="center">No purchase history found for this product.</TableCell></TableRow>
                      ) : (
                        purchaseHistory.map((item) => (
                          <TableRow key={item.purchaseId}>
                            <TableCell>{new Date(item.purchaseDate).toLocaleDateString()}</TableCell>
                            <TableCell>{item.voucherNumber || '-'}</TableCell>
                            <TableCell>{item.supplierName || '-'}</TableCell>
                            <TableCell align="right">{item.quantity}</TableCell>
                            <TableCell align="right">${item.unitPrice.toFixed(2)}</TableCell>
                            <TableCell align="right">${item.totalPrice.toFixed(2)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={6} align="right" sx={{ fontWeight: 'bold' }}>
                          Total Purchased: {purchaseHistory.reduce((sum, item) => sum + item.quantity, 0)} units
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </TableContainer>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseModal}>{modalMode === 'edit' ? 'Close' : 'Cancel'}</Button>
          <Button onClick={handleSaveProduct} variant="contained" disabled={!isFormValid || isSaving}>
            {isSaving ? <CircularProgress size={24} /> : (modalMode === 'edit' ? 'Save Changes' : 'Save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Modal */}
      <Dialog open={modalMode === 'view'} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        {selectedProduct && (
          <>
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" component="div">{selectedProduct.name}</Typography>
              <IconButton aria-label="close" onClick={handleCloseModal}><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent dividers ref={viewModalContentRef}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={5}>
                  <Avatar src={selectedProduct.imageUrl || undefined} variant="rounded" sx={{ width: '100%', height: 'auto', aspectRatio: '1 / 1', bgcolor: 'grey.200' }}>
                    <BrokenImageIcon sx={{ fontSize: 60, color: 'grey.400' }} />
                  </Avatar>
                </Grid>
                <Grid item xs={12} sm={7} container spacing={2}>
                  <Grid item xs={6}>{renderProductField('Category', selectedProduct.categoryName)}</Grid>
                  <Grid item xs={6}>{renderProductField('Brand', selectedProduct.brandName)}</Grid>
                  <Grid item xs={6}>{renderProductField('Price', selectedProduct.price ? `$${selectedProduct.price.toFixed(2)}` : '-')}</Grid>                  
                  <Grid item xs={6}>{renderProductField('Quality', selectedProduct.quality)}</Grid>
                  <Grid item xs={6}>{renderProductField('Department', selectedProduct.departmentName)}</Grid>
                  <Grid item xs={6}>{renderProductField('Code Number', selectedProduct.codeNumber)}</Grid>
                  <Grid item xs={6}>{renderProductField('Responsible Person', selectedProduct.responsiblePerson)}</Grid>
                  <Grid item xs={6}>{renderProductField('Year', selectedProduct.year ? selectedProduct.year.substring(0, 4) : '-')}</Grid>
                  {selectedProduct.plateNumber && (
                    <Grid item xs={6}>{renderProductField('Plate Number', selectedProduct.plateNumber)}</Grid>
                  )}
                  {selectedProduct.engineNumber && (
                    <Grid item xs={6}>{renderProductField('Engine / Serial Number', selectedProduct.engineNumber)}</Grid>
                  )}
                </Grid>
                {selectedProduct.attributes && (
                  <Grid item xs={12} sx={{ mt: 2 }}>
                    {renderProductField('Specifications', selectedProduct.attributes)}
                  </Grid>
                )}
                {selectedProduct.description && (
                  <Grid item xs={12}>
                    {renderProductField('Description', selectedProduct.description)}
                  </Grid>
                )}

                {/* Purchase History Table */}
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Typography variant="h6" gutterBottom>Purchase History</Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Voucher #</TableCell>
                          <TableCell>Supplier</TableCell>
                          <TableCell align="right">Qty</TableCell>
                          <TableCell align="right">Unit Price</TableCell>
                          <TableCell align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {historyLoading ? (
                          <TableRow><TableCell colSpan={6} align="center"><CircularProgress size={24} /></TableCell></TableRow>
                        ) : purchaseHistory.length === 0 ? (
                          <TableRow><TableCell colSpan={6} align="center">No purchase history found for this product.</TableCell></TableRow>
                        ) : (
                          purchaseHistory.map((item) => (
                            <TableRow key={item.purchaseId}>
                              <TableCell>{new Date(item.purchaseDate).toLocaleDateString()}</TableCell>
                              <TableCell>{item.voucherNumber || '-'}</TableCell>
                              <TableCell>{item.supplierName || '-'}</TableCell>
                              <TableCell align="right">{item.quantity}</TableCell>
                              <TableCell align="right">${item.unitPrice.toFixed(2)}</TableCell>
                              <TableCell align="right">${item.totalPrice.toFixed(2)}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                      <TableFooter>
                        <TableRow>
                          <TableCell colSpan={6} align="right" sx={{ fontWeight: 'bold' }}>
                            Total Purchased: {purchaseHistory.reduce((sum, item) => sum + item.quantity, 0)} units
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button
                startIcon={<ImageIcon />}
                onClick={() => selectedProduct && handleExportSingleProductAsImage(selectedProduct)}
              >
                Export Image
              </Button>
              <Button
                startIcon={<FileDownloadIcon />}
                onClick={() => selectedProduct && handleExportSingleProduct(selectedProduct)}
              >
                Export PDF
              </Button>
              <Button onClick={() => handleOpenModal('edit', selectedProduct)}>Edit</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Delete Confirmation Modals */}
      <Dialog open={!!productToDelete || productsToDelete.length > 0} onClose={() => { setProductToDelete(null); setProductsToDelete([]); }}>
        <DialogTitle sx={{ color: 'error.main' }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            {productsToDelete.length > 0
              ? `Are you sure you want to delete ${productsToDelete.length} selected products?`
              : `Are you sure you want to delete the product "${productToDelete?.name}"?`}
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>This action cannot be undone.</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setProductToDelete(null); setProductsToDelete([]); }}>Cancel</Button>
          <Button onClick={() => handleDelete(productsToDelete.length > 0 ? productsToDelete : [productToDelete!.id!])} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Crop Modal */}
      <Dialog open={cropModalOpen} onClose={() => setCropModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Crop Image</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', justifyContent: 'center', bgcolor: 'grey.200' }}>
          {cropImgSrc && (
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
            >
              <img ref={imgRef} src={cropImgSrc} alt="Crop preview" style={{ maxHeight: '50vh', maxWidth: '100%', objectFit: 'contain' }} />
            </ReactCrop>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setCropModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveCrop} variant="contained" color="primary">Apply Crop</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};