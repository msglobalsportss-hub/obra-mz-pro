import { createFileRoute } from '@tanstack/react-router';
import { RebuildBalancesView } from '@/modules/inventory/features/rebuild/rebuild-balances-view';

export const Route = createFileRoute('/app/inventory/rebuild')({
  component: RebuildBalancesView,
});
