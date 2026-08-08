import { useEffect, useState } from "react";
import type { Material, MaterialCategory, MaterialUnit } from "@/lib/mock-data";
import { useObraMZStore } from "@/store/obramz-store";
import { validateMaterialInput } from "@/lib/materials";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Package, Tag, Ruler, DollarSign, Info } from "lucide-react";
import { toast } from "sonner";

interface MaterialFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materialToEdit?: Material | null;
}

export function MaterialFormDialog({
  open,
  onOpenChange,
  materialToEdit = null,
}: MaterialFormDialogProps) {
  const materials = useObraMZStore((s) => s.materials || []);
  const materialCategories = useObraMZStore((s) => s.materialCategories || []);
  const materialUnits = useObraMZStore((s) => s.materialUnits || []);
  const addMaterial = useObraMZStore((s) => s.addMaterial);
  const updateMaterial = useObraMZStore((s) => s.updateMaterial);

  // Form states
  const [name, setName] = useState("");
  const [internalCode, setInternalCode] = useState("");
  const [sku, setSku] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [referencePrice, setReferencePrice] = useState("");
  const [averagePrice, setAveragePrice] = useState("");
  const [currency, setCurrency] = useState("MZN");
  const [minimumStock, setMinimumStock] = useState("");
  const [preferredBrand, setPreferredBrand] = useState("");
  const [description, setDescription] = useState("");
  const [specifications, setSpecifications] = useState("");
  const [notes, setNotes] = useState("");

  // Categorias disponíveis: ativas + a categoria atual do material (caso esteja inativa durante a edição)
  const selectableCategories = materialCategories.filter(
    (c) => c.status === "active" || (materialToEdit && c.id === materialToEdit.categoryId)
  );

  // Unidades disponíveis: ativas + a unidade atual do material (caso esteja inativa durante a edição)
  const selectableUnits = materialUnits.filter(
    (u) => u.status === "active" || (materialToEdit && u.id === materialToEdit.unitId)
  );

  useEffect(() => {
    if (open) {
      if (materialToEdit) {
        setName(materialToEdit.name || "");
        setInternalCode(materialToEdit.internalCode || "");
        setSku(materialToEdit.sku || "");
        setCategoryId(materialToEdit.categoryId || "");
        setUnitId(materialToEdit.unitId || "");
        setStatus(materialToEdit.status || "active");
        setReferencePrice(materialToEdit.referencePrice?.toString() || "");
        setAveragePrice(materialToEdit.averagePrice?.toString() || "");
        setCurrency(materialToEdit.currency || "MZN");
        setMinimumStock(materialToEdit.minimumStock?.toString() || "");
        setPreferredBrand(materialToEdit.preferredBrand || "");
        setDescription(materialToEdit.description || "");
        setSpecifications(materialToEdit.specifications || "");
        setNotes(materialToEdit.notes || "");
      } else {
        setName("");
        setInternalCode("");
        setSku("");
        setCategoryId(selectableCategories[0]?.id || "");
        setUnitId(selectableUnits[0]?.id || "");
        setStatus("active");
        setReferencePrice("");
        setAveragePrice("");
        setCurrency("MZN");
        setMinimumStock("");
        setPreferredBrand("");
        setDescription("");
        setSpecifications("");
        setNotes("");
      }
    }
  }, [open, materialToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedRefPrice = referencePrice ? parseFloat(referencePrice) : undefined;
    const parsedAvgPrice = averagePrice ? parseFloat(averagePrice) : undefined;
    const parsedMinStock = minimumStock ? parseFloat(minimumStock) : undefined;

    const payload = {
      name: name.trim(),
      internalCode: internalCode.trim() || undefined,
      sku: sku.trim() || undefined,
      categoryId,
      unitId,
      status,
      referencePrice: parsedRefPrice,
      averagePrice: parsedAvgPrice,
      currency: currency.trim() || "MZN",
      minimumStock: parsedMinStock,
      preferredBrand: preferredBrand.trim() || undefined,
      description: description.trim() || undefined,
      specifications: specifications.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    const err = validateMaterialInput(payload, materialToEdit?.id, materials);
    if (err) {
      toast.error(err);
      return;
    }

    try {
      if (materialToEdit) {
        updateMaterial(materialToEdit.id, payload);
        toast.success(`Material "${payload.name}" atualizado com sucesso!`);
      } else {
        addMaterial(payload);
        toast.success(`Material "${payload.name}" registado com sucesso!`);
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao guardar o material.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-0">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="p-5 border-b bg-muted/20">
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              {materialToEdit ? "Editar Material do Catálogo" : "Novo Material no Catálogo"}
            </DialogTitle>
          </DialogHeader>

          <div className="p-5 space-y-5 text-xs">
            {/* Secção 1: Identificação Principal */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1 flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-primary" /> 1. Identificação Principal
              </h4>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="mat-name" className="text-xs font-semibold">
                    Nome do Material *
                  </Label>
                  <Input
                    id="mat-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex.: Cimento Portland 32.5R"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="mat-category" className="text-xs font-semibold">
                    Categoria *
                  </Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger id="mat-category" className="h-9 text-xs">
                      <SelectValue placeholder="Selecione a categoria..." />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      {selectableCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} {c.status === "inactive" ? "(Inativa)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="mat-unit" className="text-xs font-semibold">
                    Unidade de Medida *
                  </Label>
                  <Select value={unitId} onValueChange={setUnitId}>
                    <SelectTrigger id="mat-unit" className="h-9 text-xs">
                      <SelectValue placeholder="Selecione a unidade..." />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      {selectableUnits.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} ({u.symbol}) {u.status === "inactive" ? "(Inativa)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="mat-code" className="text-xs font-semibold">
                    Código Interno
                  </Label>
                  <Input
                    id="mat-code"
                    value={internalCode}
                    onChange={(e) => setInternalCode(e.target.value)}
                    placeholder="Ex.: MAT-CIM-001"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="mat-sku" className="text-xs font-semibold">
                    SKU / Código Fabricante
                  </Label>
                  <Input
                    id="mat-sku"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="Ex.: CIM-325R-50KG"
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Secção 2: Informação Comercial e Referências */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1 flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-primary" /> 2. Preços e Valores de Referência
              </h4>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="mat-ref-price" className="text-xs font-semibold">
                    Preço de Referência
                  </Label>
                  <Input
                    id="mat-ref-price"
                    type="number"
                    min={0}
                    step="any"
                    value={referencePrice}
                    onChange={(e) => setReferencePrice(e.target.value)}
                    placeholder="Ex.: 550.00"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="mat-avg-price" className="text-xs font-semibold">
                    Preço Médio de Referência
                  </Label>
                  <Input
                    id="mat-avg-price"
                    type="number"
                    min={0}
                    step="any"
                    value={averagePrice}
                    onChange={(e) => setAveragePrice(e.target.value)}
                    placeholder="Ex.: 540.00"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="mat-currency" className="text-xs font-semibold">
                    Moeda
                  </Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger id="mat-currency" className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      <SelectItem value="MZN">Metical (MZN)</SelectItem>
                      <SelectItem value="USD">Dólar (USD)</SelectItem>
                      <SelectItem value="ZAR">Rand (ZAR)</SelectItem>
                      <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Secção 3: Planeamento e Marca */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1 flex items-center gap-1.5">
                <Ruler className="h-3.5 w-3.5 text-primary" /> 3. Planeamento e Marca Preferida
              </h4>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="mat-min-stock" className="text-xs font-semibold">
                    Stock Mínimo de Referência
                  </Label>
                  <Input
                    id="mat-min-stock"
                    type="number"
                    min={0}
                    step="any"
                    value={minimumStock}
                    onChange={(e) => setMinimumStock(e.target.value)}
                    placeholder="Ex.: 50"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="mat-brand" className="text-xs font-semibold">
                    Marca Preferida
                  </Label>
                  <Input
                    id="mat-brand"
                    value={preferredBrand}
                    onChange={(e) => setPreferredBrand(e.target.value)}
                    placeholder="Ex.: Cimentos de Moçambique"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 bg-blue-500/10 p-2 rounded-md border border-blue-500/20 text-blue-900 dark:text-blue-300">
                <Info className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                O stock mínimo é um valor de referência para planeamento futuro. A gestão de armazém e entradas/saídas reais será ativada na subetapa de Gestão de Stock.
              </p>
            </div>

            {/* Secção 4: Descrição e Ficha Técnica */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1">
                4. Especificações e Notas
              </h4>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="mat-desc" className="text-xs font-semibold">
                    Descrição do Material
                  </Label>
                  <Textarea
                    id="mat-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descrição detalhada sobre a aplicação e utilização do material..."
                    className="text-xs h-16 resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="mat-specs" className="text-xs font-semibold">
                    Especificações Técnicas
                  </Label>
                  <Input
                    id="mat-specs"
                    value={specifications}
                    onChange={(e) => setSpecifications(e.target.value)}
                    placeholder="Ex.: Saco de 50 kg • Classe 32.5R"
                    className="h-9 text-xs"
                  />
                </div>

                {materialToEdit && (
                  <div className="space-y-1">
                    <Label htmlFor="mat-status" className="text-xs font-semibold">
                      Estado no Catálogo
                    </Label>
                    <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                      <SelectTrigger id="mat-status" className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="active">Ativo (Disponível para seleção)</SelectItem>
                        <SelectItem value="inactive">Inativo (Indisponível para novos usos)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 border-t bg-muted/10 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs h-9"
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" className="text-xs h-9 bg-primary text-white font-bold">
              {materialToEdit ? "Guardar Alterações" : "Registar Material"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
