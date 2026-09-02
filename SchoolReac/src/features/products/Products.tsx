import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import * as api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  Box, Typography, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TablePagination, CircularProgress, Alert, Button, Dialog, DialogTitle, DialogContent, DialogActions, LinearProgress,
  IconButton, Chip, Avatar, FormControl, Select, MenuItem, Checkbox, TableSortLabel, Menu, Tooltip, Autocomplete, TableFooter, createFilterOptions, Skeleton,
  Grid, Divider, ListItemText, ToggleButton, ToggleButtonGroup, Card, CardContent,
  FormControlLabel, InputAdornment, Accordion, AccordionSummary, AccordionDetails, ListItemIcon, Switch
} from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import {
  Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, MoreVert as MoreVertIcon,
  Image as ImageIcon, BrokenImage as BrokenImageIcon, CloudUpload as CloudUploadIcon,
  DeleteForever as DeleteForeverIcon, Close as CloseIcon, Visibility as VisibilityIcon,
  FileDownload as FileDownloadIcon, ViewColumn as ViewColumnIcon, SwapHoriz as SwapHorizIcon, Autorenew as AutorenewIcon,
  ViewList as ViewListIcon, GridView as GridViewIcon, Category as CategoryIcon, Search as SearchIcon, ExpandMore as ExpandMoreIcon, FilterList as FilterListIcon, Print as PrintIcon,
  ReportProblem as ReportProblemIcon
} from '@mui/icons-material';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';

const ALL_COLUMNS = [
  { id: 'name', label: 'Name' },
  { id: 'codeNumber', label: 'Code Number' },
  { id: 'year', label: 'Year' },
  { id: 'plateNumber', label: 'Plate Number' },
  { id: 'engineNumber', label: 'Engine/Serial #' },
  { id: 'categoryName', label: 'Category' },
  { id: 'brandName', label: 'Brand' },
  { id: 'quality', label: 'Condition' },
  { id: 'departmentName', label: 'Dept' },
  { id: 'responsiblePerson', label: 'Responsible Person' },
  { id: 'initialQuantity', label: 'Qty' },
  { id: 'voucherNumber', label: 'Voucher #' },
  { id: 'donorName', label: 'Donor' },
  { id: 'supplier', label: 'Supplier' },
  { id: 'purchaseType', label: 'Acquisition Type' },
  { id: 'price', label: 'Price' },
  { id: 'description', label: 'Description' } // Ensure this is present in ALL_COLUMNS
];

