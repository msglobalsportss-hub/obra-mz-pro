import { createFileRoute } from '@tanstack/react-router';
import { TransfersListView } from '@/modules/inventory/features/transfers/transfers-list-view';

export const Route = createFileRoute('/app/inventory/transfers')({
  component: TransfersListView,
});
