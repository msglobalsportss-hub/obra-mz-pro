import { useMemo } from "react";
import type { Material, MaterialCategory, MaterialUnit } from "@/lib/mock-data";
import { formatMZN, formatDate } from "@/lib/format";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Tag, Ruler, DollarSign, Info, Calendar, Edit, Building2, Star, TrendingDown } from "lucide-react";
import { useObraMZStore } from "@/store/obramz-store";
import {
  getValidBaseUnitPrice,
  getBestSupplierQuoteIds,
  getSecondBestBasePrice,
  calculateSavingsAgainstSecondBest,
  sortSupplierQuotes,
} from "@/lib/suppliers";

interface MaterialDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material: Material | null;
  category?: MaterialCategory | null;
  unit?: MaterialUnit | null;
  onEdit?: (material: Material) => void;
}

export function MaterialDetailsDialog({
  open,
  onOpenChange,
  material,
  category,
  unit,
  onEdit,
}: MaterialDetailsDialogProps) {
  if (!material) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl w-full max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-5 border-b bg-muted/20 flex flex-row items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <DialogTitle className="text-base font-bold text-foreground">
                {material.name}
              </DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={material.status === "active" ? "default" : "secondary"}
                className={`text-[10px] font-bold ${
                  material.status === "active"
                    ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                    : "bg-slate-500/10 text-slate-700 border-slate-500/20"
                }`}
              >
                {material.status === "active" ? "Ativo no Catálogo" : "Inativo"}
              </Badge>
              {category && (
                <Badge variant="outline" className="text-[10px]">
                  {category.name}
                </Badge>
              )}
            </div>
          </div>
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onEdit(material);
              }}
              className="text-xs h-8 gap-1.5"
            >
              <Edit className="h-3.5 w-3.5" /> Editar
            </Button>
          )}
        </DialogHeader>

        <div className="p-5 space-y-4 text-xs">
          {/* Banner de Aviso de Funcionalidades Futuras */}
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-2.5 text-blue-900 dark:text-blue-200">
            <Info className="h-4 w-4 shrink-0 text-blue-500 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold block">Gestão de Stock e Compras</span>
              <p className="text-[11px] leading-relaxed text-blue-800 dark:text-blue-300">
                A consulta de stock real em armazém, saldo por obra, histórico de compras e fornecedores será disponibilizada nas próximas subetapas.
              </p>
            </div>
          </div>

          {/* Grelha de Dados Principais */}
          <div className="grid gap-3 sm:grid-cols-2 bg-muted/20 p-3.5 rounded-lg border">
            <div>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Código Interno
              </span>
              <span className="font-mono font-bold text-foreground">
                {material.internalCode || "Não especificado"}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                SKU / Código Fabricante
              </span>
              <span className="font-mono font-bold text-foreground">
                {material.sku || "Não especificado"}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Categoria
              </span>
              <span className="font-bold text-foreground">
                {category?.name || "Sem categoria"}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Unidade de Medida
              </span>
              <span className="font-bold text-foreground">
                {unit ? `${unit.name} (${unit.symbol})` : "Sem unidade"}
              </span>
            </div>
          </div>

          {/* Preços e Valores de Referência */}
          <div className="space-y-2 border-t pt-3">
            <h4 className="font-bold text-xs flex items-center gap-1.5 text-foreground">
              <DollarSign className="h-3.5 w-3.5 text-emerald-600" /> Preços e Valores de Referência
            </h4>
            <div className="grid gap-3 sm:grid-cols-3 bg-card p-3 rounded-lg border">
              <div>
                <span className="text-[10px] text-muted-foreground block">Preço de Referência</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                  {material.referencePrice !== undefined
                    ? formatMZN(material.referencePrice)
                    : "Sem preço"}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-muted-foreground block">Preço Médio de Referência</span>
                <span className="font-bold text-foreground">
                  {material.averagePrice !== undefined
                    ? formatMZN(material.averagePrice)
                    : "Sem preço"}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-muted-foreground block">Moeda Principal</span>
                <span className="font-bold text-foreground">{material.currency || "MZN"}</span>
              </div>
            </div>
          </div>

          {/* Stock Mínimo e Marca */}
          <div className="space-y-2 border-t pt-3">
            <h4 className="font-bold text-xs flex items-center gap-1.5 text-foreground">
              <Ruler className="h-3.5 w-3.5 text-primary" /> Planeamento e Marca Preferida
            </h4>
            <div className="grid gap-3 sm:grid-cols-2 bg-card p-3 rounded-lg border">
              <div>
                <span className="text-[10px] text-muted-foreground block">Stock Mínimo de Referência</span>
                <span className="font-bold text-foreground">
                  {material.minimumStock !== undefined
                    ? `${material.minimumStock} ${unit?.symbol || ""}`
                    : "Sem mínimo definido"}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-muted-foreground block">Marca Preferida</span>
                <span className="font-bold text-foreground">
                  {material.preferredBrand || "Qualquer marca qualificada"}
                </span>
              </div>
            </div>
          </div>

          {/* Descrição e Especificações */}
          {(material.description || material.specifications || material.notes) && (
            <div className="space-y-2 border-t pt-3">
              <h4 className="font-bold text-xs text-foreground">Descrição e Ficha Técnica</h4>
              {material.description && (
                <div className="bg-muted/10 p-3 rounded-lg border text-muted-foreground leading-relaxed">
                  {material.description}
                </div>
              )}
              {material.specifications && (
                <div className="text-[11px] bg-muted/20 p-2.5 rounded border">
                  <span className="font-bold text-foreground block">Especificações:</span>
                  <span>{material.specifications}</span>
                </div>
              )}
              {material.notes && (
                <div className="text-[11px] text-muted-foreground italic">
                  Nota: {material.notes}
                </div>
              )}
            </div>
          )}

          {/* Fornecedores e Cotações Comerciais (Etapa 6.2) */}
          <MaterialSuppliersSection materialId={material.id} baseUnitSymbol={unit?.symbol} />

          {/* Timestamps */}
          <div className="border-t pt-3 flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Registado em: {formatDate(material.createdAt)}
            </span>
            <span>Última atualização: {formatDate(material.updatedAt)}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function calculateSafeBaseUnitPrice(
  unitPrice?: number,
  conversionFactor?: number
): number | null {
  if (
    typeof unitPrice !== "number" ||
    !Number.isFinite(unitPrice) ||
    typeof conversionFactor !== "number" ||
    !Number.isFinite(conversionFactor) ||
    conversionFactor <= 0
  ) {
    return null;
  }

  return unitPrice / conversionFactor;
}

