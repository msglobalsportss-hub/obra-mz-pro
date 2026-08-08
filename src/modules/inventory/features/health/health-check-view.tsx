import React, { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { PageContainer } from "@/components/shared/page-container";
import { InventoryPermissionState } from "../../components/inventory-permission-state";
import { useInventoryPermissions } from "../../hooks/use-inventory-permissions";
import { inventoryStoreManager } from "../../store/inventory-store";
import { useObraMZStore } from "@/store/obramz-store";
import { InventoryMigrationService, MigrationRepairReport } from "../../application/services/inventory-migration.service";
import { formatMZN } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShieldAlert, Activity, CheckCircle2, AlertTriangle, RefreshCw, Wrench, FileText, Lock } from "lucide-react";

export function HealthCheckView() {
  const permissions = useInventoryPermissions();
  const deliveries = useObraMZStore((s) => s.deliveries || []);
  const purchaseOrders = useObraMZStore((s) => s.purchaseOrders || []);
  const activeCompanyId = useObraMZStore((s) => s.activeCompanyId) ?? "COMP-1";
  const activeTenantId = useObraMZStore((s) => s.activeTenantId) ?? "TENANT-A";

  // Estados
  const [diagnosticReport, setDiagnosticReport] = useState<MigrationRepairReport | null>(null);
  const [loadingDiagnostic, setLoadingDiagnostic] = useState(false);

  // Modal de Reparação Executiva
  const [openRepairModal, setOpenRepairModal] = useState(false);
  const [dryRunReport, setDryRunReport] = useState<MigrationRepairReport | null>(null);
  const [loadingDryRun, setLoadingDryRun] = useState(false);
  const [executingRepair, setExecutingRepair] = useState(false);
  const [repairReason, setRepairReason] = useState("");
  const [repairSuccessResult, setRepairSuccessResult] = useState<MigrationRepairReport | null>(null);

  if (!permissions.canView) {
    return <InventoryPermissionState />;
  }

  // 1. Executar Diagnóstico Read-Only
  const runDiagnostic = async () => {
    setLoadingDiagnostic(true);
    try {
      const rep = await InventoryMigrationService.repairOrphanDeliveries({
        deliveries,
        purchaseOrders,
        activeTenantId,
        activeCompanyId,
        dryRun: true,
      });
      setDiagnosticReport(rep);
    } finally {
      setLoadingDiagnostic(false);
    }
  };

  // 2. Abrir Modal de Reparação (Executa Dry-Run)
  const openRepairDialog = async () => {
    setLoadingDryRun(true);
    setOpenRepairModal(true);
    try {
      const rep = await InventoryMigrationService.repairOrphanDeliveries({
        deliveries,
        purchaseOrders,
        activeTenantId,
        activeCompanyId,
        dryRun: true,
      });
      setDryRunReport(rep);
    } finally {
      setLoadingDryRun(false);
    }
  };

  // 3. Executar Reparação Efetiva Auditada
  const executeRepair = async () => {
    if (!repairReason.trim()) {
      alert("A justificativa de reparação é obrigatória.");
      return;
    }

    setExecutingRepair(true);
    try {
      const rep = await InventoryMigrationService.repairOrphanDeliveries({
        deliveries,
        purchaseOrders,
        activeTenantId,
        activeCompanyId,
        dryRun: false,
      });
      setRepairSuccessResult(rep);
      // Re-executar diagnóstico
      await runDiagnostic();
      setTimeout(() => {
        setOpenRepairModal(false);
        setRepairSuccessResult(null);
      }, 1500);
    } finally {
      setExecutingRepair(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Verificar inconsistências do Inventário"
        description="Diagnóstico e reparação auditada de integridade entre Entregas, Movimentos e Stock"
        breadcrumbs={[
          { label: "Início", href: "/app" },
          { label: "Inventário", href: "/app/inventory" },
          { label: "Verificar inconsistências" },
        ]}
      />

      {/* PAINEL DE DIAGNÓSTICO READ-ONLY */}
      <Card className="border-border/60 mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-600" />
              <span>Diagnóstico de Integridade de Stock</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Varredura de consistência de dados sem alterar registos
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={runDiagnostic}
            disabled={loadingDiagnostic}
            className="gap-2 bg-purple-600 hover:bg-purple-700 text-white"
          >
            <RefreshCw className={`w-4 h-4 ${loadingDiagnostic ? "animate-spin" : ""}`} />
            <span>Executar Diagnóstico</span>
          </Button>
        </CardHeader>
        <CardContent>
          {!diagnosticReport ? (
            <div className="text-center py-6 text-xs text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
              Clique em "Executar Diagnóstico" para ler o estado de integridade do inventário.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-muted/40 rounded-lg border">
                  <span className="text-muted-foreground block text-[11px] uppercase">Entregas Analisadas</span>
                  <span className="text-lg font-bold text-foreground">{diagnosticReport.scannedDeliveries}</span>
                </div>
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <span className="text-amber-800 dark:text-amber-300 block text-[11px] uppercase font-bold">Entregas Confirmadas s/ Movimento</span>
                  <span className="text-lg font-bold text-amber-700">{diagnosticReport.orphanDeliveriesCount}</span>
                </div>
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <span className="text-purple-800 dark:text-purple-300 block text-[11px] uppercase font-bold">Impacto Financeiro Estimado</span>
                  <span className="text-lg font-bold text-purple-700">{formatMZN(diagnosticReport.totalFinancialImpactMZN)}</span>
                </div>
              </div>

              {/* Botão de Reparação Executiva se existirem divergências */}
              {diagnosticReport.orphanDeliveriesCount > 0 && permissions.isAdmin && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Foram encontradas {diagnosticReport.orphanDeliveriesCount} entregas necessitando de reparação
                    </span>
                    <span className="text-[11px] text-muted-foreground block">
                      A reparação criará os movimentos em falta de forma idempotente e auditada.
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={openRepairDialog}
                    className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <Wrench className="w-4 h-4" />
                    <span>Iniciar Reparação Executiva</span>
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL DE REPARAÇÃO EXECUTÁVEL (COM DRY-RUN, IMPACTO E PERMISSÃO) */}
      <Dialog open={openRepairModal} onOpenChange={setOpenRepairModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              <span>Painel de Reparação Executiva Auditada</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Esta ação corrigirá a inconsistência criando movimentos de stock idempotentes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2 text-xs">
            {repairSuccessResult && (
              <Alert className="py-2 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Reparação concluída com sucesso! {repairSuccessResult.repairedDeliveriesCount} entregas corrigidas.</span>
              </Alert>
            )}

            {/* Resultado do Dry-Run */}
            <div className="p-3 bg-muted/40 rounded-lg border space-y-1.5">
              <span className="font-bold text-foreground block text-[11px] uppercase">Estimativa de Impacto (Dry-Run)</span>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Entregas a reparar:</span>
                <strong className="text-foreground">{dryRunReport?.orphanDeliveriesCount || 0}</strong>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Impacto em Stock / Valor:</span>
                <strong className="text-emerald-600 font-mono">{formatMZN(dryRunReport?.totalFinancialImpactMZN || 0)}</strong>
              </div>
            </div>

            {/* Justificativa Obrigatória */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Motivo da Reparação (Auditado) *</Label>
              <Textarea
                value={repairReason}
                onChange={(e) => setRepairReason(e.target.value)}
                placeholder="Insira a justificativa administrativa para registrar esta reparação no histórico..."
                rows={3}
                className="text-xs"
                required
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setOpenRepairModal(false)} disabled={executingRepair}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={executeRepair}
              disabled={executingRepair || !repairReason.trim()}
              className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
            >
              {executingRepair && <RefreshCw className="w-4 h-4 animate-spin" />}
              <span>Confirmar & Executar Reparação</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
