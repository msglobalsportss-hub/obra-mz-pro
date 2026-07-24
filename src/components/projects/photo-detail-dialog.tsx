import type { ObraFoto, ObraFase } from "@/lib/mock-data";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Folder, Layers, Image as ImageIcon } from "lucide-react";

type PhotoDetailDialogProps = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  photo: ObraFoto | null;
  fases: ObraFase[];
  allPhotos: ObraFoto[];
};

export function PhotoDetailDialog({
  open,
  onOpenChange,
  photo,
  fases,
  allPhotos,
}: PhotoDetailDialogProps) {
  if (!photo) return null;

  // Encontrar a fase
  const fase = fases.find((f) => f.id === photo.phaseId);

  // Determinar o label do tipo de foto
  const getTipoBadge = (tipo?: string) => {
    switch (tipo) {
      case "antes":
        return <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-0">Fotografia Antes</Badge>;
      case "depois":
        return <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white border-0">Fotografia Depois</Badge>;
      default:
        return <Badge variant="secondary">Fotografia Normal</Badge>;
    }
  };

  // Encontrar relação Antes/Depois
  let relatedPhoto: ObraFoto | undefined;
  if (photo.beforeAfterGroupId) {
    if (photo.tipo === "antes") {
      relatedPhoto = allPhotos.find(
        (f) => f.beforeAfterGroupId === photo.beforeAfterGroupId && f.tipo === "depois" && f.id !== photo.id
      );
    } else if (photo.tipo === "depois") {
      relatedPhoto = allPhotos.find(
        (f) => f.id === photo.beforeAfterGroupId && f.tipo === "antes"
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="truncate pr-6">
            {photo.titulo || photo.legenda || "Fotografia da Obra"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Imagem Ampliada */}
          <div className="md:col-span-2 flex flex-col justify-center rounded-lg border bg-black/5 overflow-hidden">
            <img
              src={photo.dataUrl}
              alt={photo.titulo || photo.legenda || "Fotografia da Obra"}
              className="max-h-[60vh] w-full object-contain mx-auto"
            />
          </div>

          {/* Painel de Metadados */}
          <div className="space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Tipo de Foto */}
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                  Tipo de Registo
                </span>
                {getTipoBadge(photo.tipo)}
              </div>

              {/* Título e Descrição */}
              <div>
                <h3 className="text-sm font-semibold text-foreground">Descrição</h3>
                <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line leading-relaxed">
                  {photo.descricao || "Nenhuma descrição adicionada a esta imagem."}
                </p>
              </div>

              {/* Informações estruturadas */}
              <div className="space-y-2 border-t pt-3 border-border">
                {/* Data */}
                <div className="flex items-center gap-2 text-xs">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <span className="text-muted-foreground font-medium">Data de registo:</span>{" "}
                    <span className="text-foreground font-semibold">{formatDate(photo.data)}</span>
                  </div>
                </div>

                {/* Fase */}
                {fase && (
                  <div className="flex items-center gap-2 text-xs">
                    <Layers className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <span className="text-muted-foreground font-medium">Fase associada:</span>{" "}
                      <span className="text-foreground font-semibold">{fase.nome}</span>
                    </div>
                  </div>
                )}

                {/* Categoria */}
                {photo.categoria && (
                  <div className="flex items-center gap-2 text-xs">
                    <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <span className="text-muted-foreground font-medium">Categoria:</span>{" "}
                      <span className="text-foreground font-semibold">{photo.categoria}</span>
                    </div>
                  </div>
                )}

                {/* GPS e Coordenadas */}
                {photo.latitude && photo.longitude && (
                  <div className="flex items-start gap-2 text-xs border-t pt-2 mt-2 border-border/60">
                    <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="text-muted-foreground font-medium">Localização GPS:</span>
                      {photo.localizacaoNome && (
                        <div className="text-foreground font-semibold text-xs">
                          {photo.localizacaoNome}
                        </div>
                      )}
                      <div className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded border border-border mt-0.5">
                        {photo.latitude.toFixed(6)}, {photo.longitude.toFixed(6)}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Relação Antes e Depois */}
              {photo.beforeAfterGroupId && (
                <div className="border-t pt-3 border-border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-2">
                    Relação Antes & Depois
                  </span>
                  {relatedPhoto ? (
                    <div className="flex gap-2 p-2 rounded-lg border border-border/80 bg-muted/30">
                      <img
                        src={relatedPhoto.dataUrl}
                        alt="Foto relacionada"
                        className="h-10 w-10 object-cover rounded shrink-0"
                      />
                      <div className="min-w-0 flex-1 flex flex-col justify-center">
                        <span className="text-[10px] text-muted-foreground">
                          {photo.tipo === "antes" ? "Associada à foto Depois" : "Associada à foto Antes"}
                        </span>
                        <div className="text-xs font-semibold truncate text-foreground">
                          {relatedPhoto.titulo || relatedPhoto.legenda || "Sem título"}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 py-1">
                      <ImageIcon className="h-3.5 w-3.5" />
                      {photo.tipo === "antes"
                        ? "Aguardando fotografia Depois..."
                        : "Referência ao 'Antes' inexistente"}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="text-[10px] text-muted-foreground text-right mt-4 pt-2 border-t border-border/40">
              Registado em: {photo.createdAt ? formatDate(photo.createdAt) : formatDate(photo.criadoEm)}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