function MaterialSuppliersSection({ materialId, baseUnitSymbol }: { materialId: string; baseUnitSymbol?: string }) {
  const suppliers = useObraMZStore((s) => s?.suppliers ?? []);
  const supplierMaterials = useObraMZStore((s) => s?.supplierMaterials ?? []);
  const materialUnits = useObraMZStore((s) => s?.materialUnits ?? []);

  const rels = useMemo(() => {
    return (supplierMaterials || []).filter(
      (r) => r && r.materialId === materialId && r.status === "active"
    );
  }, [supplierMaterials, materialId]);

  const suppliersMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of suppliers || []) {
      if (s && s.id) map.set(s.id, s.name || "");
    }
    return map;
  }, [suppliers]);

  const sortedRels = useMemo(() => {
    return sortSupplierQuotes(rels, suppliersMap);
  }, [rels, suppliersMap]);

  const bestQuoteIds = useMemo(() => {
    return getBestSupplierQuoteIds(rels);
  }, [rels]);

  const bestPrice = useMemo(() => {
    if (bestQuoteIds.length === 0) return null;
    const bestRel = rels.find((r) => r.id === bestQuoteIds[0]);
    return getValidBaseUnitPrice(bestRel);
  }, [rels, bestQuoteIds]);

  const secondBestPrice = useMemo(() => {
    if (bestPrice === null) return null;
    return getSecondBestBasePrice(rels, bestPrice);
  }, [rels, bestPrice]);

  const savings = useMemo(() => {
    if (bestPrice === null) return 0;
    return calculateSavingsAgainstSecondBest(bestPrice, secondBestPrice);
  }, [bestPrice, secondBestPrice]);

  return (
    <div className="space-y-2.5 border-t pt-3">
      <h4 className="font-bold text-xs flex items-center justify-between text-foreground">
        <span className="flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5 text-primary" /> Fornecedores & Cotações Disponíveis ({rels.length})
        </span>
        <span className="text-[10px] text-muted-foreground font-normal">Comparado p/ Unidade Base ({baseUnitSymbol || "un"})</span>
      </h4>

      {savings > 0 && (
        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200">
          <span className="flex items-center gap-1.5 font-medium">
            <TrendingDown className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              Poupa <strong className="font-bold text-emerald-700 dark:text-emerald-300">{formatMZN(savings)}</strong> por {baseUnitSymbol || "unidade base"} face à segunda melhor cotação.
            </span>
          </span>
        </div>
      )}

      {sortedRels.length === 0 ? (
        <div className="text-xs text-muted-foreground p-3 border rounded-lg bg-muted/10 text-center">
          Nenhum fornecedor ativo associado a este material.
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto bg-card">
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-muted/30 text-[11px] font-semibold text-muted-foreground">
              <tr>
                <th className="p-2">Fornecedor</th>
                <th className="p-2">Preço Comercial</th>
                <th className="p-2">Preço Base Convertido</th>
                <th className="p-2">Qtd Mín. / Prazo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedRels.map((rel) => {
                const supp = (suppliers || []).find((s) => s && s.id === rel.supplierId);
                const purchaseUnit = (materialUnits || []).find((u) => u && u.id === rel.purchaseUnitId);
                const basePrice = getValidBaseUnitPrice(rel);
                const isBest = bestQuoteIds.includes(rel.id);
                const isPref = !!rel.isPreferred;

                let rowStyle = "hover:bg-muted/30";
                if (isBest && isPref) {
                  rowStyle = "bg-emerald-500/10 font-medium border-l-4 border-l-emerald-500";
                } else if (isBest) {
                  rowStyle = "bg-emerald-500/5 font-medium border-l-4 border-l-emerald-500/60";
                } else if (isPref) {
                  rowStyle = "bg-amber-500/5 font-medium border-l-4 border-l-amber-500/60";
                }

                return (
                  <tr key={rel.id} className={rowStyle}>
                    <td className="p-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-semibold text-foreground">{supp?.name ?? "Fornecedor indisponível"}</span>
                        {isPref && (
                          <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[9px] px-1.5 py-0.5 h-4 flex items-center gap-0.5 shrink-0">
                            <Star className="h-2.5 w-2.5 fill-white" /> Preferencial
                          </Badge>
                        )}
                        {isBest && (
                          <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] px-1.5 py-0.5 h-4 flex items-center gap-0.5 shrink-0">
                            <TrendingDown className="h-2.5 w-2.5" /> Melhor Preço
                          </Badge>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {supp ? `${supp.city || ""}, ${supp.province || ""}` : "Dados de localização indisponíveis"} {rel.brand ? `· Marca: ${rel.brand}` : ""}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="font-semibold">{rel.unitPrice ? formatMZN(rel.unitPrice) : "Sem preço"}</div>
                      <div className="text-[10px] text-muted-foreground">
                        por {purchaseUnit?.symbol ?? "un"} {rel.conversionFactor && rel.conversionFactor !== 1 ? `(fator ${rel.conversionFactor})` : ""}
                      </div>
                    </td>
                    <td className="p-2">
                      {basePrice !== null ? (
                        <>
                          <div className={`font-bold ${isBest ? "text-emerald-700 dark:text-emerald-400" : "text-primary"}`}>
                            {formatMZN(basePrice)}
                          </div>
                          <div className="text-[10px] text-muted-foreground">por {baseUnitSymbol || "un"}</div>
                        </>
                      ) : (
                        <div className="text-[11px] text-muted-foreground italic">Preço base indisponível</div>
                      )}
                    </td>
                    <td className="p-2 text-[11px]">
                      <div>{rel.minimumOrderQuantity ? `Min: ${rel.minimumOrderQuantity}` : "Sem mínimo"}</div>
                      <div className="text-muted-foreground">{rel.leadTimeDays ? `${rel.leadTimeDays} dias` : "Prazo —"}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
