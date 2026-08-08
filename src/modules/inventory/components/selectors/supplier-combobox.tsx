import React from "react";
import { useObraMZStore } from "@/store/obramz-store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2 } from "lucide-react";

interface SupplierComboboxProps {
  value: string;
  onValueChange: (supplierId: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SupplierCombobox({
  value,
  onValueChange,
  placeholder = "Selecione o Fornecedor...",
  className,
  disabled = false,
}: SupplierComboboxProps) {
  const suppliers = useObraMZStore((s) => s.suppliers || []);

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={`h-9 text-xs ${className || ""}`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {suppliers.length === 0 ? (
          <div className="p-3 text-xs text-muted-foreground text-center">Nenhum fornecedor cadastrado</div>
        ) : (
          suppliers.map((s) => (
            <SelectItem key={s.id} value={s.id} className="text-xs">
              <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="font-medium">{s.name}</span>
                {s.nuit && <span className="text-[11px] text-muted-foreground">(NUIT: {s.nuit})</span>}
              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
