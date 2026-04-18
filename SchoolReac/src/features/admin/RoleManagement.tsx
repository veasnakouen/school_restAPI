import React, { useState, useEffect, useMemo } from 'react';
import * as api from '../../services/api';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Box, Typography, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination, CircularProgress, Alert, Button, Dialog, DialogTitle, DialogContent, DialogActions, Accordion, AccordionSummary, AccordionDetails, FormGroup, FormControlLabel, Checkbox, IconButton } from '@mui/material';
import { ExpandMore as ExpandMoreIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

export const RoleManagement: React.FC = () => {
    const [roles, setRoles] = useState<api.Role[]>([]);
    const [permissions, setPermissions] = useState<api.PermissionDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentRole, setCurrentRole] = useState<api.RoleDto | null>(null);
    const [roleToDelete, setRoleToDelete] = useState<api.Role | null>(null);

    const { setLoading: setAppLoading } = useAuth();
    const { showToast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [fetchedRoles, fetchedPermissions] = await Promise.all([
                    api.getRoles(),
                    api.getPermissions(),
                ]);
                setRoles(fetchedRoles);
                setPermissions(fetchedPermissions);
            } catch (err: any) {
                const message = err.response?.data?.title || err.response?.data || err.response?.statusText || 'Failed to fetch data. You may not have permission to view this content.';
                setError(message);
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // --- Filtering and Pagination Logic ---
    const filteredRoles = useMemo(() => {
        if (!searchQuery.trim()) return roles;
        const query = searchQuery.toLowerCase();
        return roles.filter(role => role.name.toLowerCase().includes(query));
    }, [roles, searchQuery]);

    const totalItems = filteredRoles.length;
    const totalPages = Math.ceil(totalItems / pageSize);

    const paginatedRoles = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return filteredRoles.slice(startIndex, startIndex + pageSize);
    }, [filteredRoles, currentPage, pageSize]);

    const openCreateModal = () => {
        setIsEditing(false);
        setCurrentRole({ id: '', name: '', permissions: [] });
        setIsModalOpen(true);
    };

    const openEditModal = async (role: api.Role) => {
        try {
            setAppLoading(true, 'Fetching role details...');
            const roleDetails = await api.getRoleDetails(role.id);
            setIsEditing(true);
            setCurrentRole(roleDetails);
            setIsModalOpen(true);
        } catch (err) {
            setError(`Failed to fetch details for role: ${role.name}`);
        } finally {
            setAppLoading(false);
        }
    };

    const openDeleteModal = (role: api.Role) => {
        setRoleToDelete(role);
        setIsDeleteModalOpen(true);
    };

    const handleSave = async () => {
        if (!currentRole) return;
        setAppLoading(true, 'Saving role...');
        try {
            if (isEditing) {
                await api.updateRole(currentRole.id, { name: currentRole.name, permissions: currentRole.permissions });
                showToast('Role updated successfully!', 'success');
            } else {
                await api.createRole({ name: currentRole.name, permissions: currentRole.permissions });
                showToast('Role created successfully!', 'success');
            }
            setIsModalOpen(false);
            const fetchedRoles = await api.getRoles();
            setRoles(fetchedRoles);
        } catch (err: any) {
            showToast(err.response?.data?.title || 'Failed to save role.', 'error');
        } finally {
            setAppLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!roleToDelete) return;
        setAppLoading(true, 'Deleting role...');
        try {
            await api.deleteRole(roleToDelete.id);
            setIsDeleteModalOpen(false);
            setRoles(roles.filter(r => r.id !== roleToDelete.id));
            showToast('Role deleted successfully!', 'success');
        } catch (err: any) {
            showToast(err.response?.data?.title || 'Failed to delete role.', 'error');
        } finally {
            setAppLoading(false);
        }
    };

    const handlePermissionToggle = (permissionValue: string) => {
        if (!currentRole) return;
        const permissions = currentRole.permissions.includes(permissionValue)
            ? currentRole.permissions.filter(p => p !== permissionValue)
            : [...currentRole.permissions, permissionValue];
        setCurrentRole({ ...currentRole, permissions });
    };

    const groupedPermissions = useMemo(() => permissions.reduce((acc, p) => {
        acc[p.type] = acc[p.type] || [];
        acc[p.type].push(p);
        return acc;
    }, {} as Record<string, api.PermissionDto[]>), [permissions]);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 2 }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold">Roles</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Manage user roles and their associated permissions.</Typography>
                </Box>
                <Button variant="contained" color="primary" onClick={openCreateModal}>
                    Add Role
                </Button>
            </Box>

            <Paper sx={{ width: '100%', overflow: 'hidden', boxShadow: 3 }}>
                <Box sx={{ p: 2 }}>
                    <TextField
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        placeholder="Search roles..."
                        variant="outlined"
                        size="small"
                        sx={{ width: { xs: '100%', sm: 300 } }}
                    />
                </Box>
                <TableContainer>
                    <Table sx={{ minWidth: 500 }} aria-label="roles table">
                        <TableHead sx={{ bgcolor: 'action.hover' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedRoles.length === 0 ? (
                                <TableRow><TableCell colSpan={2} align="center" sx={{ py: 4 }}>No roles match your search.</TableCell></TableRow>
                            ) : (
                                paginatedRoles.map(role => (
                                    <TableRow key={role.id} hover>
                                        <TableCell sx={{ fontWeight: 'medium' }}>{role.name}</TableCell>
                                        <TableCell align="right">
                                            <IconButton color="primary" onClick={() => openEditModal(role)} size="small">
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton color="error" onClick={() => openDeleteModal(role)} size="small">
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                {totalItems > 0 && (
                    <TablePagination
                        component="div"
                        count={totalItems}
                        page={currentPage - 1}
                        onPageChange={(e, newPage) => setCurrentPage(newPage + 1)}
                        rowsPerPage={pageSize}
                        onRowsPerPageChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setCurrentPage(1); }}
                        rowsPerPageOptions={[5, 10, 20]}
                    />
                )}
            </Paper>

            {/* Edit/Create Modal */}
            <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{isEditing ? 'Edit Role' : 'Create Role'}</DialogTitle>
                <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        autoFocus
                        label="Role Name"
                        fullWidth
                        variant="outlined"
                        value={currentRole?.name || ''}
                        onChange={(e) => currentRole && setCurrentRole({ ...currentRole, name: e.target.value })}
                    />
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 1 }}>Permissions</Typography>
                    <Box sx={{ maxHeight: 400, overflowY: 'auto', borderRadius: 1, border: 1, borderColor: 'divider' }}>
                        {Object.entries(groupedPermissions).map(([type, perms]) => (
                            <Accordion key={type} disableGutters elevation={0} square sx={{ borderBottom: 1, borderColor: 'divider', '&:last-child': { borderBottom: 0 } }}>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography fontWeight="medium" textTransform="capitalize">{type}</Typography>
                                </AccordionSummary>
                                <AccordionDetails sx={{ bgcolor: 'action.hover' }}>
                                    <FormGroup>
                                        {perms.map(perm => (
                                            <FormControlLabel
                                                key={perm.value}
                                                control={
                                                    <Checkbox
                                                        checked={currentRole?.permissions.includes(perm.value) || false}
                                                        onChange={() => handlePermissionToggle(perm.value)}
                                                        color="primary"
                                                    />
                                                }
                                                label={perm.value}
                                            />
                                        ))}
                                    </FormGroup>
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setIsModalOpen(false)} color="inherit">Cancel</Button>
                    <Button onClick={handleSave} variant="contained" color="primary">Save</Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to delete the role "{roleToDelete?.name}"?</Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setIsDeleteModalOpen(false)} color="inherit">Cancel</Button>
                    <Button onClick={handleDelete} variant="contained" color="error">Delete</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};