import { createFileRoute } from '@tanstack/react-router';
import { HealthCheckView } from '@/modules/inventory/features/health/health-check-view';

export const Route = createFileRoute('/app/inventory/health')({
  component: HealthCheckView,
});
