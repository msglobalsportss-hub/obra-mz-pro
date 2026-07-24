import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Clock, AlertTriangle, TrendingUp, CalendarDays, Percent, Award,
  UserCheck, ShieldAlert, ChevronLeft, ChevronRight, RefreshCw, Check, X
} from "lucide-react";
import { formatMins } from "@/lib/time-utils";
import type { AttendanceSummary, AggregateCostResult, AttendanceStats } from "@/lib/attendance-analytics";
import type { AttendancePeriodMode } from "@/lib/attendance-period-utils";

type AttendanceSummaryCardProps = {
  summary: AttendanceSummary;
  cost: AggregateCostResult;
  stats: AttendanceStats;
  title: string;
  dateStr: string;
  periodMode: AttendancePeriodMode;
  onPeriodModeChange: (mode: AttendancePeriodMode) => void;
  onNavigate: (dir: "prev" | "next") => void;
  onHoje: () => void;
  lastUpdated: string;
  // Custom range temporary edits
  customDateFrom: string;
  customDateTo: string;
  onCustomDateFromChange: (val: string) => void;
  onCustomDateToChange: (val: string) => void;
  onApplyCustomDates: () => void;
  onCancelCustomDates: () => void;
  customDateError: string | null;
  isApplyDisabled: boolean;
  isCustomEditing: boolean;
  
  hojeButtonLabel: string;
  isHojeDisabled: boolean;
};

// Formatação Monetária baseada no padrão de Moçambique com espaço como separador
export function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return `${formatted} MTn`;
}

export function formatCurrencyAbbreviated(amount: number): { short: string; full: string } {
  const full = formatCurrency(amount);
  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000;
    const formattedMillions = new Intl.NumberFormat("pt-MZ", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(millions);
    return { short: `${formattedMillions} M MTn`, full };
  }
  return { short: full, full };
}

