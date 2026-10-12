export interface PricingAuditLog {
  id: number;
  record_id?: number;
  store_id: string;
  sku: string;
  old_price?: number;
  new_price: number;
  change_type: string;
  reason?: string;
  modified_by: string;
  created_at: string;
}

export interface PricingRecord {
  id: number;
  store_id: string;
  sku: string;
  product_name: string;
  price: number;
  currency: string;
  price_date: string;
  source_file?: string;
  created_at: string;
  updated_at: string;
  audit_logs: PricingAuditLog[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface PricingSearchParams {
  store_id?: string;
  sku?: string;
  product_name?: string;
  min_price?: number;
  max_price?: number;
  start_date?: string;
  end_date?: string;
  sort_by: string;
  sort_order: 'asc' | 'desc';
  page: number;
  page_size: number;
}

export interface UploadJob {
  id: string;
  filename: string;
  file_size_bytes: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  total_rows: number;
  inserted_rows: number;
  updated_rows: number;
  error_rows: number;
  error_summary?: string;
  duration_ms: number;
  created_at: string;
  completed_at?: string;
}

export interface SystemStats {
  total_records: number;
  active_stores_count: number;
  unique_skus_count: number;
  avg_price?: number;
  min_price?: number;
  max_price?: number;
  earliest_price_date?: string;
  latest_price_date?: string;
  recent_jobs: UploadJob[];
}

export interface CSVPreviewData {
  headers: string[];
  detected_mapping: Record<string, string>;
  preview_rows: Record<string, string>[];
}
