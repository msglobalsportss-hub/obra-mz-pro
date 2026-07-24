import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus, Calendar, MoreHorizontal, Eye, Pencil, Trash2,
  CheckCircle2, XCircle, Clock, Info, Users, Briefcase, TrendingUp, History, Trophy
} from "lucide-react";
import { useObraMZStore } from "@/store/obramz-store";
import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import { AttendanceFormDialog } from "@/components/teams/attendance-form-dialog";
import { AttendanceDetailsDialog } from "@/components/teams/attendance-details-dialog";
import { AttendanceRollCallDialog } from "@/components/teams/attendance-rollcall-dialog";
import { AttendanceHistoryDialog } from "@/components/teams/attendance-history-dialog";
import { AttendanceKpiCard } from "@/components/teams/attendance-kpi-card";
import { AttendanceSummaryCard, formatCurrencyAbbreviated } from "@/components/teams/attendance-summary-card";
import { AttendanceFilterToolbar } from "@/components/teams/attendance-filter-toolbar";
import { AttendanceAdvancedFilterSheet } from "@/components/teams/attendance-advanced-filter-sheet";
import { AttendanceScheduleList } from "@/components/teams/attendance-schedule-list";
import { AttendanceScheduleFormDialog } from "@/components/teams/attendance-schedule-form-dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/format";
import type { AttendanceRecord, AttendanceStatus } from "@/lib/mock-data";
import { formatAttendanceHours, formatMins } from "@/lib/time-utils";
import { getAttendanceKPIs, getAttendanceSummary, getAttendanceStats } from "@/lib/attendance-analytics";
import {
  AttendancePeriodMode, getDayRange, getWeekRange, getMonthRange,
  detectPeriodMode, shiftPeriod, formatPeriodLabel
} from "@/lib/attendance-period-utils";
import {
  AttendanceFilterState,
  createDefaultAttendanceFilterState,
  runAttendanceFilterPipeline,
} from "@/lib/attendance-filters";
import {
  generateAttendanceStatistics,
  AttendanceDashboardAdapter,
  type AttendanceStatisticsContext,
} from "@/lib/attendance-statistics";
import {
  generateAttendanceRankings,
  AttendanceRankingDashboardAdapter,
  type AttendanceRankingContext,
} from "@/lib/attendance-rankings";

export const Route = createFileRoute("/app/presencas/")({
  component: PresencasPage,
});

