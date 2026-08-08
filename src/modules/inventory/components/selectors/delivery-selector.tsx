import React from "react";
import { useObraMZStore } from "@/store/obramz-store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Truck } from "lucide-react";

interface DeliverySelectorProps {
  value: string;
  onValueChange: (deliveryId: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function DeliverySelector({
  value,
  onValueChange,
  placeholder = "Selecione a Entrega / Guia...",
  className,
  disabled = false,
}: DeliverySelectorProps) {
  const deliveries = useObraMZStore((s) => s.deliveries || []);

  const pendingDeliveries = deliveries.filter((d) => d.status === "draft" || d.status === "pending");

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={`h-9 text-xs ${className || ""}`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {pendingDeliveries.length === 0 ? (
          <div className="p-3 text-xs text-muted-foreground text-center">Nenhuma entrega pendente</div>
        ) : (
          pendingDeliveries.map((d) => (
            <SelectItem key={d.id} value={d.id} className="text-xs">
              <div className="flex items-center gap-2">
                <Truck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="font-mono font-semibold">{d.deliveryNumber}</span>
                {d.deliveryNoteNumber && (
                  <span className="text-[11px] text-muted-foreground">(Guia: {d.deliveryNoteNumber})</span>
                )}
              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
