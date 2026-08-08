import React, { useMemo } from "react";
import { useObraMZStore } from "@/store/obramz-store";
import { inventoryStoreManager } from "../../store/inventory-store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";

interface MaterialComboboxProps {
  value: string;
  onValueChange: (materialId: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function MaterialCombobox({
  value,
  onValueChange,
  placeholder = "Selecione o Material...",
  className,
  disabled = false,
}: MaterialComboboxProps) {
  const materials = useObraMZStore((s) => s.materials || []);
  const storeState = inventoryStoreManager.getState();

  // Calcular stock total disponível por material O(N)
  const stockAvailableMap = useMemo(() => {
    const map = new Map<string, number>();
    Object.values(storeState.balances).forEach((b) => {
      const current = map.get(b.materialId) || 0;
      map.set(b.materialId, current + b.availableQuantity);
    });
    return map;
  }, [storeState.balances]);

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={`h-9 text-xs ${className || ""}`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {materials.length === 0 ? (
          <div className="p-3 text-xs text-muted-foreground text-center">Nenhum material cadastrado</div>
        ) : (
          materials.map((m) => {
            const totalAvail = stockAvailableMap.get(m.id) || 0;
            return (
              <SelectItem key={m.id} value={m.id} className="text-xs">
                <div className="flex items-center justify-between w-full gap-3">
                  <div className="flex items-center gap-2">
                    <Package className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="font-medium text-foreground">{m.name}</span>
                    <span className="text-[11px] text-muted-foreground">({m.sku || m.id})</span>
                  </div>
                  <Badge
                    variant={totalAvail > 0 ? "secondary" : "outline"}
                    className="text-[10px] ml-auto shrink-0 font-mono"
                  >
                    {totalAvail} {m.unit || "un"} disponívei{totalAvail === 1 ? "l" : "s"}
                  </Badge>
                </div>
              </SelectItem>
            );
          })
        )}
      </SelectContent>
    </Select>
  );
}
