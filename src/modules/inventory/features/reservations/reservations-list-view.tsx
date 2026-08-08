/**
 * Vista de Lista de Reservas: ReservationsListView
 * Categoria: features/reservations
 *
 * Exibe a lista de reservas ativas, parcialmente consumidas e libertadas (Seção 11).
 */

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { PageContainer } from "@/components/shared/page-container";
import { InventoryStatusBadge } from "../../components/inventory-status-badge";
import { InventoryEmptyState } from "../../components/inventory-empty-state";
import { InventoryPermissionState } from "../../components/inventory-permission-state";
import { CreateReservationDialog } from "./create-reservation-dialog";
import { ReleaseReservationDialog } from "./release-reservation-dialog";
import { ConsumeReservationDialog } from "./consume-reservation-dialog";
import { useInventoryPermissions } from "../../hooks/use-inventory-permissions";
import { inventoryStoreManager } from "../../store/inventory-store";
import { formatDate } from "@/lib/format";
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
import { Plus, Clock, Check, X } from "lucide-react";
import type { InventoryReservationView } from "../../store/inventory-store.types";

export function ReservationsListView() {
  const permissions = useInventoryPermissions();
  const [storeState, setStoreState] = useState(inventoryStoreManager.getState());

  const [openCreate, setOpenCreate] = useState(false);
  const [reservationToRelease, setReservationToRelease] = useState<InventoryReservationView | null>(
    null,
  );
  const [reservationToConsume, setReservationToConsume] = useState<InventoryReservationView | null>(
    null,
  );

  useEffect(() => {
    const unsubscribe = inventoryStoreManager.subscribe((s) => setStoreState(s));
    return () => unsubscribe();
  }, []);

  if (!permissions.canView) {
    return <InventoryPermissionState />;
  }

  const reservations = storeState.reservations;

  return (
    <PageContainer>
      <PageHeader
        title="Reservas de Stock"
        description="Gestão de reservas ativas, consumo parcial em obras e devoluções ao stock disponível"
        breadcrumbs={[
          { label: "Início", href: "/app" },
          { label: "Inventário", href: "/app/inventory" },
          { label: "Reservas" },
        ]}
        actions={
          permissions.canReserve ? (
            <Button size="sm" onClick={() => setOpenCreate(true)} className="gap-1.5 shadow-xs">
              <Plus className="w-4 h-4" />
              <span>Nova Reserva</span>
            </Button>
          ) : undefined
        }
      />

      {reservations.length === 0 ? (
        <InventoryEmptyState
          title="Nenhuma reserva registada"
          description="Não existem reservas ativas ou históricas no sistema."
          action={
            permissions.canReserve ? (
              <Button size="sm" onClick={() => setOpenCreate(true)}>
                Criar Primeira Reserva
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
                  <TableHead>ID da Reserva</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead className="text-right">Reservado</TableHead>
                  <TableHead className="text-right">Consumido</TableHead>
                  <TableHead className="text-right">Restante</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.id}</TableCell>
                    <TableCell className="font-semibold text-foreground">{r.materialId}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.locationId}</TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {r.reservedQuantity} un
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {r.consumedQuantity} un
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-emerald-600">
                      {r.remainingQuantity} un
                    </TableCell>
                    <TableCell>
                      <InventoryStatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {r.remainingQuantity > 0 && r.status === "active" && (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setReservationToConsume(r)}
                            className="h-8 text-xs gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Consumir</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setReservationToRelease(r)}
                            className="h-8 text-xs gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-500/10"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Libertar</span>
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {openCreate && <CreateReservationDialog open={openCreate} onOpenChange={setOpenCreate} />}
      {reservationToRelease && (
        <ReleaseReservationDialog
          open={!!reservationToRelease}
          onOpenChange={(open) => !open && setReservationToRelease(null)}
          reservation={reservationToRelease}
        />
      )}
      {reservationToConsume && (
        <ConsumeReservationDialog
          open={!!reservationToConsume}
          onOpenChange={(open) => !open && setReservationToConsume(null)}
          reservation={reservationToConsume}
        />
      )}
    </PageContainer>
  );
}
