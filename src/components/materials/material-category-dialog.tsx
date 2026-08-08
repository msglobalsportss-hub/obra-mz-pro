import { useState } from "react";
import type { MaterialCategory, Material } from "@/lib/mock-data";
import { useObraMZStore } from "@/store/obramz-store";
import { validateCategoryInput } from "@/lib/materials";
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
import { Tag, Plus, Edit, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

interface MaterialCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MaterialCategoryDialog({
  open,
  onOpenChange,
}: MaterialCategoryDialogProps) {
  const categories = useObraMZStore((s) => s.materialCategories || []);
  const materials = useObraMZStore((s) => s.materials || []);
  const addCategory = useObraMZStore((s) => s.addMaterialCategory);
  const updateCategory = useObraMZStore((s) => s.updateMaterialCategory);
  const activateCategory = useObraMZStore((s) => s.activateMaterialCategory);
  const deactivateCategory = useObraMZStore((s) => s.deactivateMaterialCategory);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleStartCreate = () => {
    setEditingId("new");
    setName("");
    setDescription("");
  };

  const handleStartEdit = (cat: MaterialCategory) => {
    setEditingId(cat.id);
    setName(cat.name);
    setDescription(cat.description || "");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName("");
    setDescription("");
  };

  const handleSave = () => {
    const payload = { name: name.trim(), description: description.trim() || undefined };
    const currentId = editingId === "new" ? undefined : editingId || undefined;

    const err = validateCategoryInput(payload, currentId, categories);
    if (err) {
      toast.error(err);
      return;
    }

    try {
      if (editingId === "new") {
        addCategory(payload);
        toast.success(`Categoria "${payload.name}" criada com sucesso!`);
      } else if (editingId) {
        updateCategory(editingId, payload);
        toast.success(`Categoria "${payload.name}" atualizada!`);
      }
      handleCancelEdit();
    } catch (e: any) {
      toast.error(e.message || "Erro ao guardar categoria.");
    }
  };

  const handleToggleStatus = (cat: MaterialCategory) => {
    const associatedCount = materials.filter((m) => m.categoryId === cat.id).length;
    if (cat.status === "active") {
      deactivateCategory(cat.id);
      if (associatedCount > 0) {
        toast.warning(
          `Categoria "${cat.name}" desativada. ${associatedCount} material(ais) associado(s) continuam legíveis, mas a categoria não estará disponível para novos materiais.`
        );
      } else {
        toast.success(`Categoria "${cat.name}" desativada.`);
      }
    } else {
      activateCategory(cat.id);
      toast.success(`Categoria "${cat.name}" reativada com sucesso!`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl w-full max-h-[85vh] overflow-y-auto p-0">
        <DialogHeader className="p-5 border-b bg-muted/20 flex flex-row items-center justify-between">
          <DialogTitle className="text-sm font-bold flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" />
            Gestão de Categorias de Materiais ({categories.length})
          </DialogTitle>
          {editingId === null && (
            <Button size="sm" onClick={handleStartCreate} className="text-xs h-8 gap-1">
              <Plus className="h-3.5 w-3.5" /> Nova Categoria
            </Button>
          )}
        </DialogHeader>

        <div className="p-5 space-y-4 text-xs">
          {/* Formulário Inline de Edição ou Criação */}
          {editingId !== null && (
            <div className="p-3 bg-muted/30 border rounded-lg space-y-3">
              <h4 className="font-bold text-xs">
                {editingId === "new" ? "Criar Nova Categoria" : "Editar Categoria"}
              </h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="cat-name-input" className="text-xs">Nome da Categoria *</Label>
                  <Input
                    id="cat-name-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex.: Isolamentos e Impermeabilizantes"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cat-desc-input" className="text-xs">Descrição Curta</Label>
                  <Input
                    id="cat-desc-input"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex.: Mantas asfálticas, tintas betuminosas..."
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={handleCancelEdit} className="text-xs h-7">
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleSave} className="text-xs h-7">
                  Guardar Categoria
                </Button>
              </div>
            </div>
          )}

          {/* Lista de Categorias */}
          <div className="space-y-2">
            {categories.map((cat) => {
              const count = materials.filter((m) => m.categoryId === cat.id).length;
              return (
                <div
                  key={cat.id}
                  className={`p-3 border rounded-lg flex items-center justify-between gap-3 ${
                    cat.status === "inactive" ? "bg-muted/10 opacity-70" : "bg-card"
                  }`}
                >
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{cat.name}</span>
                      <Badge
                        variant={cat.status === "active" ? "default" : "secondary"}
                        className={`text-[9px] ${
                          cat.status === "active"
                            ? "bg-emerald-500/10 text-emerald-700"
                            : "bg-slate-500/10 text-slate-700"
                        }`}
                      >
                        {cat.status === "active" ? "Ativa" : "Inativa"}
                      </Badge>
                      <Badge variant="outline" className="text-[9px]">
                        {count} material(ais)
                      </Badge>
                    </div>
                    {cat.description && (
                      <p className="text-[11px] text-muted-foreground truncate">
                        {cat.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStartEdit(cat)}
                      className="h-7 w-7 p-0"
                      title="Editar Categoria"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleStatus(cat)}
                      className={`h-7 px-2 text-[10px] gap-1 ${
                        cat.status === "active"
                          ? "text-amber-600 hover:text-amber-700 hover:bg-amber-500/10"
                          : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                      }`}
                      title={cat.status === "active" ? "Desativar Categoria" : "Reativar Categoria"}
                    >
                      {cat.status === "active" ? (
                        <>
                          <XCircle className="h-3.5 w-3.5" /> Desativar
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Reativar
                        </>
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
