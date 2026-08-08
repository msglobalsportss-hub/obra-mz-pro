import { createFileRoute } from '@tanstack/react-router';
import { InventoryReportsView } from '@/modules/inventory/features/reports/inventory-reports-view';

export const Route = createFileRoute('/app/inventory/reports')({
  component: InventoryReportsView,
});