const getNowTimestamp = () => {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} • ${hours}:${minutes}`;
};

function PresencasPage() {
  const hydrated = useObraMZStore((s) => s._hydrated);
  const attendanceRecords = useObraMZStore((s) => s.attendanceRecords || []);
  const deleteAttendanceRecord = useObraMZStore((s) => s.deleteAttendanceRecord);
  const workers = useObraMZStore((s) => s.workers || []);
  const obras = useObraMZStore((s) => s.obras || []);
  const teams = useObraMZStore((s) => s.teams || []);
  const attendanceSchedules = useObraMZStore((s) => s.attendanceSchedules || []);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Períodos e Sincronização Inteligente
  const [refDate, setRefDate] = useState<string>(todayStr);
  const [dateFrom, setDateFrom] = useState<string>(todayStr);
  const [dateTo, setDateTo] = useState<string>(todayStr);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [periodMode, setPeriodMode] = useState<AttendancePeriodMode>("day");

  // Estados de edição para o intervalo personalizado e controle de abertura do form
  const [isCustomEditing, setIsCustomEditing] = useState<boolean>(false);
  const [customDateFrom, setCustomDateFrom] = useState<string>(todayStr);
  const [customDateTo, setCustomDateTo] = useState<string>(todayStr);

  // Armazenar o estado aplicado anterior ao entrar no modo Personalizado
  const [prevApplied, setPrevApplied] = useState<{
    periodMode: AttendancePeriodMode;
    dateFrom: string;
    dateTo: string;
    refDate: string;
  }>({
    periodMode: "day",
    dateFrom: todayStr,
    dateTo: todayStr,
    refDate: todayStr,
  });

  // ESTADO UNIFICADO DOS FILTROS AVANÇADOS
  const [filterState, setFilterState] = useState<AttendanceFilterState>(() =>
    createDefaultAttendanceFilterState(todayStr, todayStr)
  );

  // Painel Lateral (Sheet) de Filtros Avançados
  const [advancedSheetOpen, setAdvancedSheetOpen] = useState(false);

  // Modais
  const [formOpen, setFormOpen] = useState(false);
  const [mainTab, setMainTab] = useState<"presencas" | "escalas">("presencas");
  const [scheduleFormOpen, setScheduleFormOpen] = useState(false);
  const [rollCallOpen, setRollCallOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedEdit, setSelectedEdit] = useState<AttendanceRecord | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<AttendanceRecord | null>(null);
  const [confirmDel, setConfirmDel] = useState<AttendanceRecord | null>(null);

  // Inicializar data da última atualização
  useEffect(() => {
    setLastUpdated(getNowTimestamp());
  }, []);

  // Atualizar data da última atualização sempre que os registos da base de dados mudam
  useEffect(() => {
    if (hydrated) {
      setLastUpdated(getNowTimestamp());
    }
  }, [attendanceRecords, hydrated]);

  // Sincronizar intervalo de datas no filterState sempre que dateFrom/dateTo/periodMode mudam
  useEffect(() => {
    setFilterState((prev) => ({
      ...prev,
      dateFrom,
      dateTo,
      periodMode,
    }));
  }, [dateFrom, dateTo, periodMode]);

  // Validação em tempo real do intervalo personalizado (em edição)
  const customDateError = useMemo(() => {
    if (periodMode !== "custom" || !isCustomEditing) return null;
    if (!customDateFrom) {
      return "A Data Inicial é obrigatória.";
    }
    if (!customDateTo) {
      return "A Data Final é obrigatória.";
    }
    if (customDateFrom > customDateTo) {
      return "A Data Inicial não pode ser posterior à Data Final.";
    }
    const today = new Date().toISOString().slice(0, 10);
    if (customDateFrom > today || customDateTo > today) {
      return "Não é possível selecionar datas futuras.";
    }
    return null;
  }, [periodMode, isCustomEditing, customDateFrom, customDateTo, todayStr]);

  const isApplyDisabled = useMemo(() => {
    return customDateError !== null;
  }, [customDateError]);

  // Rótulos do botão Hoje
  const hojeButtonLabel = useMemo(() => {
    if (periodMode === "week") return "Semana Atual";
    if (periodMode === "month") return "Mês Atual";
    return "Hoje";
  }, [periodMode]);

  // Estado desativado do botão Hoje
  const isHojeDisabled = useMemo(() => {
    if (periodMode === "day") {
      return dateFrom === todayStr;
    }
    if (periodMode === "week") {
      const currentWeek = getWeekRange(todayStr);
      return dateFrom === currentWeek.dateFrom && dateTo === currentWeek.dateTo;
    }
    if (periodMode === "month") {
      const currentMonth = getMonthRange(todayStr);
      return dateFrom === currentMonth.dateFrom && dateTo === currentMonth.dateTo;
    }
    return false;
  }, [periodMode, dateFrom, dateTo, todayStr]);

  // Filtrar trabalhadores apenas ativos para seletores
  const activeWorkers = useMemo(() => {
    return workers.filter((w) => w.status === "active" && w.id !== "invalid-orphan");
  }, [workers]);

  // Restaurar todos os filtros e período
  const handleClearAllFilters = () => {
    const today = new Date().toISOString().slice(0, 10);
    setRefDate(today);
    setDateFrom(today);
    setDateTo(today);
    setCustomDateFrom(today);
    setCustomDateTo(today);
    setPeriodMode("day");
    setIsCustomEditing(false);

    const reset = createDefaultAttendanceFilterState(today, today);
    setFilterState(reset);
    setLastUpdated(getNowTimestamp());
    toast.info("Todos os filtros e períodos foram repostos.");
  };

  // PIPELINE DE FILTRAGEM ÚNICO E CENTRALIZADO
  const filterResult = useMemo(() => {
    return runAttendanceFilterPipeline(
      attendanceRecords,
      workers,
      obras,
      teams,
      filterState
    );
  }, [attendanceRecords, workers, obras, teams, filterState]);

  const filteredRecords = filterResult.records;

  // MOTOR DE ESTATÍSTICAS OPERACIONAIS (FASE 4.2)
  const statisticsContext = useMemo<AttendanceStatisticsContext>(() => {
    return {
      filterResult,
      workers,
      teams,
      projects: obras,
    };
  }, [filterResult, workers, teams, obras]);

  const statisticsResult = useMemo(() => {
    return generateAttendanceStatistics(statisticsContext);
  }, [statisticsContext]);

  const analyticsKPIs = useMemo(() => {
    return AttendanceDashboardAdapter.toDashboardKPIs(statisticsResult, statisticsContext);
  }, [statisticsResult, statisticsContext]);

  const analyticsSummary = useMemo(() => {
    return AttendanceDashboardAdapter.toDashboardSummary(statisticsResult);
  }, [statisticsResult]);

  const analyticsStats = useMemo(() => {
    return AttendanceDashboardAdapter.toAttendanceStats(statisticsResult);
  }, [statisticsResult]);

  // MOTOR DE RANKINGS OPERACIONAIS (FASE 4.3)
  const rankingContext = useMemo<AttendanceRankingContext>(() => {
    return {
      statisticsResult,
      filterResult,
      workers,
      teams,
      projects: obras,
    };
  }, [statisticsResult, filterResult, workers, teams, obras]);

  const rankingResult = useMemo(() => {
    return generateAttendanceRankings(rankingContext);
  }, [rankingContext]);

  const topWorkers = useMemo(() => {
    return AttendanceRankingDashboardAdapter.toTopWorkers(rankingResult, workers);
  }, [rankingResult, workers]);

  // Mapas de Pesquisa O(1) para Otimização de Performance
  const workerMap = useMemo(() => {
    const map = new Map<string, Worker>();
    workers.forEach((w) => map.set(w.id, w));
    return map;
  }, [workers]);

  const obraMap = useMemo(() => {
    const map = new Map<string, Obra>();
    obras.forEach((o) => map.set(o.id, o));
    return map;
  }, [obras]);

  const teamMap = useMemo(() => {
    const map = new Map<string, Team>();
    teams.forEach((t) => map.set(t.id, t));
    return map;
  }, [teams]);

  // Formatação monetária abreviada do KPI de Custo
  const formattedKpiCost = useMemo(() => {
    return formatCurrencyAbbreviated(analyticsKPIs.operationalCost.totalCost);
  }, [analyticsKPIs.operationalCost.totalCost]);

  // Rótulo legível do período
  const periodLabel = useMemo(() => {
    return formatPeriodLabel(dateFrom, dateTo, periodMode);
  }, [dateFrom, dateTo, periodMode]);

  // Handlers de Navegação do Período Inteligente
  const handlePeriodModeChange = (mode: AttendancePeriodMode) => {
    if (mode === "custom") {
      setPrevApplied({
        periodMode,
        dateFrom,
        dateTo,
        refDate,
      });
      setCustomDateFrom(dateFrom);
      setCustomDateTo(dateTo);
      setIsCustomEditing(true);
      setPeriodMode("custom");
    } else {
      setIsCustomEditing(false);
      setPeriodMode(mode);
      if (mode === "day") {
        const range = getDayRange(refDate);
        setDateFrom(range.dateFrom);
        setDateTo(range.dateTo);
      } else if (mode === "week") {
        const range = getWeekRange(refDate);
        setDateFrom(range.dateFrom);
        setDateTo(range.dateTo);
      } else if (mode === "month") {
        const range = getMonthRange(refDate);
        setDateFrom(range.dateFrom);
        setDateTo(range.dateTo);
      }
    }
  };

  const handleNavigate = (direction: "prev" | "next") => {
    const newRef = shiftPeriod(refDate, periodMode, direction);
    setRefDate(newRef);

    if (periodMode === "day") {
      const range = getDayRange(newRef);
      setDateFrom(range.dateFrom);
      setDateTo(range.dateTo);
    } else if (periodMode === "week") {
      const range = getWeekRange(newRef);
      setDateFrom(range.dateFrom);
      setDateTo(range.dateTo);
    } else if (periodMode === "month") {
      const range = getMonthRange(newRef);
      setDateFrom(range.dateFrom);
      setDateTo(range.dateTo);
    }
  };

  const handleHoje = () => {
    setRefDate(todayStr);
    setIsCustomEditing(false);
    if (periodMode === "custom") {
      setPeriodMode("day");
      const range = getDayRange(todayStr);
      setDateFrom(range.dateFrom);
      setDateTo(range.dateTo);
    } else {
      if (periodMode === "day") {
        const range = getDayRange(todayStr);
        setDateFrom(range.dateFrom);
        setDateTo(range.dateTo);
      } else if (periodMode === "week") {
        const range = getWeekRange(todayStr);
        setDateFrom(range.dateFrom);
        setDateTo(range.dateTo);
      } else if (periodMode === "month") {
        const range = getMonthRange(todayStr);
        setDateFrom(range.dateFrom);
        setDateTo(range.dateTo);
      }
    }
  };

  const handleApplyCustomDates = () => {
    if (customDateError) return;
    setDateFrom(customDateFrom);
    setDateTo(customDateTo);
    const newDetectedMode = detectPeriodMode(customDateFrom, customDateTo, refDate);
    setPeriodMode(newDetectedMode);
    setIsCustomEditing(false);
    toast.success("Intervalo personalizado aplicado com sucesso.");
  };

  const handleCancelCustomDates = () => {
    setPeriodMode(prevApplied.periodMode);
    setDateFrom(prevApplied.dateFrom);
    setDateTo(prevApplied.dateTo);
    setRefDate(prevApplied.refDate);
    setCustomDateFrom(prevApplied.dateFrom);
    setCustomDateTo(prevApplied.dateTo);
    setIsCustomEditing(false);
  };

  const handleDeleteRecord = (record: AttendanceRecord) => {
    deleteAttendanceRecord(record.id);
    setConfirmDel(null);
    toast.success("Registo de presença removido com sucesso.");
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case "present":
        return <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white border-0">Presente</Badge>;
      case "absent":
        return <Badge className="bg-rose-600 hover:bg-rose-700 text-white border-0">Ausente</Badge>;
      case "late":
        return <Badge className="bg-amber-600 hover:bg-amber-700 text-white border-0">Atrasado</Badge>;
      case "half_day":
        return <Badge className="bg-sky-600 hover:bg-sky-700 text-white border-0">Meio período</Badge>;
      case "justified_absence":
        return <Badge className="bg-purple-600 hover:bg-purple-700 text-white border-0">Falta justificada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Presenças"
        description="Registe e controle a presença diária e as escalas de trabalho dos trabalhadores alocados a cada obra."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setMainTab(mainTab === "presencas" ? "escalas" : "presencas")}
              variant={mainTab === "escalas" ? "default" : "outline"}
              className="gap-2 text-xs border-border/80"
            >
              <Calendar className="h-4 w-4" />
              {mainTab === "escalas" ? "Ver Dashboard" : "Escalas de Presença"}
              {attendanceSchedules.filter((s) => s.status === "active").length > 0 && (
                <Badge variant="secondary" className="text-[10px] ml-0.5 px-1.5 py-0 bg-primary/10 text-primary font-bold">
                  {attendanceSchedules.filter((s) => s.status === "active").length}
                </Badge>
              )}
            </Button>
            <Button
              onClick={() => setHistoryOpen(true)}
              variant="outline"
              className="gap-2 text-xs border-border/80"
            >
              <History className="h-4 w-4" />
              Histórico
            </Button>
            <Button
              onClick={() => {
                setRollCallOpen(true);
              }}
              variant="outline"
              className="gap-2 text-xs border-border/80"
            >
              <Users className="h-4 w-4" />
              Chamada Diária
            </Button>
            <Button
              onClick={() => {
                setSelectedEdit(null);
                setFormOpen(true);
              }}
              className="bg-primary hover:bg-primary-dark text-white gap-2 text-xs"
            >
              <Plus className="h-4 w-4" />
              Registar Presença
            </Button>
          </div>
        }
      />

      {mainTab === "escalas" ? (
        <AttendanceScheduleList onOpenNewScheduleForm={() => setScheduleFormOpen(true)} />
      ) : (
        <>

      {/* Cartões de KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        <AttendanceKpiCard
          title="Presentes"
          value={analyticsKPIs.present + analyticsKPIs.late + analyticsKPIs.halfDay}
          icon={<CheckCircle2 className="h-4 w-4" />}
          iconBg="bg-emerald-500/10"
          iconColor="text-emerald-600"
        />

        <AttendanceKpiCard
          title="Ausentes"
          value={analyticsKPIs.absent}
          icon={<XCircle className="h-4 w-4" />}
          iconBg="bg-rose-500/10"
          iconColor="text-rose-600"
        />

        <AttendanceKpiCard
          title="Atrasados"
          value={analyticsKPIs.late}
          icon={<Clock className="h-4 w-4" />}
          iconBg="bg-amber-500/10"
          iconColor="text-amber-600"
        />

        <AttendanceKpiCard
          title="Meio Período"
          value={analyticsKPIs.halfDay}
          icon={<Briefcase className="h-4 w-4" />}
          iconBg="bg-sky-500/10"
          iconColor="text-sky-600"
        />

        <AttendanceKpiCard
          title="Horas Trab."
          value={formatMins(analyticsKPIs.workedMinutes)}
          icon={<Clock className="h-4 w-4" />}
          iconBg="bg-blue-950/10"
          iconColor="text-blue-950"
        />

        <AttendanceKpiCard
          title="Horas Extra"
          value={formatMins(analyticsKPIs.overtimeMinutes)}
          icon={<Briefcase className="h-4 w-4 text-purple-600" />}
          iconBg="bg-purple-500/10"
          iconColor="text-purple-600"
        />

        <AttendanceKpiCard
          title="Custo Ope."
          value={formattedKpiCost.short}
          icon={<TrendingUp className="h-4 w-4" />}
          iconBg="bg-emerald-950/10"
          iconColor="text-emerald-950"
          tooltipText={formattedKpiCost.full}
          warningText={
            analyticsKPIs.operationalCost.hasUnavailableCosts
              ? "Custos em falta"
              : undefined
          }
        />
      </div>

      {/* Resumo Executivo / Painel de Controle Periodo */}
      <AttendanceSummaryCard
        summary={analyticsSummary}
        cost={analyticsKPIs.operationalCost}
        stats={analyticsStats}
        title="Resumo Operacional"
        dateStr={periodLabel}
        periodMode={periodMode}
        onPeriodModeChange={handlePeriodModeChange}
        onNavigate={handleNavigate}
        onHoje={handleHoje}
        lastUpdated={lastUpdated}
        customDateFrom={customDateFrom}
        customDateTo={customDateTo}
        onCustomDateFromChange={setCustomDateFrom}
        onCustomDateToChange={setCustomDateTo}
        onApplyCustomDates={handleApplyCustomDates}
        onCancelCustomDates={handleCancelCustomDates}
        customDateError={customDateError}
        isApplyDisabled={isApplyDisabled}
        isCustomEditing={isCustomEditing}
        hojeButtonLabel={hojeButtonLabel}
        isHojeDisabled={isHojeDisabled}
      />

      {/* PAINEL DE RANKINGS OPERACIONAIS: TOP TRABALHADORES DO PERÍODO (FASE 4.3) */}
      {topWorkers.length > 0 && (
        <Card className="border border-border/80 bg-card overflow-hidden">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-600">
                  <Trophy className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-foreground">Top Trabalhadores do Período</h3>
                  <p className="text-[10px] text-muted-foreground">
                    Classificação por assiduidade, horas trabalhadas e pontuação operacional.
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] bg-muted/30 font-bold">
                Top {topWorkers.length}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
              {topWorkers.map((item) => (
                <div
                  key={item.workerId}
                  className="p-3 border rounded-xl bg-card hover:bg-muted/20 transition-all flex flex-col justify-between space-y-2 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                      {item.badgeLabel}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      {item.score} pt
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 pt-1">
                    <Avatar className="h-8 w-8 border shrink-0">
                      {item.photo ? (
                        <img src={item.photo} alt={item.workerName} className="object-cover" />
                      ) : (
                        <AvatarFallback className="text-[10px] font-bold">
                          {initials(item.workerName)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-foreground truncate">{item.workerName}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{item.role}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1 pt-1 text-[10px] border-t border-border/50 text-muted-foreground">
                    <div>
                      Assiduidade: <strong className="text-foreground">{item.attendanceRate}%</strong>
                    </div>
                    <div className="text-right">
                      Horas: <strong className="text-foreground">{item.workedHours}h</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* TOOLBAR UNIFICADA DE FILTROS E PESQUISA */}
      <Card className="border border-border/80 bg-card">
        <CardContent className="p-4 space-y-3">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Filtrar e Pesquisar Presenças
          </div>

          <AttendanceFilterToolbar
            state={filterState}
            onChange={setFilterState}
            onOpenAdvancedSheet={() => setAdvancedSheetOpen(true)}
            workers={workers}
            obras={obras}
            teams={teams}
          />
        </CardContent>
      </Card>

      {/* SHEET LATERAL DE FILTROS AVANÇADOS */}
      <AttendanceAdvancedFilterSheet
        open={advancedSheetOpen}
        onOpenChange={setAdvancedSheetOpen}
        state={filterState}
        onChange={setFilterState}
        workers={workers}
        obras={obras}
        teams={teams}
      />

      {/* Conteúdo Principal — Tabela ou Estado Vazio */}
      {filteredRecords.length === 0 ? (
        <div className="p-8 text-center border rounded-xl bg-card space-y-3">
          <Info className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-xs text-muted-foreground font-semibold">
            {filterResult.emptyReason === "no_records"
              ? "Não existem presenças registadas na base de dados."
              : filterResult.emptyReason === "search"
              ? "A pesquisa não encontrou qualquer registo de presença."
              : "Nenhum registo encontrado para os filtros selecionados."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <Button
              type="button"
              size="xs"
              variant="outline"
              onClick={handleClearAllFilters}
              className="text-xs"
            >
              Limpar Filtros
            </Button>
            <Button
              type="button"
              size="xs"
              onClick={() => handlePeriodModeChange("month")}
              className="text-xs bg-primary text-white"
            >
              Ver Mês Atual
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Tabela para Desktop */}
          <div className="hidden md:block border border-border/80 rounded-xl overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 text-xs">
                  <TableHead className="w-28 font-bold">Data</TableHead>
                  <TableHead className="font-bold">Trabalhador</TableHead>
                  <TableHead className="font-bold">Obra / Fase</TableHead>
                  <TableHead className="font-bold">Equipa</TableHead>
                  <TableHead className="font-bold">Estado</TableHead>
                  <TableHead className="font-bold">Horários (24h)</TableHead>
                  <TableHead className="font-bold">Horas Trab. / Extra</TableHead>
                  <TableHead className="w-12 text-right font-bold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {filteredRecords.map((r) => {
                  const worker = workerMap.get(r.workerId);
                  const obra = obraMap.get(r.projectId);
                  const phase = obra?.fases?.find((f) => f.id === r.phaseId);
                  const team = r.teamId ? teamMap.get(r.teamId) : null;

                  return (
                    <TableRow key={r.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-semibold text-foreground">{r.date}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-7 w-7 border">
                            {worker?.photo ? (
                              <img src={worker.photo} alt={worker.name} className="object-cover" />
                            ) : (
                              <AvatarFallback className="text-[10px] font-bold">
                                {worker ? initials(worker.name) : "?"}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <div className="font-bold text-foreground">{worker?.name || "Desconhecido"}</div>
                            <div className="text-[10px] text-muted-foreground">{worker?.role || "—"}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">{obra?.nome || "—"}</div>
                        <div className="text-[10px] text-muted-foreground">{phase?.nome || "Sem fase"}</div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {team?.name || "Individual"}
                      </TableCell>
                      <TableCell>{getStatusBadge(r.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.checkInTime ? `${r.checkInTime} - ${r.checkOutTime || "—"}` : "—"}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatAttendanceHours(r.workedMinutes, r.overtimeMinutes)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground"
                              aria-label="Opções do registo de presença"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-xs">
                            <DropdownMenuItem onClick={() => setSelectedDetails(r)}>
                              <Eye className="h-3.5 w-3.5 mr-2" /> Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSelectedEdit(r); setFormOpen(true); }}>
                              <Pencil className="h-3.5 w-3.5 mr-2" /> Editar Registo
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setConfirmDel(r)} className="text-rose-600">
                              <Trash2 className="h-3.5 w-3.5 mr-2" /> Apagar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Cartões para Mobile */}
          <div className="md:hidden space-y-3">
            {filteredRecords.map((r) => {
              const worker = workerMap.get(r.workerId);
              const obra = obraMap.get(r.projectId);
              const phase = obra?.fases?.find((f) => f.id === r.phaseId);
              const team = r.teamId ? teamMap.get(r.teamId) : null;

              return (
                <Card key={r.id} className="border border-border/80 p-3.5 space-y-2 bg-card">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7 border">
                        {worker?.photo ? (
                          <img src={worker.photo} alt={worker.name} className="object-cover" />
                        ) : (
                          <AvatarFallback className="text-[10px] font-bold">
                            {worker ? initials(worker.name) : "?"}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <div className="font-bold text-xs text-foreground">{worker?.name || "Desconhecido"}</div>
                        <div className="text-[10px] text-muted-foreground">{worker?.role || "—"}</div>
                      </div>
                    </div>
                    {getStatusBadge(r.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-xs text-muted-foreground pt-1">
                    <div>Data: <strong className="text-foreground">{r.date}</strong></div>
                    <div>Obra: <strong className="text-foreground">{obra?.nome || "—"}</strong></div>
                    <div>Fase: <strong className="text-foreground">{phase?.nome || "Sem fase"}</strong></div>
                    <div>Equipa: <strong className="text-foreground">{team?.name || "Individual"}</strong></div>
                    <div>Horário: <strong className="text-foreground">{r.checkInTime ? `${r.checkInTime}–${r.checkOutTime}` : "—"}</strong></div>
                    <div>Horas: <strong className="text-foreground">{formatAttendanceHours(r.workedMinutes, r.overtimeMinutes)}</strong></div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t mt-1">
                    <Button size="xs" variant="outline" onClick={() => setSelectedDetails(r)} className="text-[10px] h-7">
                      <Eye className="h-3.5 w-3.5 mr-1" /> Ver
                    </Button>
                    <Button size="xs" variant="outline" onClick={() => { setSelectedEdit(r); setFormOpen(true); }} className="text-[10px] h-7">
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                    </Button>
                    <Button size="xs" variant="outline" onClick={() => setConfirmDel(r)} className="text-[10px] h-7 text-rose-600 hover:text-rose-700">
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Apagar
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
        </>
      )}

      {/* Diálogos */}
      <AttendanceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        attendanceToEdit={selectedEdit}
        preselectedDate={dateFrom}
        preselectedProjectId={filterState.selectedProjectIds[0] || null}
      />

      <AttendanceRollCallDialog
        open={rollCallOpen}
        onOpenChange={setRollCallOpen}
        preselectedDate={dateFrom}
        preselectedProjectId={filterState.selectedProjectIds[0] || null}
      />

      <AttendanceHistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        initialDateFrom={dateFrom}
        initialDateTo={dateTo}
      />

      <AttendanceDetailsDialog
        open={!!selectedDetails}
        onOpenChange={(o) => { if (!o) setSelectedDetails(null); }}
        record={selectedDetails}
      />

      <AttendanceScheduleFormDialog
        open={scheduleFormOpen}
        onOpenChange={setScheduleFormOpen}
      />

      <ConfirmDialog
        open={!!confirmDel}
        onOpenChange={(o) => { if (!o) setConfirmDel(null); }}
        title="Remover Presença"
        description="Tem certeza que deseja apagar este registo de presença? Esta ação não pode ser desfeita."
        confirmLabel="Apagar"
        variant="danger"
        onConfirm={() => confirmDel && handleDeleteRecord(confirmDel)}
      />
    </div>
  );
}
