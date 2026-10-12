'use client';

import React from 'react';
import { usePricingStore } from '../store/usePricingStore';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toasts, removeToast } = usePricingStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-md pointer-events-none">
      {toasts.map((t) => {
        const bg =
          t.type === 'success'
            ? 'bg-emerald-600/95 border-emerald-500/50 text-white'
            : t.type === 'error'
            ? 'bg-rose-600/95 border-rose-500/50 text-white'
            : 'bg-sky-600/95 border-sky-500/50 text-white';

        return (
          <div
            key={t.id}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md text-xs font-medium pointer-events-auto transition-all transform animate-in slide-in-from-right ${bg}`}
          >
            {t.type === 'success' && <CheckCircle2 size={16} className="shrink-0" />}
            {t.type === 'error' && <AlertCircle size={16} className="shrink-0" />}
            {t.type === 'info' && <Info size={16} className="shrink-0" />}
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              className="p-1 rounded hover:bg-black/20 text-white/80 hover:text-white transition cursor-pointer"
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
