'use client';

import React, { useState, useRef } from 'react';
import { usePricingStore } from '../store/usePricingStore';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export const UploadModal: React.FC = () => {
  const {
    isUploadModalOpen,
    closeUploadModal,
    uploadCSV,
    isUploading,
    uploadJobResult,
    uploadError
  } = usePricingStore();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isUploadModalOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv')) {
        setSelectedFile(file);
      } else {
        alert('Please select a valid .csv file');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    await uploadCSV(selectedFile);
  };

  const downloadSampleCSV = () => {
    const sampleContent = `Store ID,SKU,Product Name,Price,Date,Currency
STORE-0001,SKU-ELEC-1001,Sony WH-1000XM5 Wireless Headphones,349.99,2026-10-12,USD
STORE-0001,SKU-ELEC-1002,Apple iPhone 15 Pro 256GB Titanium,1099.00,2026-10-12,USD
STORE-0042,SKU-ELEC-1001,Sony WH-1000XM5 Wireless Headphones,299.00,2026-10-12,GBP
STORE-0105,SKU-GROC-2004,Ceremonial Grade Uji Matcha Powder 100g,2800.00,2026-10-12,JPY
STORE-0230,SKU-HOME-4001,Bavarian Whole Grain Sourdough Loaf 800g,4.80,2026-10-12,EUR
STORE-2999,SKU-APP-3005,Handwoven Silk Pashmina Shawl Maroon,4500.00,2026-10-12,INR`;
    const blob = new Blob([sampleContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_retail_pricing_feed.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeUploadModal}>
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-base font-bold text-white">
            <UploadCloud size={18} className="text-indigo-400" />
            <span>Upload Store Pricing Feed</span>
          </div>
          <button className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer" onClick={closeUploadModal}>
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-center p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 mb-5">
            <div>
              <span className="text-xs font-semibold text-indigo-300">Expected Columns:</span>
              <p className="text-[11px] text-slate-400">Store ID, SKU, Product Name, Price, Date, Currency</p>
            </div>
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
              onClick={downloadSampleCSV}
            >
              <Download size={13} />
              <span>Sample CSV</span>
            </button>
          </div>

          {!uploadJobResult ? (
            <>
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
                  dragActive
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-slate-700 bg-slate-950/40 hover:border-slate-600 hover:bg-slate-950/60'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="w-12 h-12 rounded-full bg-indigo-500/15 text-indigo-400 flex items-center justify-center mx-auto mb-3">
                  <FileSpreadsheet size={24} />
                </div>
                {selectedFile ? (
                  <div>
                    <p className="font-bold text-white text-sm">{selectedFile.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {(selectedFile.size / 1024).toFixed(1)} KB &bull; Click to replace
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-bold text-white text-sm">Drag &amp; drop CSV feed here</p>
                    <p className="text-xs text-slate-400 mt-0.5">or click to browse from local computer (up to 50MB)</p>
                  </div>
                )}
              </div>

              {uploadError && (
                <div className="flex items-center gap-2 p-3 mt-4 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                  <AlertTriangle size={15} />
                  <span>{uploadError}</span>
                </div>
              )}
            </>
          ) : (
            <div>
              <div className="text-center py-4 border-b border-slate-800 mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                  uploadJobResult.status === 'COMPLETED' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                }`}>
                  {uploadJobResult.status === 'COMPLETED' ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
                </div>
                <h3 className="text-base font-bold text-white">
                  Feed Processing {uploadJobResult.status === 'COMPLETED' ? 'Complete' : 'Failed'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {uploadJobResult.filename} &bull; Time: {uploadJobResult.duration_ms}ms
                </p>
              </div>

              <div className="grid grid-cols-4 gap-2.5 mb-4 text-center">
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Total</div>
                  <div className="text-lg font-extrabold text-white mt-0.5">{uploadJobResult.total_rows}</div>
                </div>
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25">
                  <div className="text-[10px] text-emerald-300 uppercase font-bold">Inserted</div>
                  <div className="text-lg font-extrabold text-emerald-400 mt-0.5">{uploadJobResult.inserted_rows}</div>
                </div>
                <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/25">
                  <div className="text-[10px] text-indigo-300 uppercase font-bold">Updated</div>
                  <div className="text-lg font-extrabold text-indigo-400 mt-0.5">{uploadJobResult.updated_rows}</div>
                </div>
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/25">
                  <div className="text-[10px] text-rose-300 uppercase font-bold">Errors</div>
                  <div className="text-lg font-extrabold text-rose-400 mt-0.5">{uploadJobResult.error_rows}</div>
                </div>
              </div>

              {uploadJobResult.error_summary && (
                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 max-h-32 overflow-y-auto">
                  <div className="text-[11px] font-bold text-rose-400 mb-1">Rejection Details:</div>
                  <pre className="text-[11px] font-mono text-slate-400 whitespace-pre-wrap">{uploadJobResult.error_summary}</pre>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/40">
          {!uploadJobResult ? (
            <>
              <button className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer" onClick={closeUploadModal} disabled={isUploading}>
                Cancel
              </button>
              <button
                id="btn-confirm-upload"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition cursor-pointer disabled:opacity-50"
                disabled={!selectedFile || isUploading}
                onClick={handleUpload}
              >
                <UploadCloud size={14} />
                <span>{isUploading ? 'Ingesting Batch...' : 'Ingest Feed'}</span>
              </button>
            </>
          ) : (
            <button className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition cursor-pointer" onClick={closeUploadModal}>
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
