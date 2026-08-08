import { createFileRoute } from '@tanstack/react-router';
import { StockListView } from '@/modules/inventory/features/stock/stock-list-view';

export const Route = createFileRoute('/app/inventory/stock')({
  component: StockListView,
});
