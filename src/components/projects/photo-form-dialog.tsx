import { useEffect, useState, useRef } from "react";
import type { ObraFoto, ObraFase } from "@/lib/mock-data";
import { categorias } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useObraMZStore } from "@/store/obramz-store";
import { toast } from "sonner";
import { MapPin, Trash2, Camera, Upload, Loader2, Info } from "lucide-react";

const MAX_BYTES = 10 * 1024 * 1024; // Permite selecionar arquivos maiores que serão comprimidos

async function resizeAndCompressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const maxDimension = 1600;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Não foi possível obter o contexto 2D do Canvas."));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        
        // Comprimir a imagem (JPEG com qualidade de 0.75)
        const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Falha ao processar ficheiro de imagem."));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

type PhotoFormDialogProps = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  obraId: string;
  fases: ObraFase[];
  photoToEdit?: ObraFoto | null;
};

export function PhotoFormDialog({
  open,
  onOpenChange,
  obraId,
  fases,
  photoToEdit = null,
}: PhotoFormDialogProps) {
  const addFoto = useObraMZStore((s) => s.addObraFoto);
  const updateFoto = useObraMZStore((s) => s.updateObraFoto);
  const obra = useObraMZStore((s) => s.obras.find((o) => o.id === obraId));
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // States
  const [dataUrl, setDataUrl] = useState<string>("");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [phaseId, setPhaseId] = useState<string>("none");
  const [categoria, setCategoria] = useState<string>("Outros");
  const [tipo, setTipo] = useState<"normal" | "antes" | "depois">("normal");
  const [beforeAfterGroupId, setBeforeAfterGroupId] = useState<string>("none");
  const [localizacaoNome, setLocalizacaoNome] = useState("");
  
  // GPS State
  const [gpsState, setGpsState] = useState<'idle' | 'loading' | 'success' | 'permission_denied' | 'unavailable' | 'error'>('idle');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  
  const [processingImage, setProcessingImage] = useState(false);

  // Carregar dados de edição
  useEffect(() => {
    if (open) {
      if (photoToEdit) {
        setDataUrl(photoToEdit.dataUrl);
        setTitulo(photoToEdit.titulo || photoToEdit.legenda || "");
        setDescricao(photoToEdit.descricao || "");
        setPhaseId(photoToEdit.phaseId || "none");
        setCategoria(photoToEdit.categoria || "Outros");
        setTipo(photoToEdit.tipo || "normal");
        setBeforeAfterGroupId(photoToEdit.beforeAfterGroupId || "none");
        setLocalizacaoNome(photoToEdit.localizacaoNome || "");
        if (photoToEdit.latitude && photoToEdit.longitude) {
          setCoords({ latitude: photoToEdit.latitude, longitude: photoToEdit.longitude });
          setGpsState('success');
        } else {
          setCoords(null);
          setGpsState('idle');
        }
      } else {
        // Reset para nova foto
        setDataUrl("");
        setTitulo("");
        setDescricao("");
        setPhaseId("none");
        setCategoria("Outros");
        setTipo("normal");
        setBeforeAfterGroupId("none");
        setLocalizacaoNome("");
        setCoords(null);
        setGpsState('idle');
      }
    }
  }, [open, photoToEdit]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione um ficheiro de imagem válido.");
      return;
    }

    if (file.size > MAX_BYTES) {
      toast.error("O ficheiro excede o tamanho limite.");
      return;
    }

    setProcessingImage(true);
    try {
      const compressedDataUrl = await resizeAndCompressImage(file);
      setDataUrl(compressedDataUrl);
      if (!titulo) {
        setTitulo(file.name.replace(/\.[^.]+$/, ""));
      }
      toast.success("Imagem carregada e comprimida com sucesso.");
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao processar e comprimir a imagem.");
    } finally {
      setProcessingImage(false);
    }
  };

  const getGPSLocation = () => {
    if (!navigator.geolocation) {
      setGpsState('unavailable');
      toast.error("A geolocalização não é suportada pelo seu navegador.");
      return;
    }

    setGpsState('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setGpsState('success');
        toast.success("Localização obtida com sucesso!");
      },
      (error) => {
        console.warn("Erro ao obter GPS:", error);
        if (error.code === error.PERMISSION_DENIED) {
          setGpsState('permission_denied');
          toast.error("Permissão de localização recusada.");
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setGpsState('unavailable');
          toast.error("A informação da sua localização está indisponível.");
        } else {
          setGpsState('error');
          toast.error("Ocorreu um erro ao obter a localização.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const removeLocation = () => {
    setCoords(null);
    setGpsState('idle');
    toast.info("Localização removida.");
  };

  // Filtrar fotos "Antes" do mesmo projeto para associar à foto "Depois"
  const antesPhotos = (obra?.fotos ?? []).filter(
    (f) => f.tipo === "antes" && (!photoToEdit || f.id !== photoToEdit.id)
  );

  const handleSave = () => {
    if (!dataUrl) {
      toast.error("Selecione ou capture uma imagem primeiro.");
      return;
    }
    if (!titulo.trim()) {
      toast.error("O título é obrigatório.");
      return;
    }

    const payload = {
      dataUrl,
      titulo: titulo.trim(),
      legenda: titulo.trim(), // manter retrocompatibilidade
      descricao: descricao.trim() || undefined,
      phaseId: phaseId === "none" ? undefined : phaseId,
      categoria,
      tipo,
      beforeAfterGroupId: (tipo === "depois" && beforeAfterGroupId !== "none") ? beforeAfterGroupId : undefined,
      latitude: coords?.latitude || undefined,
      longitude: coords?.longitude || undefined,
      localizacaoNome: localizacaoNome.trim() || undefined,
    };

    try {
      if (photoToEdit) {
        updateFoto(obraId, photoToEdit.id, payload);
        toast.success("Fotografia atualizada com sucesso.");
      } else {
        addFoto(obraId, {
          ...payload,
          data: new Date().toISOString().slice(0, 10),
        });
        toast.success("Fotografia registada com sucesso.");
      }
      onOpenChange(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{photoToEdit ? "Editar Detalhes da Foto" : "Registar Nova Fotografia"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2 md:grid-cols-2">
          {/* Coluna 1: Imagem e Upload */}
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border p-4 bg-muted/40 min-h-[220px]">
            {dataUrl ? (
              <div className="relative group w-full aspect-video md:aspect-square rounded overflow-hidden">
                <img
                  src={dataUrl}
                  alt="Pré-visualização"
                  className="w-full h-full object-cover"
                />
                {!photoToEdit && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Alterar Imagem
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="p-3 bg-muted rounded-full text-muted-foreground">
                  <Camera className="h-8 w-8" />
                </div>
                <div className="text-sm font-medium">Nenhuma imagem selecionada</div>
                <div className="text-xs text-muted-foreground">Suporta JPG, PNG. O ficheiro será comprimido.</div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  disabled={processingImage}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {processingImage ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      A processar...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Escolher Ficheiro
                    </>
                  )}
                </Button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={!!photoToEdit || processingImage}
            />
          </div>

          {/* Coluna 2: Formulário */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="photo-title">Título *</Label>
              <Input
                id="photo-title"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex.: Reboco da parede externa"
              />
            </div>

            <div>
              <Label htmlFor="photo-desc">Descrição</Label>
              <Textarea
                id="photo-desc"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Detalhes sobre o progresso ou observações importantes..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="photo-phase">Fase da Obra</Label>
                <Select value={phaseId} onValueChange={setPhaseId}>
                  <SelectTrigger id="photo-phase">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {fases.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="photo-category">Categoria</Label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger id="photo-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="photo-type">Tipo de Foto</Label>
                <Select value={tipo} onValueChange={(v: any) => setTipo(v)}>
                  <SelectTrigger id="photo-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Fotografia normal</SelectItem>
                    <SelectItem value="antes">Antes</SelectItem>
                    <SelectItem value="depois">Depois</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {tipo === "depois" && (
                <div>
                  <Label htmlFor="photo-before-pair">Associar ao "Antes"</Label>
                  <Select value={beforeAfterGroupId} onValueChange={setBeforeAfterGroupId}>
                    <SelectTrigger id="photo-before-pair">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Selecionar foto...</SelectItem>
                      {antesPhotos.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.titulo || f.legenda || `Foto Antes (${f.data})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Secção GPS */}
        <div className="border-t border-border pt-4 mt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold flex items-center gap-1">
              <MapPin className="h-4 w-4 text-primary" />
              Localização GPS (Opcional)
            </span>
            {gpsState === 'success' && coords && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-destructive hover:text-destructive/80 font-normal px-2"
                onClick={removeLocation}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Remover coordenadas
              </Button>
            )}
          </div>

          <div className="bg-muted/40 p-3 rounded-md flex flex-col gap-2">
            {gpsState === 'idle' && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">Sem localização GPS associada.</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={getGPSLocation}
                >
                  Obter localização atual
                </Button>
              </div>
            )}

            {gpsState === 'loading' && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                A obter localização atual por GPS do dispositivo...
              </div>
            )}

            {gpsState === 'success' && coords && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground font-medium">Latitude:</span>{" "}
                    <code className="bg-background px-1.5 py-0.5 rounded border border-border">
                      {coords.latitude.toFixed(6)}
                    </code>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">Longitude:</span>{" "}
                    <code className="bg-background px-1.5 py-0.5 rounded border border-border">
                      {coords.longitude.toFixed(6)}
                    </code>
                  </div>
                </div>
                <div>
                  <Label htmlFor="gps-loc-name" className="text-[11px] text-muted-foreground font-medium">
                    Nome da localização / divisão (Opcional)
                  </Label>
                  <Input
                    id="gps-loc-name"
                    value={localizacaoNome}
                    onChange={(e) => setLocalizacaoNome(e.target.value)}
                    placeholder="Ex.: Cozinha principal, Entrada exterior"
                    className="h-8 text-xs mt-1"
                  />
                </div>
              </div>
            )}

            {/* Estados de Erro */}
            {gpsState === 'permission_denied' && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-xs text-warning font-medium">
                  <Info className="h-3.5 w-3.5 text-warning" />
                  Permissão de localização recusada.
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Ative as permissões de localização para esta página nas definições do navegador e clique em tentar novamente.
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="w-fit self-end text-xs h-7 px-2"
                  onClick={getGPSLocation}
                >
                  Tentar novamente
                </Button>
              </div>
            )}

            {gpsState === 'unavailable' && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-xs text-destructive font-medium">
                  <Info className="h-3.5 w-3.5" />
                  Localização GPS indisponível.
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Certifique-se de que o sinal de GPS do seu dispositivo está ativo ou que está ligado a uma rede.
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="w-fit self-end text-xs h-7 px-2"
                  onClick={getGPSLocation}
                >
                  Tentar novamente
                </Button>
              </div>
            )}

            {gpsState === 'error' && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-xs text-destructive font-medium">
                  <Info className="h-3.5 w-3.5" />
                  Erro ao obter localização.
                </div>
                <div className="text-[10px] text-muted-foreground">
                  A tentativa de geolocalização falhou ou excedeu o tempo limite de resposta.
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="w-fit self-end text-xs h-7 px-2"
                  onClick={getGPSLocation}
                >
                  Tentar novamente
                </Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            className="bg-primary hover:bg-primary-dark"
            onClick={handleSave}
            disabled={processingImage}
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
