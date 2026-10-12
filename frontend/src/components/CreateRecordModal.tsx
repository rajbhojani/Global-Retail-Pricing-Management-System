'use client';

import React, { useState } from 'react';
import { usePricingStore } from '../store/usePricingStore';
import { X, PlusCircle, AlertCircle, Building2, Tag, ShoppingBag, Calendar, DollarSign } from 'lucide-react';

export const CreateRecordModal: React.FC = () => {
  const {
    isCreateModalOpen,
    closeCreateModal,
    createRecord,
    isCreatingRecord
  } = usePricingStore();

  const [storeId, setStoreId] = useState('');
  const [sku, setSku] = useState('');
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [priceDate, setPriceDate] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isCreateModalOpen && !priceDate) {
      setPriceDate(new Date().toISOString().split('T')[0]);
    }
  }, [isCreateModalOpen, priceDate]);

  if (!isCreateModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!storeId.trim()) {
      setValidationError('Store ID is required (e.g. STORE-0001).');
      return;
    }
    if (!sku.trim()) {
      setValidationError('SKU Code is required (e.g. SKU-ELEC-1001).');
      return;
    }
    if (!productName.trim()) {
      setValidationError('Product Name cannot be blank.');
      return;
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      setValidationError('Price must be a valid positive number greater than 0.');
      return;
    }
    if (!priceDate) {
      setValidationError('Effective Date is required.');
      return;
    }

    setValidationError(null);
    const success = await createRecord({
      store_id: storeId.trim(),
      sku: sku.trim(),
      product_name: productName.trim(),
      price: numPrice,
      currency,
      price_date: priceDate,
    });

    if (success) {
      setStoreId('');
      setSku('');
      setProductName('');
      setPrice('');
      setPriceDate('');
    }
  };

  const inputClass =
    'w-full px-3 py-2 text-sm bg-slate-950/80 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition [color-scheme:dark]';
  const labelClass = 'text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={closeCreateModal}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <PlusCircle size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Create New Pricing Record</h3>
              <p className="text-xs text-slate-400">Insert pricing feed entry directly via backend API</p>
            </div>
          </div>
          <button
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            onClick={closeCreateModal}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {validationError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="create-store-id">
                <Building2 size={13} className="text-indigo-400" />
                <span>Store ID *</span>
              </label>
              <input
                id="create-store-id"
                className={inputClass}
                type="text"
                placeholder="e.g. STORE-0001"
                autoComplete="off"
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                required
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="create-sku">
                <Tag size={13} className="text-sky-400" />
                <span>SKU Code *</span>
              </label>
              <input
                id="create-sku"
                className={inputClass}
                type="text"
                placeholder="e.g. SKU-ELEC-1001"
                autoComplete="off"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="create-product-name">
              <ShoppingBag size={13} className="text-violet-400" />
              <span>Product Name *</span>
            </label>
            <input
              id="create-product-name"
              className={inputClass}
              type="text"
              placeholder="e.g. Sony WH-1000XM5 Wireless Headphones"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass} htmlFor="create-price">
                <DollarSign size={13} className="text-emerald-400" />
                <span>Price *</span>
              </label>
              <input
                id="create-price"
                className={inputClass}
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="create-currency">
                <span>Currency</span>
              </label>
              <select
                id="create-currency"
                className={inputClass}
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
                <option value="AUD">AUD ($)</option>
                <option value="JPY">JPY (¥)</option>
              </select>
            </div>

            <div>
              <label className={labelClass} htmlFor="create-price-date">
                <Calendar size={13} className="text-sky-400" />
                <span>Effective Date *</span>
              </label>
              <input
                id="create-price-date"
                className={inputClass}
                type="date"
                value={priceDate}
                onChange={(e) => setPriceDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              onClick={closeCreateModal}
              disabled={isCreatingRecord}
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-submit-create-record"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition cursor-pointer disabled:opacity-50"
              disabled={isCreatingRecord}
            >
              <PlusCircle size={14} />
              <span>{isCreatingRecord ? 'Creating...' : 'Create Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
