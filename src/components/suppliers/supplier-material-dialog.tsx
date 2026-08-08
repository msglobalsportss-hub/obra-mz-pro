import { useState, useEffect } from "react";
import { useObraMZStore } from "@/store/obramz-store";
import type { SupplierMaterial } from "@/lib/suppliers";
import { calculateBaseUnitPrice } from "@/lib/suppliers";
import { formatMZN } from "@/lib/format";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface SupplierMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string;
  relationshipToEdit?: SupplierMaterial | null;
  defaultMaterialId?: string;
}

export function SupplierMaterialDialog({
  open,
  onOpenChange,
  supplierId,
  relationshipToEdit,
  defaultMaterialId,
}: SupplierMaterialDialogProps) {
  const materials = useObraMZStore((s) => s.materials || []);
  const materialUnits = useObraMZStore((s) => s.materialUnits || []);
  const addSupplierMaterial = useObraMZStore((s) => s.addSupplierMaterial);
  const updateSupplierMaterial = useObraMZStore((s) => s.updateSupplierMaterial);

  const [materialId, setMaterialId] = useState("");
  const [supplierCode, setSupplierCode] = useState("");
  const [brand, setBrand] = useState("");
  const [purchaseUnitId, setPurchaseUnitId] = useState("");
  const [conversionFactor, setConversionFactor] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [minimumOrderQuantity, setMinimumOrderQuantity] = useState("");
  const [leadTimeDays, setLeadTimeDays] = useState("");
  const [commercialConditions, setCommercialConditions] = useState("");
  const [isPreferred, setIsPreferred] = useState(false);
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [reason, setReason] = useState("");

  const activeMaterials = materials.filter((m) => m.status === "active" || m.id === relationshipToEdit?.materialId);
  const activeUnits = materialUnits.filter((u) => u.status === "active" || u.id === relationshipToEdit?.purchaseUnitId);

  const selectedMaterial = materials.find((m) => m.id === materialId);
  const selectedBaseUnit = materialUnits.find((u) => u.id === selectedMaterial?.unitId);
  const selectedPurchaseUnit = materialUnits.find((u) => u.id === purchaseUnitId);

  useEffect(() => {
    if (relationshipToEdit) {
      setMaterialId(relationshipToEdit.materialId || "");
      setSupplierCode(relationshipToEdit.supplierCode || "");
      setBrand(relationshipToEdit.brand || "");
      setPurchaseUnitId(relationshipToEdit.purchaseUnitId || "");
      setConversionFactor(String(relationshipToEdit.conversionFactor || 1));
      setUnitPrice(String(relationshipToEdit.unitPrice || ""));
      setMinimumOrderQuantity(relationshipToEdit.minimumOrderQuantity !== undefined ? String(relationshipToEdit.minimumOrderQuantity) : "");
      setLeadTimeDays(relationshipToEdit.leadTimeDays !== undefined ? String(relationshipToEdit.leadTimeDays) : "");
      setCommercialConditions(relationshipToEdit.commercialConditions || "");
      setIsPreferred(!!relationshipToEdit.isPreferred);
      setStatus(relationshipToEdit.status || "active");
      setReason("");
    } else {
      setMaterialId(defaultMaterialId || "");
      setSupplierCode("");
      setBrand("");
      setPurchaseUnitId(defaultMaterialId ? materials.find((m) => m.id === defaultMaterialId)?.unitId || "" : "");
      setConversionFactor("1");
      setUnitPrice("");
      setMinimumOrderQuantity("");
      setLeadTimeDays("");
      setCommercialConditions("");
      setIsPreferred(false);
      setStatus("active");
      setReason("");
    }
  }, [relationshipToEdit, defaultMaterialId, open, materials]);

  // Se o material for alterado e ainda não tivermos unidade de compra, selecionar a unidade base do material
  const handleMaterialChange = (newMaterialId: string) => {
    setMaterialId(newMaterialId);
    const mat = materials.find((m) => m.id === newMaterialId);
    if (mat && mat.unitId && !purchaseUnitId) {
      setPurchaseUnitId(mat.unitId);
    }
  };

  const parsedPrice = parseFloat(unitPrice) || 0;
  const parsedFactor = parseFloat(conversionFactor) || 1;
  const computedBasePrice = calculateBaseUnitPrice(parsedPrice, parsedFactor);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Partial<SupplierMaterial> = {
        supplierId,
        materialId,
        supplierCode: supplierCode || undefined,
        brand: brand || undefined,
        purchaseUnitId,
        conversionFactor: parsedFactor,
        unitPrice: parsedPrice,
        currency: "MZN",
        minimumOrderQuantity: minimumOrderQuantity ? parseFloat(minimumOrderQuantity) : undefined,
        leadTimeDays: leadTimeDays ? parseInt(leadTimeDays, 10) : undefined,
        commercialConditions: commercialConditions || undefined,
        isPreferred,
        status,
      };

      if (relationshipToEdit) {
        updateSupplierMaterial(relationshipToEdit.id, payload, reason || undefined);
        toast.success("Cotação comercial atualizada com sucesso.");
      } else {
        addSupplierMaterial(payload as any);
        toast.success("Material associado ao fornecedor com sucesso.");
      }
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao guardar relação comercial.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{relationshipToEdit ? "Editar Cotação Comercial" : "Associar Material ao Fornecedor"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="material">Material do Catálogo *</Label>
            <Select
              value={materialId}
              onValueChange={handleMaterialChange}
              disabled={!!relationshipToEdit}
            >
              <SelectTrigger id="material">
                <SelectValue placeholder="Selecione o material..." />
              </SelectTrigger>
              <SelectContent>
                {activeMaterials.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} {m.internalCode ? `(${m.internalCode})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="supplierCode">Código no Fornecedor</Label>
              <Input
                id="supplierCode"
                value={supplierCode}
                onChange={(e) => setSupplierCode(e.target.value)}
                placeholder="Ex: REF-1020"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="brand">Marca Comercial</Label>
              <Input
                id="brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Ex: Robbialac / Limak"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="purchaseUnitId">Unidade de Compra *</Label>
              <Select value={purchaseUnitId} onValueChange={setPurchaseUnitId}>
                <SelectTrigger id="purchaseUnitId">
                  <SelectValue placeholder="Selecione a unidade comercial" />
                </SelectTrigger>
                <SelectContent>
                  {activeUnits.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} ({u.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="conversionFactor">Fator de Conversão *</Label>
              <Input
                id="conversionFactor"
                type="number"
                step="any"
                min="0.0001"
                value={conversionFactor}
                onChange={(e) => setConversionFactor(e.target.value)}
                placeholder="1 (para 1:1)"
                required
              />
              {selectedBaseUnit && selectedPurchaseUnit && (
                <div className="text-[11px] text-muted-foreground mt-1">
                  1 {selectedPurchaseUnit.symbol} = {conversionFactor || 1} {selectedBaseUnit.symbol}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="unitPrice">Preço Unitário de Compra (MT) *</Label>
              <Input
                id="unitPrice"
                type="number"
                step="0.01"
                min="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="Ex: 420.00"
                required
              />
            </div>

            <div className="space-y-1.5 bg-muted/40 p-2.5 rounded border">
              <Label className="text-xs text-muted-foreground">Preço Convertido p/ Unidade Base</Label>
              <div className="text-base font-bold text-primary mt-1">
                {formatMZN(computedBasePrice)} / {selectedBaseUnit?.symbol || "un"}
              </div>
              <div className="text-[10px] text-muted-foreground">
                Ordenado e comparado por este valor.
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="minimumOrderQuantity">Quantidade Mínima</Label>
              <Input
                id="minimumOrderQuantity"
                type="number"
                step="any"
                min="0.01"
                value={minimumOrderQuantity}
                onChange={(e) => setMinimumOrderQuantity(e.target.value)}
                placeholder="Vazio = Sem mínimo"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="leadTimeDays">Prazo de Entrega (dias)</Label>
              <Input
                id="leadTimeDays"
                type="number"
                min="0"
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(e.target.value)}
                placeholder="Ex: 2"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="commercialConditions">Condições Comerciais / Observações</Label>
            <Textarea
              id="commercialConditions"
              rows={2}
              value={commercialConditions}
              onChange={(e) => setCommercialConditions(e.target.value)}
              placeholder="Ex: Desconto de 2% para compras acima de 100 unidades."
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="isPreferred"
              checked={isPreferred}
              onCheckedChange={(c) => setIsPreferred(!!c)}
            />
            <Label htmlFor="isPreferred" className="text-sm font-medium cursor-pointer">
              Marcar como Fornecedor Preferencial para este material
            </Label>
          </div>

          {relationshipToEdit && (
            <div className="space-y-1.5 pt-2 border-t mt-3">
              <Label htmlFor="reason" className="text-xs font-semibold">Motivo da Alteração de Preço (Opcional - p/ Histórico)</Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Ajuste trimestral de tabela pelo fornecedor."
              />
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {relationshipToEdit ? "Atualizar Cotação" : "Associar Material"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
