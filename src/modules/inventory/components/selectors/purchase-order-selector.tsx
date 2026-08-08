import React from "react";
import { useObraMZStore } from "@/store/obramz-store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart } from "lucide-react";

interface PurchaseOrderSelectorProps {
  value: string;
  onValueChange: (poId: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function PurchaseOrderSelector({
  value,
  onValueChange,
  placeholder = "Selecione o Pedido de Compra...",
  className,
  disabled = false,
}: PurchaseOrderSelectorProps) {
  const purchaseOrders = useObraMZStore((s) => s.purchaseOrders || []);
  const suppliers = useObraMZStore((s) => s.suppliers || []);
  const supplierMap = new Map(suppliers.map((s) => [s.id, s.name]));

  // Pedidos elegíveis para entrega (aprovados, enviados ou parcialmente recebidos)
  const eligiblePOs = purchaseOrders.filter(
    (p) => p.status === "approved" || p.status === "sent" || p.status === "partially_received"
  );

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={`h-9 text-xs ${className || ""}`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {eligiblePOs.length === 0 ? (
          <div className="p-3 text-xs text-muted-foreground text-center">
            Nenhum pedido de compra pendente de entrega
          </div>
        ) : (
          eligiblePOs.map((p) => {
            const supName = supplierMap.get(p.supplierId) || "Fornecedor";
            return (
              <SelectItem key={p.id} value={p.id} className="text-xs">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="font-mono font-semibold">{p.orderNumber}</span>
                  <span className="text-[11px] text-muted-foreground">({supName})</span>
                </div>
              </SelectItem>
            );
          })
        )}
      </SelectContent>
    </Select>
  );
}
