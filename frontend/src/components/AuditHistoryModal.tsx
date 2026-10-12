'use client';

import React from 'react';
import { usePricingStore } from '../store/usePricingStore';
import { X, History, ArrowRight, ShieldCheck, User } from 'lucide-react';

export const AuditHistoryModal: React.FC = () => {
  const { activeAuditRecord, closeAuditModal } = usePricingStore();

  if (!activeAuditRecord) return null;

  const logs = activeAuditRecord.audit_logs || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeAuditModal}>
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-base font-bold text-white">
            <History size={18} className="text-amber-400" />
            <span>Price Governance Audit Trail</span>
          </div>
          <button
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            onClick={closeAuditModal}
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="inline-flex px-2 py-0.5 rounded text-xs font-mono font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                {activeAuditRecord.store_id}
              </span>
              <span className="inline-flex px-2 py-0.5 rounded text-xs font-mono font-medium bg-sky-500/10 text-sky-300 border border-sky-500/30">
                {activeAuditRecord.sku}
              </span>
            </div>
            <p className="text-sm font-semibold text-white">{activeAuditRecord.product_name}</p>
            <p className="text-xs text-slate-400 mt-1">
              Current: <span className="font-mono font-bold text-emerald-400">${activeAuditRecord.price}</span> ({activeAuditRecord.currency}) &bull; Date: {activeAuditRecord.price_date}
            </p>
          </div>

          {logs.length === 0 ? (
            <div className="text-center py-8">
              <ShieldCheck size={32} className="text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-200">No manual modifications recorded</p>
              <p className="text-xs text-slate-500 mt-1">
                Reflects original feed state from {activeAuditRecord.source_file || 'direct store feed'}.
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
              {logs.map((log) => (
                <div key={log.id} className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 line-through font-mono">
                        ${log.old_price ?? '--'}
                      </span>
                      <ArrowRight size={13} className="text-indigo-400" />
                      <span className="font-mono font-bold text-emerald-400 text-sm">
                        ${log.new_price}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                      {log.change_type}
                    </span>
                  </div>

                  <p className="text-slate-300 italic mb-2">
                    &ldquo;{log.reason || 'No justification note'}&rdquo;
                  </p>

                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <User size={11} />
                      {log.modified_by}
                    </span>
                    <span>{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end px-6 py-4 border-t border-slate-800 bg-slate-950/40">
          <button
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            onClick={closeAuditModal}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
