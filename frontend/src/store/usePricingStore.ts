import { create } from 'zustand';
import {
  PricingRecord,
  PricingSearchParams,
  PaginatedResponse,
  SystemStats,
  UploadJob,
  PricingAuditLog
} from '../types/pricing';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface PricingStoreState {
  filters: PricingSearchParams;
  records: PricingRecord[];
  totalRecords: number;
  totalPages: number;
  isLoadingRecords: boolean;
  recordsError: string | null;

  availableStores: string[];

  stats: SystemStats | null;
  isLoadingStats: boolean;

  isUploadModalOpen: boolean;
  isCreateModalOpen: boolean;
  isCreatingRecord: boolean;
  activeEditingRecord: PricingRecord | null;
  activeAuditRecord: PricingRecord | null;
  isSavingEdit: boolean;

  isUploading: boolean;
  uploadJobResult: UploadJob | null;
  uploadError: string | null;

  toasts: ToastMessage[];

  setFilters: (newFilters: Partial<PricingSearchParams>) => void;
  resetFilters: () => void;
  fetchRecords: () => Promise<void>;
  fetchStores: () => Promise<void>;
  fetchStats: () => Promise<void>;
  openCreateModal: () => void;
  closeCreateModal: () => void;
  createRecord: (payload: {
    store_id: string;
    sku: string;
    product_name: string;
    price: number;
    currency?: string;
    price_date: string;
  }) => Promise<boolean>;
  openEditModal: (record: PricingRecord) => void;
  closeEditModal: () => void;
  saveRecordEdit: (id: number, price: number, productName?: string, reason?: string) => Promise<boolean>;
  openAuditModal: (record: PricingRecord) => void;
  closeAuditModal: () => void;
  openUploadModal: () => void;
  closeUploadModal: () => void;
  uploadCSV: (file: File) => Promise<UploadJob | null>;
  deleteRecord: (id: number) => Promise<boolean>;
  addToast: (type: 'success' | 'error' | 'info', message: string) => void;
  removeToast: (id: string) => void;
}

const defaultFilters: PricingSearchParams = {
  store_id: '',
  sku: '',
  product_name: '',
  min_price: undefined,
  max_price: undefined,
  start_date: undefined,
  end_date: undefined,
  sort_by: 'price_date',
  sort_order: 'desc',
  page: 1,
  page_size: 25,
};

