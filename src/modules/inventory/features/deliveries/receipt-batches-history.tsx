import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { getMaterialDisplay } from "../../utils/inventory-display";
import { useObraMZStore } from "@/store/obramz-store";
import { Layers, Calendar, User, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { ReceiptBatch } from "@/lib/purchases";

interface ReceiptBatchesHistoryProps {
  batches: ReceiptBatch[];
}

export function ReceiptBatchesHistory({ batches }: ReceiptBatchesHistoryProps) {
  const materials = useObraMZStore((s) => s.materials || []);

  if (!batches || batches.length === 0) {
    return (
      <Card className="border-border/60">
        <CardHeader className="py-3 px-4 bg-muted/20">
          <CardTitle className="text-xs font-bold flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <span>Histórico de Receções por Lote (0 lotes)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center text-xs text-muted-foreground">
          Ainda não foram efetuados lotes de receção parcial nesta entrega.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60">
      <CardHeader className="py-3 px-4 bg-muted/20 border-b border-border/60">
        <CardTitle className="text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <span>Histórico de Receções por Lote ({batches.length} {batches.length === 1 ? "lote" : "lotes"})</span>
          </div>
          <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600">
            Postagem Atómica no Engine
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {batches.map((batch, index) => (
          <div key={batch.id || index} className="p-3 border rounded-lg bg-background space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <Badge className="bg-primary text-primary-foreground text-[10px]">
                  {batch.batchNumber || `LOTE-${index + 1}`}
                </Badge>
                <span className="flex items-center gap-1 text-muted-foreground text-[11px]">
                  <Calendar className="w-3 h-3" />
                  {formatDate(batch.receivedAt)}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground text-[11px]">
                  <User className="w-3 h-3" />
                  {batch.receivedByUserName || "Fiel de Armazém"}
                </span>
              </div>

              {batch.movementIds && batch.movementIds.length > 0 && (
                <div className="flex items-center gap-1 text-[11px]">
                  <span className="text-muted-foreground">Movimentos:</span>
                  {batch.movementIds.map((mId) => (
                    <Link
                      key={mId}
                      to="/app/inventory/movements"
                      className="font-mono text-primary hover:underline flex items-center gap-0.5 bg-primary/10 px-1.5 py-0.5 rounded text-[10px]"
                    >
                      <span>{mId.substring(0, 10)}...</span>
                      <ArrowUpRight className="w-2.5 h-2.5" />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Tabela dos itens recebidos neste lote */}
            <div className="border rounded overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-transparent">
                    <TableHead className="text-[11px] py-1.5">Material</TableHead>
                    <TableHead className="text-[11px] py-1.5 text-right">Qtd Entregue</TableHead>
                    <TableHead className="text-[11px] py-1.5 text-right">Qtd Aceite</TableHead>
                    <TableHead className="text-[11px] py-1.5 text-right">Qtd Rejeitada</TableHead>
                    <TableHead className="text-[11px] py-1.5">Motivo de Rejeição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batch.items?.map((item) => {
                    const matName = getMaterialDisplay(item.materialId, materials).name;
                    return (
                      <TableRow key={item.id} className="hover:bg-muted/20 text-xs">
                        <TableCell className="py-1.5 font-medium">{matName}</TableCell>
                        <TableCell className="py-1.5 text-right font-mono">{item.deliveredQuantity}</TableCell>
                        <TableCell className="py-1.5 text-right font-mono text-emerald-600 font-bold">
                          {item.acceptedQuantity}
                        </TableCell>
                        <TableCell className="py-1.5 text-right font-mono text-rose-600">
                          {item.rejectedQuantity || 0}
                        </TableCell>
                        <TableCell className="py-1.5 text-muted-foreground text-[11px]">
                          {item.rejectionReason || "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
