import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useInventoryOperation } from "../../hooks/use-inventory-operation";
import { inventoryActions } from "../../application/actions/action-container";
import { useObraMZStore } from "@/store/obramz-store";
import { MaterialCombobox, InventoryLocationSelector } from "../../components/selectors";
import { toTenantId, toCompanyId } from "../../core/shared/primitives";
import { PackagePlus, Loader2, CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";

interface ManualReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Os 6 Motivos Excecionais Autorizados
const ALLOWED_MANUAL_REASONS = [
  { value: "INITIAL_STOCK", label: "Stock Inicial" },
  { value: "DONATION", label: "Doação Recebida" },
  { value: "RETURN", label: "Devolução de Obra / Cliente" },
  { value: "AUTHORIZED_NO_PO", label: "Entrada sem Pedido Autorizada (Urgência)" },
  { value: "MIGRATION", label: "Migração de Dados Legacy" },
  { value: "ADMIN_CORRECTION", label: "Correção Administrativa Auditada" },
];

export function ManualReceiptDialog({ open, onOpenChange }: ManualReceiptDialogProps) {
  const activeCompanyId = useObraMZStore((s) => s.activeCompanyId) ?? "COMP-1";
  const activeTenantId = useObraMZStore((s) => s.activeTenantId) ?? "TENANT-A";

  const materials = useObraMZStore((s) => s.materials || []);
  const warehouses = useObraMZStore((s) => s.warehouses || []);

  const [selectedMaterialId, setSelectedMaterialId] = useState(materials[0]?.id || "MAT-CEMENT");
  const [destinationLocationId, setDestinationLocationId] = useState(warehouses[0]?.id || "WH-MAIN");
  const [quantityInput, setQuantityInput] = useState("10");
  const [unitCostInput, setUnitCostInput] = useState("500");
  const [reason, setReason] = useState("INITIAL_STOCK");
  const [description, setDescription] = useState("");
  const [externalDoc, setExternalDoc] = useState("");

  const parsedQty = parseFloat(quantityInput) || 0;
  const parsedCost = parseFloat(unitCostInput) || 0;

  const operation = useInventoryOperation(async (params) => {
    return inventoryActions.receiveStock({
      tenantId: toTenantId(activeTenantId),
      companyId: toCompanyId(activeCompanyId),
      correlationId: `manual-${Date.now()}`,
      idempotencyKey: params.idempotencyKey,
      timestamp: new Date().toISOString(),
      sourceModule: "manual_entry_ui",
      materialId: selectedMaterialId,
      destinationLocationId,
      quantity: parsedQty,
      unitCost: parsedCost,
      invoiceNumber: externalDoc || `MOTIVO-${reason}`,
    });
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      alert("A descrição detalhada da entrada manual é obrigatória.");
      return;
    }
    if (parsedQty <= 0) {
      alert("A quantidade deve ser um número positivo.");
      return;
    }

    const res = await operation.execute();
    if (res && res.success) {
      setTimeout(() => onOpenChange(false), 1200);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-700">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <span>Entrada Manual de Inventário (Excecional)</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Esta operação insere stock sem passar por Pedido de Compra. Requer motivo justificado e permissão elevada.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2 text-xs">
          {/* Alerta de Orientação */}
          <Alert className="py-2 bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <AlertDescription>
              Para compras normais de fornecedores, utilize Pedido de Compra ➔ Entrega ➔ Confirmar Receção.
            </AlertDescription>
          </Alert>

          {operation.error && (
            <Alert variant="destructive" className="py-2 text-xs">
              <AlertDescription>{operation.error}</AlertDescription>
            </Alert>
          )}

          {operation.status === "completed" && (
            <Alert className="py-2 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Entrada manual registada e auditada com sucesso!</span>
            </Alert>
          )}

          {/* Motivo Excecional Autorizado */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Motivo Excecional Autorizado *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALLOWED_MANUAL_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value} className="text-xs">
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selecionar Material com Combobox Real */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Material *</Label>
            <MaterialCombobox value={selectedMaterialId} onValueChange={setSelectedMaterialId} />
          </div>

          {/* Selecionar Destino */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Destino Real *</Label>
            <InventoryLocationSelector value={destinationLocationId} onValueChange={setDestinationLocationId} />
          </div>

          {/* Quantidade e Custo Unitário */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Quantidade *</Label>
              <Input
                type="number"
                step="any"
                min="0.0001"
                value={quantityInput}
                onChange={(e) => setQuantityInput(e.target.value)}
                required
                className="text-xs font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Custo Unitário (MZN) *</Label>
              <Input
                type="number"
                step="any"
                min="0"
                value={unitCostInput}
                onChange={(e) => setUnitCostInput(e.target.value)}
                required
                className="text-xs font-mono"
              />
            </div>
          </div>

          {/* Descrição Detalhada */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Descrição / Justificativa Auditada *</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva a razão excecional para realizar esta entrada sem pedido de compra..."
              rows={2}
              className="text-xs"
              required
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={operation.loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={operation.loading || !description.trim()} className="gap-2 bg-rose-600 hover:bg-rose-700 text-white">
              {operation.loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Registar Entrada Manual Auditada</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
