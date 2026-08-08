import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Package } from "lucide-react";
import type { DeliveryItem } from "@/lib/purchases";
import { getMaterialDisplay } from "../../utils/inventory-display";
import { useObraMZStore } from "@/store/obramz-store";

interface DeliveryPendingItemsCardProps {
  items: DeliveryItem[];
}

export function DeliveryPendingItemsCard({ items }: DeliveryPendingItemsCardProps) {
  const materials = useObraMZStore((s) => s.materials || []);

  const totalCount = items.length;
  const pendingItems = items.filter((item) => {
    const accepted = item.acceptedQuantity || 0;
    const expected = item.quantityExpected || 1;
    return accepted < expected;
  });

  const completedCount = totalCount - pendingItems.length;
  const isAllConferenced = pendingItems.length === 0 && totalCount > 0;

  // Gerar barra textual tipo ■■■■■■■■□□ (10 blocos)
  const filledBlocks = totalCount > 0 ? Math.round((completedCount / totalCount) * 10) : 0;
  const emptyBlocks = 10 - filledBlocks;
  const blockString = "■".repeat(filledBlocks) + "□".repeat(emptyBlocks);

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="py-3 px-4 bg-muted/20 border-b border-border/60">
        <CardTitle className="text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            <span>Progresso da Conferência de Materiais</span>
          </div>
          <span className="font-mono text-[11px] font-semibold text-primary">
            {completedCount} de {totalCount} materiais
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {/* Barra de Progresso Textual e Porcentagem */}
        <div className="p-3 bg-muted/30 rounded-lg border border-border/50 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">Materiais Conferidos</span>
            <span className="font-mono font-bold text-foreground">{completedCount} / {totalCount}</span>
          </div>
          <div className="flex items-center justify-between font-mono text-xs tracking-widest text-primary font-bold">
            <span>{blockString}</span>
            <span className="text-[11px] font-semibold text-muted-foreground">
              {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Status "Ainda Falta" ou "Tudo Concluído" */}
        {isAllConferenced ? (
          <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Todos os materiais conferidos! Prontos para confirmação.</span>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-amber-700 dark:text-amber-400">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>Ainda por conferir ({pendingItems.length})</span>
              </div>
              <Badge variant="outline" className="text-[10px] bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400 font-mono">
                Faltam {pendingItems.length} material(is)
              </Badge>
            </div>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
              {pendingItems.map((item) => {
                const mat = getMaterialDisplay(item.materialId, materials);
                const accepted = item.acceptedQuantity || 0;
                const expected = item.quantityExpected || 1;

                return (
                  <li
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded border border-amber-200/60 dark:border-amber-900/30 bg-amber-50/40 dark:bg-amber-950/20 text-xs"
                  >
                    <span className="font-medium text-foreground truncate">{mat.name}</span>
                    <span className="font-mono text-[11px] text-muted-foreground shrink-0 ml-2">
                      {accepted}/{expected} {mat.unit}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
