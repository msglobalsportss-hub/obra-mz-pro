import React from "react";
import { useObraMZStore } from "@/store/obramz-store";
import { DEFAULT_INITIAL_WAREHOUSES } from "@/lib/materials/warehouse";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Boxes } from "lucide-react";

interface WarehouseSelectorProps {
  value: string;
  onValueChange: (warehouseId: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function WarehouseSelector({
  value,
  onValueChange,
  placeholder = "Selecione o Armazém...",
  className,
  disabled = false,
}: WarehouseSelectorProps) {
  const warehouses = useObraMZStore((s) => s.warehouses || DEFAULT_INITIAL_WAREHOUSES);
  const activeWarehouses = warehouses.filter((w) => w.isActive);

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={`h-9 text-xs ${className || ""}`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {activeWarehouses.length === 0 ? (
          <div className="p-3 text-xs text-muted-foreground text-center">Nenhum armazém ativo</div>
        ) : (
          activeWarehouses.map((w) => (
            <SelectItem key={w.id} value={w.id} className="text-xs">
              <div className="flex items-center gap-2">
                <Boxes className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="font-medium">{w.name}</span>
                <span className="text-[11px] text-muted-foreground">({w.code})</span>
                {w.isMainWarehouse && (
                  <span className="text-[9px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-semibold ml-auto">
                    Principal
                  </span>
                )}
              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
