import React from 'react';
import { useStockMovements } from '../../hooks/useStockMovements';

export const StockMovementsTable: React.FC = () => {
  // Initialize the hook, sorting by the newest movements first
  const { data, loading, error, handlePageChange } = useStockMovements({
    sortBy: 'date',
    isAscending: false
  });

  if (error) return <div className="p-4 text-red-500 bg-red-50 rounded">Error: {error}</div>;

  return (
    <div className="p-6 bg-white shadow-sm rounded-lg border border-gray-200">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Inventory Audit Trail</h2>
      
      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="min-w-full table-auto border-collapse text-left text-sm">
          <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Action Type</th>
              <th className="px-4 py-3">Direction</th>
              <th className="px-4 py-3">Qty Changed</th>
              <th className="px-4 py-3">Reference</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-gray-700">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8">Loading stock data...</td></tr>
            ) : data?.items.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8">No stock movements found.</td></tr>
            ) : (
              data?.items.map((movement) => (
                <tr key={movement.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    {new Date(movement.movedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{movement.productName}</td>
                  <td className="px-4 py-3">{movement.type}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 rounded-md text-xs font-semibold tracking-wide ${
                      movement.direction === 'In' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {movement.direction.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono font-medium">
                    {movement.direction === 'In' ? '+' : '-'}{movement.quantity}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{movement.referenceNumber || 'N/A'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {data && data.totalCount > 0 && (
        <div className="mt-4 flex justify-between items-center text-sm">
          <span className="text-gray-500">
            Showing page <span className="font-medium text-gray-900">{data.pageNumber}</span> of <span className="font-medium text-gray-900">{Math.ceil(data.totalCount / data.pageSize)}</span> ({data.totalCount} records)
          </span>
          <div className="space-x-2">
            <button 
              disabled={data.pageNumber === 1}
              onClick={() => handlePageChange(data.pageNumber - 1)}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>
            <button 
              disabled={data.pageNumber >= Math.ceil(data.totalCount / data.pageSize)}
              onClick={() => handlePageChange(data.pageNumber + 1)}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};