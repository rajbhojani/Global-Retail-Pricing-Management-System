'use client';

import React, { useState, useEffect } from 'react';
import { usePricingStore } from '../store/usePricingStore';
import { X, Save, AlertCircle } from 'lucide-react';

export const EditRecordModal: React.FC = () => {
  const {
    activeEditingRecord,
    closeEditModal,
    saveRecordEdit,
    isSavingEdit
  } = usePricingStore();

  const [price, setPrice] = useState<string>('');
  const [productName, setProductName] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (activeEditingRecord) {
      setPrice(String(activeEditingRecord.price));
      setProductName(activeEditingRecord.product_name);
      setReason('');
      setValidationError(null);
    }
  }, [activeEditingRecord]);

  if (!activeEditingRecord) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      setValidationError('Price must be a valid positive number.');
      return;
    }
    if (!productName.trim()) {
      setValidationError('Product Name cannot be blank.');
      return;
    }

    setValidationError(null);
    await saveRecordEdit(
      activeEditingRecord.id,
      numPrice,
      productName.trim(),
      reason.trim() || 'Manual revision'
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeEditModal}>
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="text-base font-bold text-white">Edit Pricing Record</div>
          <button
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            onClick={closeEditModal}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {validationError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                <AlertCircle size={15} />
                <span>{validationError}</span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Store ID</span>
                <p className="font-mono font-semibold text-indigo-300 mt-0.5">{activeEditingRecord.store_id}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">SKU Code</span>
                <p className="font-mono font-semibold text-sky-300 mt-0.5">{activeEditingRecord.sku}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Price Date</span>
                <p className="font-mono text-slate-400 mt-0.5">{activeEditingRecord.price_date}</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1" htmlFor="edit-record-price">
                Updated Price ({activeEditingRecord.currency}) *
              </label>
              <input
                id="edit-record-price"
                className="w-full px-3.5 py-2.5 text-base font-mono font-bold bg-slate-950/80 border border-slate-800 rounded-lg text-emerald-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Original price: {activeEditingRecord.price} {activeEditingRecord.currency}
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1" htmlFor="edit-record-product-name">
                Product Title *
              </label>
              <input
                id="edit-record-product-name"
                className="w-full px-3 py-2 text-sm bg-slate-950/80 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                type="text"
                required
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1" htmlFor="edit-record-reason">
                Modification Justification (Audit Log)
              </label>
              <textarea
                id="edit-record-reason"
                className="w-full px-3 py-2 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                rows={2}
                placeholder="e.g. Promotional price match, supplier cost adjustment..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/40">
            <button
              type="button"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              onClick={closeEditModal}
              disabled={isSavingEdit}
            >
              Cancel
            </button>
            <button
              id="btn-save-record-edit"
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition cursor-pointer disabled:opacity-50"
              disabled={isSavingEdit}
            >
              <Save size={14} />
              <span>{isSavingEdit ? 'Saving...' : 'Save & Audit'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
