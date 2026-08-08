import React from "react";
import { useObraMZStore } from "@/store/obramz-store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HardHat } from "lucide-react";

interface ProjectSelectorProps {
  value: string;
  onValueChange: (projectId: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function ProjectSelector({
  value,
  onValueChange,
  placeholder = "Selecione a Obra...",
  className,
  disabled = false,
}: ProjectSelectorProps) {
  const obras = useObraMZStore((s) => s.obras || []);
  const activeObras = obras.filter((o) => o.estado === "em_andamento" || o.estado === "planeada");

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={`h-9 text-xs ${className || ""}`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {activeObras.length === 0 ? (
          <div className="p-3 text-xs text-muted-foreground text-center">Nenhuma obra ativa</div>
        ) : (
          activeObras.map((o) => (
            <SelectItem key={o.id} value={o.id} className="text-xs">
              <div className="flex items-center gap-2">
                <HardHat className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="font-medium">{o.nome}</span>
                {o.localizacao && <span className="text-[11px] text-muted-foreground">({o.localizacao})</span>}
              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
