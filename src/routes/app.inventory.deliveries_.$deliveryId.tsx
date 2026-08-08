import { createFileRoute } from "@tanstack/react-router";
import { DeliveryDetailsView } from "@/modules/inventory/features/deliveries/delivery-details-view";

export const Route = createFileRoute("/app/inventory/deliveries_/$deliveryId")({
  component: DeliveryDetailsRouteComponent,
});

function DeliveryDetailsRouteComponent() {
  const { deliveryId } = Route.useParams();
  return <DeliveryDetailsView deliveryId={deliveryId} />;
}
