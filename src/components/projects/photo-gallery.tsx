import { useState } from "react";
import type { ObraFoto } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { useObraMZStore } from "@/store/obramz-store";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";
import {
  Trash2, Upload, ImageIcon, Pencil, MapPin, Eye, Filter, Layers, Folder, Tag, X,
} from "lucide-react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PhotoFormDialog } from "./photo-form-dialog";
import { PhotoDetailDialog } from "./photo-detail-dialog";
import { categorias } from "@/lib/mock-data";

export function PhotoGallery({ obraId, fotos }: { obraId: string; fotos: ObraFoto[] }) {
  const deleteFoto = useObraMZStore((s) => s.deleteObraFoto);
  const obra = useObraMZStore((s) => s.obras.find((o) => o.id === obraId));
  const fases = obra?.fases ?? [];

  // Diálogos
  const [formOpen, setFormOpen] = useState(false);
  const [editPhoto, setEditPhoto] = useState<ObraFoto | null>(null);
  const [detailPhoto, setDetailPhoto] = useState<ObraFoto | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  // Estados de filtro
  const [filterTipo, setFilterTipo] = useState<string>("all");
  const [filterFase, setFilterFase] = useState<string>("all");
  const [filterCategoria, setFilterCategoria] = useState<string>("all");
  const [filterGps, setFilterGps] = useState<string>("all");

  const clearFilters = () => {
    setFilterTipo("all");
    setFilterFase("all");
    setFilterCategoria("all");
    setFilterGps("all");
  };

  // Filtragem
  const filteredFotos = fotos.filter((f) => {
    const matchTipo =
      filterTipo === "all" ||
      (filterTipo === "normal" && (!f.tipo || f.tipo === "normal")) ||
      f.tipo === filterTipo;

    const matchFase = filterFase === "all" || f.phaseId === filterFase;

    const matchCategoria = filterCategoria === "all" || f.categoria === filterCategoria;

    const matchGps =
      filterGps === "all" ||
      (filterGps === "com" && f.latitude !== undefined && f.longitude !== undefined) ||
      (filterGps === "sem" && (f.latitude === undefined || f.longitude === undefined));

    return matchTipo && matchFase && matchCategoria && matchGps;
  });

  const sorted = [...filteredFotos].sort((a, b) => b.data.localeCompare(a.data));

  const openNew = () => {
    setEditPhoto(null);
    setFormOpen(true);
  };

  const openEdit = (f: ObraFoto) => {
    setEditPhoto(f);
    setFormOpen(true);
  };

  const isFiltered = filterTipo !== "all" || filterFase !== "all" || filterCategoria !== "all" || filterGps !== "all";

  // Retorna a badge correspondente ao tipo
  const getTipoLabel = (tipo?: string) => {
    if (tipo === "antes") return "Antes";
    if (tipo === "depois") return "Depois";
    return "Normal";
  };

  return (
    <div>
      {/* Cabeçalho da Galeria */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div>
          <div className="text-sm font-semibold">Galeria de Fotografias</div>
          <div className="text-xs text-muted-foreground">
            {fotos.length} foto{fotos.length === 1 ? "" : "s"} registadas · {filteredFotos.length} exibidas
          </div>
        </div>
        <Button size="sm" className="bg-primary hover:bg-primary-dark" onClick={openNew}>
          <Upload className="mr-1.5 h-4 w-4" />Registar foto
        </Button>
      </div>

      {/* Barra de Filtros */}
      <div className="mb-4 bg-muted/30 p-3 rounded-lg border border-border/80 flex flex-col gap-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          Filtros
          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="ml-auto h-6 text-[10px] text-destructive hover:bg-destructive/10 font-medium px-2"
            >
              <X className="mr-1 h-3 w-3" />Limpar filtros
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {/* Filtro por Tipo */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">Tipo</label>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="antes">Antes</SelectItem>
                <SelectItem value="depois">Depois</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por Fase */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">Fase</label>
            <Select value={filterFase} onValueChange={setFilterFase}>
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder="Fase" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as fases</SelectItem>
                {fases.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por Categoria */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">Categoria</label>
            <Select value={filterCategoria} onValueChange={setFilterCategoria}>
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categorias.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por GPS */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">GPS</label>
            <Select value={filterGps} onValueChange={setFilterGps}>
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder="GPS" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as fotos</SelectItem>
                <SelectItem value="com">Com localização</SelectItem>
                <SelectItem value="sem">Sem localização</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Grid de Fotos */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-12 text-center bg-card">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-muted text-muted-foreground">
            <ImageIcon className="h-5 w-5" />
          </div>
          <div className="text-sm font-medium">Sem fotografias encontradas</div>
          <div className="text-xs text-muted-foreground">
            {isFiltered
              ? "Tente ajustar ou limpar os filtros ativos para ver mais imagens."
              : "Documente o progresso da obra com imagens do estaleiro."}
          </div>
          {!isFiltered && (
            <Button size="sm" variant="outline" className="mt-2" onClick={openNew}>
              <Upload className="mr-1 h-3.5 w-3.5" />Carregar primeira foto
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {sorted.map((f) => {
            const faseFoto = fases.find((ph) => ph.id === f.phaseId);
            const temGPS = f.latitude !== undefined && f.longitude !== undefined;

            return (
              <div key={f.id} className="group overflow-hidden rounded-lg border border-border bg-card flex flex-col justify-between hover:shadow-sm transition-all">
                <div className="relative aspect-square w-full bg-black/5 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setDetailPhoto(f)}
                    className="block w-full h-full"
                  >
                    <img
                      src={f.dataUrl}
                      alt={f.titulo || f.legenda || "Fotografia da obra"}
                      className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  </button>

                  {/* Badges Flutuantes */}
                  <div className="absolute top-1.5 left-1.5 flex flex-col gap-1.5">
                    {/* Badge de Tipo */}
                    {f.tipo && f.tipo !== "normal" && (
                      <Badge className={`text-[9px] font-bold border-0 h-4 px-1.5 ${f.tipo === "antes" ? "bg-amber-500 text-white" : "bg-emerald-600 text-white"}`}>
                        {getTipoLabel(f.tipo)}
                      </Badge>
                    )}
                  </div>

                  <div className="absolute top-1.5 right-1.5 flex gap-1">
                    {temGPS && (
                      <div className="p-1 rounded bg-black/60 text-white" title={f.localizacaoNome || "Com localização GPS"}>
                        <MapPin className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Info Rodapé */}
                <div className="flex flex-col gap-1 border-t bg-background p-2.5">
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-foreground" title={f.titulo || f.legenda}>
                      {f.titulo || f.legenda || "Sem título"}
                    </div>

                    {/* Detalhes rápidos */}
                    <div className="text-[10px] text-muted-foreground flex flex-col gap-0.5 mt-1">
                      <div>{formatDate(f.data)}</div>
                      {faseFoto && (
                        <div className="truncate flex items-center gap-1 font-medium text-primary">
                          <Layers className="h-2.5 w-2.5 shrink-0" />
                          <span>{faseFoto.nome}</span>
                        </div>
                      )}
                      {f.categoria && (
                        <div className="truncate flex items-center gap-1">
                          <Folder className="h-2.5 w-2.5 shrink-0" />
                          <span>{f.categoria}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t pt-1.5 mt-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      onClick={() => setDetailPhoto(f)}
                      aria-label="Ver ampliada"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <div className="flex gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => openEdit(f)}
                        aria-label="Editar"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:bg-destructive/10"
                        onClick={() => setConfirmDel(f.id)}
                        aria-label="Eliminar"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Formulário de Foto */}
      <PhotoFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        obraId={obraId}
        fases={fases}
        photoToEdit={editPhoto}
      />

      {/* Detalhe de Foto */}
      <PhotoDetailDialog
        open={!!detailPhoto}
        onOpenChange={(o) => !o && setDetailPhoto(null)}
        photo={detailPhoto}
        fases={fases}
        allPhotos={fotos}
      />

      {/* Confirmação de Eliminar */}
      <ConfirmDialog
        open={!!confirmDel}
        onOpenChange={(o) => !o && setConfirmDel(null)}
        title="Eliminar fotografia?"
        description="Esta ação não pode ser desfeita e removerá a associação com qualquer outra foto."
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
