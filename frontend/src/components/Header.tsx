'use client';

import React from 'react';
import { usePricingStore } from '../store/usePricingStore';
import {
  Store,
  UploadCloud,
  RefreshCw,
  Layers,
  Plus
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    openUploadModal,
    openCreateModal,
    fetchRecords,
    fetchStats,
    isLoadingRecords
  } = usePricingStore();

  const handleRefresh = () => {
    fetchRecords();
    fetchStats();
  };

  return (
    <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 mb-7 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-xl">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
          <Store size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Retail Pricing Hub
          </h1>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
            <Layers size={13} />
            <span>Global Ingestion &amp; Record Governance &bull; 3,000 Stores Multi-Region</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
        <button
          className="p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition cursor-pointer"
          onClick={handleRefresh}
          title="Refresh Data & Metrics"
        >
          <RefreshCw size={15} className={isLoadingRecords ? 'animate-spin' : ''} />
        </button>

        <button
          id="btn-add-record"
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-sm font-semibold transition cursor-pointer"
          onClick={openCreateModal}
          title="Add New Pricing Record"
        >
          <Plus size={16} className="text-indigo-400" />
          <span>Add Record</span>
        </button>

        <button
          id="btn-upload-feed"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition transform hover:-translate-y-0.5 cursor-pointer"
          onClick={openUploadModal}
        >
          <UploadCloud size={16} />
          <span>Upload Pricing Feed</span>
        </button>
      </div>
    </header>
  );
};
