import { createFileRoute } from '@tanstack/react-router';
import { MovementsHistoryView } from '@/modules/inventory/features/movements/movements-history-view';

export const Route = createFileRoute('/app/inventory/movements')({
  component: MovementsHistoryView,
});
