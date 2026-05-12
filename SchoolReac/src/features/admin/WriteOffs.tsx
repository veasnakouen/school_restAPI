import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TablePagination, CircularProgress, Alert, Chip, IconButton, Tooltip
} from '@mui/material';
import { Check as CheckIcon, Close as CloseIcon, Undo as UndoIcon } from '@mui/icons-material';
import { getWriteOffs, approveWriteOff, rejectWriteOff, undoWriteOff, WriteOffDto } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const WriteOffs: React.FC = () => {
  const [writeOffs, setWriteOffs] = useState<WriteOffDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const { showToast } = useToast();

  const loadWriteOffs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getWriteOffs({
        pageNumber: currentPage + 1,
        pageSize: pageSize,
      });
      setWriteOffs(result.items || []);
      setTotalItems(result.totalCount || 0);
    } catch (err: any) {
      const message = err.response?.data?.title || 'Failed to load write-offs.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, showToast]);

  useEffect(() => {
    loadWriteOffs();
  }, [loadWriteOffs]);

  const handleAction = async (id: string, action: 'approve' | 'reject' | 'undo') => {
    try {
      if (action === 'approve') {
        await approveWriteOff(id);
        showToast('Write-Off approved successfully.', 'success');
      } else if (action === 'reject') {
        await rejectWriteOff(id);
        showToast('Write-Off rejected.', 'info');
      } else if (action === 'undo') {
        await undoWriteOff(id);
        showToast('Write-Off action reverted to pending.', 'info');
      }
      loadWriteOffs();
    } catch (err: any) {
      showToast(err.response?.data?.title || `Failed to ${action} write-off.`, 'error');
    }
  };

  const getReasonText = (reasonCode: number) => {
    switch (reasonCode) {
      case 1: return 'Damaged';
      case 2: return 'Stolen';
      case 3: return 'Expired';
      case 4: return 'Obsolete';
      case 5: return 'Lost';
      case 6: return 'Beyond Repair';
      default: return 'Unknown';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'warning';
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="h4" fontWeight="bold">Write-Off Approvals</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Review, approve, or reject broken and lost asset reports.
        </Typography>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden', boxShadow: 3 }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 250px)' }}>
          <Table stickyHeader>
            <TableHead sx={{ '& th': { fontWeight: 'bold', bgcolor: 'background.paper' } }}>
              <TableRow>
                <TableCell>Date Submitted</TableCell>
                <TableCell>Product</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell align="center">Qty</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody sx={{ opacity: loading ? 0.4 : 1, transition: 'opacity 0.2s ease-in-out' }}>
              {loading && writeOffs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}><Alert severity="error">{error}</Alert></TableCell>
                </TableRow>
              ) : writeOffs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>No write-offs pending review.</TableCell>
                </TableRow>
              ) : (
                writeOffs.map((w) => (
                  <TableRow key={w.id} hover>
                    <TableCell>{w.createdDate ? new Date(w.createdDate).toLocaleDateString() : '-'}</TableCell>
                    <TableCell sx={{ fontWeight: 'medium' }}>
                      {w.productName || 'Unknown Product'}
                      {w.codeNumber && <Typography variant="caption" display="block" color="text.secondary">{w.codeNumber}</Typography>}
                    </TableCell>
                    <TableCell>{getReasonText(w.reason)}</TableCell>
                    <TableCell sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={w.description}>
                      {w.description || '-'}
                    </TableCell>
                    <TableCell align="center">{w.quantity}</TableCell>
                    <TableCell align="center">
                      <Chip label={w.status || 'Pending'} size="small" color={getStatusColor(w.status) as any} variant={w.status === 'Pending' ? 'outlined' : 'filled'} />
                    </TableCell>
                    <TableCell align="right">
                      {w.status === 'Pending' ? (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          <Tooltip title="Approve">
                            <IconButton color="success" size="small" onClick={() => handleAction(w.id, 'approve')}>
                              <CheckIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton color="error" size="small" onClick={() => handleAction(w.id, 'reject')}>
                              <CloseIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      ) : (
                        <Tooltip title="Undo / Revert">
                          <IconButton size="small" onClick={() => handleAction(w.id, 'undo')}>
                            <UndoIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={totalItems}
          rowsPerPage={pageSize}
          page={currentPage}
          onPageChange={(e, newPage) => setCurrentPage(newPage)}
          onRowsPerPageChange={(e) => {
            setPageSize(parseInt(e.target.value, 10));
            setCurrentPage(0);
          }}
        />
      </Paper>
    </Box>
  );
};