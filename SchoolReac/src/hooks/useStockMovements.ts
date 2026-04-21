import { useState, useEffect, useCallback } from 'react';

export interface StockMovement {
  id: string;
  type: string;
  direction: string;
  productId: string;
  productName: string;
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  referenceNumber?: string;
  notes?: string;
  movedAt: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

interface UseStockMovementsParams {
  filterOn?: string;
  filterQuery?: string;
  sortBy?: string;
  isAscending?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

export const useStockMovements = (initialParams: UseStockMovementsParams = {}) => {
  const [data, setData] = useState<PagedResult<StockMovement> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<UseStockMovementsParams>({
    pageNumber: 1,
    pageSize: 10,
    ...initialParams,
  });

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    try {
      // Construct query string, ignoring empty values
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      // Note: Replace this with however you currently retrieve your JWT in React
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/inventory/stock-movements?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch stock movements');

      const result: PagedResult<StockMovement> = await response.json();
      setData(result);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  const handlePageChange = (newPage: number) => {
    setParams(prev => ({ ...prev, pageNumber: newPage }));
  };

  return { data, loading, error, params, setParams, handlePageChange, refetch: fetchMovements };
};