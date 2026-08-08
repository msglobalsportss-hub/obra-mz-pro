import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { PageContainer } from "@/components/shared/page-container";
import { InventoryEmptyState } from "../../components/inventory-empty-state";
import { InventoryPermissionState } from "../../components/inventory-permission-state";
import { useInventoryPermissions } from "../../hooks/use-inventory-permissions";
import { inventoryStoreManager } from "../../store/inventory-store";
import { useObraMZStore } from "@/store/obramz-store";
import { formatDate } from "@/lib/format";
import { getMaterialDisplay, getLocationDisplay } from "../../utils/inventory-display";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeftRight, CheckCircle2, Plus, Truck, Clock } from "lucide-react";
import { NewTransferDialog } from "./new-transfer-dialog";
import { ConfirmTransferReceiptDialog } from "./confirm-transfer-receipt-dialog";

export function TransfersListView() {
  const permissions = useInventoryPermissions();
  const [storeState, setStoreState] = useState(inventoryStoreManager.getState());

  const materials = useObraMZStore((s) => s.materials || []);
  const warehouses = useObraMZStore((s) => s.warehouses || []);
  const obras = useObraMZStore((s) => s.obras || []);

  const [openNewTransferModal, setOpenNewTransferModal] = useState(false);
  const [selectedTransferToConfirm, setSelectedTransferToConfirm] = useState<{
    id: string;
    sourceLocationId: string;
    destinationLocationId: string;
    materialId: string;
    quantitySent: number;
  } | null>(null);

  useEffect(() => {
    const unsubscribe = inventoryStoreManager.subscribe((s) => setStoreState(s));
    return () => unsubscribe();
  }, []);

  if (!permissions.canView) {
    return <InventoryPermissionState />;
  }

  // Filtrar movimentos de transferência
  const transferMovements = storeState.movements.filter((m) => m.movementType.includes("transfer"));

  // Agrupar movimentos de transferência em pares ou exibi-los como transferências em trânsito
  const transitBalances = Object.values(storeState.balances).filter((b) => b.locationId.includes("TRANSIT") && b.onHandQuantity > 0);

  return (
    <PageContainer>
      <PageHeader
        title="Transferências Internas entre Armazéns e Obras"
        description="Acompanhamento em 2 etapas com retenção de stock em trânsito e verificação de divergências"
        breadcrumbs={[
          { label: "Início", href: "/app" },
          { label: "Inventário", href: "/app/inventory" },
          { label: "Transferências" },
        ]}
        actions={
          permissions.canTransfer && (
            <Button size="sm" onClick={() => setOpenNewTransferModal(true)} className="gap-1.5">
              <Plus className="w-4 h-4" />
              <span>Nova Transferência</span>
            </Button>
          )
        }
      />

      {/* Lista de Stock Retido em Trânsito (Aguardando Confirmação no Destino) */}
      {transitBalances.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5 mb-6">
          <CardContent className="p-4">
            <h3 className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 mb-3">
              <Truck className="w-4 h-4 text-amber-600" />
              <span>Transferências Atualmente em Trânsito (Aguardando Confirmação)</span>
            </h3>
            <div className="divide-y divide-amber-500/20 text-xs">
              {transitBalances.map((tb) => {
                const matDisplay = getMaterialDisplay(tb.materialId, materials);
                return (
                  <div key={tb.id} className="py-2 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-foreground">{matDisplay.name}</span>
                      <span className="text-[11px] text-muted-foreground block">
                        Quantidade Retida em Trânsito: {tb.onHandQuantity} {matDisplay.unit}
                      </span>
                    </div>
                    <Button
                      size="xs"
                      onClick={() =>
                        setSelectedTransferToConfirm({
                          id: tb.id,
                          sourceLocationId: tb.locationId,
                          destinationLocationId: "PROJ-1",
                          materialId: tb.materialId,
                          quantitySent: tb.onHandQuantity,
                        })
                      }
                      className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirmar Chegada no Destino</span>
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico Geral de Transferências com Timeline Visual */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          {transferMovements.length === 0 ? (
            <InventoryEmptyState
              title="Nenhuma transferência registada"
              description="Utilize o botão 'Nova Transferência' para despachar stock da Origem para o Trânsito."
              action={
                permissions.canTransfer ? (
                  <Button size="sm" onClick={() => setOpenNewTransferModal(true)}>
                    Nova Transferência
                  </Button>
                ) : null
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data Efetiva</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Origem {"->"} Destino</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead>Timeline de Progresso Visual</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transferMovements.map((m) => {
                  const matDisplay = getMaterialDisplay(m.materialId, materials);
                  const destDisplay = getLocationDisplay(m.destinationLocationId || m.sourceLocationId, warehouses, obras);

                  const isOut = m.movementType === "transfer_out";

                  return (
                    <TableRow key={m.id} className="hover:bg-muted/30">
                      <TableCell className="text-xs">{formatDate(m.occurredAt)}</TableCell>
                      <TableCell>
                        <div className="font-semibold text-foreground">{matDisplay.name}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">{matDisplay.sku}</div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{destDisplay.label}</TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {isOut ? "-" : "+"}{m.quantity} {matDisplay.unit}
                      </TableCell>
                      <TableCell>
                        {/* Timeline Visual em 3 Passos */}
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold">
                          <span className="text-emerald-600">✓ Despachada</span>
                          <span className="text-muted-foreground">➔</span>
                          <span className={isOut ? "text-amber-600 font-bold" : "text-emerald-600"}>
                            {isOut ? "🟢 Em Trânsito" : "✓ Em Trânsito"}
                          </span>
                          <span className="text-muted-foreground">➔</span>
                          <span className={!isOut ? "text-emerald-600 font-bold" : "text-muted-foreground"}>
                            {!isOut ? "✓ Recebida" : "Pendente"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={!isOut ? "default" : "outline"} className="text-[10px]">
                          {!isOut ? "Concluída" : "Em Trânsito"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modais */}
      {openNewTransferModal && (
        <NewTransferDialog open={openNewTransferModal} onOpenChange={setOpenNewTransferModal} />
      )}
      {selectedTransferToConfirm && (
        <ConfirmTransferReceiptDialog
          open={!!selectedTransferToConfirm}
          onOpenChange={(open) => !open && setSelectedTransferToConfirm(null)}
          transfer={selectedTransferToConfirm}
        />
      )}
    </PageContainer>
  );
}
