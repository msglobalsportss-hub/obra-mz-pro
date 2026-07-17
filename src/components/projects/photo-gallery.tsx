import { useRef, useState } from "react";
import type { ObraFoto } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useObraMZStore } from "@/store/obramz-store";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";
import { Trash2, Upload, ImageIcon, Pencil } from "lucide-react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";

const MAX_BYTES = 3 * 1024 * 1024; // 3MB

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function PhotoGallery({ obraId, fotos }: { obraId: string; fotos: ObraFoto[] }) {
  const addFoto = useObraMZStore((s) => s.addObraFoto);
  const updateFoto = useObraMZStore((s) => s.updateObraFoto);
  const deleteFoto = useObraMZStore((s) => s.deleteObraFoto);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<ObraFoto | null>(null);
  const [editing, setEditing] = useState<ObraFoto | null>(null);
  const [legenda, setLegenda] = useState("");
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const sorted = [...fotos].sort((a, b) => b.data.localeCompare(a.data));

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name}: não é imagem`);
          continue;
        }
        if (file.size > MAX_BYTES) {
          toast.error(`${file.name}: excede 3 MB`);
          continue;
        }
        const dataUrl = await fileToDataUrl(file);
        addFoto(obraId, {
          dataUrl,
          legenda: file.name.replace(/\.[^.]+$/, ""),
          data: new Date().toISOString().slice(0, 10),
        });
      }
      toast.success("Fotografias adicionadas");
    } catch {
      toast.error("Falha ao carregar fotografia");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const openEdit = (f: ObraFoto) => { setEditing(f); setLegenda(f.legenda ?? ""); };
  const saveEdit = () => {
    if (editing) {
      updateFoto(obraId, editing.id, { legenda });
      toast.success("Legenda atualizada");
      setEditing(null);
    }
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Fotografias</div>
          <div className="text-xs text-muted-foreground">{fotos.length} imagem{fotos.length === 1 ? "" : "s"} · máx. 3 MB cada</div>
        </div>
        <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()} disabled={uploading}>
          <Upload className="mr-1 h-3.5 w-3.5" />{uploading ? "A carregar…" : "Carregar"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-10 text-center">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-muted text-muted-foreground">
            <ImageIcon className="h-5 w-5" />
          </div>
          <div className="text-sm font-medium">Sem fotografias</div>
          <div className="text-xs text-muted-foreground">Documente o progresso da obra com imagens do estaleiro.</div>
          <Button size="sm" variant="outline" className="mt-2" onClick={() => inputRef.current?.click()}>
            <Upload className="mr-1 h-3.5 w-3.5" />Carregar primeira foto
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {sorted.map((f) => (
            <div key={f.id} className="group overflow-hidden rounded-lg border border-border bg-muted">
              <button type="button" onClick={() => setPreview(f)} className="block w-full">
                <img src={f.dataUrl} alt={f.legenda ?? "Fotografia da obra"} className="aspect-square w-full object-cover transition group-hover:scale-105" />
              </button>
              <div className="flex items-center justify-between gap-1 border-t bg-background p-2">
                <div className="min-w-0">
                  <div className="truncate text-xs font-medium">{f.legenda || "Sem legenda"}</div>
                  <div className="text-[10px] text-muted-foreground">{formatDate(f.data)}</div>
                </div>
                <div className="flex shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(f)} aria-label="Editar legenda">
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setConfirmDel(f.id)} aria-label="Eliminar">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{preview?.legenda || "Fotografia"}</DialogTitle></DialogHeader>
          {preview && (
            <div className="space-y-2">
              <img src={preview.dataUrl} alt={preview.legenda ?? "Fotografia"} className="max-h-[70vh] w-full rounded object-contain" />
              <div className="text-xs text-muted-foreground">{formatDate(preview.data)}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Editar legenda</DialogTitle></DialogHeader>
          <div className="space-y-1.5">
            <Label>Legenda</Label>
            <Input value={legenda} onChange={(e) => setLegenda(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button className="bg-primary hover:bg-primary-dark" onClick={saveEdit}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmDel}
        onOpenChange={(o) => !o && setConfirmDel(null)}
        title="Eliminar fotografia?"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Eliminar"
        tone="destructive"
        onConfirm={() => {
          if (confirmDel) {
            deleteFoto(obraId, confirmDel);
            toast.success("Fotografia eliminada");
            setConfirmDel(null);
          }
        }}
      />
    </div>
  );
}
