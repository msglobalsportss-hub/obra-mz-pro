import { createFileRoute } from '@tanstack/react-router';
import { AdjustmentsListView } from '@/modules/inventory/features/adjustments/adjustments-list-view';

export const Route = createFileRoute('/app/inventory/adjustments')({
  component: AdjustmentsListView,
});
