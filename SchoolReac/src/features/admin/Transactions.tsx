import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TablePagination, CircularProgress, Alert, Chip, FormControl, InputLabel, Select, MenuItem, Button
} from '@mui/material';
import { getTransactions, TransactionDto } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';

export const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<TransactionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filtering
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [transactionType, setTransactionType] = useState<string>('All');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const { showToast } = useToast();

  // Debounce search query to prevent spamming the API on every keystroke
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(0);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        pageNumber: currentPage + 1,
        pageSize: pageSize,
        name: debouncedSearchQuery || undefined,
        filterOn: transactionType !== 'All' ? 'transactionType' : undefined,
        filterQuery: transactionType !== 'All' ? transactionType : undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
      };

      const result = await getTransactions(params);
      setTransactions(result.items || []);
      setTotalItems(result.totalCount || 0);
    } catch (err: any) {
      const message = err.response?.data?.title || 'Failed to load transactions.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearchQuery, transactionType, startDate, endDate, showToast]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Dynamically color-code the transaction badges
  const getTypeColor = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('in') || t.includes('purchase') || t.includes('donate')) return 'success';
    if (t.includes('out') || t.includes('consume')) return 'error';
    if (t.includes('transfer')) return 'info';
    return 'default';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="h4" fontWeight="bold">Transactions</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          View and track all inventory movements and updates.
        </Typography>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden', boxShadow: 3 }}>
        <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            label="Search Transactions"
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ width: { xs: '100%', sm: 300 } }}
            placeholder="Search by product, donor, or department..."
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={transactionType}
              label="Type"
              onChange={(e) => {
                setTransactionType(e.target.value);
                setCurrentPage(0);
              }}
            >
              <MenuItem value="All">All Types</MenuItem>
              <MenuItem value="In">In</MenuItem>
              <MenuItem value="Out">Out</MenuItem>
              <MenuItem value="Transfer">Transfer</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <DatePicker
              label="Start Date"
              slotProps={{ textField: { size: 'small' } }}
              value={startDate ? dayjs(startDate) : null}
              onChange={(newDate: Dayjs | null) => {
                setStartDate(newDate && newDate.isValid() ? newDate.format('YYYY-MM-DD') : '');
                setCurrentPage(0);
              }}
            />
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <DatePicker
              label="End Date"
              slotProps={{ textField: { size: 'small' } }}
              value={endDate ? dayjs(endDate) : null}
              onChange={(newDate: Dayjs | null) => {
                setEndDate(newDate && newDate.isValid() ? newDate.format('YYYY-MM-DD') : '');
                setCurrentPage(0);
              }}
            />
          </FormControl>
          {(searchQuery || transactionType !== 'All' || startDate || endDate) && (
            <Button variant="text" color="inherit" onClick={() => {
              setSearchQuery('');
              setTransactionType('All');
              setStartDate('');
              setEndDate('');
              setCurrentPage(0);
            }}>
              Clear
            </Button>
          )}
        </Box>

        <TableContainer sx={{ maxHeight: 'calc(100vh - 250px)' }}>
          <Table stickyHeader>
            <TableHead sx={{ '& th': { fontWeight: 'bold', bgcolor: 'background.paper' } }}>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Product</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Dept / Resource</TableCell>
                <TableCell>Provider / Donor</TableCell>
                <TableCell>Responsible</TableCell>
                <TableCell align="right">Qty</TableCell>
                <TableCell align="right">Total Cost</TableCell>
              </TableRow>
            </TableHead>
            <TableBody sx={{ opacity: loading ? 0.4 : 1, transition: 'opacity 0.2s ease-in-out' }}>
              {loading && transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}><Alert severity="error">{error}</Alert></TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>No transactions match your filters.</TableCell>
                </TableRow>
              ) : (
                transactions.map((t) => (
                  <TableRow key={t.id} hover>
                    <TableCell>{t.createdDate ? new Date(t.createdDate).toLocaleString() : '-'}</TableCell>
                    <TableCell sx={{ fontWeight: 'medium' }}>{t.productName || '-'}</TableCell>
                    <TableCell>
                      <Chip label={t.transactionType || '-'} size="small" color={getTypeColor(t.transactionType || '') as any} variant="outlined" />
                    </TableCell>
                    <TableCell>
                      {t.departmentName || '-'}
                      {t.resource ? <Typography variant="caption" display="block" color="text.secondary">{t.resource}</Typography> : null}
                    </TableCell>
                    <TableCell>{t.providerName || t.donorName || '-'}</TableCell>
                    <TableCell>{t.responserName || '-'}</TableCell>
                    <TableCell align="right">{t.quantity}</TableCell>
                    <TableCell align="right">${(t.totalCost || 0).toFixed(2)}</TableCell>
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