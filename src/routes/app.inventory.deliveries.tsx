import { createFileRoute } from '@tanstack/react-router';
import { DeliveriesReceiptsView } from '@/modules/inventory/features/deliveries/deliveries-receipts-view';

export const Route = createFileRoute('/app/inventory/deliveries')({
  component: DeliveriesReceiptsView,
});
