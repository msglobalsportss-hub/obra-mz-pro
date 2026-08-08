import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useObraMZStore } from "@/store/obramz-store";
import { formatMZN } from "@/lib/format";
import { calculateItemLineTotal } from "@/lib/purchases";
import { calculateBaseUnitPrice } from "@/lib/suppliers/supplier-utils";
import { Plus, Trash2 } from "lucide-react";

interface PurchaseOrderItemFormProps {
  supplierId: string;
  purchaseOrderId?: string;
  onAddItemDirect?: (item: any) => void;
  disabled?: boolean;
}

export function PurchaseOrderItemForm({
  supplierId,
  purchaseOrderId,
  onAddItemDirect,
  disabled = false,
}: PurchaseOrderItemFormProps) {
  const materials = useObraMZStore((s) => s.materials);
  const materialUnits = useObraMZStore((s) => s.materialUnits);
  const supplierMaterials = useObraMZStore((s) => s.supplierMaterials);
  const addPurchaseOrderItem = useObraMZStore((s) => s.addPurchaseOrderItem);

  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
  const [supplierMaterialId, setSupplierMaterialId] = useState<string>("");
  const [purchaseUnitId, setPurchaseUnitId] = useState<string>("");
  const [conversionFactor, setConversionFactor] = useState<number>(1);
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Filtrar fornecedores do material selecionado
  const activeMaterials = materials.filter((m) => m.status === "active");

  // Atualizar valores pré-preenchidos ao selecionar material
  useEffect(() => {
    if (!selectedMaterialId) return;

    const mat = materials.find((m) => m.id === selectedMaterialId);
    if (!mat) return;

    // Procurar relação comercial ativa do fornecedor
    const suppMat = supplierMaterials.find(
      (sm) => sm.materialId === selectedMaterialId && sm.supplierId === supplierId && sm.status === "active"
    );

    if (suppMat) {
      setSupplierMaterialId(suppMat.id);
      setPurchaseUnitId(suppMat.purchaseUnitId || mat.unitId);
      setConversionFactor(suppMat.conversionFactor || 1);
      setUnitPrice(suppMat.unitPrice || 0);
    } else {
      setSupplierMaterialId("");
      setPurchaseUnitId(mat.unitId);
      setConversionFactor(1);
      setUnitPrice(mat.referencePrice || mat.averagePrice || 0);
    }
  }, [selectedMaterialId, supplierId, materials, supplierMaterials]);

  const handleAdd = () => {
    setError(null);
    if (!selectedMaterialId) {
      setError("Selecione um material.");
      return;
    }
    if (quantity <= 0) {
      setError("A quantidade deve ser maior que zero.");
      return;
    }
    if (unitPrice <= 0) {
      setError("O preço unitário deve ser maior que zero.");
      return;
    }
    if (conversionFactor <= 0) {
      setError("O fator de conversão deve ser maior que zero.");
      return;
    }

    const mat = materials.find((m) => m.id === selectedMaterialId);
    const purchaseUnit = materialUnits.find((u) => u.id === purchaseUnitId);
    const baseUnit = materialUnits.find((u) => u.id === mat?.unitId);

    const itemPayload = {
      purchaseOrderId: purchaseOrderId || "__pending__",
      materialId: selectedMaterialId,
      supplierMaterialId: supplierMaterialId || undefined,
      descriptionSnapshot: mat?.name || "Material",
      brandSnapshot: mat?.preferredBrand || undefined,
      purchaseUnitId: purchaseUnitId || mat?.unitId || "unit-un",
      purchaseUnitSymbolSnapshot: purchaseUnit?.symbol || "un",
      baseUnitId: mat?.unitId || "unit-un",
      baseUnitSymbolSnapshot: baseUnit?.symbol || "un",
      conversionFactor,
      orderedPurchaseQuantity: quantity,
      unitPrice,
      notes: notes.trim() || undefined,
    };

    if (purchaseOrderId) {
      try {
        addPurchaseOrderItem(itemPayload);
      } catch (err: any) {
        setError(err.message);
        return;
      }
    } else if (onAddItemDirect) {
      onAddItemDirect(itemPayload);
    }

    // Reset campos do formulário
    setSelectedMaterialId("");
    setSupplierMaterialId("");
    setQuantity(1);
    setUnitPrice(0);
    setNotes("");
  };

  const selectedMat = materials.find((m) => m.id === selectedMaterialId);
  const baseUnitSymbol = materialUnits.find((u) => u.id === selectedMat?.unitId)?.symbol || "";
  const baseUnitPrice = calculateBaseUnitPrice(unitPrice, conversionFactor);
  const lineTotal = calculateItemLineTotal(quantity, unitPrice);

  return (
    <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-900/30 space-y-4">
      <div className="font-semibold text-sm text-slate-800 dark:text-slate-200">
        Adicionar Item ao Pedido
      </div>

      {error && (
        <div className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2 rounded border border-rose-200 dark:border-rose-900">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-1.5 md:col-span-2">
          <Label className="text-xs">Material *</Label>
          <Select
            value={selectedMaterialId}
            onValueChange={setSelectedMaterialId}
            disabled={disabled || !supplierId}
          >
            <SelectTrigger className="text-xs h-9">
              <SelectValue placeholder={supplierId ? "Selecione o material..." : "Selecione primeiro o fornecedor"} />
            </SelectTrigger>
            <SelectContent>
              {activeMaterials.map((m) => (
                <SelectItem key={m.id} value={m.id} className="text-xs">
                  {m.internalCode || m.sku || m.name} — {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Unidade de Compra</Label>
          <Select
            value={purchaseUnitId}
            onValueChange={setPurchaseUnitId}
            disabled={disabled || !selectedMaterialId}
          >
            <SelectTrigger className="text-xs h-9">
              <SelectValue placeholder="Unidade" />
            </SelectTrigger>
            <SelectContent>
              {materialUnits.map((u) => (
                <SelectItem key={u.id} value={u.id} className="text-xs">
                  {u.name} ({u.symbol})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Qtd. Pedida *</Label>
          <Input
            type="number"
            min="0.01"
            step="any"
            className="text-xs h-9"
            value={quantity || ""}
            onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
            disabled={disabled || !selectedMaterialId}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Preço Unitário (MZN) *</Label>
          <Input
            type="number"
            min="0"
            step="any"
            className="text-xs h-9"
            value={unitPrice || ""}
            onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
            disabled={disabled || !selectedMaterialId}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Fator Conversão</Label>
          <Input
            type="number"
            min="0.0001"
            step="any"
            className="text-xs h-9"
            value={conversionFactor || ""}
            onChange={(e) => setConversionFactor(parseFloat(e.target.value) || 1)}
            disabled={disabled || !selectedMaterialId}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-slate-500">Total do Item</Label>
          <div className="h-9 px-3 text-xs font-semibold flex items-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded">
            {formatMZN(lineTotal)}
          </div>
        </div>
      </div>

      {conversionFactor > 1 && baseUnitSymbol && (
        <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-blue-50/50 dark:bg-blue-950/20 p-2 rounded border border-blue-100 dark:border-blue-900/40">
          Conversão: 1 unidade de compra = {conversionFactor} {baseUnitSymbol} (Preço Base: {formatMZN(baseUnitPrice)} / {baseUnitSymbol})
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-1">
        <Input
          placeholder="Observações do item (opcional)"
          className="text-xs h-8 flex-1"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={disabled || !selectedMaterialId}
        />
        <Button
          type="button"
          size="sm"
          onClick={handleAdd}
          disabled={disabled || !selectedMaterialId || quantity <= 0 || unitPrice <= 0}
          className="h-8 text-xs gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Adicionar Item
        </Button>
      </div>
    </div>
  );
}
