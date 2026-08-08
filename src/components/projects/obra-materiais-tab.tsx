import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { StatCard } from "@/components/stat-card";
import { Plus, Boxes, Package, TrendingDown, CheckCircle2, AlertCircle } from "lucide-react";
import { formatMZN, formatDate } from "@/lib/format";
import {
  inventoryStoreManager,
  inventoryActions,
  useInventoryOperation,
} from "@/modules/inventory";
import { toTenantId, toCompanyId } from "@/modules/inventory/core/shared/primitives";
import { toast } from "sonner";

interface ObraMateriaisTabProps {
  obraId: string;
  obraNome: string;
  fases?: Array<{ id: string; nome: string }>;
}

export function ObraMateriaisTab({ obraId, obraNome, fases = [] }: ObraMateriaisTabProps) {
  const [storeState, setStoreState] = useState(() => inventoryStoreManager.getState());
  const [consumeDialogOpen, setConsumeDialogOpen] = useState(false);

  // Form states
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [quantityInput, setQuantityInput] = useState("");
  const [selectedPhaseId, setSelectedPhaseId] = useState("ALL");
  const [notesInput, setNotesInput] = useState("");

  useEffect(() => {
    return inventoryStoreManager.subscribe(setStoreState);
  }, []);

  // 1. Filtrar saldos associados a esta Obra
  const obraBalances = useMemo(() => {
    const allBalances = Object.values(storeState.balances);
    return allBalances.filter(
      (b) =>
        b.locationId === obraId ||
        b.locationId === `LOC-PROJ-${obraId}` ||
        b.locationId.includes(obraId),
    );
  }, [storeState.balances, obraId]);

  // 2. Filtrar movimentos associados a esta Obra
  const obraMovements = useMemo(() => {
    return storeState.movements.filter(
      (m) =>
        m.sourceLocationId === obraId ||
        m.destinationLocationId === obraId ||
        m.sourceLocationId?.includes(obraId) ||
        m.destinationLocationId?.includes(obraId),
    );
  }, [storeState.movements, obraId]);

  // 3. Cálculos Financeiros da Obra (Refinamento E)
  // - Valor dos Materiais Recebidos (Transferências ou Entregas para a Obra)
  const valorRecebido = useMemo(() => {
    return obraMovements
      .filter(
        (m) => m.destinationLocationId === obraId || m.destinationLocationId?.includes(obraId),
      )
      .reduce((sum, m) => sum + (m.totalCost || m.quantity * (m.unitCost || 0)), 0);
  }, [obraMovements, obraId]);

  // - Valor do Stock Atual na Obra (Físico * WAC)
  const valorStockAtual = useMemo(() => {
    return obraBalances.reduce((sum, b) => sum + b.totalValue, 0);
  }, [obraBalances]);

  // - Valor dos Materiais Consumidos na Obra
  const valorConsumido = useMemo(() => {
    return obraMovements
      .filter(
        (m) =>
          (m.sourceLocationId === obraId || m.sourceLocationId?.includes(obraId)) &&
          m.movementType.includes("issue"),
      )
      .reduce((sum, m) => sum + (m.totalCost || m.quantity * (m.unitCost || 0)), 0);
  }, [obraMovements, obraId]);

  // 4. Operation Hook para o Consumo na Obra
  const consumeOperation = useInventoryOperation(async (params) => {
    const locId =
      obraBalances.find((b) => b.materialId === selectedMaterialId)?.locationId || obraId;
    return inventoryActions.issueStock({
      tenantId: toTenantId(storeState.tenantId || "tenant-default"),
      companyId: toCompanyId(storeState.companyId || "company-default"),
      correlationId: `corr-cons-${Date.now()}`,
      idempotencyKey: params.idempotencyKey,
      timestamp: new Date().toISOString(),
      sourceModule: "obra_ui",
      materialId: selectedMaterialId,
      locationId: locId,
      quantity: parseFloat(quantityInput),
      notes: `Consumo na Obra ${obraNome}. Fase: ${selectedPhaseId}. ${notesInput}`,
    });
  });

  const handleConsumeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterialId) {
      toast.error("Selecione um material para consumo.");
      return;
    }
    const qty = parseFloat(quantityInput);
    if (isNaN(qty) || qty <= 0) {
      toast.error("A quantidade utilizada deve ser um valor positivo.");
      return;
    }

    const res = await consumeOperation.execute();
    if (res && res.success) {
      toast.success("Consumo registado com sucesso! Stock da obra atualizado.");
      setQuantityInput("");
      setNotesInput("");
      setTimeout(() => setConsumeDialogOpen(false), 1200);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards — Refinamento E */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard
          label="Valor Recebido"
          value={formatMZN(valorRecebido)}
          icon={Package}
          tone="primary"
        />
        <StatCard
          label="Stock Atual na Obra"
          value={formatMZN(valorStockAtual)}
          icon={Boxes}
          tone="success"
        />
        <StatCard
          label="Materiais Consumidos"
          value={formatMZN(valorConsumido)}
          icon={TrendingDown}
          tone="warning"
        />
        <StatCard
          label="Total de Consumos"
          value={obraMovements.filter((m) => m.movementType.includes("issue")).length.toString()}
          tone="primary"
        />
      </div>

      {/* Tabela de Stock Local da Obra */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
          <div>
            <div className="text-base font-semibold">Materiais no Estaleiro da Obra</div>
            <div className="text-xs text-muted-foreground">
              Materiais fisicamente disponíveis nesta obra para aplicação imediata.
            </div>
          </div>
          <Button
            className="bg-primary hover:bg-primary-dark"
            onClick={() => setConsumeDialogOpen(true)}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Registar Consumo
          </Button>
        </div>

        <div className="mt-4 divide-y overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b bg-muted/30 text-muted-foreground font-semibold">
                <th className="py-2.5 px-3">Material (SKU)</th>
                <th className="py-2.5 px-3 text-right">Físico na Obra</th>
                <th className="py-2.5 px-3 text-right">Reservado</th>
                <th className="py-2.5 px-3 text-right">Disponível (Refinamento B)</th>
                <th className="py-2.5 px-3 text-right">Custo Médio (WAC)</th>
                <th className="py-2.5 px-3 text-right">Valor em Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {obraBalances.map((b) => {
                // Refinamento B: Disponível = Físico - Reservado (Sem somar reservas ao físico)
                const disponivel = Math.max(0, b.onHandQuantity - b.reservedQuantity);
                return (
                  <tr key={b.id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-3 px-3 font-medium text-foreground">{b.materialId}</td>
                    <td className="py-3 px-3 text-right font-mono font-semibold">
                      {b.onHandQuantity}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-amber-600">
                      {b.reservedQuantity}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-600 font-bold">
                      {disponivel}
                    </td>
                    <td className="py-3 px-3 text-right font-mono">{formatMZN(b.averageCost)}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold">
                      {formatMZN(b.totalValue)}
                    </td>
                  </tr>
                );
              })}
              {obraBalances.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    Nenhum material alocado a esta obra atualmente.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Registar Consumo na Obra */}
      <Dialog open={consumeDialogOpen} onOpenChange={setConsumeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-amber-600" />
              <span>Registar Consumo na Obra</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Baixa física do stock da obra e imputação do custo dos materiais ao orçamento da obra
              (sem saída de caixa).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConsumeSubmit} className="space-y-4 pt-2">
            {consumeOperation.error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{consumeOperation.error}</span>
              </div>
            )}

            {consumeOperation.status === "completed" && (
              <div className="p-3 rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Consumo registado com sucesso!</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">Material a Consumir</Label>
              <Select value={selectedMaterialId} onValueChange={setSelectedMaterialId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o material..." />
                </SelectTrigger>
                <SelectContent>
                  {obraBalances.map((b) => (
                    <SelectItem key={b.id} value={b.materialId}>
                      {b.materialId} (Disp: {Math.max(0, b.onHandQuantity - b.reservedQuantity)})
                    </SelectItem>
                  ))}
                  {obraBalances.length === 0 && (
                    <SelectItem value="none" disabled>
                      Sem materiais na obra
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Quantidade Utilizada</Label>
                <Input
                  type="number"
                  step="any"
                  placeholder="Ex: 10"
                  value={quantityInput}
                  onChange={(e) => setQuantityInput(e.target.value)}
                />
              </div>

              {fases.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Fase da Obra</Label>
                  <Select value={selectedPhaseId} onValueChange={setSelectedPhaseId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas / Geral" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Geral da Obra</SelectItem>
                      {fases.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Observações / Aplicação</Label>
              <Input
                placeholder="Ex: Betonagem da laje do 1º piso"
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setConsumeDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={consumeOperation.loading}
                className="bg-primary hover:bg-primary-dark"
              >
                {consumeOperation.loading ? "A processar..." : "Confirmar Consumo"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
