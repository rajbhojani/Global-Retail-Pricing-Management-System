'use client';

import React, { useEffect } from 'react';
import { usePricingStore } from '../store/usePricingStore';
import { PricingRecord } from '../types/pricing';
import {
  Edit3,
  History,
  Trash2,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

export const PricingTable: React.FC = () => {
  const {
    records,
    totalRecords,
    totalPages,
    filters,
    setFilters,
    fetchRecords,
    isLoadingRecords,
    recordsError,
    openCreateModal,
    openEditModal,
    openAuditModal,
    deleteRecord
  } = usePricingStore();

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setFilters({ page: newPage });
    }
  };

  const handleSort = (field: string) => {
    if (filters.sort_by === field) {
      setFilters({
        sort_order: filters.sort_order === 'asc' ? 'desc' : 'asc',
        page: 1,
      });
    } else {
      setFilters({
        sort_by: field,
        sort_order: 'desc',
        page: 1,
      });
    }
  };

  const renderSortIndicator = (field: string) => {
    if (filters.sort_by === field) {
      return filters.sort_order === 'asc' ? (
        <ArrowUp size={12} className="text-indigo-400 shrink-0" />
      ) : (
        <ArrowDown size={12} className="text-indigo-400 shrink-0" />
      );
    }
    return <ArrowUpDown size={12} className="text-slate-600 group-hover:text-slate-400 shrink-0 transition" />;
  };

  const formatPrice = (price: number, currency: string = 'USD') => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD',
      }).format(price);
    } catch {
      return `$${Number(price).toFixed(2)}`;
    }
  };

  const startRecord = (filters.page - 1) * filters.page_size + 1;
  const endRecord = Math.min(filters.page * filters.page_size, totalRecords);

  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md shadow-xl overflow-hidden mb-8">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/40">
        <div className="text-base font-bold text-white">Pricing Records Database</div>
        <div className="flex items-center gap-3">
          <button
            id="btn-table-add-record"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition cursor-pointer"
            onClick={openCreateModal}
            title="Create new pricing record"
          >
            <span>+ Add Record</span>
          </button>
          <div className="text-xs text-slate-400 bg-slate-800/80 border border-slate-700/60 px-3 py-1 rounded-full font-medium">
            {totalRecords > 0 ? (
              <span>Showing {startRecord} - {endRecord} of {totalRecords.toLocaleString()} records</span>
            ) : (
              <span>0 records found</span>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950/40 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <th
                className="px-5 py-3.5 cursor-pointer select-none hover:text-white transition group"
                onClick={() => handleSort('store_id')}
                title="Sort by Store ID"
              >
                <div className="flex items-center gap-1.5">
                  <span>Store ID</span>
                  {renderSortIndicator('store_id')}
                </div>
              </th>
              <th
                className="px-5 py-3.5 cursor-pointer select-none hover:text-white transition group"
                onClick={() => handleSort('sku')}
                title="Sort by SKU"
              >
                <div className="flex items-center gap-1.5">
                  <span>SKU</span>
                  {renderSortIndicator('sku')}
                </div>
              </th>
              <th
                className="px-5 py-3.5 cursor-pointer select-none hover:text-white transition group"
                onClick={() => handleSort('product_name')}
                title="Sort by Product Name"
              >
                <div className="flex items-center gap-1.5">
                  <span>Product Name</span>
                  {renderSortIndicator('product_name')}
                </div>
              </th>
              <th
                className="px-5 py-3.5 cursor-pointer select-none hover:text-white transition group"
                onClick={() => handleSort('price_date')}
                title="Sort by Effective Date"
              >
                <div className="flex items-center gap-1.5">
                  <span>Effective Date</span>
                  {renderSortIndicator('price_date')}
                </div>
              </th>
              <th
                className="px-5 py-3.5 cursor-pointer select-none hover:text-white transition group"
                onClick={() => handleSort('price')}
                title="Sort by Price"
              >
                <div className="flex items-center gap-1.5">
                  <span>Price</span>
                  {renderSortIndicator('price')}
                </div>
              </th>
              <th className="px-5 py-3.5">Currency</th>
              <th className="px-5 py-3.5">Audit Trail</th>
              <th className="px-5 py-3.5">Feed Source</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {isLoadingRecords ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-slate-400 text-sm">
                  Loading retail pricing records...
                </td>
              </tr>
            ) : recordsError ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-rose-400 text-sm">
                  <div className="flex items-center justify-center gap-2">
                    <AlertCircle size={18} />
                    <span>{recordsError}</span>
                  </div>
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-16">
                  <FileSpreadsheet size={36} className="text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-300 font-semibold text-sm">
                    No pricing records match the selected criteria.
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    Try adjusting your search criteria or upload a new CSV pricing feed.
                  </p>
                </td>
              </tr>
            ) : (
              records.map((r: PricingRecord) => (
                <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/25">
                      {r.store_id}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-sky-500/10 text-sky-300 border border-sky-500/25">
                      {r.sku}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-medium text-slate-200 text-sm max-w-xs truncate">
                    {r.product_name}
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 font-mono text-xs">
                    {r.price_date}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      {formatPrice(r.price, r.currency)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-400 font-semibold">
                    {r.currency}
                  </td>
                  <td className="px-5 py-3.5">
                    {r.audit_logs && r.audit_logs.length > 0 ? (
                      <button
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition cursor-pointer"
                        onClick={() => openAuditModal(r)}
                        title="View price modification history"
                      >
                        <History size={11} />
                        <span>{r.audit_logs.length} revision{r.audit_logs.length > 1 ? 's' : ''}</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-500">Original</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs text-slate-500 max-w-[120px] truncate block">
                      {r.source_file || 'Direct Feed'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        id={`btn-edit-record-${r.id}`}
                        className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 border border-slate-700/60 transition cursor-pointer"
                        onClick={() => openEditModal(r)}
                        title="Edit Price & Details"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        id={`btn-audit-record-${r.id}`}
                        className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-amber-400 hover:text-amber-300 border border-slate-700/60 transition cursor-pointer"
                        onClick={() => openAuditModal(r)}
                        title="View Change History"
                      >
                        <History size={14} />
                      </button>
                      <button
                        id={`btn-delete-record-${r.id}`}
                        className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-rose-400 hover:text-rose-300 border border-slate-700/60 transition cursor-pointer"
                        onClick={() => {
                          if (confirm(`Delete record for ${r.sku} in ${r.store_id}?`)) {
                            deleteRecord(r.id);
                          }
                        }}
                        title="Delete Record"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800/80 bg-slate-950/40 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Page Size:</span>
          <select
            id="page-size-select"
            className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            value={filters.page_size}
            onChange={(e) => setFilters({ page_size: Number(e.target.value), page: 1 })}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-prev-page"
            className={`p-1.5 rounded-md border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 transition ${
              filters.page <= 1 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
            }`}
            disabled={filters.page <= 1}
            onClick={() => handlePageChange(filters.page - 1)}
          >
            <ChevronLeft size={15} />
          </button>
          <span className="px-2 font-medium text-slate-400">
            Page {filters.page} of {totalPages || 1}
          </span>
          <button
            id="btn-next-page"
            className={`p-1.5 rounded-md border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 transition ${
              filters.page >= totalPages ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
            }`}
            disabled={filters.page >= totalPages}
            onClick={() => handlePageChange(filters.page + 1)}
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
