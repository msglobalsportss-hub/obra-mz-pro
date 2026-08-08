import { createFileRoute } from '@tanstack/react-router';
import { MaterialDetailsView } from '@/modules/inventory/features/materials/material-details-view';

export const Route = createFileRoute('/app/inventory/materials/$materialId')({
  component: MaterialDetailsRouteComponent,
});

function MaterialDetailsRouteComponent() {
  const { materialId } = Route.useParams();
  return <MaterialDetailsView materialId={materialId} />;
}
