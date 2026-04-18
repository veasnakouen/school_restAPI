import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  Box, Typography, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TablePagination, CircularProgress, Alert, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Chip, Avatar, FormControl, Select, MenuItem, Checkbox, TableSortLabel, Menu, Tooltip,
  Grid, Divider
} from '@mui/material';
import {
  Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, MoreVert as MoreVertIcon,
  Image as ImageIcon, BrokenImage as BrokenImageIcon, CloudUpload as CloudUploadIcon,
  DeleteForever as DeleteForeverIcon, Close as CloseIcon, Visibility as VisibilityIcon,
  FileDownload as FileDownloadIcon
} from '@mui/icons-material';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

export const Products: React.FC = () => {
  // Data State
  const [products, setProducts] = useState<api.ProductDto[]>([]);
  const [categories, setCategories] = useState<api.CategoryDto[]>([]);
  const [brands, setBrands] = useState<api.BrandDto[]>([]);
  const [departments, setDepartments] = useState<api.DepartmentDto[]>([]);
  const [suppliers, setSuppliers] = useState<api.SupplierDto[]>([]);
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
  const [sortBy, setSortBy] = useState('name');
  const [isAscending, setIsAscending] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);

  // Modal & Form State
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view' | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<api.ProductDto | null>(null);
  const [productToDelete, setProductToDelete] = useState<api.ProductDto | null>(null);
  const [productsToDelete, setProductsToDelete] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Image State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Quality state (local since it's not a DB entity yet)
  const [qualities, setQualities] = useState(['Excellent', 'Good', 'Fair', 'Poor']);
  const [isQualityModalOpen, setIsQualityModalOpen] = useState(false);
  const [newQualityName, setNewQualityName] = useState('');
  const [isSavingQuality, setIsSavingQuality] = useState(false);

  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [newDepartmentLocation, setNewDepartmentLocation] = useState('');
  const [isSavingDepartment, setIsSavingDepartment] = useState(false);

  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [isSavingSupplier, setIsSavingSupplier] = useState(false);

  // Image Cropping State
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImgSrc, setCropImgSrc] = useState<string>('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  // Brand Modal State
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [isSavingBrand, setIsSavingBrand] = useState(false);

  // Menu State
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const viewModalContentRef = useRef<HTMLDivElement>(null);

  const { showToast } = useToast();

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: api.QueryOptions = {
        pageNumber: currentPage + 1,
        pageSize,
        sortBy,
        isAscending,
        filterOn: filterCategory ? 'category' : (searchQuery ? 'name' : undefined),
        filterQuery: filterCategory || searchQuery,
        department: filterDepartment || undefined,
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
    const params = new URLSearchParams(searchParams);
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
  }, [searchQuery, filterCategory, currentPage, setSearchParams, searchParams]);

  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [cats, brnds, depts, supps] = await Promise.all([
          api.getCategories(), 
          api.getBrands(), 
          api.getDepartments(),
          api.getSuppliers()
        ]);
        setCategories(cats.sort((a, b) => a.name.localeCompare(b.name)));
        setBrands(brnds.sort((a, b) => a.name.localeCompare(b.name)));
        setDepartments(depts.sort((a, b) => a.name.localeCompare(b.name)));
        setSuppliers(supps.sort((a, b) => a.name.localeCompare(b.name)));
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

  const handleOpenModal = (mode: 'create' | 'edit' | 'view', product?: api.ProductDto) => {
    setModalMode(mode);
    if (mode === 'create') {
      setSelectedProduct({ id: null, name: '', price: 0, department: '', supplierId: '', supplierName: '' } as api.ProductDto);
    } else {
      setSelectedProduct(product || null);
      setImagePreview(product?.imageUrl || null);
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
  };

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

      showToast(`Product ${modalMode === 'edit' ? 'updated' : 'created'} successfully!`, 'success');
      handleCloseModal();
      await loadProducts();
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

  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsSavingCategory(true);
    try {
      const newCat = await api.createCategory({ name: newCategoryName });
      setCategories(prev => [...prev, newCat]);
      setSelectedProduct(p => p ? { ...p, categoryId: newCat.id } : null);
      showToast('Category created successfully!', 'success');
      setIsCategoryModalOpen(false);
      setNewCategoryName('');
    } catch (err: any) {
      const message = err.response?.data?.title || 'Failed to create category.';
      showToast(message, 'error');
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleSaveBrand = async () => {
    if (!newBrandName.trim()) return;
    setIsSavingBrand(true);
    try {
      const newBrand = await api.createBrand({ name: newBrandName });
      setBrands(prev => [...prev, newBrand]);
      setSelectedProduct(p => p ? { ...p, brandId: newBrand.id } : null);
      showToast('Brand created successfully!', 'success');
      setIsBrandModalOpen(false);
      setNewBrandName('');
    } catch (err: any) {
      const message = err.response?.data?.title || 'Failed to create brand.';
      showToast(message, 'error');
    } finally {
      setIsSavingBrand(false);
    }
  };

  const handleSaveQuality = () => {
    if (!newQualityName.trim()) return;
    setIsSavingQuality(true);
    const newQuality = newQualityName.trim();
    // This is a local-only update. It doesn't save to a backend table.
    if (!qualities.includes(newQuality)) {
      setQualities(prev => [...prev, newQuality].sort());
    }
    // Set the new quality for the current product
    setSelectedProduct(p => p ? { ...p, quality: newQuality } : null);
    showToast(`Quality "${newQuality}" selected.`, 'success');
    
    // Reset and close
    setIsQualityModalOpen(false);
    setNewQualityName('');
    setIsSavingQuality(false);
  };

  const handleSaveDepartment = async () => {
    if (!newDepartmentName.trim()) return;
    setIsSavingDepartment(true);
    try {
      const newDept = await api.createDepartment({ name: newDepartmentName, location: newDepartmentLocation });
      setDepartments(prev => [...prev, newDept]);
      setSelectedProduct(p => p ? { ...p, department: newDept.name } : null);
      showToast('Department created successfully!', 'success');
      setIsDepartmentModalOpen(false);
      setNewDepartmentName('');
      setNewDepartmentLocation('');
    } catch (err: any) {
      const message = err.response?.data?.title || 'Failed to create department.';
      showToast(message, 'error');
    } finally {
      setIsSavingDepartment(false);
    }
  };

  const handleSaveSupplier = async () => {
    if (!newSupplierName.trim()) return;
    setIsSavingSupplier(true);
    try {
      const newSupp = await api.createSupplier({ name: newSupplierName });
      setSuppliers(prev => [...prev, newSupp]);
      setSelectedProduct(p => p ? { ...p, supplierId: newSupp.id, supplierName: newSupp.name } : null);
      showToast('Supplier created successfully!', 'success');
      setIsSupplierModalOpen(false);
      setNewSupplierName('');
    } catch (err: any) {
      const message = err.response?.data?.title || 'Failed to create supplier.';
      showToast(message, 'error');
    } finally {
      setIsSavingSupplier(false);
    }
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    const timestamp = new Date().toISOString().slice(0, 10);
    if (format === 'csv') {
      const headers = ['ID', 'Name', 'Category', 'Brand', 'Price', 'Quality', 'Department', 'Supplier'];
      const rows = products.map(p => [p.id, p.name, p.categoryName, p.brandName, p.price, p.quality, p.department, p.supplierName].map(escapeCsvValue).join(','));
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
        head: [['Name', 'Category', 'Brand', 'Price', 'Dept', 'Supplier']],
        body: products.map(p => [p.name, p.categoryName, p.brandName, `$${p.price?.toFixed(2)}`, p.department || '-', p.supplierName || '-']),
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
      ['Voucher #', product.voucherNumber || '-'],
      ['Department', product.department || '-'],
      ['Supplier', product.supplierName || '-'],
      ['Created Date', product.createdDate ? new Date(product.createdDate).toLocaleDateString() : '-'],
    ];

    if (product.description) {
      // autoTable can handle multiline text if it's an array of strings
      const splitDescription = doc.splitTextToSize(product.description, 180);
      productData.push(['Description', splitDescription]);
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
              value={filterCategory}
              onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(0); }}
              displayEmpty
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map(cat => <MenuItem key={cat.id} value={cat.name}>{cat.name}</MenuItem>)}
            </Select>
          </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <Select
            value={filterDepartment}
            onChange={(e) => { setFilterDepartment(e.target.value); setCurrentPage(0); }}
            displayEmpty
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
                <TableCell>
                  <TableSortLabel active={sortBy === 'name'} direction={isAscending ? 'asc' : 'desc'} onClick={() => handleSort('name')}>
                    Name
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel active={sortBy === 'category'} direction={isAscending ? 'asc' : 'desc'} onClick={() => handleSort('categoryName')}>
                    Category
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel active={sortBy === 'brand'} direction={isAscending ? 'asc' : 'desc'} onClick={() => handleSort('brandName')}>
                    Brand
                  </TableSortLabel>
                </TableCell>
              <TableCell>
                <TableSortLabel active={sortBy === 'department'} direction={isAscending ? 'asc' : 'desc'} onClick={() => handleSort('department')}>
                  Dept
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel active={sortBy === 'supplier'} direction={isAscending ? 'asc' : 'desc'} onClick={() => handleSort('supplierName')}>
                  Supplier
                </TableSortLabel>
              </TableCell>
                <TableCell align="right">
                  <TableSortLabel active={sortBy === 'price'} direction={isAscending ? 'asc' : 'desc'} onClick={() => handleSort('price')}>
                    Price
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
            <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
              ) : error ? (
            <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><Alert severity="error">{error}</Alert></TableCell></TableRow>
              ) : products.length === 0 ? (
            <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}>No products match your filters.</TableCell></TableRow>
              ) : (
                products.map((product) => {
                  const isItemSelected = isSelected(product.id!);
                  return (
                    <TableRow hover onClick={(event) => handleClick(event, product.id!)} role="checkbox" tabIndex={-1} key={product.id} selected={isItemSelected}>
                      <TableCell padding="checkbox">
                        <Checkbox color="primary" checked={isItemSelected} />
                      </TableCell>
                      <TableCell component="th" scope="row">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar variant="rounded" src={product.imageUrl || undefined}>
                            <ImageIcon />
                          </Avatar>
                          <Typography variant="body2" fontWeight="medium">{product.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{product.categoryName || '-'}</TableCell>
                      <TableCell>{product.brandName || '-'}</TableCell>
                  <TableCell>{product.department || '-'}</TableCell>
                  <TableCell>{product.supplierName || '-'}</TableCell>
                      <TableCell align="right">${product.price?.toFixed(2) || '0.00'}</TableCell>
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
                <TextField label="Description" value={selectedProduct?.description || ''} onChange={(e) => setSelectedProduct(p => p ? { ...p, description: e.target.value } : null)} multiline rows={4} fullWidth />
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Box sx={{ position: 'relative', width: '100%', aspectRatio: '1 / 1' }}>
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
              <FormControl fullWidth>
              <Select 
                value={selectedProduct?.categoryId || ''} 
                onChange={(e) => {
                  if (e.target.value === 'ADD_NEW_CATEGORY') {
                    setIsCategoryModalOpen(true);
                  } else {
                    setSelectedProduct(p => p ? { ...p, categoryId: e.target.value } : null);
                  }
                }} 
                displayEmpty
              >
                  <MenuItem value=""><em>Select Category</em></MenuItem>
                  {categories.map(cat => <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>)}
                <Divider />
                <MenuItem value="ADD_NEW_CATEGORY" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                  <AddIcon sx={{ mr: 1, fontSize: 20 }} /> Add New Category
                </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <Select 
                value={selectedProduct?.brandId || ''} 
                onChange={(e) => {
                  if (e.target.value === 'ADD_NEW_BRAND') {
                    setIsBrandModalOpen(true);
                  } else {
                    setSelectedProduct(p => p ? { ...p, brandId: e.target.value } : null);
                  }
                }} 
                displayEmpty
              >
                <MenuItem value=""><em>Select Brand</em></MenuItem>
                {brands.map(brand => <MenuItem key={brand.id} value={brand.id}>{brand.name}</MenuItem>)}
                <Divider />
                <MenuItem value="ADD_NEW_BRAND" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                  <AddIcon sx={{ mr: 1, fontSize: 20 }} /> Add New Brand
                </MenuItem>
              </Select>
            </FormControl>
            </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
                <Select 
                  value={selectedProduct?.department || ''} 
                  onChange={(e) => {
                    if (e.target.value === 'ADD_NEW_DEPARTMENT') {
                      setIsDepartmentModalOpen(true);
                    } else {
                      setSelectedProduct(p => p ? { ...p, department: e.target.value } : null);
                    }
                  }} 
                  displayEmpty
                >
              <MenuItem value=""><em>Select Department</em></MenuItem>
              {departments.map(dept => <MenuItem key={dept.id} value={dept.name}>{dept.name}</MenuItem>)}
                  <Divider />
                  <MenuItem value="ADD_NEW_DEPARTMENT" sx={{ color: 'primary.main', fontStyle: 'italic' }}><AddIcon sx={{ mr: 1, fontSize: 20 }} /> Add Custom Department</MenuItem>
            </Select>
          </FormControl>
        </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Price" type="number" value={selectedProduct?.price || 0} onChange={(e) => setSelectedProduct(p => p ? { ...p, price: parseFloat(e.target.value) } : null)} required fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Select 
                  value={selectedProduct?.quality || ''} 
                  onChange={(e) => {
                    if (e.target.value === 'ADD_NEW_QUALITY') {
                      setIsQualityModalOpen(true);
                    } else {
                      setSelectedProduct(p => p ? { ...p, quality: e.target.value } : null)
                    }
                  }} 
                  displayEmpty
                >
                  <MenuItem value=""><em>Select Quality</em></MenuItem>
                  {qualities.map(q => <MenuItem key={q} value={q}>{q}</MenuItem>)}
                  <Divider />
                  <MenuItem value="ADD_NEW_QUALITY" sx={{ color: 'primary.main', fontStyle: 'italic' }}><AddIcon sx={{ mr: 1, fontSize: 20 }} /> Add Custom Quality</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Select 
                  value={selectedProduct?.supplierId || ''} 
                  onChange={(e) => {
                    if (e.target.value === 'ADD_NEW_SUPPLIER') {
                      setIsSupplierModalOpen(true);
                    } else {
                      const selectedSupp = suppliers.find(s => s.id === e.target.value);
                      setSelectedProduct(p => p ? { ...p, supplierId: e.target.value as string, supplierName: selectedSupp?.name || '' } : null)
                    }
                  }} 
                  displayEmpty
                >
                  <MenuItem value=""><em>Select Supplier</em></MenuItem>
                  {suppliers.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                  <Divider />
                  <MenuItem value="ADD_NEW_SUPPLIER" sx={{ color: 'primary.main', fontStyle: 'italic' }}><AddIcon sx={{ mr: 1, fontSize: 20 }} /> Add Custom Supplier</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseModal}>Cancel</Button>
          <Button onClick={handleSaveProduct} variant="contained" disabled={isSaving}>
            {isSaving ? <CircularProgress size={24} /> : 'Save'}
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
                  <Grid item xs={6}>{renderProductField('Department', selectedProduct.department)}</Grid>
                  <Grid item xs={6}>{renderProductField('Supplier', selectedProduct.supplierName)}</Grid>
                  <Grid item xs={12}>{renderProductField('Code Number', selectedProduct.codeNumber)}</Grid>
                </Grid>
                {selectedProduct.description && (
                  <Grid item xs={12}>
                    {renderProductField('Description', selectedProduct.description)}
                  </Grid>
                )}
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

      {/* Add Category Modal */}
      <Dialog open={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add New Category</DialogTitle>
        <DialogContent dividers>
          <TextField
            autoFocus
            label="Category Name"
            fullWidth
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            disabled={isSavingCategory}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setIsCategoryModalOpen(false)} disabled={isSavingCategory}>Cancel</Button>
          <Button onClick={handleSaveCategory} variant="contained" disabled={isSavingCategory || !newCategoryName.trim()}>
            {isSavingCategory ? <CircularProgress size={24} color="inherit" /> : 'Save Category'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Brand Modal */}
      <Dialog open={isBrandModalOpen} onClose={() => setIsBrandModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add New Brand</DialogTitle>
        <DialogContent dividers>
          <TextField
            autoFocus
            label="Brand Name"
            fullWidth
            value={newBrandName}
            onChange={(e) => setNewBrandName(e.target.value)}
            disabled={isSavingBrand}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setIsBrandModalOpen(false)} disabled={isSavingBrand}>Cancel</Button>
          <Button onClick={handleSaveBrand} variant="contained" disabled={isSavingBrand || !newBrandName.trim()}>
            {isSavingBrand ? <CircularProgress size={24} color="inherit" /> : 'Save Brand'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Quality Modal */}
      <Dialog open={isQualityModalOpen} onClose={() => setIsQualityModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Custom Quality</DialogTitle>
        <DialogContent dividers>
          <TextField
            autoFocus
            label="Quality Name"
            fullWidth
            value={newQualityName}
            onChange={(e) => setNewQualityName(e.target.value)}
            disabled={isSavingQuality}
            helperText="This quality will only be set for this product."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setIsQualityModalOpen(false)} disabled={isSavingQuality}>Cancel</Button>
          <Button onClick={handleSaveQuality} variant="contained" disabled={isSavingQuality || !newQualityName.trim()}>Set Quality</Button>
        </DialogActions>
      </Dialog>

      {/* Add Department Modal */}
      <Dialog open={isDepartmentModalOpen} onClose={() => setIsDepartmentModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Custom Department</DialogTitle>
        <DialogContent dividers>
          <TextField
            autoFocus
            label="Department Name"
            fullWidth
            value={newDepartmentName}
            onChange={(e) => setNewDepartmentName(e.target.value)}
            disabled={isSavingDepartment}
            helperText="This department will only be set for this product."
          />
          <TextField
            label="Location"
            fullWidth
            value={newDepartmentLocation}
            onChange={(e) => setNewDepartmentLocation(e.target.value)}
            disabled={isSavingDepartment}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => { setIsDepartmentModalOpen(false); setNewDepartmentLocation(''); }} disabled={isSavingDepartment}>Cancel</Button>
          <Button onClick={handleSaveDepartment} variant="contained" disabled={isSavingDepartment || !newDepartmentName.trim()}>Set Department</Button>
        </DialogActions>
      </Dialog>

      {/* Add Supplier Modal */}
      <Dialog open={isSupplierModalOpen} onClose={() => setIsSupplierModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Custom Supplier</DialogTitle>
        <DialogContent dividers>
          <TextField
            autoFocus
            label="Supplier Name"
            fullWidth
            value={newSupplierName}
            onChange={(e) => setNewSupplierName(e.target.value)}
            disabled={isSavingSupplier}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setIsSupplierModalOpen(false)} disabled={isSavingSupplier}>Cancel</Button>
          <Button onClick={handleSaveSupplier} variant="contained" disabled={isSavingSupplier || !newSupplierName.trim()}>Set Supplier</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};