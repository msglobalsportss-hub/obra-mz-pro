/**
 * TODO — Bloco 3: Migrar DeliveryConferenceSection para esta página dedicada.
 *
 * Esta rota está preparada para receber o componente DeliveryConferenceSection
 * sem necessidade de refactoring — o contrato do componente já é desacoplado.
 *
 * URL: /app/inventory/deliveries/$deliveryId/conferencia
 *
 * Para activar:
 * 1. Importar DeliveryConferenceSection
 * 2. Ler deliveryId dos params da rota
 * 3. Ligar aos handlers do useObraMZStore
 * 4. Atualizar o botão [Conferir Carga] na DeliveryActionBar para navegar aqui
 */

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/app/inventory/deliveries_/$deliveryId/conferencia"
)({
  component: ConferenciaPage,
});

function ConferenciaPage() {
  const { deliveryId } = Route.useParams();

  return (
    <div className="p-8 text-center text-muted-foreground space-y-2">
      <p className="text-sm font-bold">Página de Conferência Dedicada</p>
      <p className="text-xs">Entrega: {deliveryId}</p>
      <p className="text-xs">
        Em desenvolvimento — Bloco 3. A conferência está disponível na Ficha de Entrega.
      </p>
    </div>
  );
}
