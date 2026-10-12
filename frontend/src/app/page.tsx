'use client';

import { KpiMetrics } from '../components/KpiMetrics';
import { FilterBar } from '../components/FilterBar';
import { PricingTable } from '../components/PricingTable';
import { CreateRecordModal } from '../components/CreateRecordModal';
import { EditRecordModal } from '../components/EditRecordModal';
import { AuditHistoryModal } from '../components/AuditHistoryModal';
import { UploadModal } from '../components/UploadModal';

export default function Home() {
  return (
    <>
      <KpiMetrics />
      <FilterBar />
      <PricingTable />
      <CreateRecordModal />
      <EditRecordModal />
      <AuditHistoryModal />
      <UploadModal />
    </>
  );
}