export const Products: React.FC = () => {
  // Data State
  const [products, setProducts] = useState<api.ProductDto[]>([]);
  const [categories, setCategories] = useState<api.CategoryDto[]>([]);
  const [brands, setBrands] = useState<api.BrandDto[]>([]);
  const [departments, setDepartments] = useState<api.DepartmentDto[]>([]);
  const [persons, setPersons] = useState<api.PersonDto[]>([]);
  const [suppliers, setSuppliers] = useState<api.SupplierDto[]>([]);
  const [qualities, setQualities] = useState<api.QualityDto[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // UI & Control State
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [filterDepartment, setFilterDepartment] = useState<string[]>(searchParams.get('department') ? searchParams.get('department')!.split(',') : []);
  const [filterCategory, setFilterCategory] = useState<string[]>(searchParams.get('category') ? searchParams.get('category')!.split(',') : []);
  const [filterQuality, setFilterQuality] = useState<string[]>(searchParams.get('quality') ? searchParams.get('quality')!.split(',') : []);
  const [filterPurchaseType, setFilterPurchaseType] = useState(searchParams.get('purchaseType') || '');
  const [filterGroup, setFilterGroup] = useState(searchParams.get('group') || '');
  const [filterStartDate, setFilterStartDate] = useState(searchParams.get('startDate') || '');
  const [filterEndDate, setFilterEndDate] = useState(searchParams.get('endDate') || '');
  const [filterPrice, setFilterPrice] = useState(searchParams.get('price') || '');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1', 10) - 1);
  const [pageSize, setPageSize] = useState(() => {
    const saved = localStorage.getItem('products_page_size');
    return saved ? parseInt(saved, 10) : 10;
  });
  const [sortBy, setSortBy] = useState<keyof api.ProductDto>('createdDate');
  const [isAscending, setIsAscending] = useState(false); // false = descending (newest first)
  const [selected, setSelected] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    return (localStorage.getItem('products_view_mode') as 'list' | 'grid') || 'list';
  });
  const [gridColumns, setGridColumns] = useState<number>(() => {
    return parseInt(localStorage.getItem('products_grid_cols') || '4', 10);
  });

  // Action Menu State
  const [actionMenuAnchorEl, setActionMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activeActionProduct, setActiveActionProduct] = useState<api.ProductDto | null>(null);

  // Modal & Form State
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view' | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<api.ProductDto | null>(null);
  const [contacts, setContacts] = useState<{ type: string, value: string }[]>([{ type: 'Phone', value: '' }]);
  const [productToDelete, setProductToDelete] = useState<api.ProductDto | null>(null);
  const [productsToDelete, setProductsToDelete] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  // Purchase History State
  const [purchaseHistory, setPurchaseHistory] = useState<api.ProductPurchaseHistoryDto[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Transfer State
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [productToTransfer, setProductToTransfer] = useState<api.ProductDto | null>(null);
  const [transferDeptId, setTransferDeptId] = useState<string>('');
  const [transferNotes, setTransferNotes] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState(false);

  // Write-Off State
  const [writeOffModalOpen, setWriteOffModalOpen] = useState(false);
  const [productToWriteOff, setProductToWriteOff] = useState<api.ProductDto | null>(null);
  const [writeOffQuantity, setWriteOffQuantity] = useState<number>(1);
  const [writeOffReason, setWriteOffReason] = useState<number>(1);
  const [writeOffNotes, setWriteOffNotes] = useState<string>('');
  const [isWritingOff, setIsWritingOff] = useState(false);

  // Image State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Image Cropping State
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImgSrc, setCropImgSrc] = useState<string>('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Menu State
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [columnMenuAnchorEl, setColumnMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [exportAllData, setExportAllData] = useState(false);
  const [exportFields, setExportFields] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    const localStorageKey = 'products_table_hidden_cols_v7';
    const savedHidden = localStorage.getItem(localStorageKey);
    let initialVisible = ALL_COLUMNS.map(c => c.id); // Start with all columns visible

    if (savedHidden) { // If there's a saved state in local storage
      try {
        const hiddenArr = JSON.parse(savedHidden);
        initialVisible = ALL_COLUMNS.map(c => c.id).filter(id => !hiddenArr.includes(id));
      } catch (e) {
        console.error('Failed to parse hidden columns from local storage', e);
        // If parsing fails, fall back to showing all columns (initialVisible already has this)
      }
    }
    return initialVisible;
  });
  const viewModalContentRef = useRef<HTMLDivElement>(null);
  const [showImageInView, setShowImageInView] = useState(true);

  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  const filter = createFilterOptions<any>();

  const { showToast } = useToast();

  const activeFilterCount = filterCategory.length + filterDepartment.length + filterQuality.length + 
    (filterPurchaseType ? 1 : 0) + (filterGroup ? 1 : 0) + (filterStartDate ? 1 : 0) + (filterEndDate ? 1 : 0) + (filterPrice ? 1 : 0);

  const totalValue = useMemo(() => {
    return products.reduce((sum, p) => sum + (p.price || 0), 0);
  }, [products]);

  useEffect(() => {
    const hiddenColumns = ALL_COLUMNS.map(c => c.id).filter(id => !visibleColumns.includes(id));
    localStorage.setItem('products_table_hidden_cols_v7', JSON.stringify(hiddenColumns));
  }, [visibleColumns]);

  useEffect(() => {
    localStorage.setItem('products_view_mode', viewMode);
    localStorage.setItem('products_page_size', pageSize.toString());
    localStorage.setItem('products_grid_cols', gridColumns.toString());
  }, [viewMode, pageSize, gridColumns]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const uniqueCategories = useMemo(() => {
    const map = new Map<string, string>();
    const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
    categories.forEach(c => {
      if (c.name) map.set(normalize(c.name), c.name);
    });
    products.forEach(p => {
      if (p.categoryName && !map.has(normalize(p.categoryName))) map.set(normalize(p.categoryName), p.categoryName);
    });
    map.delete('all categories');
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  }, [categories, products]);

  const uniqueDepartments = useMemo(() => {
    const map = new Map<string, string>();
    const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
    departments.forEach(d => {
      if (d.name) map.set(normalize(d.name), d.name);
    });
    products.forEach(p => {
      if (p.departmentName && !map.has(normalize(p.departmentName))) map.set(normalize(p.departmentName), p.departmentName);
    });
    map.delete('all depts');
    map.delete('all departments');
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  }, [departments, products]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const selectedCats = categories.filter(c => filterCategory.includes(c.name));
      const categoryIds = selectedCats.map(c => c.id).join(',');
      const selectedDepts = departments.filter(d => filterDepartment.includes(d.name));
      const departmentIds = selectedDepts.map(d => d.id).join(',');
      const selectedQualities = qualities.filter(q => filterQuality.includes(q.name));
      const qualityIds = selectedQualities.map(q => q.id).join(',');

      let filterOn = undefined;
      let filterQuery = undefined;
      
      let minPrice = undefined;
      let maxPrice = undefined;
      if (filterPrice === 'under100') { maxPrice = 99.99; }
      else if (filterPrice === 'equal100') { minPrice = 100; maxPrice = 100; }
      else if (filterPrice === 'over100') { minPrice = 100.01; }

      // Fallback for free-text categories that don't have an ID
      const unmappedCategories = filterCategory.filter(name => !selectedCats.find(c => c.name === name));
      const unmappedDepartments = filterDepartment.filter(name => !selectedDepts.find(d => d.name === name));
      const unmappedQualities = filterQuality.filter(name => !selectedQualities.find(q => q.name === name));
      if (unmappedCategories.length > 0) {
        filterOn = 'categoryName';
        filterQuery = unmappedCategories.join(',');
      } else if (unmappedDepartments.length > 0) {
        filterOn = 'departmentName';
        filterQuery = unmappedDepartments.join(',');
      } else if (unmappedQualities.length > 0) {
        filterOn = 'quality';
        filterQuery = unmappedQualities.join(',');
      }

      // Cast to any to bypass strict QueryOptions typing
      const params: any = {
        pageNumber: currentPage + 1,
        pageSize,
        sortBy,
        isAscending,
        name: debouncedSearchQuery || undefined,
        categoryId: categoryIds || undefined,
        departmentId: departmentIds || undefined,
        qualityId: qualityIds || undefined,
        purchaseType: filterPurchaseType || undefined,
        productGroup: filterGroup || undefined,
        invoiceStartDate: filterStartDate ? new Date(filterStartDate).toISOString() : undefined,
        invoiceEndDate: filterEndDate ? new Date(filterEndDate).toISOString() : undefined,
        minPrice,
        maxPrice,
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
  }, [currentPage, pageSize, sortBy, isAscending, filterCategory, filterDepartment, filterQuality, filterPurchaseType, filterGroup, filterPrice, filterStartDate, filterEndDate, debouncedSearchQuery, showToast, categories, departments, qualities]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // This effect syncs the component's filter and pagination state to the URL search params.
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearchQuery) {
      params.set('search', debouncedSearchQuery);
    } else {
      params.delete('search');
    }
    if (filterCategory.length > 0) {
      params.set('category', filterCategory.join(','));
    } else {
      params.delete('category');
    }
    if (filterDepartment.length > 0) {
      params.set('department', filterDepartment.join(','));
    } else {
      params.delete('department');
    }
    if (filterQuality.length > 0) {
      params.set('quality', filterQuality.join(','));
    } else {
      params.delete('quality');
    }
    if (filterPurchaseType) {
      params.set('purchaseType', filterPurchaseType);
    } else {
      params.delete('purchaseType');
    }
    if (filterGroup) {
      params.set('group', filterGroup);
    } else {
      params.delete('group');
    }
    if (filterStartDate) {
      params.set('startDate', filterStartDate);
    } else {
      params.delete('startDate');
    }
    if (filterEndDate) {
      params.set('endDate', filterEndDate);
    } else {
      params.delete('endDate');
    }
    if (filterPrice) {
      params.set('price', filterPrice);
    } else {
      params.delete('price');
    }
    params.set('page', (currentPage + 1).toString());

    // Using replace to not pollute browser history on every filter change
    setSearchParams(params, { replace: true });
  }, [debouncedSearchQuery, filterCategory, filterDepartment, filterQuality, filterPurchaseType, filterGroup, filterStartDate, filterEndDate, filterPrice, currentPage, setSearchParams]);

  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [cats, brnds, depts, pers, supps, quals, settings] = await Promise.all([
          api.getCategories().catch(() => []),
          api.getBrands().catch(() => []),
          api.getDepartments().catch(() => []),
          api.getPersons().catch(() => []),
          api.getSuppliers().catch(() => []),
          api.getQualities().catch(() => []),
          api.getSystemSettings().catch(() => null)
        ]);

        const localExportFields = localStorage.getItem('productExportFields');
        const finalExportFields = settings?.productExportFields || localExportFields;

        if (finalExportFields) {
          setExportFields(finalExportFields.split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean));
        }

        function getUnique<T, K extends keyof T>(arr: T[], key: K) {
          const map = new Map();
          for (const item of arr) {
            const val = item[key];
            if (val && typeof val === 'string') {
              map.set(val.toLowerCase().replace(/\s+/g, ' ').trim(), item);
            }
          }
          return Array.from(map.values());
        }

        setCategories(getUnique(cats, 'name').sort((a, b) => (a.name || '').localeCompare(b.name || '')));
        setBrands(getUnique(brnds, 'name').sort((a, b) => (a.name || '').localeCompare(b.name || '')));
        setDepartments(getUnique(depts, 'name').sort((a, b) => (a.name || '').localeCompare(b.name || '')));
        setPersons(getUnique(pers, 'fullName').sort((a, b) => (a.fullName || '').localeCompare(b.fullName || '')));
        setSuppliers(getUnique(supps, 'name').sort((a, b) => (a.name || '').localeCompare(b.name || '')));
        setQualities(getUnique(quals, 'name').sort((a, b) => (a.name || '').localeCompare(b.name || '')));
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

  const handleOpenActionMenu = (event: React.MouseEvent<HTMLElement>, product: api.ProductDto) => {
    event.stopPropagation();
    setActionMenuAnchorEl(event.currentTarget);
    setActiveActionProduct(product);
  };

  const handleCloseActionMenu = (event?: any) => {
    if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
    setActionMenuAnchorEl(null);
    setActiveActionProduct(null);
  };

  const handleGenerateAssetCode = () => {
    if (!selectedProduct) return;
    const yearPart = selectedProduct.year ? new Date(selectedProduct.year).getFullYear().toString() : new Date().getFullYear().toString();
    const catPart = selectedProduct.categoryName ? selectedProduct.categoryName.substring(0, 3).toUpperCase() : 'GEN';
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    setSelectedProduct({ ...selectedProduct, codeNumber: `${yearPart}-${catPart}-${randomPart}` });
  };

  const handleGenerateInventoryCode = () => {
    if (!selectedProduct) return;
    const yearPart = selectedProduct.year ? new Date(selectedProduct.year).getFullYear().toString() : new Date().getFullYear().toString();
    const catPart = selectedProduct.categoryName ? selectedProduct.categoryName.substring(0, 2).toUpperCase() : 'FN';
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    setSelectedProduct({ ...selectedProduct, codeNumber: `${catPart}${yearPart}-${randomPart}` });
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

  const updateSupplierContact = (currentContacts: { type: string, value: string }[]) => {
    const combined = currentContacts
      .filter(c => c.value.trim() !== '')
      .reduce((acc, c) => {
        acc[c.type || 'Other'] = c.value;
        return acc;
      }, {} as Record<string, string>);
    setSelectedProduct(p => p ? { ...p, supplierContact: Object.keys(combined).length > 0 ? (combined as any) : null } : null);
  };

  const handleOpenModal = (mode: 'create' | 'edit' | 'view', product?: api.ProductDto | null) => {
    setModalMode(mode);
    if (mode === 'create') {
      setSelectedProduct({ id: null, name: '', price: 0, departmentName: '', codeNumber: '', attributes: '', purchaseType: 'None', initialQuantity: null, supplierName: '', donorName: '', voucherNumber: '', supplierContact: {} as any, invoiceDate: '', responsiblePerson: '', responsiblePersonId: null, qualityId: null } as api.ProductDto);
      setContacts([{ type: 'Phone', value: '' }]);
    } else {
      // Set initial data from the list for a responsive UI
      setSelectedProduct(product || null);
      setImagePreview(product?.imageUrl || null);
      
      if ((mode === 'view' || mode === 'edit') && product?.id) {
        setHistoryLoading(true);
        setPurchaseHistory([]); // Clear old history
        
        // Dynamically fetch the latest export fields configuration so you never need to refresh the page!
        if (mode === 'view') {
          setShowImageInView(true);
          api.getSystemSettings().then(settings => {
            const localExportFields = localStorage.getItem('productExportFields');
            const finalExportFields = settings?.productExportFields || localExportFields;
            if (finalExportFields) {
              setExportFields(finalExportFields.split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean));
            } else {
              setExportFields([]);
            }
          }).catch(console.warn);
        }

        // Fetch full product details including purchase history
        api.getProductById(product.id)
          .then(fullProduct => {
            if (mode === 'edit') {
              // The fullProduct from the API is the source of truth.
              // We spread the original `product` first to ensure all properties are initialized,
              // then overwrite with the complete data from `fullProduct`.
              setSelectedProduct({ ...product, ...fullProduct });

              const contactData = fullProduct.supplierContact;
              if (contactData && typeof contactData === 'object' && !Array.isArray(contactData)) {
                const parsed = Object.keys(contactData).map(key => ({
                  type: key || 'Unknown',
                  value: (contactData as any)[key] || ''
                })).filter(c => c.value !== '');
                setContacts(parsed.length > 0 ? parsed : [{ type: 'Phone', value: '' }]);
              } else if (typeof contactData === 'string' && contactData) {
                const parsed = (contactData as string).split(' | ').map(part => {
                  const [type, ...rest] = part.split(': ');
                  return { type: type || 'Unknown', value: rest.join(': ') || '' };
                }).filter(c => c.value !== '');
                setContacts(parsed.length > 0 ? parsed : [{ type: 'Phone', value: '' }]);
              } else {
                setContacts([{ type: 'Phone', value: '' }]);
              }
            } else {
              setSelectedProduct({ ...product, ...fullProduct });
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

  const openTransferModal = (product: api.ProductDto) => {
    setProductToTransfer(product);
    setTransferDeptId('');
    setTransferNotes('');
    setTransferModalOpen(true);
  };

  const handleTransfer = async () => {
    if (!productToTransfer || !transferDeptId) return;
    setIsTransferring(true);
    try {
      // Use the new transfer endpoint
      // await api.transferProduct(productToTransfer.id!, { newDepartmentId: transferDeptId, notes: transferNotes });
      
      // Fallback: If you haven't created the endpoint yet, you can just update the product:
      await api.updateProduct(productToTransfer.id!, { ...productToTransfer, departmentId: transferDeptId });

      showToast('Product transferred successfully!', 'success');
      setTransferModalOpen(false);
      loadProducts();
    } catch (err: any) {
      showToast('Failed to transfer product.', 'error');
    } finally {
      setIsTransferring(false);
    }
  };

  const openWriteOffModal = (product: api.ProductDto) => {
    setProductToWriteOff(product);
    setWriteOffQuantity(1);
    setWriteOffReason(1);
    setWriteOffNotes('');
    setWriteOffModalOpen(true);
  };

  const handleWriteOff = async () => {
    if (!productToWriteOff || !productToWriteOff.id) return;
    setIsWritingOff(true);
    try {
      await api.createWriteOff({
        productId: productToWriteOff.id,
        quantity: writeOffQuantity,
        reason: writeOffReason,
        description: writeOffNotes
      });
      showToast('Product reported for write-off successfully!', 'success');
      setWriteOffModalOpen(false);
      loadProducts();
    } catch (err: any) {
      showToast('Failed to submit write-off.', 'error');
    } finally {
      setIsWritingOff(false);
    }
  };

  const handleViewPurchase = (purchaseId: string) => {
    handleCloseModal();
    navigate(`/inventory/purchases/${purchaseId}`);
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
    if (isVehicleCategory) {
      if (!selectedProduct.year) return false;
      // Also check if the year is in the future
      if (new Date(selectedProduct.year).getFullYear() > new Date().getFullYear()) {
        return false;
      }
    }
    return true;
  }, [selectedProduct, modalMode, isVehicleCategory]);

  const handleSaveProduct = async () => {
    if (!selectedProduct) return;
    setIsSaving(true);

    // Clean up empty strings to null to ensure the backend validates optional/Date fields properly
    const payloadToSave: any = { ...selectedProduct }; 
    const optionalFields = ['description', 'codeNumber', 'attributes', 'plateNumber', 'engineNumber', 'donorName', 'voucherNumber', 'supplierName', 'responsiblePerson', 'invoiceDate', 'year', 'quality', 'categoryName', 'brandName', 'departmentName'];
    
    optionalFields.forEach(field => {
      if (payloadToSave[field] === '') {
        payloadToSave[field] = null;
      }
    });

    try {
      // Auto-create Responsible Person if it's new
      if (payloadToSave.purchaseType !== 'None' && payloadToSave.responsiblePerson && !payloadToSave.responsiblePersonId) {
        try {
          const newPerson = await api.createPerson({ fullName: payloadToSave.responsiblePerson });
          payloadToSave.responsiblePersonId = newPerson.id;
          setPersons(prev => [...prev, newPerson]);
        } catch (e) {
          console.warn("Could not auto-create person", e);
        }
      }
      
      // Auto-create Category if it's new
      if (payloadToSave.categoryName && !payloadToSave.categoryId) {
        try {
          const newCat = await api.createCategory({ name: payloadToSave.categoryName });
          payloadToSave.categoryId = newCat.id;
          setCategories(prev => [...prev, newCat]);
        } catch (e) { console.warn("Could not auto-create category", e); }
      }

      // Auto-create Department if it's new
      if (payloadToSave.departmentName && !payloadToSave.departmentId) {
        try {
          const newDept = await api.createDepartment({ name: payloadToSave.departmentName });
          payloadToSave.departmentId = newDept.id;
          setDepartments(prev => [...prev, newDept]);
        } catch (e) { console.warn("Could not auto-create department", e); }
      }

      // Auto-create Brand if it's new
      if (payloadToSave.brandName && !payloadToSave.brandId) {
        try {
          const newBrand = await api.createBrand({ name: payloadToSave.brandName });
          payloadToSave.brandId = newBrand.id;
          setBrands(prev => [...prev, newBrand]);
        } catch (e) { console.warn("Could not auto-create brand", e); }
      }

      let savedProduct: api.ProductDto;
      if (modalMode === 'edit' && payloadToSave.id) {
        const updateResult = await api.updateProduct(payloadToSave.id, payloadToSave);
        savedProduct = updateResult || payloadToSave;
      } else {
        savedProduct = await api.createProduct(payloadToSave as api.CreateProductRequest);
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

  const handleInstantRemoveImage = async () => {
    if (!selectedProduct?.id) return;
    setIsSaving(true);
    try {
      await api.deleteProductImage(selectedProduct.id);
      setSelectedProduct(p => p ? { ...p, imageUrl: null } : null);
      setImagePreview(null);
      setImageFile(null);
      showToast('Image removed successfully!', 'success');
      await loadProducts();
    } catch (err: any) {
      showToast('Failed to remove image.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      // Send the raw file directly to the API. Let the C# backend handle empty rows and parsing.
      // This prevents browser memory crashes on large Excel files.
      const result = await api.importProducts(file);
      if (result.errors && result.errors.length > 0) {
        showToast(`Imported ${result.importedCount} products. Encountered ${result.errors.length} row errors (see console).`, 'warning');
        console.warn("Import errors:", result.errors);
        setImportErrors(result.errors);
      } else {
        showToast(`Successfully imported ${result.importedCount} products!`, 'success');
      }
      await loadProducts();
    } catch (err: any) {
      const message = err.response?.data?.title || err.response?.data?.message || 'Failed to import products.';
      showToast(message, 'error');
    } finally {
      setIsImporting(false);
      event.target.value = ''; // Reset input so the same file can be uploaded again if needed
    }
  };

  const handleSaveCrop = async () => {
    if (imgRef.current) {
      const cropWidth = completedCrop?.width || imgRef.current.width;
      const cropHeight = completedCrop?.height || imgRef.current.height;
      const cropX = completedCrop?.x || 0;
      const cropY = completedCrop?.y || 0;

      const canvas = document.createElement('canvas');
      const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
      
      // Calculate high-resolution dimensions, capped to prevent massive payloads
      const MAX_SIZE = 1200;
      let finalWidth = cropWidth * scaleX;
      let finalHeight = cropHeight * scaleY;
      
      if (finalWidth > MAX_SIZE || finalHeight > MAX_SIZE) {
        const ratio = Math.min(MAX_SIZE / finalWidth, MAX_SIZE / finalHeight);
        finalWidth *= ratio;
        finalHeight *= ratio;
      }

      canvas.width = finalWidth;
      canvas.height = finalHeight;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(
          imgRef.current,
          cropX * scaleX,
          cropY * scaleY,
          cropWidth * scaleX,
          cropHeight * scaleY,
          0,
          0,
          finalWidth,
          finalHeight
        );

        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });
            setImageFile(file);
            setImagePreview(URL.createObjectURL(blob));
            setCropModalOpen(false);
          }
        }, 'image/jpeg', 0.8);
      }
    } else {
      setCropModalOpen(false);
    }
  };

  const handleExport = async (format: 'csv' | 'pdf' | 'excel') => {
    setAnchorEl(null);
    showToast(`Preparing ${format.toUpperCase()} export, please wait...`, 'info');

    try {
      const selectedCats = categories.filter(c => filterCategory.includes(c.name));
      const categoryIds = selectedCats.map(c => c.id).join(',');
      const selectedDepts = departments.filter(d => filterDepartment.includes(d.name));
      const departmentIds = selectedDepts.map(d => d.id).join(',');
      const selectedQualities = qualities.filter(q => filterQuality.includes(q.name));
      const qualityIds = selectedQualities.map(q => q.id).join(',');

      let filterOn = undefined;
      let filterQuery = undefined;
      
      let minPrice = undefined;
      let maxPrice = undefined;
      if (filterPrice === 'under100') { maxPrice = 99.99; }
      else if (filterPrice === 'equal100') { minPrice = 100; maxPrice = 100; }
      else if (filterPrice === 'over100') { minPrice = 100.01; }

      const unmappedCategories = filterCategory.filter(name => !selectedCats.find(c => c.name === name));
      const unmappedDepartments = filterDepartment.filter(name => !selectedDepts.find(d => d.name === name));
      const unmappedQualities = filterQuality.filter(name => !selectedQualities.find(q => q.name === name));
      if (unmappedCategories.length > 0) {
        filterOn = 'categoryName';
        filterQuery = unmappedCategories.join(',');
      } else if (unmappedDepartments.length > 0) {
        filterOn = 'departmentName';
        filterQuery = unmappedDepartments.join(',');
      } else if (unmappedQualities.length > 0) {
        filterOn = 'quality';
        filterQuery = unmappedQualities.join(',');
      }

      const params: any = {
        pageNumber: 1,
        pageSize: exportAllData ? 100000 : (totalItems > 0 ? totalItems : 10000),
        sortBy: exportAllData ? 'name' : sortBy,
        isAscending: exportAllData ? true : isAscending,
        name: exportAllData ? undefined : debouncedSearchQuery || undefined,
        categoryId: exportAllData ? undefined : categoryIds || undefined,
        departmentId: exportAllData ? undefined : departmentIds || undefined,
        qualityId: exportAllData ? undefined : qualityIds || undefined,
        purchaseType: exportAllData ? undefined : filterPurchaseType || undefined,
        productGroup: exportAllData ? undefined : filterGroup || undefined,
        invoiceStartDate: exportAllData ? undefined : (filterStartDate ? new Date(filterStartDate).toISOString() : undefined),
        invoiceEndDate: exportAllData ? undefined : (filterEndDate ? new Date(filterEndDate).toISOString() : undefined),
        minPrice: exportAllData ? undefined : minPrice,
        maxPrice: exportAllData ? undefined : maxPrice,
        filterOn: exportAllData ? undefined : filterOn,
        filterQuery: exportAllData ? undefined : filterQuery
      };

      let fetchBlob: Promise<Blob>;
      let mimeType: string;
      let extension: string;

      if (format === 'excel') {
        fetchBlob = api.exportProductsExcel(params);
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        extension = 'xlsx';
      } else if (format === 'csv') {
        fetchBlob = api.exportProductsCsv(params);
        mimeType = 'text/csv;charset=utf-8;';
        extension = 'csv';
      } else {
        fetchBlob = api.exportProductsPdf(params);
        mimeType = 'application/pdf';
        extension = 'pdf';
      }

      const blobData = await fetchBlob;
      const blob = new Blob([blobData], { type: mimeType });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `products_${new Date().toISOString().slice(0, 10)}.${extension}`;
      link.click();
      URL.revokeObjectURL(link.href);
      showToast(`${format.toUpperCase()} export completed successfully!`, 'success');
    } catch (err) {
      showToast(`Failed to generate ${format.toUpperCase()} file on the server.`, 'error');
      console.error("Export error:", err);
    }
  };

  const isSelected = (id: string) => selected.indexOf(id) !== -1;

  const renderProductField = (label: string, value: any) => (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, borderBottom: '1px dashed', borderColor: 'divider', pb: 1 }}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140, fontWeight: 500, flexShrink: 0 }}>{label}:</Typography>
      <Typography variant="body2" fontWeight="medium" sx={{ wordBreak: 'break-word' }}>{value || '-'}</Typography>
    </Box>
  );

  const renderViewField = (label: string, value: any) => {
    if (exportFields.length > 0) {
      const match = exportFields.some(f => label.toLowerCase().includes(f));
      if (!match) return null;
    }
    return (
      <Grid size={{ xs: 12 }}>{renderProductField(label, value)}</Grid>
    );
  };

  const handleExportSingleProduct = (product: api.ProductDto) => {
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.text(product.name, 14, 22);

    doc.setFontSize(12);
    doc.setTextColor(100); // a gray color
    doc.text(`Product Details - ${product.codeNumber || 'N/A'}`, 14, 30);

    const qName = product.quality || qualities.find(q => q.id === product.qualityId)?.name;
    let productData = [
      ['Item Name', product.name || '-'],
      ['Code Number', product.codeNumber || '-'],
      ['Category', product.categoryName || categories.find(c => c.id === product.categoryId)?.name || '-'],
      ['Brand', product.brandName || brands.find(b => b.id === product.brandId)?.name || '-'],
      ['Department', product.departmentName || departments.find(d => d.id === product.departmentId)?.name || '-'],
      ['Quality / Condition', qName || '-'],
      ['Price', product.price != null ? `$${product.price.toFixed(2)}` : '-'],
      ['Voucher Number', product.voucherNumber || '-'],
      ['Purchase Date', product.invoiceDate ? new Date(product.invoiceDate).toLocaleDateString() : (product.createdDate ? new Date(product.createdDate).toLocaleDateString() : '-')],
      ['Responsible Person', product.responsiblePerson || persons.find(p => p.id === product.responsiblePersonId)?.fullName || '-'],
      ['Supplier', product.supplierName || '-'],
      ['Donor', product.donorName || '-'],
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

    if (exportFields.length > 0) {
      productData = productData.filter(row => exportFields.some(f => row[0].toString().toLowerCase().includes(f)));
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

  const handlePrintDetails = async () => {
    if (!viewModalContentRef.current) {
      showToast('Could not capture product details for printing.', 'error');
      return;
    }

    try {
      const canvas = await html2canvas(viewModalContentRef.current, { scale: 2 });
      const image = canvas.toDataURL('image/png');

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        showToast('Please allow popups for this site to print.', 'warning');
        return;
      }

      printWindow.document.write(`<html><head><title>Print Product Details</title></head><body style="margin:0; text-align: center;"><img src="${image}" style="max-width:100%;"></body></html>`);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    } catch (error) {
      showToast('Failed to prepare details for printing.', 'error');
    }
  };

  const disablePurchaseFields = modalMode === 'edit' && historyLoading;

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterCategory([]);
    setFilterDepartment([]);
    setFilterQuality([]);
    setFilterPurchaseType('');
    setFilterGroup('');
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterPrice('');
    setCurrentPage(0);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Products</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Manage your inventory items.</Typography>
        </Box>
      </Box>

      {/* Table Card */}
      <Paper sx={{ width: '100%', overflow: 'hidden', boxShadow: 3, position: 'relative' }}>
        {loading && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }} />}
        
        {/* Primary Search Bar */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'nowrap', gap: 2, overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' } }}>
          <TextField
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(0); }}
            placeholder="Search by name or code..."
            variant="outlined"
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ width: { xs: 200, sm: 300 }, flexShrink: 0 }}
          />
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'nowrap', flexShrink: 0 }}>
            {searchQuery && (
              <Button variant="text" color="inherit" onClick={() => { setSearchQuery(''); setCurrentPage(0); }}>
                Clear Search
              </Button>
            )}
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, newMode) => { if (newMode) setViewMode(newMode); }}
              size="small"
              sx={{ bgcolor: 'background.paper' }}
            >
              <ToggleButton value="list" aria-label="list view">
                <ViewListIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="grid" aria-label="grid view">
                <GridViewIcon fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
            {viewMode === 'grid' && (
              <FormControl size="small" sx={{ width: 110 }}>
                <Select
                  value={gridColumns}
                  onChange={(e) => setGridColumns(e.target.value as number)}
                  displayEmpty
                >
                  <MenuItem value={2}>2 Columns</MenuItem>
                  <MenuItem value={3}>3 Columns</MenuItem>
                  <MenuItem value={4}>4 Columns</MenuItem>
                  <MenuItem value={5}>5 Columns</MenuItem>
                  <MenuItem value={6}>6 Columns</MenuItem>
                </Select>
              </FormControl>
            )}
            <Button variant="outlined" startIcon={<ViewColumnIcon />} onClick={(e) => setColumnMenuAnchorEl(e.currentTarget)} disabled={viewMode === 'grid'}>
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
              component="label"
              variant="outlined"
              startIcon={isImporting ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
              disabled={isImporting}
            >
              Import
              <input type="file" hidden accept=".xlsx" onChange={handleImportExcel} />
            </Button>
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={(e) => setAnchorEl(e.currentTarget)}
            >
              Export
            </Button>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
              <Box sx={{ px: 2, py: 1 }}>
                <FormControlLabel
                  control={<Checkbox checked={exportAllData} onChange={(e) => setExportAllData(e.target.checked)} size="small" />}
                  label={<Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>Export all data & columns</Typography>}
                />
              </Box>
              <Divider />
              <MenuItem onClick={() => handleExport('excel')}>Export as Excel</MenuItem>
              <MenuItem onClick={() => handleExport('csv')}>Export as CSV</MenuItem>
              <MenuItem onClick={() => handleExport('pdf')}>Export as PDF</MenuItem>
            </Menu>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal('create')}>
              Add Product
            </Button>
          </Box>
        </Box>

        {/* Advanced Filters Accordion */}
        <Accordion elevation={0} sx={{ borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'divider', '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: 'background.default' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterListIcon fontSize="small" color="action" />
              <Typography variant="subtitle2" fontWeight="bold" color="text.secondary">Advanced Filters</Typography>
              {activeFilterCount > 0 && (
                <Chip size="small" label={`${activeFilterCount} Active`} color="primary" sx={{ height: 20, fontSize: '0.7rem' }} />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ bgcolor: 'background.default', p: { xs: 2, md: 3 } }} >
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <FormControl size="small" fullWidth>
            <Select
              multiple
              value={filterCategory}
              onChange={(e) => { 
                const val = e.target.value; 
                setFilterCategory(typeof val === 'string' ? val.split(',') : val as string[]); 
                setCurrentPage(0); 
              }}
              displayEmpty
              renderValue={(selected) => {
                if ((selected as string[]).length === 0) return "All Categories";
                return (selected as string[]).join(', ');
              }}
            >
              <MenuItem disabled value="" sx={{ display: 'none' }}>All Categories</MenuItem>
              {uniqueCategories.map(name => (
                <MenuItem key={name} value={name}>
                  <Checkbox checked={filterCategory.includes(name)} size="small" sx={{ p: 0.5, mr: 1 }} />
                  <ListItemText primary={name} />
                </MenuItem>
              ))}
            </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <FormControl size="small" fullWidth>
            <Select
              multiple
              value={filterDepartment}
              onChange={(e) => { 
                const val = e.target.value; 
                setFilterDepartment(typeof val === 'string' ? val.split(',') : val as string[]); 
                setCurrentPage(0); 
              }}
              displayEmpty
              renderValue={(selected) => {
                if ((selected as string[]).length === 0) return "All Depts";
                return (selected as string[]).join(', ');
              }}
            >
              <MenuItem disabled value="" sx={{ display: 'none' }}>All Depts</MenuItem>
              {uniqueDepartments.map(name => (
                <MenuItem key={name} value={name}>
                  <Checkbox checked={filterDepartment.includes(name)} size="small" sx={{ p: 0.5, mr: 1 }} />
                  <ListItemText primary={name} />
                </MenuItem>
              ))}
            </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <FormControl size="small" fullWidth>
            <Select
              multiple
              value={filterQuality}
              onChange={(e) => { 
                const val = e.target.value; 
                setFilterQuality(typeof val === 'string' ? val.split(',') : val as string[]); 
                setCurrentPage(0); 
              }}
              displayEmpty
              renderValue={(selected) => {
                if ((selected as string[]).length === 0) return "All Conditions";
                return (selected as string[]).join(', ');
              }}
            >
              <MenuItem disabled value="" sx={{ display: 'none' }}>All Conditions</MenuItem>
              {qualities.map(q => (
                <MenuItem key={q.id} value={q.name}>
                  <Checkbox checked={filterQuality.includes(q.name)} size="small" sx={{ p: 0.5, mr: 1 }} />
                  <ListItemText primary={q.name} />
                </MenuItem>
              ))}
            </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <FormControl size="small" fullWidth>
            <Select
              value={filterPurchaseType}
              onChange={(e) => { setFilterPurchaseType(e.target.value); setCurrentPage(0); }}
              displayEmpty
            >
              <MenuItem value="">All Acquisitions</MenuItem>
              <MenuItem value="Purchased">Purchased</MenuItem>
              <MenuItem value="Donated">Donated</MenuItem>
            </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <FormControl size="small" fullWidth>
        <Select
          value={filterGroup}
          onChange={(e) => { setFilterGroup(e.target.value as string); setCurrentPage(0); }}
          displayEmpty
        >
          <MenuItem value="">All Groups</MenuItem>
          <MenuItem value="Inventory">Inventory (Letters first)</MenuItem>
          <MenuItem value="Asset">Assets (Year first)</MenuItem>
          <MenuItem value="NoCode">No Code Assigned</MenuItem>
        </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <FormControl size="small" fullWidth>
            <DatePicker
              label="From Date"
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
              value={filterStartDate ? dayjs(filterStartDate) : null}
              onChange={(newDate: Dayjs | null) => { 
                setFilterStartDate(newDate && newDate.isValid() ? newDate.format('YYYY-MM-DD') : ''); 
                setCurrentPage(0); 
              }}
            />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <FormControl size="small" fullWidth>
            <DatePicker
              label="To Date"
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
              value={filterEndDate ? dayjs(filterEndDate) : null}
              onChange={(newDate: Dayjs | null) => { 
                setFilterEndDate(newDate && newDate.isValid() ? newDate.format('YYYY-MM-DD') : ''); 
                setCurrentPage(0); 
              }}
            />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <FormControl size="small" fullWidth>
            <Select
              value={filterPrice}
              onChange={(e) => { setFilterPrice(e.target.value as string); setCurrentPage(0); }}
              displayEmpty
            >
              <MenuItem value="">All Prices</MenuItem>
              <MenuItem value="under100">Under $100</MenuItem>
              <MenuItem value="equal100">Exactly $100</MenuItem>
              <MenuItem value="over100">Over $100</MenuItem>
            </Select>
                </FormControl>
              </Grid>
            </Grid>
              {activeFilterCount > 0 && (
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="text" color="error" onClick={handleClearFilters} startIcon={<CloseIcon />}>
                  Clear All Filters
            </Button>
              </Box>
          )}
          </AccordionDetails>
        </Accordion>

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
        {viewMode === 'list' && (
        <TableContainer sx={{ minHeight: 580, maxHeight: { xs: 'calc(100vh - 280px)', sm: 'calc(100vh - 220px)' } }}>
          <Table stickyHeader sx={{ minWidth: { xs: '100%', sm: 750 } }} aria-labelledby="tableTitle">
            <TableHead>
              <TableRow sx={{ '& .MuiTableCell-head': { fontWeight: 'bold', bgcolor: 'background.paper' } }}>
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
                {visibleColumns.includes('plateNumber') && (
                  <TableCell>
                    <TableSortLabel active={sortBy === 'plateNumber'} direction={isAscending ? 'asc' : 'desc'} onClick={() => handleSort('plateNumber')}>
                      Plate Number
                    </TableSortLabel>
                  </TableCell>
                )}
                {visibleColumns.includes('engineNumber') && (
                  <TableCell>
                    <TableSortLabel active={sortBy === 'engineNumber'} direction={isAscending ? 'asc' : 'desc'} onClick={() => handleSort('engineNumber')}>
                      Engine/Serial #
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
                {visibleColumns.includes('initialQuantity') && (
                  <TableCell align="right">
                    <TableSortLabel active={sortBy === 'initialQuantity'} direction={isAscending ? 'asc' : 'desc'} onClick={() => handleSort('initialQuantity')}>
                      Qty
                    </TableSortLabel>
                  </TableCell>
                )}
                {visibleColumns.includes('voucherNumber') && (
                  <TableCell>
                    <TableSortLabel active={sortBy === 'voucherNumber'} direction={isAscending ? 'asc' : 'desc'} onClick={() => handleSort('voucherNumber')}>
                      Voucher #
                    </TableSortLabel>
                  </TableCell>
                )}
                {visibleColumns.includes('donorName') && (
                  <TableCell>
                    <TableSortLabel active={sortBy === 'donorName'} direction={isAscending ? 'asc' : 'desc'} onClick={() => handleSort('donorName')}>
                      Donor
                    </TableSortLabel>
                  </TableCell>
                )}
                {visibleColumns.includes('supplier') && (
                  <TableCell>
                    <TableSortLabel active={sortBy === 'supplierName' as any} direction={isAscending ? 'asc' : 'desc'} onClick={() => handleSort('supplierName' as any)}>
                      Supplier
                    </TableSortLabel>
                  </TableCell>
                )}
                {visibleColumns.includes('purchaseType') && (
                  <TableCell>
                    <TableSortLabel active={sortBy === 'purchaseType'} direction={isAscending ? 'asc' : 'desc'} onClick={() => handleSort('purchaseType')}>
                      Acquisition Type
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
                {visibleColumns.includes('description') && (
                  <TableCell>
                    <TableSortLabel active={sortBy === 'description'} direction={isAscending ? 'asc' : 'desc'} onClick={() => handleSort('description')}>
                      Description
                    </TableSortLabel>
                  </TableCell>
                )}
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
        <TableBody sx={{ opacity: loading ? 0.4 : 1, transition: 'opacity 0.2s ease-in-out' }}>
          {loading && products.length === 0 ? (
            Array.from(new Array(pageSize)).map((_, index) => (
              <TableRow key={`skel-row-${index}`}>
                <TableCell padding="checkbox">
                  <Skeleton variant="rectangular" width={18} height={18} sx={{ borderRadius: 1 }} />
                </TableCell>
                {ALL_COLUMNS.map(col => {
                  if (!visibleColumns.includes(col.id)) return null;
                  return (
                    <TableCell key={`skel-cell-${col.id}-${index}`}>
                      {col.id === 'name' ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}><Skeleton variant="circular" width={40} height={40} /><Skeleton variant="text" width="70%" /></Box>
                      ) : <Skeleton variant="text" />}
                    </TableCell>
                  );
                })}
                <TableCell align="center">
                  <Skeleton variant="circular" width={32} height={32} />
                </TableCell>
              </TableRow>
            ))
          ) : error ? (
                <TableRow><TableCell colSpan={visibleColumns.length + 2} align="center" sx={{ py: 4 }}><Alert severity="error">{error}</Alert></TableCell></TableRow>
              ) : products.length === 0 ? (
                <TableRow><TableCell colSpan={visibleColumns.length + 2} align="center" sx={{ py: 4 }}>No products match your filters.</TableCell></TableRow>
              ) : (
                products.map((product) => {
                  const isItemSelected = isSelected(product.id!);
                  const qualityName = product.quality || qualities.find(q => q.id === product.qualityId)?.name;
                  
                  let rowBgColor = 'inherit';
                  if (qualityName) {
                    const q = qualityName.toLowerCase();
                    if (q.includes('poor') || q.includes('broken') || q.includes('bad')) rowBgColor = 'rgba(244, 67, 54, 0.08)'; // Light Red
                    else if (q.includes('fair') || q.includes('okay')) rowBgColor = 'rgba(255, 152, 0, 0.08)'; // Light Orange
                    else if (q.includes('excellent') || q.includes('new') || q.includes('great')) rowBgColor = 'rgba(76, 175, 80, 0.08)'; // Light Green
                  }

                  return (
                    <TableRow hover onClick={(event) => handleClick(event, product.id!)} role="checkbox" tabIndex={-1} key={product.id} selected={isItemSelected} sx={{ bgcolor: rowBgColor }}>
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
                      {visibleColumns.includes('codeNumber') && (
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {product.codeNumber || '-'}
                            {product.codeNumber && (
                              <Chip 
                                label={/^(19|20)\d{2}/.test(product.codeNumber) ? 'AST' : 'INV'} 
                                size="small" 
                                color={/^(19|20)\d{2}/.test(product.codeNumber) ? 'secondary' : 'primary'} 
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            )}
                          </Box>
                        </TableCell>
                      )}
                      {visibleColumns.includes('year') && <TableCell>{product.year ? product.year.substring(0, 4) : '-'}</TableCell>}
                      {visibleColumns.includes('plateNumber') && <TableCell>{product.plateNumber || '-'}</TableCell>}
                      {visibleColumns.includes('engineNumber') && <TableCell>{product.engineNumber || '-'}</TableCell>}
                      {visibleColumns.includes('categoryName') && <TableCell>{product.categoryName || categories.find(c => c.id === product.categoryId)?.name || '-'}</TableCell>}
                      {visibleColumns.includes('brandName') && <TableCell>{product.brandName || brands.find(b => b.id === product.brandId)?.name || '-'}</TableCell>}
                      {visibleColumns.includes('quality') && <TableCell>{qualityName || '-'}</TableCell>}
                      {visibleColumns.includes('departmentName') && <TableCell>{product.departmentName || departments.find(d => d.id === product.departmentId)?.name || '-'}</TableCell>}
                      {visibleColumns.includes('responsiblePerson') && <TableCell>{product.responsiblePerson || persons.find(p => p.id === product.responsiblePersonId)?.fullName || '-'}</TableCell>}
                      {visibleColumns.includes('initialQuantity') && <TableCell align="right">{product.initialQuantity || '-'}</TableCell>}
                      {visibleColumns.includes('voucherNumber') && <TableCell>{product.voucherNumber || '-'}</TableCell>}
                      {visibleColumns.includes('donorName') && <TableCell>{product.donorName || '-'}</TableCell>}
                      {visibleColumns.includes('supplier') && (
                        <TableCell>
                          <Typography variant="body2">{product.supplierName || '-'}</Typography>
                          {product.supplierContact && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {typeof product.supplierContact === 'string' ? product.supplierContact : Object.entries(product.supplierContact || {}).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                            </Typography>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.includes('purchaseType') && <TableCell>{product.purchaseType || '-'}</TableCell>}
                      {visibleColumns.includes('price') && <TableCell align="right">${product.price?.toFixed(2) || '0.00'}</TableCell>}
                      {visibleColumns.includes('description') && <TableCell sx={{ whiteSpace: 'normal', minWidth: 150 }}>{product.description || '-'}</TableCell>}
                      <TableCell align="center">
                  <IconButton size="small" onClick={(e) => handleOpenActionMenu(e, product)}>
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                      </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
              
              {!loading && !error && products.length > 0 && visibleColumns.includes('price') && (
                <TableFooter>
                  <TableRow sx={{ '& .MuiTableCell-root': { fontWeight: 'bold', border: 0, fontSize: '0.9rem', bgcolor: 'background.paper' } }}>
                    <TableCell colSpan={visibleColumns.length} align="right" sx={{ pr: 4 }}>
                      Current Page Value
                    </TableCell>
                    <TableCell align="right">
                      ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </TableContainer>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && (
          <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'background.default', minHeight: 580, maxHeight: 'calc(100vh - 220px)', overflowY: 'auto', overflowX: 'hidden' }}>
            {loading && products.length === 0 ? (
              <Grid container spacing={{ xs: 1.5, sm: 3 }} columns={60}>
                {Array.from(new Array(pageSize)).map((_, index) => (
                  <Grid key={`skel-grid-${index}`} size={{ xs: 60, sm: 60 / Math.min(2, gridColumns), md: 60 / Math.min(3, gridColumns), lg: 60 / gridColumns }}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <Skeleton variant="rectangular" sx={{ p: { xs: 1, sm: 2 }, aspectRatio: '1 / 1', maxWidth: 140, mx: 'auto', mt: 2 }} />
                      <CardContent sx={{ flexGrow: 1, p: { xs: 1.5, sm: 2 } }}>
                        <Skeleton variant="text" sx={{ fontSize: '1rem' }} />
                        <Skeleton variant="text" width="60%" />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5 }}>
                          <Skeleton variant="text" width="40%" />
                          <Skeleton variant="text" width="30%" />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : products.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>No products match your filters.</Box>
            ) : (
              <Box sx={{ opacity: loading ? 0.4 : 1, transition: 'opacity 0.2s ease-in-out' }}>
              <Grid container spacing={{ xs: 1.5, sm: 3 }} columns={60}>
                {products.map((product) => {
                  const isItemSelected = isSelected(product.id!);
                  const qualityName = product.quality || qualities.find(q => q.id === product.qualityId)?.name;
                  let badgeColor: 'default' | 'success' | 'warning' | 'error' = 'default';
                  if (qualityName) {
                    const q = qualityName.toLowerCase();
                    if (q.includes('poor') || q.includes('broken') || q.includes('bad')) badgeColor = 'error';
                    else if (q.includes('fair') || q.includes('okay')) badgeColor = 'warning';
                    else if (q.includes('excellent') || q.includes('new') || q.includes('great')) badgeColor = 'success';
                  }
                  return (
                <Grid key={product.id} size={{ xs: 60, sm: 60 / Math.min(2, gridColumns), md: 60 / Math.min(3, gridColumns), lg: 60 / gridColumns }}>
                      <Card 
                        sx={{ 
                          height: '100%', display: 'flex', flexDirection: 'column', position: 'relative',
                          boxShadow: isItemSelected ? 4 : 1,
                          border: isItemSelected ? 2 : 1,
                          borderColor: isItemSelected ? 'primary.main' : 'divider',
                          cursor: 'pointer', transition: 'all 0.2s',
                          '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' }
                        }}
                        onClick={(event) => handleClick(event, product.id!)}
                      >
                  <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Checkbox checked={isItemSelected} onChange={(e) => { e.stopPropagation(); handleClick(e, product.id!); }} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'rgba(255,255,255,1)' } }} />
                    <IconButton size="small" onClick={(e) => handleOpenActionMenu(e, product)} sx={{ bgcolor: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'rgba(255,255,255,1)' } }}>
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                        </Box>
                        <Box sx={{ p: { xs: 1, sm: 2 }, display: 'flex', justifyContent: 'center', bgcolor: 'background.default', borderBottom: 1, borderColor: 'divider' }}>
                          <Avatar src={product.imageUrl || undefined} variant="rounded" sx={{ width: '100%', height: 'auto', aspectRatio: '1 / 1', maxWidth: 140, bgcolor: 'action.hover' }}>
                            <ImageIcon sx={{ fontSize: { xs: 32, sm: 48 }, color: 'text.disabled' }} />
                          </Avatar>
                        </Box>
                        <CardContent sx={{ flexGrow: 1, p: { xs: 1.5, sm: 2 }, pb: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', fontSize: { xs: '0.85rem', sm: '1rem' } }} noWrap title={product.name}>{product.name}</Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                              {product.codeNumber || 'No Code'}
                            </span>
                            {product.codeNumber && (
                              <Chip 
                                label={/^(19|20)\d{2}/.test(product.codeNumber) ? 'AST' : 'INV'} 
                                size="small" 
                                color={/^(19|20)\d{2}/.test(product.codeNumber) ? 'secondary' : 'primary'} 
                                sx={{ height: 18, fontSize: '0.65rem' }}
                              />
                            )}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                            <Typography variant="subtitle1" color="primary.main" fontWeight="bold">${product.price?.toFixed(2) || '0.00'}</Typography>
                            {qualityName && <Chip label={qualityName} size="small" color={badgeColor} variant="outlined" />}
                          </Box>
                          <Typography variant="body2" sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CategoryIcon fontSize="small" color="action" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {product.categoryName || categories.find(c => c.id === product.categoryId)?.name || '-'}
                            </span>
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
              </Box>
            )}
          </Box>
        )}

        {/* Pagination */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', borderTop: '1px solid', borderColor: 'divider' }}>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50, 100]}
            component="div"
            count={totalItems}
            rowsPerPage={pageSize}
            page={currentPage}
            onPageChange={(e, newPage) => setCurrentPage(newPage)}
            onRowsPerPageChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setCurrentPage(0); }}
            sx={{ borderBottom: 'none' }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 2, pb: { xs: 2, sm: 0 } }}>
            <Typography variant="body2" color="text.secondary">Go to page:</Typography>
            <TextField
              size="small"
              type="number"
              inputProps={{ min: 1, max: Math.max(1, Math.ceil(totalItems / pageSize)) }}
              defaultValue={currentPage + 1}
              key={currentPage} // Resets value when external buttons change the page
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = parseInt((e.target as HTMLInputElement).value, 10);
                  const maxPage = Math.max(1, Math.ceil(totalItems / pageSize));
                  if (!isNaN(val) && val >= 1 && val <= maxPage) setCurrentPage(val - 1);
                }
              }}
              onBlur={(e) => {
                const val = parseInt((e.target as HTMLInputElement).value, 10);
                const maxPage = Math.max(1, Math.ceil(totalItems / pageSize));
                if (!isNaN(val) && val >= 1 && val <= maxPage) setCurrentPage(val - 1);
                else (e.target as HTMLInputElement).value = (currentPage + 1).toString();
              }}
              sx={{ width: 70, '& .MuiInputBase-input': { p: '6px', textAlign: 'center' } }}
            />
          </Box>
        </Box>
      </Paper>

      {/* Shared Action Menu for both Table and Grid views */}
      <Menu
        anchorEl={actionMenuAnchorEl}
        open={Boolean(actionMenuAnchorEl)}
        onClose={handleCloseActionMenu}
        onClick={handleCloseActionMenu}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={(e) => { e.stopPropagation(); handleCloseActionMenu(); if (activeActionProduct) handleOpenModal('view', activeActionProduct); }}>
          <ListItemIcon><VisibilityIcon fontSize="small" color="info" /></ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={(e) => { e.stopPropagation(); handleCloseActionMenu(); if (activeActionProduct) openTransferModal(activeActionProduct); }}>
          <ListItemIcon><SwapHorizIcon fontSize="small" color="secondary" /></ListItemIcon>
          <ListItemText>Transfer Dept</ListItemText>
        </MenuItem>
        <MenuItem onClick={(e) => { e.stopPropagation(); handleCloseActionMenu(); if (activeActionProduct) openWriteOffModal(activeActionProduct); }}>
          <ListItemIcon><ReportProblemIcon fontSize="small" color="warning" /></ListItemIcon>
          <ListItemText>Write-Off (Broken/Lost)</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={(e) => { e.stopPropagation(); handleCloseActionMenu(); if (activeActionProduct) handleOpenModal('edit', activeActionProduct); }}>
          <ListItemIcon><EditIcon fontSize="small" color="primary" /></ListItemIcon>
          <ListItemText>Edit Product</ListItemText>
        </MenuItem>
        <MenuItem onClick={(e) => { e.stopPropagation(); handleCloseActionMenu(); if (activeActionProduct) setProductToDelete(activeActionProduct); }}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>Delete Product</ListItemText>
        </MenuItem>
      </Menu>

      {/* Create/Edit Modal */}
      <Dialog open={modalMode === 'create' || modalMode === 'edit'} onClose={handleCloseModal} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle>{modalMode === 'create' ? 'Create New Product' : 'Edit Product'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3} sx={{ pt: 1 }}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField label="Product Name" value={selectedProduct?.name || ''} onChange={(e) => setSelectedProduct(p => p ? { ...p, name: e.target.value } : null)} required fullWidth />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField label="Code Number" value={selectedProduct?.codeNumber || ''} onChange={(e) => setSelectedProduct(p => p ? { ...p, codeNumber: e.target.value } : null)} fullWidth />
              <Tooltip title="Generate Asset Code (e.g. 2025-LAP...)">
                <Button variant="outlined" onClick={handleGenerateAssetCode} sx={{ minWidth: 'auto', px: 1, whiteSpace: 'nowrap' }}>
                  <AutorenewIcon fontSize="small" sx={{ mr: 0.5 }} /> Asset
                </Button>
              </Tooltip>
              <Tooltip title="Generate Inventory Code (e.g. FN2025-...)">
                <Button variant="outlined" onClick={handleGenerateInventoryCode} sx={{ minWidth: 'auto', px: 1, whiteSpace: 'nowrap' }}>
                  <AutorenewIcon fontSize="small" sx={{ mr: 0.5 }} /> Inv
                    </Button>
                  </Tooltip>
                </Box>
                <TextField label="Product Specs" value={selectedProduct?.attributes || ''} onChange={(e) => setSelectedProduct(p => p ? { ...p, attributes: e.target.value } : null)} multiline rows={3} placeholder="E.g. Dimensions: 10x10, Weight: 1kg" fullWidth />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Box sx={{ position: 'relative', width: '100%', maxWidth: 160, mx: 'auto', aspectRatio: '1 / 1' }}>
                  <Avatar src={imagePreview || undefined} variant="rounded" sx={{ width: '100%', height: '100%', bgcolor: 'action.hover' }}>
                    <ImageIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
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
            <Grid size={{ xs: 12, sm: 6 }}>
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
                  const isExisting = options.some((option) => inputValue.toLowerCase().replace(/\s+/g, ' ').trim() === (option.name || '').toLowerCase().replace(/\s+/g, ' ').trim());
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
                onInputChange={(event, newInputValue, reason) => {
                  // Only update the name when the user is actively typing.
                  // This prevents onInputChange from overwriting the state set by onChange when an item is selected.
                  if (reason === 'input') {
                    setSelectedProduct(p => p ? { ...p, categoryId: null, categoryName: newInputValue } : null);
                  }
                }}
                renderOption={(props, option) => {
                  const { key, ...restProps } = props as any;
                  const isString = typeof option === 'string';
                  const label = isString ? option : ((option as any).inputValue || (option as any).name);
                  const desc = !isString ? (option as any).description : null;
                  return (
                    <li key={key} {...restProps}>
                      <Box>
                        <Typography variant="body2">{label}</Typography>
                        {desc && <Typography variant="caption" color="text.secondary" display="block">{desc}</Typography>}
                      </Box>
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Category" placeholder="Select or type to create" />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
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
                  const isExisting = options.some((option) => inputValue.toLowerCase().replace(/\s+/g, ' ').trim() === (option.name || '').toLowerCase().replace(/\s+/g, ' ').trim());
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
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    label="Plate Number"
                    value={selectedProduct?.plateNumber || ''}
                    onChange={(e) => setSelectedProduct(p => p ? { ...p, plateNumber: e.target.value } : null)}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    label="Engine / Serial Number"
                    value={selectedProduct?.engineNumber || ''}
                    onChange={(e) => setSelectedProduct(p => p ? { ...p, engineNumber: e.target.value } : null)}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <DatePicker
                    label="Year *"
                    value={selectedProduct?.year ? dayjs(selectedProduct.year) : null}
                    onChange={(newDate: Dayjs | null) => {
                      setSelectedProduct(p => p ? { ...p, year: newDate && newDate.isValid() ? `${newDate.format('YYYY-MM-DD')}T00:00:00.000Z` : null } : null);
                    }}
                    maxDate={dayjs()}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        error: Boolean(!selectedProduct?.year || (selectedProduct?.year && dayjs(selectedProduct.year).isAfter(dayjs(), 'year'))),
                        helperText: !selectedProduct?.year ? "Year is required for vehicles." : (selectedProduct?.year && dayjs(selectedProduct.year).isAfter(dayjs(), 'year') ? "Year cannot be in the future." : "")
                      }
                    }}
                  />
                </Grid>
              </>
            )}
            <Grid size={{ xs: 12, sm: 6 }}>
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
                  const isExisting = options.some((option) => inputValue.toLowerCase().replace(/\s+/g, ' ').trim() === (option.name || '').toLowerCase().replace(/\s+/g, ' ').trim());
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
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Price" type="number" value={selectedProduct?.price ?? ''} onChange={(e) => setSelectedProduct(p => p ? { ...p, price: e.target.value ? parseFloat(e.target.value) : null } : null)} required fullWidth />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                freeSolo
                options={qualities}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') return option;
                  if ((option as any).inputValue) return (option as any).inputValue;
                  return (option as any).name;
                }}
                filterOptions={(options, params) => {
                  const filtered = filter(options, params);
                  const { inputValue } = params;
                  const isExisting = options.some((option) => inputValue.toLowerCase().replace(/\s+/g, ' ').trim() === (option.name || '').toLowerCase().replace(/\s+/g, ' ').trim());
                  if (inputValue !== '' && !isExisting) {
                    filtered.push({ inputValue, name: `Add "${inputValue}"` } as any);
                  }
                  return filtered;
                }}
                value={qualities.find(q => q.name === selectedProduct?.quality) || selectedProduct?.quality || null}
                onChange={(event, newValue) => {
                  if (typeof newValue === 'string') {
                    setSelectedProduct(p => p ? { ...p, qualityId: null, quality: newValue } : null);
                  } else if (newValue && (newValue as any).inputValue) {
                    setSelectedProduct(p => p ? { ...p, qualityId: null, quality: (newValue as any).inputValue } : null);
                  } else if (newValue) {
                    setSelectedProduct(p => p ? { ...p, qualityId: (newValue as any).id, quality: (newValue as any).name } : null);
                  } else {
                    setSelectedProduct(p => p ? { ...p, qualityId: null, quality: null } : null);
                  }
                }}
                onInputChange={(event, newInputValue, reason) => {
                  if (reason === 'input') {
                    setSelectedProduct(p => p ? { ...p, qualityId: null, quality: newInputValue } : null);
                  }
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Quality" placeholder="Select or type to create" />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField label="Description" value={selectedProduct?.description || ''} onChange={(e) => setSelectedProduct(p => p ? { ...p, description: e.target.value } : null)} multiline rows={4} fullWidth />
            </Grid>

            {/* Stock Acquisition / Purchase Information */}
            {(modalMode === 'create' || modalMode === 'edit') && (
              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 2, color: 'text.secondary' }}>{modalMode === 'edit' ? 'Purchase Information' : 'Initial Stock / Acquisition'}</Divider>
                <Box sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        select
                        label="Acquisition Type"
                        value={selectedProduct?.purchaseType || 'None'}
                        onChange={(e) => setSelectedProduct(p => p ? { ...p, purchaseType: e.target.value } : null)}
                        disabled={disablePurchaseFields}
                        fullWidth
                      >
                        <MenuItem value="None">None (Just setup product catalog)</MenuItem>
                        <MenuItem value="Purchased">Purchased</MenuItem>
                        <MenuItem value="Donated">Donated</MenuItem>
                      </TextField>
                    </Grid>
                    {selectedProduct?.purchaseType && selectedProduct.purchaseType !== 'None' && (
                      <>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <TextField label="Initial Quantity *" type="number" value={selectedProduct?.initialQuantity ?? ''} onChange={(e) => setSelectedProduct(p => p ? { ...p, initialQuantity: e.target.value ? Number(e.target.value) : null } : null)} inputProps={{ min: 1 }} required fullWidth disabled={disablePurchaseFields} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <DatePicker
                            label="Invoice Date"
                            value={selectedProduct?.invoiceDate ? dayjs(selectedProduct.invoiceDate) : null}
                            onChange={(newDate: Dayjs | null) => {
                              setSelectedProduct(p => p ? { ...p, invoiceDate: newDate && newDate.isValid() ? `${newDate.format('YYYY-MM-DD')}T00:00:00.000Z` : null } : null);
                            }}
                            disabled={disablePurchaseFields}
                            slotProps={{ textField: { fullWidth: true } }}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <TextField label="Voucher Number" value={selectedProduct?.voucherNumber || ''} onChange={(e) => setSelectedProduct(p => p ? { ...p, voucherNumber: e.target.value } : null)} fullWidth placeholder="e.g. INV-12345" />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
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
                              const isExisting = options.some((option) => inputValue.toLowerCase().replace(/\s+/g, ' ').trim() === (option.name || '').toLowerCase().replace(/\s+/g, ' ').trim());
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
                              <TextField {...params} label="Supplier Name" placeholder="e.g. ABC Tech" disabled={disablePurchaseFields} />
                            )}
                            disabled={disablePurchaseFields}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <TextField label="Donor Name" value={selectedProduct?.donorName || ''} onChange={(e) => setSelectedProduct(p => p ? { ...p, donorName: e.target.value } : null)} fullWidth placeholder="e.g. John Doe" disabled={disablePurchaseFields} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <Autocomplete
                            freeSolo
                            options={persons}
                            getOptionLabel={(option) => {
                              if (typeof option === 'string') return option;
                              if ((option as any).inputValue) return (option as any).inputValue;
                              return (option as any).fullName;
                            }}
                            filterOptions={(options, params) => {
                              const filtered = filter(options, params);
                              const { inputValue } = params;
                              const isExisting = options.some((option) => inputValue.toLowerCase().replace(/\s+/g, ' ').trim() === (option.fullName || '').toLowerCase().replace(/\s+/g, ' ').trim());
                              if (inputValue !== '' && !isExisting) {
                                filtered.push({ inputValue, fullName: `Add "${inputValue}"` } as any);
                              }
                              return filtered;
                            }}
                            value={persons.find(p => p.fullName === selectedProduct?.responsiblePerson) || selectedProduct?.responsiblePerson || null}
                            onChange={(event, newValue) => {
                              if (typeof newValue === 'string') {
                                setSelectedProduct(p => p ? { ...p, responsiblePersonId: null, responsiblePerson: newValue } : null);
                              } else if (newValue && (newValue as any).inputValue) {
                                setSelectedProduct(p => p ? { ...p, responsiblePersonId: null, responsiblePerson: (newValue as any).inputValue } : null);
                              } else if (newValue) {
                                setSelectedProduct(p => p ? { ...p, responsiblePersonId: (newValue as any).id, responsiblePerson: (newValue as any).fullName } : null);
                              } else {
                                setSelectedProduct(p => p ? { ...p, responsiblePersonId: null, responsiblePerson: null } : null);
                              }
                            }}
                            onInputChange={(event, newInputValue, reason) => {
                              if (reason === 'input') {
                                setSelectedProduct(p => p ? { ...p, responsiblePersonId: null, responsiblePerson: newInputValue } : null);
                              }
                            }}
                renderOption={(props, option) => {
                  const { key, ...restProps } = props as any;
                  const isString = typeof option === 'string';
                          const label = isString ? option : ((option as any).inputValue || (option as any).fullName);
                          const email = !isString ? (option as any).email : null;
                          const dept = !isString ? (option as any).department : null;
                  return (
                    <li key={key} {...restProps}>
                      <Box>
                        <Typography variant="body2">{label}</Typography>
                        {(email || dept) && <Typography variant="caption" color="text.secondary" display="block">{[dept, email].filter(Boolean).join(' • ')}</Typography>}
                      </Box>
                    </li>
                  );
                }}
                            renderInput={(params) => <TextField {...params} label="Responsible Person" placeholder="Select or type to assign" />}
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" fontWeight="bold" color="text.secondary">Contact Info</Typography>
                              <Button size="small" variant="outlined" onClick={addContact} disabled={disablePurchaseFields}>+ Add Contact</Button>
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
                                    disabled={disablePurchaseFields}
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
            )}

            {/* Purchase History Table for Edit Modal */}
            {modalMode === 'edit' && purchaseHistory.length > 0 && (
              <Grid size={{ xs: 12 }}>
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
                      ) : (
                        purchaseHistory.map((item) => (
                          <TableRow
                            key={item.purchaseId}
                            hover
                            onClick={() => handleViewPurchase(item.purchaseId)}
                            sx={{ cursor: 'pointer' }}
                          >
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
                      <TableRow><TableCell colSpan={6} align="right" sx={{ fontWeight: 'bold' }}>Total Purchased: {purchaseHistory.reduce((sum, item) => sum + item.quantity, 0)} units</TableCell></TableRow>
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
      <Dialog open={modalMode === 'view'} onClose={handleCloseModal} maxWidth="sm" fullWidth fullScreen={isMobile}>
        {selectedProduct && (
          <>
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" component="div">{selectedProduct.name}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FormControlLabel 
                  control={<Switch size="small" checked={showImageInView} onChange={(e) => setShowImageInView(e.target.checked)} />} 
                  label={<Typography variant="body2">Include Image</Typography>} 
                  sx={{ m: 0 }}
                />
                <IconButton aria-label="close" onClick={handleCloseModal}><CloseIcon /></IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers ref={viewModalContentRef}>
              <Grid container spacing={2}>
                {showImageInView && (
                <Grid size={{ xs: 12, sm: 5 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ position: 'relative', width: '100%', maxWidth: 220, mx: 'auto', aspectRatio: '1 / 1' }}>
                      <Avatar src={selectedProduct.imageUrl || undefined} variant="rounded" sx={{ width: '100%', height: '100%', bgcolor: 'action.hover' }}>
                        <BrokenImageIcon sx={{ fontSize: 60, color: 'text.disabled' }} />
                      </Avatar>
                      {isSaving && (
                        <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', bgcolor: 'rgba(255, 255, 255, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, borderRadius: 1 }}>
                          <CircularProgress />
                        </Box>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button component="label" variant="outlined" size="small" startIcon={<CloudUploadIcon />} disabled={isSaving}>
                        Upload
                        <input type="file" hidden accept="image/*" onChange={handleImageChange} disabled={isSaving} />
                      </Button>
                      {selectedProduct.imageUrl && (
                        <Button size="small" color="error" onClick={handleInstantRemoveImage} disabled={isSaving}>Remove</Button>
                      )}
                    </Box>
                  </Box>
                </Grid>
                )}
                <Grid container spacing={2} alignContent="flex-start" size={{ xs: 12, sm: showImageInView ? 7 : 12 }}>
                  {renderViewField('Item Name', selectedProduct.name)}
                  {renderViewField('Code Number', selectedProduct.codeNumber)}
                  {renderViewField('Brand', selectedProduct.brandName || brands.find(b => b.id === selectedProduct.brandId)?.name)}
                  {renderViewField('Department', selectedProduct.departmentName || departments.find(d => d.id === selectedProduct.departmentId)?.name)}
                  {renderViewField('Quality / Condition', selectedProduct.quality || qualities.find(q => q.id === selectedProduct.qualityId)?.name)}
                  {renderViewField('Price', selectedProduct.price != null ? `$${selectedProduct.price.toFixed(2)}` : '-')}
                  {renderViewField('Voucher Number', selectedProduct.voucherNumber)}
                  {renderViewField('Purchase Date', selectedProduct.invoiceDate ? new Date(selectedProduct.invoiceDate).toLocaleDateString() : (selectedProduct.createdDate ? new Date(selectedProduct.createdDate).toLocaleDateString() : '-'))}
                  {renderViewField('Responsible Person', selectedProduct.responsiblePerson || persons.find(per => per.id === selectedProduct.responsiblePersonId)?.fullName)}
                  {renderViewField('Supplier', selectedProduct.supplierName)}
                  {renderViewField('Donor', selectedProduct.donorName)}
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
              <Button
                startIcon={<PrintIcon />}
                onClick={handlePrintDetails}
              >
                Print Details
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
          <Alert severity="warning" sx={{ mt: 2 }}>The product will be marked as inactive and hidden from view. This can be undone by an administrator.</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setProductToDelete(null); setProductsToDelete([]); }}>Cancel</Button>
          <Button onClick={() => handleDelete(productsToDelete.length > 0 ? productsToDelete : (productToDelete?.id ? [productToDelete.id] : []))} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Crop Modal */}
      <Dialog open={cropModalOpen} onClose={() => setCropModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Crop Image</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', justifyContent: 'center', bgcolor: 'background.default' }}>
          {cropImgSrc && (
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
            >
              <img ref={imgRef} src={cropImgSrc} alt="Crop preview" style={{ maxHeight: '50vh', maxWidth: '100%', display: 'block' }} />
            </ReactCrop>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setCropModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveCrop} variant="contained" color="primary">Apply Crop</Button>
        </DialogActions>
      </Dialog>

      {/* Transfer Modal */}
      <Dialog open={transferModalOpen} onClose={() => setTransferModalOpen(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle>Transfer to New Department</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 3 }}>
            Move <strong>{productToTransfer?.name}</strong> to a different department.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <FormControl fullWidth>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>Current Department</Typography>
              <Typography variant="body1" fontWeight="bold">
                {productToTransfer?.departmentName || departments.find(d => d.id === productToTransfer?.departmentId)?.name || '-'}
              </Typography>
            </FormControl>
            <FormControl fullWidth>
              <Select
                displayEmpty
                value={transferDeptId}
                onChange={(e) => setTransferDeptId(e.target.value as string)}
              >
                <MenuItem value="" disabled>Select Destination Department</MenuItem>
                {departments.filter(d => d.id !== productToTransfer?.departmentId).map(d => (
                  <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField label="Transfer Notes / Reason" multiline rows={3} value={transferNotes} onChange={(e) => setTransferNotes(e.target.value)} fullWidth placeholder="e.g. Relocated for new academic year" />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setTransferModalOpen(false)} disabled={isTransferring}>Cancel</Button>
          <Button onClick={handleTransfer} variant="contained" color="primary" disabled={!transferDeptId || isTransferring}>
            {isTransferring ? <CircularProgress size={24} /> : 'Confirm Transfer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Write-Off Modal */}
      <Dialog open={writeOffModalOpen} onClose={() => setWriteOffModalOpen(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ color: 'warning.main' }}>Report Broken / Lost Asset</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 3 }}>
            Submit a write-off request for <strong>{productToWriteOff?.name}</strong> to remove it from your active inventory.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <FormControl fullWidth>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>Reason for Write-Off</Typography>
              <Select size="small" value={writeOffReason} onChange={(e) => setWriteOffReason(e.target.value as number)}>
                <MenuItem value={1}>Damaged / Broken</MenuItem>
                <MenuItem value={2}>Stolen</MenuItem>
                <MenuItem value={3}>Expired</MenuItem>
                <MenuItem value={4}>Obsolete</MenuItem>
                <MenuItem value={5}>Lost</MenuItem>
                <MenuItem value={6}>Beyond Repair</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Quantity" type="number" value={writeOffQuantity} onChange={(e) => setWriteOffQuantity(Number(e.target.value))} inputProps={{ min: 1 }} fullWidth size="small" />
            <TextField label="Description / Notes" multiline rows={3} value={writeOffNotes} onChange={(e) => setWriteOffNotes(e.target.value)} fullWidth placeholder="Provide details about the damage or loss..." />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setWriteOffModalOpen(false)} disabled={isWritingOff}>Cancel</Button>
          <Button onClick={handleWriteOff} variant="contained" color="warning" disabled={!writeOffQuantity || isWritingOff}>
            {isWritingOff ? <CircularProgress size={24} color="inherit" /> : 'Submit Write-Off'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Errors Modal */}
      <Dialog open={importErrors.length > 0} onClose={() => setImportErrors([])} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: 'error.main' }}>Import Completed with Errors</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Some rows failed validation. Please review the specific errors below:
          </Typography>
          <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableBody>
                {importErrors.map((err, idx) => (
                  <TableRow key={idx}>
                    <TableCell sx={{ color: 'error.main', py: 1 }}>{err}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setImportErrors([])} variant="contained" color="primary">Dismiss</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
};