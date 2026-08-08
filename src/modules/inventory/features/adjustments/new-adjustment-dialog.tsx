import React, { useState, useMemo } from "react";
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
import { inventoryStoreManager } from "../../store/inventory-store";
import { MaterialCombobox, InventoryLocationSelector } from "../../components/selectors";
import { toTenantId, toCompanyId } from "../../core/shared/primitives";
import { formatMZN } from "@/lib/format";
import { TrendingDown, Loader2, CheckCircle2, AlertTriangle, Calculator } from "lucide-react";

interface NewAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewAdjustmentDialog({ open, onOpenChange }: NewAdjustmentDialogProps) {
  const activeCompanyId = useObraMZStore((s) => s.activeCompanyId) ?? "COMP-1";
  const activeTenantId = useObraMZStore((s) => s.activeTenantId) ?? "TENANT-A";

  const materials = useObraMZStore((s) => s.materials || []);
  const warehouses = useObraMZStore((s) => s.warehouses || []);

  const [selectedMaterialId, setSelectedMaterialId] = useState(materials[0]?.id || "MAT-CEMENT");
  const [locationId, setLocationId] = useState(warehouses[0]?.id || "WH-MAIN");
  const [adjustmentType, setAdjustmentType] = useState<"positive" | "negative">("positive");
  const [quantityInput, setQuantityInput] = useState("5");
  const [reason, setReason] = useState("COUNT_CORRECTION");
  const [description, setDescription] = useState("");

  // Obter saldo atual na localização
  const currentBalance = useMemo(() => {
    const balances = Object.values(inventoryStoreManager.getState().balances);
    return balances.find((b) => b.materialId === selectedMaterialId && b.locationId === locationId);
  }, [selectedMaterialId, locationId]);

  const currentOnHand = currentBalance?.onHandQuantity || 0;
  const currentAverageCost = currentBalance?.averageCost || 0;

  const parsedQty = parseFloat(quantityInput) || 0;

  // Stock resultante
  const resultingOnHand = adjustmentType === "positive" ? currentOnHand + parsedQty : currentOnHand - parsedQty;
  const isInvalidNegativeStock = resultingOnHand < 0;

  // Impacto Financeiro
  const financialImpactMZN = parsedQty * currentAverageCost;

  const operation = useInventoryOperation(async (params) => {
    return inventoryActions.adjustStock({
      tenantId: toTenantId(activeTenantId),
      companyId: toCompanyId(activeCompanyId),
      correlationId: `adj-${Date.now()}`,
      idempotencyKey: params.idempotencyKey,
      timestamp: new Date().toISOString(),
      sourceModule: "adjustment_ui",
      materialId: selectedMaterialId,
      locationId,
      quantity: parsedQty,
      adjustmentType,
      unitCost: currentAverageCost,
      reason: `${reason}: ${description}`,
    });
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isInvalidNegativeStock) {
      alert("Ajustes negativos não podem deixar o stock físico abaixo de zero.");
      return;
    }
    if (!description.trim()) {
      alert("A justificativa detalhada do ajuste é obrigatória.");
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
          <DialogTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-purple-600" />
            <span>Acerto / Ajuste Físico-Contabilístico</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Corrija divergências de contagem física. Ajustes são imutáveis e auditados no Kardex.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2 text-xs">
          {operation.error && (
            <Alert variant="destructive" className="py-2 text-xs">
              <AlertDescription>{operation.error}</AlertDescription>
            </Alert>
          )}

          {operation.status === "completed" && (
            <Alert className="py-2 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Ajuste registado com sucesso!</span>
            </Alert>
          )}

          {isInvalidNegativeStock && (
            <Alert variant="destructive" className="py-2 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Ajuste inválido: o stock resultante não pode ser inferior a 0.</span>
            </Alert>
          )}

          {/* Tipo de Ajuste */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tipo de Ajuste *</Label>
              <Select value={adjustmentType} onValueChange={(v: any) => setAdjustmentType(v)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="positive" className="text-xs text-emerald-600 font-semibold">
                    + Positivo (Sobra)
                  </SelectItem>
                  <SelectItem value="negative" className="text-xs text-rose-600 font-semibold">
                    - Negativo (Perda/Quebra)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Motivo *</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COUNT_CORRECTION">Contagem Física (Inventário)</SelectItem>
                  <SelectItem value="DAMAGED">Danificado / Avaria</SelectItem>
                  <SelectItem value="EXPIRED">Prazo de Validade Expirado</SelectItem>
                  <SelectItem value="THEFT">Divergência de Estoque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Selecionar Material com Combobox Real */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Material *</Label>
            <MaterialCombobox value={selectedMaterialId} onValueChange={setSelectedMaterialId} />
          </div>

          {/* Selecionar Localização */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Localização *</Label>
            <InventoryLocationSelector value={locationId} onValueChange={setLocationId} />
          </div>

          {/* Quantidade */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Quantidade a Ajustar *</Label>
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

          {/* Cálculo do Stock Resultante e Impacto Financeiro */}
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Stock Atual: <strong>{currentOnHand}</strong></span>
              <span className="text-muted-foreground">Stock Resultante: <strong className={isInvalidNegativeStock ? "text-rose-600 font-bold" : "text-foreground"}>{resultingOnHand}</strong></span>
            </div>
            <div className="flex justify-between items-center text-xs pt-1 border-t border-purple-500/20">
              <span className="font-semibold text-purple-900 dark:text-purple-300 flex items-center gap-1">
                <Calculator className="w-3.5 h-3.5" />
                Impacto Financeiro:
              </span>
              <span className="font-mono font-bold text-purple-700 dark:text-purple-300">
                {adjustmentType === "positive" ? "+" : "-"}{formatMZN(financialImpactMZN)}
              </span>
            </div>
          </div>

          {/* Descrição Detalhada */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Descrição / Justificativa Auditada *</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva detalhadamente a justificativa para este acerto..."
              rows={2}
              className="text-xs"
              required
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={operation.loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={operation.loading || isInvalidNegativeStock || !description.trim()} className="gap-2 bg-purple-600 hover:bg-purple-700 text-white">
              {operation.loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Confirmar Ajuste Auditado</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
