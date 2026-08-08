/**
 * Vista de Ajustes de Stock: AdjustmentsListView
 * Categoria: features/adjustments
 *
 * Tabela de histórico de acertos e ajustes físico-contabilísticos (Seção 13).
 */

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { PageContainer } from "@/components/shared/page-container";
import { InventoryEmptyState } from "../../components/inventory-empty-state";
import { InventoryPermissionState } from "../../components/inventory-permission-state";
import { NewAdjustmentDialog } from "./new-adjustment-dialog";
import { useInventoryPermissions } from "../../hooks/use-inventory-permissions";
import { inventoryStoreManager } from "../../store/inventory-store";
import { formatDate, formatMZN } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, TrendingDown } from "lucide-react";

export function AdjustmentsListView() {
  const permissions = useInventoryPermissions();
  const [storeState, setStoreState] = useState(inventoryStoreManager.getState());
  const [openNewAdjustment, setOpenNewAdjustment] = useState(false);

  useEffect(() => {
    const unsubscribe = inventoryStoreManager.subscribe((s) => setStoreState(s));
    return () => unsubscribe();
  }, []);

  if (!permissions.canView) {
    return <InventoryPermissionState />;
  }

  const adjustmentMovements = storeState.movements.filter((m) =>
    m.movementType.includes("adjustment"),
  );

  return (
    <PageContainer>
      <PageHeader
        title="Ajustes e Acertos de Stock"
        description="Histórico auditável de acertos de inventário por contagem física, danos ou correções"
        breadcrumbs={[
          { label: "Início", href: "/app" },
          { label: "Inventário", href: "/app/inventory" },
          { label: "Ajustes" },
        ]}
        actions={
          permissions.canAdjust ? (
            <Button
              size="sm"
              onClick={() => setOpenNewAdjustment(true)}
              className="gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Ajuste</span>
            </Button>
          ) : undefined
        }
      />

      {adjustmentMovements.length === 0 ? (
        <InventoryEmptyState
          title="Nenhum ajuste registado"
          description="Não foram efetuados ajustes de stock."
          action={
            permissions.canAdjust ? (
              <Button size="sm" onClick={() => setOpenNewAdjustment(true)}>
                Registar Primeiro Ajuste
              </Button>
            ) : null
          }
        />
      ) : (
        <Card className="border-border/60">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo de Ajuste</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead className="text-right">Custo Total</TableHead>
                  <TableHead>Referência</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustmentMovements.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-xs">{formatDate(m.occurredAt)}</TableCell>
                    <TableCell className="text-xs font-semibold">{m.movementType}</TableCell>
                    <TableCell className="font-semibold text-foreground">{m.materialId}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {m.destinationLocationId || m.sourceLocationId}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {m.movementType.includes("in") ? "+" : "-"}
                      {m.quantity} un
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {formatMZN(m.totalCost)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{m.referenceId}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {openNewAdjustment && (
        <NewAdjustmentDialog open={openNewAdjustment} onOpenChange={setOpenNewAdjustment} />
      )}
    </PageContainer>
  );
}
