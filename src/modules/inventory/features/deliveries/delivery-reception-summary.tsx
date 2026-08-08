import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2,
  AlertTriangle,
  Package,
  ArrowLeft,
  Loader2,
  Building2,
  HardHat,
  FileText,
  TrendingDown,
  TrendingUp,
  Minus,
} from "lucide-react";
import { getMaterialDisplay } from "../../utils/inventory-display";
import { useObraMZStore } from "@/store/obramz-store";
import type { Delivery, DeliveryItem, PurchaseOrder } from "@/lib/purchases";

interface DeliveryReceptionSummaryProps {
  delivery: Delivery;
  deliveryItems: DeliveryItem[];
  purchaseOrder?: PurchaseOrder;
  /** Mapa de quantidades aceites finais para confirmação */
  acceptedQuantities: Record<string, number>;
  /** Mapa de quantidades entregues pelo fornecedor */
  deliveredQuantities: Record<string, number>;
  /** Mapa de motivos de rejeição */
  rejectionReasons: Record<string, string>;
  loading: boolean;
  onBack: () => void;
  onConfirm: () => void;
}

export function DeliveryReceptionSummary({
  delivery,
  deliveryItems,
  purchaseOrder,
  acceptedQuantities,
  deliveredQuantities,
  rejectionReasons,
  loading,
  onBack,
  onConfirm,
}: DeliveryReceptionSummaryProps) {
  const materials = useObraMZStore((s) => s.materials || []);
  const obras = useObraMZStore((s) => s.obras || []);
  const warehouses = useObraMZStore((s) => s.warehouses || []);

  // Cálculos agregados
  const totalOrdered = deliveryItems.reduce((s, i) => s + (i.quantityExpected || 0), 0);
  const totalDelivered = deliveryItems.reduce((s, i) => s + (deliveredQuantities[i.id] ?? i.receivedBaseQuantity ?? 0), 0);
  const totalAccepted = deliveryItems.reduce((s, i) => s + (acceptedQuantities[i.id] ?? i.acceptedQuantity ?? 0), 0);
  const totalRejected = Math.max(0, totalDelivered - totalAccepted);
  const totalPending = Math.max(0, totalOrdered - totalAccepted);
  const receivedPct = totalOrdered > 0 ? Math.round((totalAccepted / totalOrdered) * 100) : 0;
  const difference = totalAccepted - totalOrdered;

  const divergences = deliveryItems.filter((i) => {
    const accepted = acceptedQuantities[i.id] ?? i.acceptedQuantity ?? 0;
    const rejected = (deliveredQuantities[i.id] ?? i.receivedBaseQuantity ?? 0) - accepted;
    return rejected > 0;
  });

  const docCount = delivery.documents?.length || 0;
  const isWarehouse = delivery.destinationType === "central_stock";

  const destLabel = isWarehouse
    ? (warehouses.find((w: any) => w.id === (delivery as any).destinationWarehouseId)?.name || "Armazém Central")
    : (obras.find((o: any) => o.id === delivery.destinationProjectId)?.name || delivery.destinationProjectId || "—");

  // Cartão de comparação: cor baseada na diferença
  const diffColor = difference === 0
    ? "text-emerald-600"
    : difference < 0
    ? "text-rose-600"
    : "text-amber-600";

  const DiffIcon = difference === 0 ? Minus : difference < 0 ? TrendingDown : TrendingUp;

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        <div>
          <h2 className="text-sm font-bold text-foreground">Resumo Final da Conferência</h2>
          <p className="text-xs text-muted-foreground">
            Reveja os totais antes de confirmar definitivamente a receção.
          </p>
        </div>
      </div>

      {/* 3 Cartões de Comparação Visual */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 border-blue-200/60 bg-blue-50/40">
          <div className="text-[11px] text-muted-foreground font-semibold uppercase mb-1">Pedido</div>
          <div className="text-2xl font-bold text-blue-700 font-mono">{totalOrdered}</div>
          <div className="text-[11px] text-blue-600 mt-0.5">unidades esperadas</div>
        </Card>

        <Card className={`p-4 ${receivedPct >= 100 ? "border-emerald-200/60 bg-emerald-50/40" : "border-amber-200/60 bg-amber-50/40"}`}>
          <div className="text-[11px] text-muted-foreground font-semibold uppercase mb-1">Recebido</div>
          <div className={`text-2xl font-bold font-mono ${receivedPct >= 100 ? "text-emerald-700" : "text-amber-700"}`}>
            {totalAccepted}
          </div>
          <div className={`text-[11px] mt-0.5 ${receivedPct >= 100 ? "text-emerald-600" : "text-amber-600"}`}>
            {receivedPct}% recebido
          </div>
          <Progress value={receivedPct} className="h-1 mt-1.5" />
        </Card>

        <Card className={`p-4 ${difference === 0 ? "border-emerald-200/60 bg-emerald-50/40" : difference < 0 ? "border-rose-200/60 bg-rose-50/40" : "border-amber-200/60 bg-amber-50/40"}`}>
          <div className="text-[11px] text-muted-foreground font-semibold uppercase mb-1">Diferença</div>
          <div className={`text-2xl font-bold font-mono flex items-center gap-1 ${diffColor}`}>
            <DiffIcon className="w-5 h-5" />
            {difference >= 0 ? "+" : ""}{difference}
          </div>
          <div className={`text-[11px] mt-0.5 ${diffColor}`}>
            {difference === 0 ? "Entrega completa" : difference < 0 ? `${Math.abs(difference)} em falta` : `${difference} a mais`}
          </div>
        </Card>
      </div>

      {/* Tabela por Material */}
      <Card className="border-border/60">
        <CardHeader className="py-2.5 px-4 bg-muted/20 border-b border-border/60">
          <CardTitle className="text-xs font-bold flex items-center gap-2">
            <Package className="w-3.5 h-3.5 text-primary" />
            Detalhe por Material
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/10 hover:bg-transparent text-[11px]">
                <TableHead>Material</TableHead>
                <TableHead className="text-right">Pedido</TableHead>
                <TableHead className="text-right">Entregue</TableHead>
                <TableHead className="text-right">Aceite</TableHead>
                <TableHead className="text-right">Rejeitado</TableHead>
                <TableHead className="text-right">Pendente</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveryItems.map((item) => {
                const mat = getMaterialDisplay(item.materialId, materials);
                const ordered = item.quantityExpected || 0;
                const delivered = deliveredQuantities[item.id] ?? item.receivedBaseQuantity ?? 0;
                const accepted = acceptedQuantities[item.id] ?? item.acceptedQuantity ?? 0;
                const rejected = Math.max(0, delivered - accepted);
                const pending = Math.max(0, ordered - accepted);
                const isOk = accepted >= ordered;

                return (
                  <TableRow key={item.id} className="text-xs hover:bg-muted/20">
                    <TableCell className="font-medium py-2">
                      <div>{mat.name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{mat.sku}</div>
                    </TableCell>
                    <TableCell className="text-right font-mono py-2">{ordered}</TableCell>
                    <TableCell className="text-right font-mono py-2">{delivered}</TableCell>
                    <TableCell className="text-right font-mono py-2 text-emerald-600 font-bold">{accepted}</TableCell>
                    <TableCell className="text-right font-mono py-2 text-rose-600">{rejected || "—"}</TableCell>
                    <TableCell className="text-right font-mono py-2 text-amber-600">{pending || "—"}</TableCell>
                    <TableCell className="py-2">
                      {isOk ? (
                        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">✓ Completo</Badge>
                      ) : rejected > 0 ? (
                        <Badge variant="outline" className="text-[10px] bg-rose-500/10 text-rose-600 border-rose-500/20">⚠ Divergência</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">◎ Parcial</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Rodapé de Contexto */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          {divergences.length > 0 ? <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
          {divergences.length > 0 ? `${divergences.length} divergência(s)` : "Sem divergências"}
        </span>
        <span className="flex items-center gap-1">
          <FileText className="w-3.5 h-3.5 text-primary" />
          {docCount > 0 ? `${docCount} documento(s) anexado(s)` : "Sem documentos"}
        </span>
        <span className="flex items-center gap-1">
          {isWarehouse ? <Building2 className="w-3.5 h-3.5 text-blue-500" /> : <HardHat className="w-3.5 h-3.5 text-amber-500" />}
          {isWarehouse ? "Armazém" : "Obra"}: {destLabel}
        </span>
        {purchaseOrder && (
          <span className="font-mono">{purchaseOrder.orderNumber}</span>
        )}
      </div>

      {/* Secção de Impacto da Operação */}
      <Card className="border-emerald-200/60 bg-emerald-50/30">
        <CardContent className="p-4 space-y-2">
          <p className="text-xs font-bold text-foreground mb-2">Ao confirmar, o sistema irá:</p>
          <div className="space-y-1.5 text-xs">
            {[
              "Atualizar o Stock imediatamente",
              "Atualizar os Materiais no módulo de Inventário",
              `Atualizar a ${isWarehouse ? "disponibilidade do Armazém" : "Obra e os seus materiais"}`,
              "Registar os Movimentos de Stock com data e utilizador",
              "Fechar definitivamente esta Entrega",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-2 mt-3 pt-3 border-t border-emerald-200/60 text-xs text-amber-700">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
            <span className="font-medium">Esta ação não pode ser anulada. O stock será atualizado imediatamente após a confirmação.</span>
          </div>
        </CardContent>
      </Card>

      {/* Botões de Confirmação */}
      <div className="flex items-center justify-between pt-2 border-t border-border/60">
        <Button size="sm" variant="outline" onClick={onBack} disabled={loading} className="gap-1.5 h-8 text-xs">
          <ArrowLeft className="w-3.5 h-3.5" />
          Rever Conferência
        </Button>
        <Button
          size="sm"
          onClick={onConfirm}
          disabled={loading || totalAccepted === 0}
          className="gap-1.5 h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
          id="btn-confirmar-final"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5" />
          )}
          Confirmar Receção Definitivamente
        </Button>
      </div>
    </div>
  );
}