export const usePricingStore = create<PricingStoreState>((set, get) => ({
  filters: { ...defaultFilters },
  records: [],
  totalRecords: 0,
  totalPages: 1,
  isLoadingRecords: false,
  recordsError: null,

  availableStores: [],
  stats: null,
  isLoadingStats: false,

  isUploadModalOpen: false,
  isCreateModalOpen: false,
  isCreatingRecord: false,
  activeEditingRecord: null,
  activeAuditRecord: null,
  isSavingEdit: false,

  isUploading: false,
  uploadJobResult: null,
  uploadError: null,

  toasts: [],

  addToast: (type, message) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({ toasts: [...state.toasts, { id, type, message }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4500);
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
    get().fetchRecords();
  },

  resetFilters: () => {
    set({ filters: { ...defaultFilters } });
    get().fetchRecords();
  },

  fetchRecords: async () => {
    set({ isLoadingRecords: true, recordsError: null });
    const { filters } = get();

    const query = new URLSearchParams();
    if (filters.store_id) query.append('store_id', filters.store_id);
    if (filters.sku) query.append('sku', filters.sku);
    if (filters.product_name) query.append('product_name', filters.product_name);
    if (filters.min_price !== undefined && !isNaN(filters.min_price)) query.append('min_price', String(filters.min_price));
    if (filters.max_price !== undefined && !isNaN(filters.max_price)) query.append('max_price', String(filters.max_price));
    if (filters.start_date) query.append('start_date', filters.start_date);
    if (filters.end_date) query.append('end_date', filters.end_date);
    query.append('sort_by', filters.sort_by);
    query.append('sort_order', filters.sort_order);
    query.append('page', String(filters.page));
    query.append('page_size', String(filters.page_size));

    try {
      const res = await fetch(`${API_BASE}/api/v1/pricing?${query.toString()}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data: PaginatedResponse<PricingRecord> = await res.json();
      set({
        records: data.items,
        totalRecords: data.total,
        totalPages: data.total_pages,
        isLoadingRecords: false,
      });
    } catch (err: any) {
      set({
        isLoadingRecords: false,
        recordsError: err.message || 'Failed to fetch pricing records.',
      });
      get().addToast('error', 'Unable to fetch pricing records. Check API connection.');
    }
  },

  fetchStores: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/pricing/stores/list`);
      if (res.ok) {
        const stores = await res.json();
        set({ availableStores: stores });
      }
    } catch (e) {
      console.warn('Could not load stores autocomplete', e);
    }
  },

  fetchStats: async () => {
    set({ isLoadingStats: true });
    try {
      const res = await fetch(`${API_BASE}/api/v1/stats`);
      if (res.ok) {
        const data: SystemStats = await res.json();
        set({ stats: data, isLoadingStats: false });
      }
    } catch (err) {
      set({ isLoadingStats: false });
    }
  },

  openCreateModal: () => {
    set({ isCreateModalOpen: true });
  },

  closeCreateModal: () => {
    set({ isCreateModalOpen: false });
  },

  createRecord: async (payload) => {
    set({ isCreatingRecord: true });
    try {
      const res = await fetch(`${API_BASE}/api/v1/pricing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.detail || 'Failed to create pricing record');
      }

      set({ isCreatingRecord: false, isCreateModalOpen: false });
      get().addToast('success', `Created pricing record for ${payload.sku} in ${payload.store_id}`);
      await get().fetchRecords();
      await get().fetchStats();
      return true;
    } catch (err: any) {
      set({ isCreatingRecord: false });
      get().addToast('error', err.message || 'Error creating pricing record');
      return false;
    }
  },

  openEditModal: (record) => {
    set({ activeEditingRecord: record });
  },

  closeEditModal: () => {
    set({ activeEditingRecord: null });
  },

  saveRecordEdit: async (id, price, productName, reason) => {
    set({ isSavingEdit: true });
    try {
      const res = await fetch(`${API_BASE}/api/v1/pricing/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price,
          product_name: productName,
          reason: reason || 'Manual price revision',
          modified_by: 'Pricing Analyst',
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.detail || 'Failed to update record');
      }

      const updatedRecord: PricingRecord = await res.json();
      set({
        isSavingEdit: false,
        activeEditingRecord: null,
      });

      get().addToast('success', `Price updated to ${updatedRecord.price} (${updatedRecord.sku})`);
      await get().fetchRecords();
      await get().fetchStats();
      return true;
    } catch (err: any) {
      set({ isSavingEdit: false });
      get().addToast('error', err.message || 'Error updating price');
      return false;
    }
  },

  openAuditModal: (record) => {
    set({ activeAuditRecord: record });
  },

  closeAuditModal: () => {
    set({ activeAuditRecord: null });
  },

  openUploadModal: () => {
    set({ isUploadModalOpen: true, uploadJobResult: null, uploadError: null });
  },

  closeUploadModal: () => {
    set({ isUploadModalOpen: false });
  },

  uploadCSV: async (file: File) => {
    set({ isUploading: true, uploadError: null, uploadJobResult: null });
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE}/api/v1/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Upload failed');
      }

      const job: UploadJob = await res.json();
      set({ isUploading: false, uploadJobResult: job });

      get().addToast(
        job.status === 'COMPLETED' ? 'success' : 'error',
        `Feed processed: ${job.inserted_rows} inserted, ${job.updated_rows} updated, ${job.error_rows} errors.`
      );

      get().fetchRecords();
      get().fetchStats();
      get().fetchStores();
      return job;
    } catch (err: any) {
      set({ isUploading: false, uploadError: err.message || 'Feed upload failed' });
      get().addToast('error', err.message || 'CSV feed upload failed');
      return null;
    }
  },

  deleteRecord: async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/pricing/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');

      get().addToast('info', 'Record removed successfully.');
      await get().fetchRecords();
      await get().fetchStats();
      return true;
    } catch (err: any) {
      get().addToast('error', 'Failed to delete record.');
      return false;
    }
  },
}));
