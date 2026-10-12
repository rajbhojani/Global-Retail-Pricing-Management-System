'use client';

import React, { useEffect } from 'react';
import { usePricingStore } from '../store/usePricingStore';
import {
  Database,
  Store,
  Tag,
  TrendingUp
} from 'lucide-react';

export const KpiMetrics: React.FC = () => {
  const { stats, isLoadingStats, fetchStats } = usePricingStore();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const formatNumber = (num?: number) => {
    if (num === undefined || num === null) return '--';
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return '--';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const cards = [
    {
      title: 'Total Records',
      value: isLoadingStats ? '...' : formatNumber(stats?.total_records),
      subtext: 'Persisted pricing feeds in PostgreSQL',
      icon: <Database size={18} className="text-indigo-400" />,
      borderHover: 'hover:border-indigo-500/50',
    },
    {
      title: 'Active Stores',
      value: isLoadingStats ? '...' : formatNumber(stats?.active_stores_count),
      subtext: 'Across 3,000 global chain locations',
      icon: <Store size={18} className="text-sky-400" />,
      borderHover: 'hover:border-sky-500/50',
    },
    {
      title: 'Catalog SKUs',
      value: isLoadingStats ? '...' : formatNumber(stats?.unique_skus_count),
      subtext: 'Distinct retail merchandise items',
      icon: <Tag size={18} className="text-emerald-400" />,
      borderHover: 'hover:border-emerald-500/50',
    },
    {
      title: 'Average Price',
      value: isLoadingStats ? '...' : formatCurrency(stats?.avg_price),
      subtext: `Min: ${formatCurrency(stats?.min_price)} • Max: ${formatCurrency(stats?.max_price)}`,
      icon: <TrendingUp size={18} className="text-amber-400" />,
      borderHover: 'hover:border-amber-500/50',
    },
  ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-7">
      {cards.map((c, i) => (
        <div
          key={i}
          className={`p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md transition duration-200 hover:-translate-y-0.5 shadow-lg ${c.borderHover}`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
              {c.title}
            </span>
            <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
              {c.icon}
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">
            {c.value}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {c.subtext}
          </div>
        </div>
      ))}
    </section>
  );
};