export function AttendanceSummaryCard({
  summary,
  cost,
  stats,
  title,
  dateStr,
  periodMode,
  onPeriodModeChange,
  onNavigate,
  onHoje,
  lastUpdated,
  customDateFrom,
  customDateTo,
  onCustomDateFromChange,
  onCustomDateToChange,
  onApplyCustomDates,
  onCancelCustomDates,
  customDateError,
  isApplyDisabled,
  isCustomEditing,
  hojeButtonLabel,
  isHojeDisabled,
}: AttendanceSummaryCardProps) {
  const costFormatted = formatCurrencyAbbreviated(cost.totalCost);

  return (
    <Card className="border border-border/85 bg-card overflow-hidden shadow-xs">
      {/* Cabeçalho Executivo com Seletor e Navegação */}
      <CardHeader className="py-4 px-4 bg-muted/30 border-b flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-0">
        
        {/* Lado Esquerdo: Título e Intervalo de Datas */}
        <div className="space-y-1 min-w-0">
          <CardTitle className="text-xs font-bold text-foreground flex items-center gap-2">
            📊 Resumo Operacional
          </CardTitle>
          <div className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1.5">
            <CalendarDays className="h-3 w-3 text-primary shrink-0" />
            <span>{dateStr}</span>
          </div>
        </div>

        {/* Centro/Direita: Controles de Período e Navegação */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          
          {/* Navegação Anteriores/Seguintes (Desativada no modo Custom) */}
          <div className="flex items-center border rounded-lg bg-background overflow-hidden h-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigate("prev")}
              disabled={periodMode === "custom"}
              className="h-7 w-7 rounded-none hover:bg-muted text-muted-foreground disabled:opacity-40"
              aria-label="Período anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigate("next")}
              disabled={periodMode === "custom"}
              className="h-7 w-7 rounded-none hover:bg-muted text-muted-foreground disabled:opacity-40 border-l"
              aria-label="Período seguinte"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Segmented Control de Períodos */}
          <div className="flex items-center border rounded-lg bg-muted/30 p-0.5 h-8">
            <button
              aria-pressed={periodMode === "day"}
              aria-label="Modo Dia"
              onClick={() => onPeriodModeChange("day")}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all h-7 ${
                periodMode === "day"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Dia
            </button>
            <button
              aria-pressed={periodMode === "week"}
              aria-label="Modo Semana"
              onClick={() => onPeriodModeChange("week")}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all h-7 ${
                periodMode === "week"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Semana
            </button>
            <button
              aria-pressed={periodMode === "month"}
              aria-label="Modo Mês"
              onClick={() => onPeriodModeChange("month")}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all h-7 ${
                periodMode === "month"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mês
            </button>
            <button
              aria-pressed={periodMode === "custom"}
              aria-label="Modo Personalizado"
              onClick={() => onPeriodModeChange("custom")}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all h-7 ${
                periodMode === "custom"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Personalizado
            </button>
          </div>

          {/* Botão Hoje Contextual e Acessível */}
          <Button
            variant="outline"
            onClick={onHoje}
            disabled={isHojeDisabled}
            aria-disabled={isHojeDisabled}
            className="h-8 text-[10px] font-bold px-2.5 hover:bg-muted border disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            aria-label={`Ir para ${hojeButtonLabel}`}
          >
            {hojeButtonLabel}
          </Button>

          {/* Horário de Atualização */}
          <div className="text-[9px] text-muted-foreground font-semibold flex items-center gap-1 bg-muted/20 px-2 py-1 rounded border ml-auto lg:ml-2">
            <RefreshCw className="h-3 w-3 shrink-0 text-muted-foreground/60 animate-spin-slow" />
            <span>Última atualização: {lastUpdated}</span>
          </div>
        </div>

      </CardHeader>

      {/* Form de Edição Separado para Período Personalizado (Apenas exibido se periodMode for custom e isCustomEditing for verdadeiro) */}
      {periodMode === "custom" && isCustomEditing && (
        <div className="px-5 py-3.5 bg-muted/10 border-b border-border/60 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex-1 space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Data Inicial</span>
              <input
                type="date"
                value={customDateFrom}
                onChange={(e) => onCustomDateFromChange(e.target.value)}
                className="w-full h-8 px-3 rounded-md border border-input bg-background text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="flex-1 space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Data Final</span>
              <input
                type="date"
                value={customDateTo}
                onChange={(e) => onCustomDateToChange(e.target.value)}
                className="w-full h-8 px-3 rounded-md border border-input bg-background text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={onApplyCustomDates}
                disabled={isApplyDisabled}
                className="h-8 bg-primary hover:bg-primary/90 text-white text-xs gap-1 px-3"
              >
                <Check className="h-3.5 w-3.5" />
                Aplicar
              </Button>
              <Button
                variant="outline"
                onClick={onCancelCustomDates}
                className="h-8 text-xs gap-1 px-3 border bg-background"
              >
                <X className="h-3.5 w-3.5" />
                Cancelar
              </Button>
            </div>
          </div>
          {customDateError && (
            <div className="flex items-center gap-1.5 text-[10px] text-rose-600 font-bold bg-rose-50 px-2.5 py-1.5 rounded border border-rose-200/50">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>{customDateError}</span>
            </div>
          )}
        </div>
      )}

      <CardContent className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Coluna 1: Indicadores Operacionais */}
          <div className="space-y-4">
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider border-b pb-1">
              Indicadores Operacionais
            </div>
            <div className="space-y-2.5">
              {/* Trabalhadores */}
              <div className="flex items-center justify-between text-xs py-1 border-b border-border/40">
                <span className="flex items-center gap-2 text-muted-foreground font-medium">
                  <span className="text-sm">👷</span>
                  Trabalhadores no Período
                </span>
                <span className="font-bold text-foreground">{summary.totalWorkers}</span>
              </div>
              
              {/* Taxa Assiduidade */}
              <div className="flex items-center justify-between text-xs py-1 border-b border-border/40">
                <span className="flex items-center gap-2 text-muted-foreground font-medium">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                  Taxa de Assiduidade
                </span>
                <span className="font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                  {stats.assiduidadeTaxa.toFixed(1)}%
                </span>
              </div>

              {/* Taxa Absentismo */}
              <div className="flex items-center justify-between text-xs py-1 border-b border-border/40">
                <span className="flex items-center gap-2 text-muted-foreground font-medium">
                  <Percent className="h-3.5 w-3.5 text-rose-600" />
                  Taxa de Absentismo
                </span>
                <span className="font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded text-[10px]">
                  {stats.absentismoTaxa.toFixed(1)}%
                </span>
              </div>

              {/* Média de Horas */}
              <div className="flex items-center justify-between text-xs py-1 border-b border-border/40">
                <span className="flex items-center gap-2 text-muted-foreground font-medium">
                  <Clock className="h-3.5 w-3.5 text-sky-600" />
                  Média de Horas por Trabalhador
                </span>
                <span className="font-bold text-foreground">{formatMins(stats.avgWorkedMinutes)}</span>
              </div>

              {/* Horas Extra Totais */}
              <div className="flex items-center justify-between text-xs py-1 border-b border-border/40">
                <span className="flex items-center gap-2 text-muted-foreground font-medium">
                  <Award className="h-3.5 w-3.5 text-purple-600" />
                  Horas Extra Totais
                </span>
                <span className="font-bold text-purple-600">{formatMins(summary.overtimeMinutes)}</span>
              </div>
            </div>
          </div>

          {/* Coluna 2: Indicadores Financeiros */}
          <div className="space-y-4">
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider border-b pb-1">
              Indicadores Financeiros (Operacionais)
            </div>
            <div className="space-y-2.5">
              {/* Custo Operacional */}
              <div className="flex items-center justify-between text-xs py-1 border-b border-border/40">
                <span className="flex items-center gap-2 text-muted-foreground font-medium">
                  <span>💰</span>
                  Custo Operacional Total
                </span>
                <span 
                  className="font-black text-slate-800 text-sm cursor-help hover:underline decoration-dashed decoration-1"
                  title={costFormatted.full}
                >
                  {costFormatted.short}
                </span>
              </div>

              {/* Trabalhadores com Custo */}
              <div className="flex items-center justify-between text-xs py-1 border-b border-border/40">
                <span className="flex items-center gap-2 text-muted-foreground font-medium">
                  <UserCheck className="h-3.5 w-3.5 text-slate-500" />
                  Trabalhadores com custo definido
                </span>
                <span className="font-bold text-foreground">{summary.workersWithCost}</span>
              </div>

              {/* Trabalhadores sem Custo */}
              <div className="flex items-center justify-between text-xs py-1 border-b border-border/40">
                <span className="flex items-center gap-2 text-muted-foreground font-medium">
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                  Trabalhadores sem custo definido
                </span>
                <span className="font-bold text-foreground">{summary.workersWithoutCost}</span>
              </div>
              
              {/* Aviso de custo discreto */}
              {summary.workersWithoutCost > 0 && (
                <div className="mt-1 flex items-center gap-1.5 text-[10px] text-amber-600 font-semibold bg-amber-50 px-2 py-1.5 rounded border border-amber-200/50">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span>Existem {summary.workersWithoutCost} trabalhadores sem custo configurado.</span>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </CardContent>
    </Card>
  );
}
