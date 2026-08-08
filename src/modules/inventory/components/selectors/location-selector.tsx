import React, { useMemo } from "react";
import { useObraMZStore } from "@/store/obramz-store";
import { DEFAULT_INITIAL_WAREHOUSES } from "@/lib/materials/warehouse";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Boxes, HardHat, Truck } from "lucide-react";

interface InventoryLocationSelectorProps {
  value: string;
  onValueChange: (locationId: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  includeAllOption?: boolean;
  includeTransitOption?: boolean;
}

export function InventoryLocationSelector({
  value,
  onValueChange,
  placeholder = "Selecione a Localização...",
  className,
  disabled = false,
  includeAllOption = false,
  includeTransitOption = false,
}: InventoryLocationSelectorProps) {
  const warehouses = useObraMZStore((s) => s.warehouses || DEFAULT_INITIAL_WAREHOUSES);
  const obras = useObraMZStore((s) => s.obras || []);

  const activeWarehouses = warehouses.filter((w) => w.isActive);
  const activeObras = obras.filter((o) => o.estado === "em_andamento" || o.estado === "planeada");

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={`h-9 text-xs ${className || ""}`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-80">
        {includeAllOption && (
          <SelectItem value="ALL" className="text-xs font-semibold">
            Todas as Localizações
          </SelectItem>
        )}

        {includeTransitOption && (
          <SelectItem value="LOC-TRANSIT" className="text-xs font-medium text-amber-600">
            <div className="flex items-center gap-2">
              <Truck className="w-3.5 h-3.5 text-amber-500" />
              <span>Stock Em Trânsito</span>
            </div>
          </SelectItem>
        )}

        <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/40 my-1">
          Armazéns Centrais
        </div>
        {activeWarehouses.map((w) => (
          <SelectItem key={w.id} value={w.id} className="text-xs pl-4">
            <div className="flex items-center gap-2">
              <Boxes className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="font-medium">Armazém: {w.name}</span>
              <span className="text-[11px] text-muted-foreground">({w.code})</span>
            </div>
          </SelectItem>
        ))}

        <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/40 my-1">
          Obras / Estaleiros
        </div>
        {activeObras.map((o) => (
          <SelectItem key={`LOC-PROJ-${o.id}`} value={`LOC-PROJ-${o.id}`} className="text-xs pl-4">
            <div className="flex items-center gap-2">
              <HardHat className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="font-medium">Obra: {o.nome}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
