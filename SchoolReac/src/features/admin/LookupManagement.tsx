import React, { useState, useEffect } from 'react';
import { Box, Typography, Select, MenuItem, FormControl, InputLabel, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { useToast } from '../../context/ToastContext';
import * as api from '../../services/api';

type LookupType = 'Categories' | 'Brands' | 'Departments' | 'Qualities' | 'Suppliers' | 'Persons';

export const LookupManagement: React.FC = () => {
  const [activeType, setActiveType] = useState<LookupType>('Categories');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [itemName, setItemName] = useState('');
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
    loadData(activeType);
  }, [activeType]);

  const handleSave = async () => {
    if (!itemName.trim()) return;
    
    setIsSaving(true);
    try {
      if (editingItem) {
        // UPDATE Logic
        switch (activeType) {
          case 'Categories': await api.updateCategory(editingItem.id, { name: itemName }); break;
          case 'Brands': await api.updateBrand(editingItem.id, { name: itemName }); break;
          case 'Departments': await api.updateDepartment(editingItem.id, { name: itemName }); break;
          case 'Qualities': await api.updateQuality(editingItem.id, { name: itemName }); break;
          case 'Suppliers': await api.updateSupplier(editingItem.id, { name: itemName }); break;
          case 'Persons': await api.updatePerson(editingItem.id, { fullName: itemName }); break;
        }
        showToast(`${activeType.slice(0, -1)} updated successfully`, 'success');
      } else {
        // CREATE Logic
        switch (activeType) {
          case 'Categories': await api.createCategory({ name: itemName }); break;
          case 'Brands': await api.createBrand({ name: itemName }); break;
          case 'Departments': await api.createDepartment({ name: itemName }); break;
          case 'Qualities': await api.createQuality({ name: itemName }); break;
          case 'Suppliers': await api.createSupplier({ name: itemName }); break;
          case 'Persons': await api.createPerson({ fullName: itemName }); break;
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
    setItemName(item ? (item.name || item.fullName) : '');
    setModalOpen(true);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" fontWeight="bold">Product Data Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => openModal()}>
          Add New
        </Button>
      </Box>

      <FormControl sx={{ maxWidth: 300 }}>
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

      <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={2} align="center"><CircularProgress size={24} /></TableCell></TableRow>
            ) : data.length === 0 ? (
              <TableRow><TableCell colSpan={2} align="center">No records found.</TableCell></TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>{item.name || item.fullName}</TableCell>
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

      <Dialog open={modalOpen} onClose={() => !isSaving && setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingItem ? 'Edit Item' : `Add New ${activeType.slice(0, -1)}`}</DialogTitle>
        <DialogContent dividers>
          <TextField
            autoFocus
            label="Name"
            fullWidth
            variant="outlined"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            disabled={isSaving}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setModalOpen(false)} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={!itemName.trim() || isSaving}>
            {isSaving ? <CircularProgress size={24} color="inherit" /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};