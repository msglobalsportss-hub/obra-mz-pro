import { createFileRoute } from '@tanstack/react-router';
import { InventoryDashboardView } from '@/modules/inventory/features/dashboard/inventory-dashboard-view';

export const Route = createFileRoute('/app/inventory/')({
  component: InventoryDashboardView,
});
