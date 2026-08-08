import { createFileRoute } from '@tanstack/react-router';
import { ReservationsListView } from '@/modules/inventory/features/reservations/reservations-list-view';

export const Route = createFileRoute('/app/inventory/reservations')({
  component: ReservationsListView,
});
