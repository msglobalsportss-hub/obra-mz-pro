import React from "react";
import { formatMZN, formatDate } from "@/lib/format";
import type { StockMovement } from "@/lib/purchases";
import { stockMovementTypeLabel } from "@/lib/purchases";
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from "lucide-react";
import { useObraMZStore } from "@/store/obramz-store";

interface StockMovementListProps {
  movements: StockMovement[];
  title?: string;
  emptyMessage?: string;
}

export function StockMovementList({
  movements,
  title = "Histórico de Movimentos de Stock",
  emptyMessage = "Nenhum movimento de stock registado.",
}: StockMovementListProps) {
  const materials = useObraMZStore((s) => s.materials);
  const obras = useObraMZStore((s) => s.obras);

  if (movements.length === 0) {
    return (
      <div className="text-xs text-slate-500 text-center py-8 border border-dashed rounded-lg">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {title && (
        <div className="font-semibold text-xs text-slate-700 dark:text-slate-300">
          {title} ({movements.length})
        </div>
      )}

      <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <tr>
              <th className="p-2.5">Tipo</th>
              <th className="p-2.5">Material</th>
              <th className="p-2.5">Destino</th>
              <th className="p-2.5 text-right">Qtd (Base)</th>
              <th className="p-2.5 text-right">Custo Un.</th>
              <th className="p-2.5 text-right">Total</th>
              <th className="p-2.5">Data / Resp.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {movements.map((m) => {
              const mat = materials.find((item) => item.id === m.materialId);
              const project = m.destinationProjectId
                ? obras.find((o) => o.id === m.destinationProjectId)
                : null;

              const isEntrance = m.movementType === "purchase_receipt" || m.movementType === "adjustment_in" || m.movementType === "opening_balance";

              return (
                <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                  <td className="p-2.5 font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      {isEntrance ? (
                        <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <ArrowUpRight className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      )}
                      {stockMovementTypeLabel[m.movementType] || m.movementType}
                    </span>
                  </td>
                  <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200">
                    {mat?.name || m.materialId}
                  </td>
                  <td className="p-2.5">
                    {m.destinationLocationType === "central_stock" ? (
                      <span className="text-slate-600 dark:text-slate-400">Stock Central</span>
                    ) : (
                      <span className="text-blue-600 dark:text-blue-400 font-medium">
                        {project?.nome || "Obra"}
                      </span>
                    )}
                  </td>
                  <td className="p-2.5 text-right font-semibold text-slate-800 dark:text-slate-200">
                    {m.quantity}
                  </td>
                  <td className="p-2.5 text-right text-slate-600 dark:text-slate-400">
                    {formatMZN(m.unitCost)}
                  </td>
                  <td className="p-2.5 text-right font-semibold text-slate-900 dark:text-slate-100">
                    {formatMZN(m.totalCost)}
                  </td>
                  <td className="p-2.5 text-slate-500">
                    <div>{formatDate(m.movementDate)}</div>
                    {m.performedBy && <div className="text-[10px] text-slate-400">{m.performedBy}</div>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
