/**
 * Reconstrução Administrativa de Saldos: RebuildBalancesView
 * Categoria: features/rebuild
 *
 * Ferramenta administrativa para recalcular saldos projetados a partir do histórico imutável (Seção 17).
 * Suporta modo Dry-Run (simulação em memória) e confirmação explícita.
 */

import React, { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { PageContainer } from "@/components/shared/page-container";
import { InventoryConfirmationDialog } from "../../components/inventory-confirmation-dialog";
import { InventoryPermissionState } from "../../components/inventory-permission-state";
import { useInventoryPermissions } from "../../hooks/use-inventory-permissions";
import { inventoryActions } from "../../application/actions/action-container";
import { useObraMZStore } from "@/store/obramz-store";
import {
  toTenantId,
  toCompanyId,
  toInventoryLocationId,
  toMaterialId,
} from "../../core/shared/primitives";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Boxes, Play, CheckCircle2, AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import type { InventoryBalanceRebuildResult } from "../../core/engine/inventory-balance-rebuilder";

export function RebuildBalancesView() {
  const permissions = useInventoryPermissions();
  const activeCompanyId = useObraMZStore((s) => s.activeCompanyId);
  const activeTenantId = useObraMZStore((s) => s.activeTenantId);

  const [dryRun, setDryRun] = useState(true);
  const [materialFilter, setMaterialFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [reasonDescription, setReasonDescription] = useState(
    "Reconstrução administrativa periódica de saldos",
  );

  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState<InventoryBalanceRebuildResult | null>(null);

  if (!permissions.canRebuild) {
    return (
      <InventoryPermissionState
        title="Acesso Restrito"
        description="Apenas administradores podem executar a reconstrução de saldos de inventário."
      />
    );
  }

  const handleExecute = async () => {
    setLoading(true);
    try {
      const res = await inventoryActions.rebuildBalances({
        tenantId: toTenantId(activeTenantId),
        companyId: toCompanyId(activeCompanyId),
        materialId: materialFilter.trim() ? toMaterialId(materialFilter.trim()) : undefined,
        locationId: locationFilter.trim()
          ? toInventoryLocationId(locationFilter.trim())
          : undefined,
        dryRun,
      });
      setResult(res);
      setConfirmOpen(false);
    } catch (err: unknown) {
      alert(`Erro na reconstrução: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    if (dryRun) {
      handleExecute();
    } else {
      setConfirmOpen(true);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Reconstrução Administrativa de Saldos"
        description="Recalcula e substitui as projeções de saldo derivadas do histórico imutável de movimentos"
        breadcrumbs={[
          { label: "Início", href: "/app" },
          { label: "Inventário", href: "/app/inventory" },
          { label: "Reconstrução" },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel de Configuração */}
        <Card className="border-border/60 lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Parâmetros de Reconstrução</CardTitle>
            <CardDescription className="text-xs">
              Scope restrito ao Tenant <strong className="text-foreground">{activeTenantId}</strong>{" "}
              e Empresa <strong className="text-foreground">{activeCompanyId}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border/40">
              <div>
                <Label className="text-xs font-semibold block">Modo Dry Run (Simulação)</Label>
                <span className="text-[11px] text-muted-foreground">
                  Não altera a base de dados, apenas compara saldos.
                </span>
              </div>
              <Switch checked={dryRun} onCheckedChange={setDryRun} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Filtro por Material (Opcional)</Label>
              <Input
                value={materialFilter}
                onChange={(e) => setMaterialFilter(e.target.value)}
                placeholder="Deixar em branco para Todos os Materiais"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Filtro por Localização (Opcional)</Label>
              <Input
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                placeholder="Deixar em branco para Todas as Localizações"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Justificação Administrativa</Label>
              <Input
                value={reasonDescription}
                onChange={(e) => setReasonDescription(e.target.value)}
                placeholder="Razão do acerto de saldos..."
                required
              />
            </div>

            <Button onClick={handleStart} disabled={loading} className="w-full gap-2 mt-2">
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : dryRun ? (
                <Play className="w-4 h-4" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>{dryRun ? "Executar Dry-Run (Simular)" : "Executar Reconstrução Real"}</span>
            </Button>
          </CardContent>
        </Card>

        {/* Painel de Resultados */}
        <Card className="border-border/60 lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Relatório de Resultados de Reconstrução
            </CardTitle>
            <CardDescription className="text-xs">
              Resumo das alterações detetadas e corrigidas na memória de saldos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!result ? (
              <p className="text-xs text-muted-foreground text-center py-12">
                Nenhuma reconstrução executada recentemente. Configura os parâmetros e clica em
                Executar.
              </p>
            ) : (
              <div className="space-y-4 text-xs">
                <Alert
                  className={
                    result.discrepanciesCorrected > 0
                      ? "bg-amber-500/10 border-amber-500/20 text-amber-700"
                      : "bg-emerald-500/10 border-emerald-500/20 text-emerald-700"
                  }
                >
                  <AlertDescription className="font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {result.dryRun
                        ? "[DRY RUN] Simulação concluída com sucesso!"
                        : "Reconstrução real efetuada com sucesso!"}
                    </span>
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 bg-muted/40 rounded-xl border border-border/40">
                    <span className="text-[11px] text-muted-foreground block uppercase">
                      Movimentos
                    </span>
                    <span className="text-lg font-bold text-foreground">
                      {result.movementsProcessed}
                    </span>
                  </div>
                  <div className="p-3 bg-muted/40 rounded-xl border border-border/40">
                    <span className="text-[11px] text-muted-foreground block uppercase">
                      Saldos Reconstruídos
                    </span>
                    <span className="text-lg font-bold text-foreground">
                      {result.balancesRebuilt}
                    </span>
                  </div>
                  <div className="p-3 bg-muted/40 rounded-xl border border-border/40">
                    <span className="text-[11px] text-muted-foreground block uppercase">
                      Inalterados
                    </span>
                    <span className="text-lg font-bold text-foreground">
                      {result.balancesUnchanged}
                    </span>
                  </div>
                  <div className="p-3 bg-muted/40 rounded-xl border border-border/40">
                    <span className="text-[11px] text-muted-foreground block uppercase">
                      Discrepâncias
                    </span>
                    <span className="text-lg font-bold text-amber-600">
                      {result.discrepanciesCorrected}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Diálogo de Confirmação para Reconstrução Real */}
      <InventoryConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirmar Reconstrução Real de Saldos"
        description="Esta ação substituirá as projeções de saldo atuais na base de dados pelos valores recalculados do histórico imutável de movimentos. Os movimentos originais NUNCA serão alterados."
        confirmLabel="Substituir Saldos Agora"
        variant="amber"
        loading={loading}
        onConfirm={handleExecute}
      />
    </PageContainer>
  );
}
