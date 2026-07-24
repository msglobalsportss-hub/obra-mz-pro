import type { ObraFoto, ObraFase } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { MapPin, Calendar, Layers, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type PhotoComparisonProps = {
  fotos: ObraFoto[];
  fases: ObraFase[];
  onOpenDetail: (photo: ObraFoto) => void;
};

export function PhotoComparison({ fotos, fases, onOpenDetail }: PhotoComparisonProps) {
  // Encontrar todas as fotos do tipo "Antes"
  const antesFotos = fotos.filter((f) => f.tipo === "antes");

  // Ordenar das mais recentes para as mais antigas
  const sortedAntes = [...antesFotos].sort((a, b) => b.data.localeCompare(a.data));

  if (sortedAntes.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-12 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-amber-50 text-amber-500 border border-amber-200">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="text-base font-semibold">Sem comparações Antes/Depois</div>
        <div className="text-sm text-muted-foreground max-w-md">
          Para ver a evolução da obra, carregue uma fotografia e defina o seu tipo como <strong>Antes</strong> no formulário de registo.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold">Comparador Antes e Depois</h2>
        <p className="text-xs text-muted-foreground">
          Acompanhe a evolução visual dos locais e etapas da obra.
        </p>
      </div>

      <div className="space-y-8">
        {sortedAntes.map((antesFoto) => {
          // Achar a foto "Depois" correspondente
          // Uma foto "Depois" deve ter o mesmo beforeAfterGroupId (que é o ID da foto Antes)
          const depoisFoto = fotos.find(
            (f) => f.tipo === "depois" && f.beforeAfterGroupId === antesFoto.id
          );

          // Encontrar a fase (partilhada ou individual)
          const faseAntes = fases.find((f) => f.id === antesFoto.phaseId);
          const faseDepois = depoisFoto ? fases.find((f) => f.id === depoisFoto.phaseId) : null;

          return (
            <Card key={antesFoto.id} className="overflow-hidden border border-border bg-card">
              {/* Cabeçalho do Par de Comparação */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/30 px-4 py-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate text-foreground">
                    {antesFoto.titulo || antesFoto.legenda || "Sem título"}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 flex flex-wrap items-center gap-2">
                    {faseAntes && (
                      <span className="flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        Fase: {faseAntes.nome}
                      </span>
                    )}
                    {antesFoto.categoria && (
                      <span className="bg-muted px-1.5 py-0.5 rounded text-[10px] border border-border">
                        {antesFoto.categoria}
                      </span>
                    )}
                  </div>
                </div>
                {depoisFoto ? (
                  <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium">Comparação Concluída</Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Aguardando "Depois"</Badge>
                )}
              </div>

              {/* Grid Lado a Lado (Grande) ou Empilhado (Pequeno) */}
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                
                {/* Lado ANTES */}
                <div className="p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="relative aspect-video rounded overflow-hidden bg-black/5 group">
                      <button
                        type="button"
                        onClick={() => onOpenDetail(antesFoto)}
                        className="w-full h-full block"
                      >
                        <img
                          src={antesFoto.dataUrl}
                          alt="Antes"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </button>
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-amber-500 text-white text-[10px] font-bold border-0 px-2 py-0.5">
                          ANTES
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-3 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Registo: {formatDate(antesFoto.data)}</span>
                      </div>
                      <p className="text-xs text-foreground mt-1 line-clamp-3">
                        {antesFoto.descricao || "Sem descrição adicional."}
                      </p>
                    </div>
                  </div>

                  {/* GPS Antes se disponível */}
                  {antesFoto.latitude && antesFoto.longitude && (
                    <div className="border-t pt-2 border-border/40 text-[11px] text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="truncate">
                        {antesFoto.localizacaoNome ? `${antesFoto.localizacaoNome} · ` : ""}
                        {antesFoto.latitude.toFixed(6)}, {antesFoto.longitude.toFixed(6)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Lado DEPOIS */}
                <div className="p-4 flex flex-col justify-between space-y-3 bg-muted/5">
                  {depoisFoto ? (
                    <>
                      <div>
                        <div className="relative aspect-video rounded overflow-hidden bg-black/5 group">
                          <button
                            type="button"
                            onClick={() => onOpenDetail(depoisFoto)}
                            className="w-full h-full block"
                          >
                            <img
                              src={depoisFoto.dataUrl}
                              alt="Depois"
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          </button>
                          <div className="absolute top-2 left-2">
                            <Badge className="bg-emerald-600 text-white text-[10px] font-bold border-0 px-2 py-0.5">
                              DEPOIS
                            </Badge>
                          </div>
                        </div>

                        <div className="mt-3 space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>Registo: {formatDate(depoisFoto.data)}</span>
                          </div>
                          <p className="text-xs text-foreground mt-1 line-clamp-3">
                            {depoisFoto.descricao || "Sem descrição adicional."}
                          </p>
                        </div>
                      </div>

                      {/* GPS Depois se disponível */}
                      {depoisFoto.latitude && depoisFoto.longitude && (
                        <div className="border-t pt-2 border-border/40 text-[11px] text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="truncate">
                            {depoisFoto.localizacaoNome ? `${depoisFoto.localizacaoNome} · ` : ""}
                            {depoisFoto.latitude.toFixed(6)}, {depoisFoto.longitude.toFixed(6)}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="h-full min-h-[200px] flex flex-col items-center justify-center border border-dashed border-border rounded bg-muted/20 p-6 text-center">
                      <Clock className="h-8 w-8 text-muted-foreground/60 mb-2 stroke-[1.5]" />
                      <div className="text-xs font-semibold text-muted-foreground">
                        Aguardando fotografia depois
                      </div>
                      <p className="text-[11px] text-muted-foreground/80 max-w-[240px] mt-1">
                        Carregue uma nova foto para este local e selecione a relação com esta imagem.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
