'use client';

import React, { useState, useEffect } from 'react';
import { usePricingStore } from '../store/usePricingStore';
import {
  Search,
  Filter,
  RotateCcw,
  SlidersHorizontal,
  Calendar,
  DollarSign
} from 'lucide-react';

export const FilterBar: React.FC = () => {
  const {
    filters,
    setFilters,
    resetFilters
  } = usePricingStore();

  const [localStoreId, setLocalStoreId] = useState(filters.store_id || '');
  const [localSku, setLocalSku] = useState(filters.sku || '');
  const [localProduct, setLocalProduct] = useState(filters.product_name || '');
  const [localMinPrice, setLocalMinPrice] = useState(filters.min_price !== undefined ? String(filters.min_price) : '');
  const [localMaxPrice, setLocalMaxPrice] = useState(filters.max_price !== undefined ? String(filters.max_price) : '');
  const [localStartDate, setLocalStartDate] = useState(filters.start_date || '');
  const [localEndDate, setLocalEndDate] = useState(filters.end_date || '');

  useEffect(() => {
    setLocalStoreId(filters.store_id || '');
    setLocalSku(filters.sku || '');
    setLocalProduct(filters.product_name || '');
    setLocalMinPrice(filters.min_price !== undefined ? String(filters.min_price) : '');
    setLocalMaxPrice(filters.max_price !== undefined ? String(filters.max_price) : '');
    setLocalStartDate(filters.start_date || '');
    setLocalEndDate(filters.end_date || '');
  }, [filters]);

  const handleApplySearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFilters({
      store_id: localStoreId.trim() || undefined,
      sku: localSku.trim() || undefined,
      product_name: localProduct.trim() || undefined,
      min_price: localMinPrice ? parseFloat(localMinPrice) : undefined,
      max_price: localMaxPrice ? parseFloat(localMaxPrice) : undefined,
      start_date: localStartDate || undefined,
      end_date: localEndDate || undefined,
      page: 1,
    });
  };

  const handleReset = () => {
    setLocalStoreId('');
    setLocalSku('');
    setLocalProduct('');
    setLocalMinPrice('');
    setLocalMaxPrice('');
    setLocalStartDate('');
    setLocalEndDate('');
    resetFilters();
  };

  const activeFilterCount = [
    Boolean(filters.store_id),
    Boolean(filters.sku),
    Boolean(filters.product_name),
    filters.min_price !== undefined,
    filters.max_price !== undefined,
    Boolean(filters.start_date),
    Boolean(filters.end_date),
  ].filter(Boolean).length;

  const inputClass =
    'w-full px-3 py-2 text-sm bg-slate-950/80 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition [color-scheme:dark]';
  const labelClass = 'text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5';

  return (
    <section className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md shadow-lg mb-7">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Filter size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Multi-Criteria Search &amp; Governance Filters
            </h2>
            <p className="text-xs text-slate-400">
              Filter by store, SKU, merchandise name, price limits, and date ranges
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              {activeFilterCount} active filter{activeFilterCount > 1 ? 's' : ''}
            </span>
          )}
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
            onClick={handleReset}
            title="Reset All Filters"
          >
            <RotateCcw size={13} />
            <span>Reset All</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleApplySearch} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass} htmlFor="filter-store-id">
              <span>Store ID</span>
            </label>
            <input
              id="filter-store-id"
              className={inputClass}
              type="text"
              placeholder="e.g. STORE-0001"
              autoComplete="off"
              value={localStoreId}
              onChange={(e) => setLocalStoreId(e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="filter-sku">
              <span>SKU Code</span>
            </label>
            <input
              id="filter-sku"
              className={inputClass}
              type="text"
              placeholder="e.g. SKU-ELEC-1001"
              value={localSku}
              onChange={(e) => setLocalSku(e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="filter-product-name">
              <span>Product Name</span>
            </label>
            <input
              id="filter-product-name"
              className={inputClass}
              type="text"
              placeholder="e.g. Headphones, iPhone, 4K TV..."
              value={localProduct}
              onChange={(e) => setLocalProduct(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end pt-1">
          <div className="lg:col-span-3">
            <label className={labelClass}>
              <DollarSign size={13} className="text-emerald-400" />
              <span>Price Range (USD)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                id="filter-min-price"
                className={inputClass}
                type="number"
                step="0.01"
                min="0"
                placeholder="Min $"
                value={localMinPrice}
                onChange={(e) => setLocalMinPrice(e.target.value)}
              />
              <input
                id="filter-max-price"
                className={inputClass}
                type="number"
                step="0.01"
                min="0"
                placeholder="Max $"
                value={localMaxPrice}
                onChange={(e) => setLocalMaxPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="lg:col-span-4">
            <label className={labelClass}>
              <Calendar size={13} className="text-sky-400" />
              <span>Effective Date Range</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                id="filter-start-date"
                className={`${inputClass} min-w-0`}
                type="date"
                value={localStartDate}
                onChange={(e) => setLocalStartDate(e.target.value)}
                title="Start Date (From)"
              />
              <input
                id="filter-end-date"
                className={`${inputClass} min-w-0`}
                type="date"
                value={localEndDate}
                onChange={(e) => setLocalEndDate(e.target.value)}
                title="End Date (To)"
              />
            </div>
          </div>

          <div className="lg:col-span-3">
            <label className={labelClass}>
              <SlidersHorizontal size={13} className="text-indigo-400" />
              <span>Sort Results</span>
            </label>
            <div className="grid grid-cols-5 gap-2">
              <div className="col-span-3">
                <select
                  id="sort-by-select"
                  className={inputClass}
                  value={filters.sort_by}
                  onChange={(e) => setFilters({ sort_by: e.target.value, page: 1 })}
                >
                  <option value="price_date" className="bg-slate-900 text-white">Price Date</option>
                  <option value="price" className="bg-slate-900 text-white">Price</option>
                  <option value="store_id" className="bg-slate-900 text-white">Store ID</option>
                  <option value="sku" className="bg-slate-900 text-white">SKU Code</option>
                  <option value="product_name" className="bg-slate-900 text-white">Product Name</option>
                  <option value="updated_at" className="bg-slate-900 text-white">Last Updated</option>
                </select>
              </div>
              <div className="col-span-2">
                <select
                  id="sort-order-select"
                  className={inputClass}
                  value={filters.sort_order}
                  onChange={(e) => setFilters({ sort_order: e.target.value as 'asc' | 'desc', page: 1 })}
                >
                  <option value="desc" className="bg-slate-900 text-white">DESC</option>
                  <option value="asc" className="bg-slate-900 text-white">ASC</option>
                </select>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <button
              type="submit"
              id="btn-apply-filters"
              className="w-full h-[38px] flex items-center justify-center gap-2 px-4 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition cursor-pointer"
            >
              <Search size={15} />
              <span>Apply Filters</span>
            </button>
          </div>
        </div>
      </form>
    </section>
  );
};
