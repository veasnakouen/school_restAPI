import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Select, MenuItem, FormControl, InputLabel, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress, TablePagination, LinearProgress } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { useToast } from '../../context/ToastContext';
import * as api from '../../services/api';

type LookupType = 'Categories' | 'Brands' | 'Departments' | 'Qualities' | 'Suppliers' | 'Persons';

export const LookupManagement: React.FC = () => {
  const [activeType, setActiveType] = useState<LookupType>('Categories');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [itemData, setItemData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  const { showToast } = useToast();

  const loadData = async (type: LookupType) => {
    setLoading(true);
    try {
      let result: any[] = [];
      switch (type) {
        case 'Categories': result = await api.getCategories(); break;
        case 'Brands': result = await api.getBrands(); break;
        case 'Departments': result = await api.getDepartments(); break;
        case 'Qualities': result = await api.getQualities(); break;
        case 'Suppliers': result = await api.getSuppliers(); break;
        case 'Persons': result = await api.getPersons(); break;
      }
      setData(result);
    } catch (error: any) {
      showToast(`Failed to load ${type}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(0);
    setSearchQuery('');
    loadData(activeType);
  }, [activeType]);

  const handleSave = async () => {
    const primaryName = activeType === 'Persons' ? itemData.fullName : itemData.name;
    if (!primaryName || !primaryName.trim()) return;
    
    setIsSaving(true);
    try {
      if (editingItem) {
        // UPDATE Logic
        switch (activeType) {
          case 'Categories': await api.updateCategory(editingItem.id, { name: itemData.name, description: itemData.description }); break;
          case 'Brands': await api.updateBrand(editingItem.id, { name: itemData.name }); break;
          case 'Departments': await api.updateDepartment(editingItem.id, { name: itemData.name, location: itemData.location }); break;
          case 'Qualities': await api.updateQuality(editingItem.id, { name: itemData.name }); break;
          case 'Suppliers': await api.updateSupplier(editingItem.id, { name: itemData.name, address: itemData.address, contactInfo: itemData.contactInfo ? itemData.contactInfo.split(',').map((s: string) => s.trim()).filter(Boolean) : [] }); break;
          case 'Persons': await api.updatePerson(editingItem.id, { fullName: itemData.fullName, email: itemData.email, department: itemData.department }); break;
        }
        showToast(`${activeType.slice(0, -1)} updated successfully`, 'success');
      } else {
        // CREATE Logic
        switch (activeType) {
          case 'Categories': await api.createCategory({ name: itemData.name, description: itemData.description }); break;
          case 'Brands': await api.createBrand({ name: itemData.name }); break;
          case 'Departments': await api.createDepartment({ name: itemData.name, location: itemData.location }); break;
          case 'Qualities': await api.createQuality({ name: itemData.name }); break;
          case 'Suppliers': await api.createSupplier({ name: itemData.name, address: itemData.address, contactInfo: itemData.contactInfo ? itemData.contactInfo.split(',').map((s: string) => s.trim()).filter(Boolean) : [] }); break;
          case 'Persons': await api.createPerson({ fullName: itemData.fullName, email: itemData.email, department: itemData.department }); break;
        }
        showToast(`${activeType.slice(0, -1)} created successfully`, 'success');
      }
      
      setModalOpen(false);
      loadData(activeType);
    } catch (error: any) {
      const errorMsg = error.response?.data?.title || error.response?.data?.message || 'Failed to save item';
      showToast(errorMsg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const singularName = activeType.slice(0, -1).toLowerCase();
    if (!window.confirm(`Are you sure you want to delete this ${singularName}?`)) return;
    
    setLoading(true);
    try {
      // DELETE Logic
      switch (activeType) {
        case 'Categories': await api.deleteCategory(id); break;
        case 'Brands': await api.deleteBrand(id); break;
        case 'Departments': await api.deleteDepartment(id); break;
        case 'Qualities': await api.deleteQuality(id); break;
        case 'Suppliers': await api.deleteSupplier(id); break;
        case 'Persons': await api.deletePerson(id); break;
      }
      
      showToast(`${activeType.slice(0, -1)} deleted successfully`, 'success');
      loadData(activeType);
    } catch (error: any) {
      const errorMsg = error.response?.data?.title || error.response?.data?.message || `Failed to delete ${singularName}`;
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item: any = null) => {
    setEditingItem(item);
    if (item) {
      setItemData({ ...item, contactInfo: item.contactInfo ? item.contactInfo.join(', ') : '' });
    } else {
      setItemData({
        name: '',
        fullName: '',
        description: '',
        email: '',
        department: '',
        location: '',
        address: '',
        contactInfo: ''
      });
    }
    setModalOpen(true);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase();
    return data.filter((item) => {
      const nameMatch = (item.name || item.fullName || '').toLowerCase().includes(query);
      const emailMatch = (item.email || '').toLowerCase().includes(query);
      
      let contactStr = '';
      if (Array.isArray(item.contactInfo)) {
        contactStr = item.contactInfo.join(', ');
      } else if (typeof item.contactInfo === 'string') {
        contactStr = item.contactInfo;
      }
      const contactMatch = contactStr.toLowerCase().includes(query);

      return nameMatch || emailMatch || contactMatch;
    });
  }, [data, searchQuery]);

  const paginatedData = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" fontWeight="bold">Product Data Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => openModal()}>
          Add New
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <FormControl sx={{ minWidth: 250 }}>
          <InputLabel>Data Type</InputLabel>
          <Select
            value={activeType}
            label="Data Type"
            onChange={(e) => setActiveType(e.target.value as LookupType)}
          >
            <MenuItem value="Categories">Categories</MenuItem>
            <MenuItem value="Brands">Brands</MenuItem>
            <MenuItem value="Departments">Departments</MenuItem>
            <MenuItem value="Qualities">Condition / Qualities</MenuItem>
            <MenuItem value="Suppliers">Suppliers</MenuItem>
            <MenuItem value="Persons">Responsible Persons</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label={`Search ${activeType}`}
          variant="outlined"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(0);
          }}
          sx={{ flexGrow: 1, maxWidth: 400 }}
          placeholder="Search by name, email, or contact info..."
        />
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden', boxShadow: 3, position: 'relative' }}>
        {loading && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }} />}
        <TableContainer>
          <Table>
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>{activeType === 'Persons' ? 'Full Name' : 'Name'}</TableCell>
              {activeType === 'Categories' && <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>}
              {activeType === 'Departments' && <TableCell sx={{ fontWeight: 'bold' }}>Location</TableCell>}
              {activeType === 'Persons' && (
                <>
                  <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Department</TableCell>
                </>
              )}
              {activeType === 'Suppliers' && (
                <>
                  <TableCell sx={{ fontWeight: 'bold' }}>Contact Info</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Address</TableCell>
                </>
              )}
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody sx={{ opacity: loading ? 0.4 : 1, transition: 'opacity 0.2s ease-in-out' }}>
            {loading && data.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center"><CircularProgress size={24} /></TableCell></TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center">No records found.</TableCell></TableRow>
            ) : (
              paginatedData.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>{item.name || item.fullName}</TableCell>
                  {activeType === 'Categories' && <TableCell>{item.description || '-'}</TableCell>}
                  {activeType === 'Departments' && <TableCell>{item.location || '-'}</TableCell>}
                  {activeType === 'Persons' && (
                    <>
                      <TableCell>{item.email || '-'}</TableCell>
                      <TableCell>{item.department || '-'}</TableCell>
                    </>
                  )}
                  {activeType === 'Suppliers' && (
                    <>
                      <TableCell>{item.contactInfo && item.contactInfo.length > 0 ? item.contactInfo.join(', ') : '-'}</TableCell>
                      <TableCell>{item.address || '-'}</TableCell>
                    </>
                  )}
                  <TableCell align="right">
                    <IconButton color="primary" onClick={() => openModal(item)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(item.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      <Dialog open={modalOpen} onClose={() => !isSaving && setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingItem ? 'Edit Item' : `Add New ${activeType.slice(0, -1)}`}</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {activeType === 'Persons' ? (
            <TextField
              autoFocus
              label="Full Name"
              fullWidth
              variant="outlined"
              value={itemData.fullName || ''}
              onChange={(e) => setItemData({ ...itemData, fullName: e.target.value })}
              disabled={isSaving}
            />
          ) : (
            <TextField
              autoFocus
              label="Name"
              fullWidth
              variant="outlined"
              value={itemData.name || ''}
              onChange={(e) => setItemData({ ...itemData, name: e.target.value })}
              disabled={isSaving}
            />
          )}
          
          {activeType === 'Categories' && (
            <TextField
              label="Description"
              fullWidth
              variant="outlined"
              multiline
              rows={3}
              value={itemData.description || ''}
              onChange={(e) => setItemData({ ...itemData, description: e.target.value })}
              disabled={isSaving}
            />
          )}

          {activeType === 'Departments' && (
            <TextField
              label="Location"
              fullWidth
              variant="outlined"
              value={itemData.location || ''}
              onChange={(e) => setItemData({ ...itemData, location: e.target.value })}
              disabled={isSaving}
            />
          )}
          
          {activeType === 'Persons' && (
            <>
              <TextField
                label="Email"
                fullWidth
                variant="outlined"
                type="email"
                value={itemData.email || ''}
                onChange={(e) => setItemData({ ...itemData, email: e.target.value })}
                disabled={isSaving}
              />
              <TextField
                label="Department"
                fullWidth
                variant="outlined"
                value={itemData.department || ''}
                onChange={(e) => setItemData({ ...itemData, department: e.target.value })}
                disabled={isSaving}
              />
            </>
          )}

          {activeType === 'Suppliers' && (
            <>
              <TextField
                label="Contact Info (comma-separated)"
                fullWidth
                variant="outlined"
                value={itemData.contactInfo || ''}
                onChange={(e) => setItemData({ ...itemData, contactInfo: e.target.value })}
                disabled={isSaving}
                placeholder="e.g. Phone: 12345, Email: abc@example.com"
              />
              <TextField
                label="Address"
                fullWidth
                variant="outlined"
                multiline
                rows={2}
                value={itemData.address || ''}
                onChange={(e) => setItemData({ ...itemData, address: e.target.value })}
                disabled={isSaving}
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setModalOpen(false)} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={!(activeType === 'Persons' ? itemData.fullName?.trim() : itemData.name?.trim()) || isSaving}>
            {isSaving ? <CircularProgress size={24} color="inherit" /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};