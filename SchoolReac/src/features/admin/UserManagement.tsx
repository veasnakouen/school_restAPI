import React, { useState, useEffect, useMemo } from 'react';
import { getUsers, getRoles, User, Role, updateUser, createUser, deleteUser, toggleUserStatus, UserPayload, uploadUserAvatar } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../auth/AuthContext';
import { Box, Typography, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination, CircularProgress, Alert, Button, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Chip, Avatar, FormControl, Select, MenuItem, FormGroup, FormControlLabel, Checkbox, useTheme, TableSortLabel } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Lock as LockIcon, LockOpen as LockOpenIcon, Add as AddIcon, Download as DownloadIcon } from '@mui/icons-material';

export const UserManagement: React.FC = () => {
  // Data State
  const [users, setUsers] = useState<User[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'locked'>('all');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [sortColumn, setSortColumn] = useState<keyof User | 'status'>('userName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Modal State
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToToggle, setUserToToggle] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const { showToast } = useToast();
  const theme = useTheme();
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.roles?.includes('SuperAdmin');

  // --- Data Fetching ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // To get all users for client-side filtering, request a large page size.
        const [usersResult, rolesData] = await Promise.all([
          getUsers({ pageSize: 10000 }),
          getRoles().catch(() => []) // Gracefully fallback to empty array if roles fail to load
        ]);
        setUsers(usersResult?.items ?? []);
        setAvailableRoles(rolesData ?? []);
      } catch (error: any) {
        console.error("Failed to fetch data:", error);
        const message = error.response?.data?.title || error.response?.data || error.response?.statusText || 'Failed to fetch user data. You may not have permission.';
        showToast(message, 'error');
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, []);

  // --- Filtering and Pagination Logic ---
  const isLocked = (user: User | null): boolean => {
    if (!user?.lockoutEnd) return false;
    return new Date(user.lockoutEnd) > new Date();
  };

  const filteredUsers = useMemo(() => {
    let result = [...users];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(user =>
        (user.userName || user.email || '').toLowerCase().includes(query) ||
        (user.email || '').toLowerCase().includes(query) ||
        (user.fullName && user.fullName.toLowerCase().includes(query))
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter(user => (statusFilter === 'active') ? !isLocked(user) : isLocked(user));
    }
    
    // Sorting
    result.sort((a, b) => {
      let aVal: any = sortColumn === 'status' ? (isLocked(a) ? 1 : 0) : (a[sortColumn] || '');
      let bVal: any = sortColumn === 'status' ? (isLocked(b) ? 1 : 0) : (b[sortColumn] || '');
      
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [users, searchQuery, statusFilter, sortColumn, sortDirection]);

  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredUsers.slice(startIndex, startIndex + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  // --- Event Handlers ---
  const handleOpenCreateModal = () => {
    setSelectedUser({ id: '', userName: '', email: '', roles: [], fullName: '', password: '' } as any);
    setModalMode('create');
  };

  const handleStartEdit = (user: User) => {
    setSelectedUser({ ...user });
    setModalMode('edit');
  };

  const handleSort = (column: keyof User | 'status') => {
    if (sortColumn === column) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleCloseModal = () => {
    setModalMode(null);
    setSelectedUser(null);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;
    setIsSaving(true);

    const payload: Partial<UserPayload> = {
      userName: selectedUser.userName,
      fullName: selectedUser.fullName,
      email: selectedUser.email,
      phoneNumber: selectedUser.phoneNumber,
      roles: selectedUser.roles,
    };

    // Pass the password for both "Create" and "Password Resets" during Edit
    if ((selectedUser as any).password) {
      payload.password = (selectedUser as any).password;
    }

    try {
      if (modalMode === 'create') {
        await createUser(payload as UserPayload);
        showToast('User created successfully!', 'success');
      } else {
        const updatedUser = await updateUser(selectedUser.id, payload);
        // Merge the updated fields so we don't lose imageUrl, lockoutEnd, and roles from the UI
        setUsers(users.map(u => u.id === selectedUser.id ? { ...u, ...updatedUser, roles: selectedUser.roles } : u));
        showToast('User updated successfully!', 'success');
      }
      // Refetch only on create, otherwise update state optimistically
      if (modalMode === 'create') {
        const usersResult = await getUsers({ pageSize: 10000 });
        setUsers(usersResult.items);
      }
      handleCloseModal();
    } catch (error: any) {
      console.error("Failed to save user:", error);
      const message = error.response?.data?.title || 'Failed to save user. Please check the details and try again.';
      showToast(message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await deleteUser(userToDelete.id);
      setUsers(users.filter(u => u.id !== userToDelete.id));
      showToast(`User "${userToDelete.userName}" deleted successfully.`, 'success');
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      showToast(error.response?.data?.title || 'Failed to delete user.', 'error');
    } finally {
      setUserToDelete(null);
    }
  };

  const confirmToggleLock = async () => {
    if (!userToToggle) return;
    setIsToggling(true);
    try {
      const response = await toggleUserStatus(userToToggle.id);
      
      // Optimistic UI update: Toggle the user's status locally to avoid a full re-fetch.
      setUsers(prevUsers => 
        prevUsers.map(u => {
          if (u.id === userToToggle.id) {
            const currentlyLocked = isLocked(u);
            // If they were locked, they are now unlocked (lockoutEnd is null).
            // If they were unlocked, they are now locked (lockoutEnd is a future date).
            return { ...u, lockoutEnd: currentlyLocked ? null : new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString() };
          }
          return u;
        })
      );
      showToast(response.message, 'success');
    } catch (error: any) {
      console.error('Failed to toggle user status:', error);
      showToast(error.response?.data?.title || 'Failed to update user status.', 'error');
    } finally {
      setIsToggling(false);
      setUserToToggle(null);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedUser) return;

    setIsUploadingAvatar(true);
    try {
      const response = await uploadUserAvatar(selectedUser.id, file);
      
      // Optimistically update the modal UI and the table to avoid a full re-fetch
      setSelectedUser(prev => prev ? { ...prev, imageUrl: response.imageUrl } : null);
      setUsers(prevUsers => prevUsers.map(u => u.id === selectedUser.id ? { ...u, imageUrl: response.imageUrl } : u));
      showToast('Avatar updated successfully!', 'success');
    } catch (error: any) {
      console.error('Failed to upload avatar:', error);
      showToast(error.response?.data?.title || error.response?.data || 'Failed to upload avatar.', 'error');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const escapeCsvValue = (value: string | null | undefined): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    const escaped = str.replace(/"/g, '""');
    // Quote the value if it contains a comma, a quote, or a newline.
    if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')) {
      return `"${escaped}"`;
    }
    return escaped;
  };

  const handleExportToCSV = () => {
    if (filteredUsers.length === 0) return;

    const headers = ['ID', 'Username', 'Full Name', 'Email', 'Phone Number', 'Roles', 'Status'];

    const rows = filteredUsers.map(user =>
      [
        user.id,
        escapeCsvValue(user.userName || user.email),
        escapeCsvValue(user.fullName),
        escapeCsvValue(user.email),
        escapeCsvValue(user.phoneNumber),
        escapeCsvValue((user.roles || []).join(' | ')),
        isLocked(user) ? 'Locked' : 'Active',
      ].join(',')
    );

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().slice(0, 10);
    link.download = `users_${timestamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // --- JSX ---
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>U</Avatar>
          <Box>
            <Typography variant="h4" fontWeight="bold">User Management</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Manage system users, roles, and access status</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" color="primary" startIcon={<DownloadIcon />} onClick={handleExportToCSV} disabled={filteredUsers.length === 0}>
            Export CSV
          </Button>
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleOpenCreateModal}>
            Add User
          </Button>
        </Box>
      </Box>

      {/* Table Card */}
      <Paper sx={{ width: '100%', overflow: 'hidden', boxShadow: 3 }}>
        {/* Filter Bar */}
        <Box sx={{ p: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
          <TextField
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder="Search users..."
            variant="outlined"
            size="small"
            sx={{ width: { xs: '100%', sm: 300 } }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as any); setCurrentPage(1); }}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="locked">Locked</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Table */}
        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="users table">
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <TableSortLabel
                    active={sortColumn === 'userName'}
                    direction={sortColumn === 'userName' ? sortDirection : 'asc'}
                    onClick={() => handleSort('userName')}
                  >
                    User
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <TableSortLabel
                    active={sortColumn === 'email'}
                    direction={sortColumn === 'email' ? sortDirection : 'asc'}
                    onClick={() => handleSort('email')}
                  >
                    Contact Info
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <TableSortLabel
                    active={sortColumn === 'status'}
                    direction={sortColumn === 'status' ? sortDirection : 'asc'}
                    onClick={() => handleSort('status')}
                  >
                    Status
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
              ) : paginatedUsers.length === 0 ? (
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}>No users match your filters.</TableCell></TableRow>
              ) : (
                paginatedUsers.map(user => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar src={user.imageUrl} sx={{ bgcolor: 'primary.main' }}>
                          {(user.userName || user.email || '?').charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">{user.userName || user.email}</Typography>
                          <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                            ID: {user.id ? user.id.substring(0, 8) : ''}...
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{user.email}</Typography>
                      <Typography variant="caption" color="text.secondary">{user.phoneNumber || 'No phone'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={isLocked(user) ? 'Locked' : 'Active'} 
                        color={isLocked(user) ? 'error' : 'success'} 
                        size="small" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton color="primary" size="small" onClick={() => handleStartEdit(user)} title="Edit User">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        color={isLocked(user) ? 'success' : 'warning'} 
                        size="small" 
                        onClick={() => setUserToToggle(user)}
                        title={isLocked(user) ? 'Unlock User' : 'Lock User'}
                      >
                        {isLocked(user) ? <LockOpenIcon fontSize="small" /> : <LockIcon fontSize="small" />}
                      </IconButton>
                  {isSuperAdmin && (
                    <IconButton color="error" size="small" onClick={() => setUserToDelete(user)} title="Delete User">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
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

      {/* Create/Edit Modal */}
      <Dialog open={modalMode !== null} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>{modalMode === 'create' ? 'Create New User' : 'Edit User'}</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {selectedUser && (
            <>
              {modalMode === 'edit' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3, gap: 1 }}>
                  <Avatar src={selectedUser.imageUrl} sx={{ width: 80, height: 80, fontSize: '2.5rem', bgcolor: 'primary.main' }}>
                    {(selectedUser.userName || selectedUser.email || '?').charAt(0).toUpperCase()}
                  </Avatar>
                  <Button variant="outlined" size="small" component="label" disabled={isUploadingAvatar}>
                    {isUploadingAvatar ? <CircularProgress size={16} sx={{ mr: 1 }} color="inherit" /> : null}
                    Upload New Avatar
                    <input type="file" hidden accept="image/*" onChange={handleAvatarUpload} />
                  </Button>
                </Box>
              )}
              <TextField
                label="Username"
                fullWidth
                variant="outlined"
                required
                value={selectedUser.userName || ''}
                onChange={(e) => setSelectedUser(u => u ? { ...u, userName: e.target.value } : null)}
              />
              <TextField
                label="Full Name"
                fullWidth
                variant="outlined"
                value={selectedUser.fullName || ''}
                onChange={(e) => setSelectedUser(u => u ? { ...u, fullName: e.target.value } : null)}
              />
              <TextField
                label="Email"
                fullWidth
                variant="outlined"
                type="email"
                required
                value={selectedUser.email || ''}
                onChange={(e) => setSelectedUser(u => u ? { ...u, email: e.target.value } : null)}
              />
              <TextField
                label="Phone Number"
                fullWidth
                variant="outlined"
                value={selectedUser.phoneNumber || ''}
                onChange={(e) => setSelectedUser(u => u ? { ...u, phoneNumber: e.target.value } : null)}
              />
                <TextField
                label={modalMode === 'create' ? "Password" : "New Password"}
                  fullWidth
                  variant="outlined"
                  type="password"
                required={modalMode === 'create'}
                placeholder={modalMode === 'edit' ? "Leave blank to keep unchanged" : ""}
                  value={(selectedUser as any).password || ''}
                  onChange={(e) => setSelectedUser(u => u ? { ...u, password: e.target.value } : null)}
                />
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 1 }}>Roles</Typography>
              <FormGroup row>
                {availableRoles.map(role => (
                  <FormControlLabel
                    key={role.id}
                    control={
                      <Checkbox
                        checked={(selectedUser.roles || []).includes(role.name)}
                        onChange={(e) => {
                          const roleName = role.name;
                          const isChecked = e.target.checked;
                          setSelectedUser(u => {
                            if (!u) return null;
                            const currentRoles = u.roles || [];
                            const newRoles = isChecked
                              ? [...currentRoles, roleName]
                              : currentRoles.filter(r => r !== roleName);
                            return { ...u, roles: newRoles };
                          });
                        }}
                        color="primary"
                      />
                    }
                    label={role.name}
                  />
                ))}
              </FormGroup>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseModal} color="inherit">Cancel</Button>
          <Button onClick={handleSaveUser} variant="contained" color="primary" disabled={isSaving}>
            {isSaving ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!userToDelete} onClose={() => setUserToDelete(null)}>
        <DialogTitle sx={{ color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteIcon /> Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the user <strong>{userToDelete?.userName || userToDelete?.email}</strong>?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Warning: This action cannot be undone.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setUserToDelete(null)} color="inherit">Cancel</Button>
          <Button onClick={handleDeleteUser} variant="contained" color="error">Delete User</Button>
        </DialogActions>
      </Dialog>

      {/* Toggle Status Confirmation Modal */}
      <Dialog open={!!userToToggle} onClose={() => setUserToToggle(null)}>
        <DialogTitle sx={{ color: isLocked(userToToggle) ? 'success.main' : 'warning.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          {isLocked(userToToggle) ? <LockOpenIcon /> : <LockIcon />}
          Confirm Status Change
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to <strong>{isLocked(userToToggle) ? 'unlock' : 'lock'}</strong> the account for <strong>{userToToggle?.userName || userToToggle?.email}</strong>?
          </Typography>
          <Alert severity={isLocked(userToToggle) ? 'info' : 'warning'} sx={{ mt: 2 }}>
            {isLocked(userToToggle) 
              ? 'They will be able to log in again.' 
              : 'They will immediately lose access to the system.'}
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setUserToToggle(null)} color="inherit">Cancel</Button>
          <Button onClick={confirmToggleLock} variant="contained" color={isLocked(userToToggle) ? 'success' : 'warning'} disabled={isToggling}>
            {isToggling ? <CircularProgress size={24} color="inherit" /> : (isLocked(userToToggle) ? 'Unlock User' : 'Lock User')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};