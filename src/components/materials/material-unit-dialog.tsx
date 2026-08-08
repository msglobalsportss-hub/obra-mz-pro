import { useState } from "react";
import type { MaterialUnit, Material } from "@/lib/mock-data";
import { useObraMZStore } from "@/store/obramz-store";
import { validateUnitInput } from "@/lib/materials";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Ruler, Plus, Edit, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

interface MaterialUnitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MaterialUnitDialog({
  open,
  onOpenChange,
}: MaterialUnitDialogProps) {
  const units = useObraMZStore((s) => s.materialUnits || []);
  const materials = useObraMZStore((s) => s.materials || []);
  const addUnit = useObraMZStore((s) => s.addMaterialUnit);
  const updateUnit = useObraMZStore((s) => s.updateMaterialUnit);
  const activateUnit = useObraMZStore((s) => s.activateMaterialUnit);
  const deactivateUnit = useObraMZStore((s) => s.deactivateMaterialUnit);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [precision, setPrecision] = useState("2");

  const handleStartCreate = () => {
    setEditingId("new");
    setName("");
    setSymbol("");
    setPrecision("2");
  };

  const handleStartEdit = (unit: MaterialUnit) => {
    setEditingId(unit.id);
    setName(unit.name);
    setSymbol(unit.symbol);
    setPrecision((unit.precision ?? 2).toString());
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName("");
    setSymbol("");
    setPrecision("2");
  };

  const handleSave = () => {
    const payload = {
      name: name.trim(),
      symbol: symbol.trim(),
      precision: precision ? parseInt(precision, 10) : 2,
    };
    const currentId = editingId === "new" ? undefined : editingId || undefined;

    const err = validateUnitInput(payload, currentId, units);
    if (err) {
      toast.error(err);
      return;
    }

    try {
      if (editingId === "new") {
        addUnit(payload);
        toast.success(`Unidade "${payload.name} (${payload.symbol})" criada com sucesso!`);
      } else if (editingId) {
        updateUnit(editingId, payload);
        toast.success(`Unidade "${payload.name}" atualizada!`);
      }
      handleCancelEdit();
    } catch (e: any) {
      toast.error(e.message || "Erro ao guardar unidade.");
    }
  };

  const handleToggleStatus = (unit: MaterialUnit) => {
    const associatedCount = materials.filter((m) => m.unitId === unit.id).length;
    if (unit.status === "active") {
      deactivateUnit(unit.id);
      if (associatedCount > 0) {
        toast.warning(
          `Unidade "${unit.name}" desativada. ${associatedCount} material(ais) associado(s) continuam legíveis, mas a unidade não aparecerá para novos materiais.`
        );
      } else {
        toast.success(`Unidade "${unit.name}" desativada.`);
      }
    } else {
      activateUnit(unit.id);
      toast.success(`Unidade "${unit.name}" reativada com sucesso!`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl w-full max-h-[85vh] overflow-y-auto p-0">
        <DialogHeader className="p-5 border-b bg-muted/20 flex flex-row items-center justify-between">
          <DialogTitle className="text-sm font-bold flex items-center gap-2">
            <Ruler className="h-4 w-4 text-primary" />
            Unidades de Medida ({units.length})
          </DialogTitle>
          {editingId === null && (
            <Button size="sm" onClick={handleStartCreate} className="text-xs h-8 gap-1">
              <Plus className="h-3.5 w-3.5" /> Nova Unidade
            </Button>
          )}
        </DialogHeader>

        <div className="p-5 space-y-4 text-xs">
          {/* Formulário Inline de Edição ou Criação */}
          {editingId !== null && (
            <div className="p-3 bg-muted/30 border rounded-lg space-y-3">
              <h4 className="font-bold text-xs">
                {editingId === "new" ? "Criar Nova Unidade de Medida" : "Editar Unidade"}
              </h4>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1 sm:col-span-1">
                  <Label htmlFor="unit-name-input" className="text-xs">Nome *</Label>
                  <Input
                    id="unit-name-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex.: Pacote"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1 sm:col-span-1">
                  <Label htmlFor="unit-symbol-input" className="text-xs">Símbolo *</Label>
                  <Input
                    id="unit-symbol-input"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    placeholder="Ex.: pct"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1 sm:col-span-1">
                  <Label htmlFor="unit-prec-input" className="text-xs">Decimais</Label>
                  <Input
                    id="unit-prec-input"
                    type="number"
                    min={0}
                    max={4}
                    value={precision}
                    onChange={(e) => setPrecision(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={handleCancelEdit} className="text-xs h-7">
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleSave} className="text-xs h-7">
                  Guardar Unidade
                </Button>
              </div>
            </div>
          )}

          {/* Lista de Unidades */}
          <div className="grid gap-2 sm:grid-cols-2">
            {units.map((unit) => {
              const count = materials.filter((m) => m.unitId === unit.id).length;
              return (
                <div
                  key={unit.id}
                  className={`p-3 border rounded-lg flex items-center justify-between gap-2 ${
                    unit.status === "inactive" ? "bg-muted/10 opacity-70" : "bg-card"
                  }`}
                >
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-foreground">{unit.name}</span>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {unit.symbol}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>{count} material(ais)</span>
                      <span>•</span>
                      <Badge
                        variant={unit.status === "active" ? "default" : "secondary"}
                        className={`text-[8px] h-4 ${
                          unit.status === "active"
                            ? "bg-emerald-500/10 text-emerald-700"
                            : "bg-slate-500/10 text-slate-700"
                        }`}
                      >
                        {unit.status === "active" ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStartEdit(unit)}
                      className="h-7 w-7 p-0"
                      title="Editar Unidade"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleStatus(unit)}
                      className={`h-7 px-1.5 text-[10px] ${
                        unit.status === "active"
                          ? "text-amber-600 hover:bg-amber-500/10"
                          : "text-emerald-600 hover:bg-emerald-500/10"
                      }`}
                      title={unit.status === "active" ? "Desativar Unidade" : "Reativar Unidade"}
                    >
                      {unit.status === "active" ? (
                        <XCircle className="h-3.5 w-3.5" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
