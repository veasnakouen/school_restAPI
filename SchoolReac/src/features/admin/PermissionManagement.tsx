import React, { useState, useEffect, useMemo } from 'react';
import * as api from '../../services/api';
import { Box, Typography, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, TablePagination, CircularProgress, Alert, TableSortLabel } from '@mui/material';

export const PermissionManagement: React.FC = () => {
  const [permissions, setPermissions] = useState<api.PermissionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI State for filtering and pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortColumn, setSortColumn] = useState<keyof api.PermissionDto>('value');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setLoading(true);
        const fetchedPermissions = await api.getPermissions();
        setPermissions(fetchedPermissions);
      } catch (err: any) {
        const message = err.response?.data?.title || err.response?.data || err.response?.statusText || 'Failed to fetch permissions. You may not have permission to view this content.';
        setError(message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  const handleSort = (column: keyof api.PermissionDto) => {
    if (sortColumn === column) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // --- Filtering and Pagination Logic ---
  const processedPermissions = useMemo(() => {
    let filtered = [...permissions];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.value.toLowerCase().includes(query) ||
        p.type.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      );
    }

    if (sortColumn) {
      filtered.sort((a, b) => {
        const aValue = a[sortColumn] ?? '';
        const bValue = b[sortColumn] ?? '';
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [permissions, searchQuery, sortColumn, sortDirection]);

  const totalItems = processedPermissions.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  const paginatedPermissions = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return processedPermissions.slice(startIndex, startIndex + pageSize);
  }, [processedPermissions, currentPage, pageSize]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Permissions</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            These are the permissions available in the system. They are assigned to roles to grant access to different features.
          </Typography>
        </Box>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden', boxShadow: 3 }}>
        <Box sx={{ p: 2 }}>
          <TextField
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder="Search permissions..."
            variant="outlined"
            size="small"
            sx={{ width: { xs: '100%', sm: 300 } }}
          />
        </Box>
        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="permissions table">
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={sortColumn === 'value'}
                    direction={sortColumn === 'value' ? sortDirection : 'asc'}
                    onClick={() => handleSort('value')}
                  >
                    Permission
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortColumn === 'type'}
                    direction={sortColumn === 'type' ? sortDirection : 'asc'}
                    onClick={() => handleSort('type')}
                  >
                    Type
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortColumn === 'description'}
                    direction={sortColumn === 'description' ? sortDirection : 'asc'}
                    onClick={() => handleSort('description')}
                  >
                    Description
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedPermissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 6 }}>
                    <Typography variant="h6" color="text.secondary">No Permissions Found</Typography>
                    <Typography variant="body2" color="text.secondary">This could be because no permissions are seeded in the database, or your role lacks the required claims to view them.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPermissions.map(perm => (
                  <TableRow key={`${perm.type}-${perm.value}`} hover>
                    <TableCell sx={{ fontWeight: 'medium' }}>{perm.value}</TableCell>
                    <TableCell><Chip label={perm.type} size="small" variant="outlined" /></TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{perm.description}</TableCell>
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
            rowsPerPageOptions={[10, 20, 50]}
          />
        )}
      </Paper>
    </Box>
  );
};