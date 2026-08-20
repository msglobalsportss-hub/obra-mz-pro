/**
 * Página de Conferência Dedicada de Carga
 * Rota: /app/inventory/deliveries/$deliveryId/conferencia
 */

import React, { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useObraMZStore } from "@/store/obramz-store";
import { useDeliveriesUiStateStore } from "@/modules/inventory/store/deliveries-ui-state";
import { DeliveryConferenceSection } from "@/modules/inventory/features/deliveries/delivery-conference-section";
import { PageHeader } from "@/components/page-header";
import { PageContainer } from "@/components/shared/page-container";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import type { ReceiptBatch, DeliveryStatus } from "@/lib/purchases";

export const Route = createFileRoute(
  "/app/inventory/deliveries_/$deliveryId/conferencia"
)({
  component: ConferenciaPage,
});

function ConferenciaPage() {
  const { deliveryId } = Route.useParams();
  const navigate = useNavigate();

  const deliveries = useObraMZStore((s) => s.deliveries || []);
  const allDeliveryItems = useObraMZStore((s) => s.deliveryItems || []);
  const addReceiptBatchStore = useObraMZStore((s) => (s as any).addReceiptBatch);

  const conferenceState = useDeliveriesUiStateStore((s) => s.conferenceState);
  const setConferenceState = useDeliveriesUiStateStore((s) => s.setConferenceState);

  const delivery = deliveries.find((d) => d.id === deliveryId);
  const deliveryItems = allDeliveryItems.filter((i) => i.deliveryId === deliveryId);

  if (!delivery) {
    return (
      <PageContainer>
        <Card className="p-8 text-center text-muted-foreground space-y-3 border-destructive/30">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
          <p className="text-sm font-bold text-foreground">Entrega não encontrada</p>
          <p className="text-xs">A entrega com o código '{deliveryId}' não existe no sistema.</p>
        </Card>
      </PageContainer>
    );
  }

  const handleBatchProcessed = (batch: ReceiptBatch, newStatus: DeliveryStatus) => {
    if (addReceiptBatchStore) {
      addReceiptBatchStore(deliveryId, batch, newStatus);
    }
    navigate({ to: "/app/inventory/deliveries/$deliveryId", params: { deliveryId } });
  };

  return (
    <PageContainer>
      <PageHeader
        title={`Conferência Operacional — ${delivery.deliveryNumber}`}
        description="Registo físico e atómico de receção de carga"
        breadcrumbs={[
          { label: "Início", href: "/app" },
          { label: "Entregas", href: "/app/inventory/deliveries" },
          { label: delivery.deliveryNumber, href: `/app/inventory/deliveries/${deliveryId}` },
          { label: "Conferência" },
        ]}
      />

      <DeliveryConferenceSection
        delivery={delivery}
        deliveryItems={deliveryItems}
        conferenceState={conferenceState}
        onConferenceStateChange={setConferenceState}
        onBatchProcessed={handleBatchProcessed}
        onOpenSummary={() =>
          navigate({ to: "/app/inventory/deliveries/$deliveryId", params: { deliveryId } })
        }
        onClose={() =>
          navigate({ to: "/app/inventory/deliveries/$deliveryId", params: { deliveryId } })
        }
      />
    </PageContainer>
  );
}
