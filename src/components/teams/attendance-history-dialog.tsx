import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/format";
import {
  Calendar, Clock, User, Users, Building, Search, Filter, X, ChevronLeft,
  ChevronRight, RefreshCw, Award, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle2, XCircle, Briefcase, Eye, ArrowUpDown, History, ShieldAlert, Check, AlertCircle, Info
} from "lucide-react";
import { useObraMZStore } from "@/store/obramz-store";
import { useMemo, useState, useEffect, useRef, Component, ReactNode } from "react";
import type { AttendanceRecord, AttendanceStatus, Worker, Obra, Team } from "@/lib/mock-data";
import { formatAttendanceHours, formatMins } from "@/lib/time-utils";
import {
  getWorkerHistory, getTeamHistory, getProjectHistory,
  getAttendanceSummary, getAttendanceStats, calculateRecordsCost,
  calculateWorkerPerformanceScore, calcPercentageDiff, filterRecords,
  aggregateTeamHistoryByWorker, aggregateProjectHistoryByWorker, aggregateProjectHistoryByTeam,
  WorkerPerformanceScore
} from "@/lib/attendance-analytics";
import {
  AttendancePeriodMode, getDayRange, getWeekRange, getMonthRange,
  shiftPeriod, formatPeriodLabel, getPreviousPeriodRange, isValidDateString
} from "@/lib/attendance-period-utils";
import { AttendanceRecordDetailDialog } from "@/components/teams/attendance-record-detail-dialog";
import { formatCurrency } from "@/components/teams/attendance-summary-card";
import {
  filterAttendanceByPeriod,
  buildAttendanceFilterResult,
  createDefaultAttendanceFilterState,
} from "@/lib/attendance-filters";
import {
  generateAttendanceStatistics,
  AttendanceDashboardAdapter,
  type AttendanceStatisticsContext,
} from "@/lib/attendance-statistics";

type AttendanceHistoryMode = "worker" | "team" | "project";
type WorkerViewType = "table" | "timeline";
type ProjectViewType = "by_worker" | "by_team";

type AttendanceHistoryDialogProps = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initialDateFrom: string;
  initialDateTo: string;
};

// Error Boundary interno montado ESTRITAMENTE dentro de <DialogContent>
class HistoryErrorBoundary extends Component<
  { children: ReactNode; onClose: () => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("AttendanceHistoryDialog error caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const isDev = process.env.NODE_ENV !== "production";
      return (
        <div className="p-8 text-center bg-card rounded-xl border m-6 space-y-4 shadow-sm flex-1 flex flex-col justify-center items-center">
          <AlertCircle className="h-10 w-10 text-amber-500 mx-auto" />
          <div className="space-y-1">
            <h4 className="font-bold text-base text-foreground">
              Não foi possível carregar o Histórico de Presenças.
            </h4>
            <p className="text-xs text-muted-foreground">
              Ocorreu um problema ao processar as presenças para este período.
            </p>
            {isDev && this.state.error && (
              <pre className="text-[10px] text-rose-600 font-mono bg-muted p-2 rounded max-w-lg mx-auto overflow-x-auto text-left mt-2 border">
                {this.state.error.message}
              </pre>
            )}
          </div>
          <div className="flex justify-center gap-2 pt-2">
            <Button
              type="button"
              size="xs"
              variant="outline"
              onClick={this.handleReset}
              className="text-xs font-semibold"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Tentar Novamente
            </Button>
            <Button
              type="button"
              size="xs"
              onClick={this.props.onClose}
              className="text-xs font-semibold bg-primary text-white"
            >
              <X className="h-3.5 w-3.5 mr-1.5" />
              Fechar
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function AttendanceHistoryDialog({
  open,
  onOpenChange,
  initialDateFrom,
  initialDateTo,
}: AttendanceHistoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] sm:w-[90vw] lg:w-[85vw] h-[92vh] max-h-[950px] p-0 gap-0 overflow-hidden flex flex-col bg-background">
        <HistoryErrorBoundary onClose={() => onOpenChange(false)}>
          <AttendanceHistoryDialogInner
            open={open}
            onOpenChange={onOpenChange}
            initialDateFrom={initialDateFrom}
            initialDateTo={initialDateTo}
          />
        </HistoryErrorBoundary>
      </DialogContent>
    </Dialog>
  );
}

function AttendanceHistoryDialogInner({
  open,
  onOpenChange,
  initialDateFrom,
  initialDateTo,
}: AttendanceHistoryDialogProps) {
  const workers = useObraMZStore((s) => s.workers || []);
  const obras = useObraMZStore((s) => s.obras || []);
  const teams = useObraMZStore((s) => s.teams || []);
  const attendanceRecords = useObraMZStore((s) => s.attendanceRecords || []);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Normalização inicial segura das datas recebidas via props
  const safeInitialFrom = useMemo(() => {
    return isValidDateString(initialDateFrom) ? initialDateFrom : todayStr;
  }, [initialDateFrom, todayStr]);

  const safeInitialTo = useMemo(() => {
    return isValidDateString(initialDateTo) ? initialDateTo : safeInitialFrom;
  }, [initialDateTo, safeInitialFrom]);

  // Modos de Consulta e Visualização
  const [historyMode, setHistoryMode] = useState<AttendanceHistoryMode>("worker");
  const [workerViewMode, setWorkerViewMode] = useState<WorkerViewType>("table");
  const [projectViewMode, setProjectViewMode] = useState<ProjectViewType>("by_worker");

  // Estado de Período Local Autónomo
  const [refDate, setRefDate] = useState<string>(safeInitialFrom);
  const [dateFrom, setDateFrom] = useState<string>(safeInitialFrom);
  const [dateTo, setDateTo] = useState<string>(safeInitialTo);
  const [periodMode, setPeriodMode] = useState<AttendancePeriodMode>("day");
  const [isCustomEditing, setIsCustomEditing] = useState<boolean>(false);
  const [customDateFrom, setCustomDateFrom] = useState<string>(safeInitialFrom);
  const [customDateTo, setCustomDateTo] = useState<string>(safeInitialTo);

  // Entidades Selecionadas
  const activeWorkers = useMemo(() => workers.filter((w) => w.status === "active" && w.id !== "invalid-orphan"), [workers]);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>("");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  // Pesquisas e Filtros Contextuais Locais
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterObra, setFilterObra] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterHours, setFilterHours] = useState<string>("all");
  const [filterWorker, setFilterWorker] = useState<string>("all");
  const [filterTeam, setFilterTeam] = useState<string>("all");

  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [detailRecord, setDetailRecord] = useState<AttendanceRecord | null>(null);
  const [pageLimit, setPageLimit] = useState<number>(50);

  // Inicializar estado local APENAS quando o modal transita de fechado para aberto
  const prevOpenRef = useRef(false);

  useEffect(() => {
    const isOpening = open && !prevOpenRef.current;
    prevOpenRef.current = open;

    if (isOpening) {
      setRefDate(safeInitialFrom);
      setDateFrom(safeInitialFrom);
      setDateTo(safeInitialTo);
      setCustomDateFrom(safeInitialFrom);
      setCustomDateTo(safeInitialTo);
      setPeriodMode("day");
      setIsCustomEditing(false);
      setHistoryMode("worker");
      setWorkerViewMode("table");
      setProjectViewMode("by_worker");
      setSearchQuery("");
      setFilterObra("all");
      setFilterStatus("all");
      setFilterHours("all");
      setFilterWorker("all");
      setFilterTeam("all");
      setSortOrder("desc");
      setPageLimit(50);
    }
  }, [open, safeInitialFrom, safeInitialTo]);

  // Fallbacks de Seleção de Entidade
  const effectiveWorkerId = selectedWorkerId || activeWorkers[0]?.id || "";
  const effectiveTeamId = selectedTeamId || teams[0]?.id || "";
  const effectiveProjectId = selectedProjectId || obras[0]?.id || "";

  // ----------------------------------------------------
  // FONTE ÚNICA DE VERDADE DOS DADOS NO PERÍODO SELECIONADO
  // ----------------------------------------------------
  const periodRecords = useMemo(() => {
    if (!dateFrom || !dateTo) return [];
    return filterAttendanceByPeriod(attendanceRecords, dateFrom, dateTo);
  }, [attendanceRecords, dateFrom, dateTo]);

  // Período Anterior para Comparativo
  const previousRange = useMemo(() => {
    return getPreviousPeriodRange(dateFrom, dateTo, periodMode);
  }, [dateFrom, dateTo, periodMode]);

  const previousPeriodRecords = useMemo(() => {
    if (!previousRange.dateFrom || !previousRange.dateTo) return [];
    return filterAttendanceByPeriod(
      attendanceRecords,
      previousRange.dateFrom,
      previousRange.dateTo
    );
  }, [attendanceRecords, previousRange]);

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

  // Rótulos e Troca de Período
  const hojeButtonLabel = useMemo(() => {
    if (periodMode === "week") return "Semana Atual";
    if (periodMode === "month") return "Mês Atual";
    return "Hoje";
  }, [periodMode]);

  const handlePeriodModeChange = (mode: AttendancePeriodMode) => {
    if (mode === "custom") {
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

  const clearFilters = () => {
    setSearchQuery("");
    setFilterObra("all");
    setFilterStatus("all");
    setFilterHours("all");
    setFilterWorker("all");
    setFilterTeam("all");
  };

  // ----------------------------------------------------
  // PROCESSAMENTO DO MODO TRABALHADOR
  // ----------------------------------------------------
  const selectedWorker = useMemo(() => {
    return workers.find((w) => w.id === effectiveWorkerId) || activeWorkers[0] || null;
  }, [workers, effectiveWorkerId, activeWorkers]);

  const workerCurrentTeam = useMemo(() => {
    if (!selectedWorker) return null;
    return teams.find((t) => t.id === selectedWorker.teamId) || null;
  }, [selectedWorker, teams]);

  const rawWorkerRecords = useMemo(() => {
    if (!effectiveWorkerId) return [];
    return periodRecords.filter((r) => {
      if (r.workerId !== effectiveWorkerId) return false;
      if (filterObra !== "all" && r.projectId !== filterObra) return false;
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      return true;
    });
  }, [periodRecords, effectiveWorkerId, filterObra, filterStatus]);

  const filteredWorkerRecords = useMemo(() => {
    return rawWorkerRecords.filter((r) => {
      const obra = obras.find((o) => o.id === r.projectId);
      const team = r.teamId ? teams.find((t) => t.id === r.teamId) : null;
      const query = searchQuery.toLowerCase().trim();

      const matchesQuery =
        query === "" ||
        (selectedWorker?.name && selectedWorker.name.toLowerCase().includes(query)) ||
        (selectedWorker?.role && selectedWorker.role.toLowerCase().includes(query)) ||
        (team?.name && team.name.toLowerCase().includes(query)) ||
        (obra?.nome && obra.nome.toLowerCase().includes(query));

      let matchesHours = true;
      if (filterHours === "with_hours") {
        matchesHours = (r.workedMinutes || 0) > 0;
      } else if (filterHours === "without_hours") {
        matchesHours = !r.workedMinutes || r.workedMinutes === 0;
      }

      return matchesQuery && matchesHours;
    });
  }, [rawWorkerRecords, searchQuery, filterHours, selectedWorker, obras, teams]);

  const previousWorkerRecords = useMemo(() => {
    if (!effectiveWorkerId) return [];
    return previousPeriodRecords.filter((r) => r.workerId === effectiveWorkerId);
  }, [previousPeriodRecords, effectiveWorkerId]);

  // MOTOR DE ESTATÍSTICAS OPERACIONAIS NO HISTÓRICO (FASE 4.2.1)
  const workerStatsData = useMemo(() => {
    const filterRes = buildAttendanceFilterResult(
      filteredWorkerRecords,
      filteredWorkerRecords.length,
      createDefaultAttendanceFilterState(dateFrom, dateTo),
      filteredWorkerRecords.length === 0 ? "filters" : "none"
    );
    const ctx: AttendanceStatisticsContext = { filterResult: filterRes, workers, teams, projects: obras };
    const res = generateAttendanceStatistics(ctx);
    return {
      summary: AttendanceDashboardAdapter.toDashboardSummary(res),
      stats: AttendanceDashboardAdapter.toAttendanceStats(res),
      cost: AttendanceDashboardAdapter.toDashboardKPIs(res, ctx).operationalCost,
    };
  }, [filteredWorkerRecords, workers, teams, obras, dateFrom, dateTo]);

  const workerSummary = workerStatsData.summary;
  const workerStats = workerStatsData.stats;
  const workerCost = workerStatsData.cost;

  const prevWorkerStatsData = useMemo(() => {
    const filterRes = buildAttendanceFilterResult(
      previousWorkerRecords,
      previousWorkerRecords.length,
      createDefaultAttendanceFilterState(previousRange.dateFrom, previousRange.dateTo),
      previousWorkerRecords.length === 0 ? "filters" : "none"
    );
    const ctx: AttendanceStatisticsContext = { filterResult: filterRes, workers, teams, projects: obras };
    const res = generateAttendanceStatistics(ctx);
    return {
      summary: AttendanceDashboardAdapter.toDashboardSummary(res),
      cost: AttendanceDashboardAdapter.toDashboardKPIs(res, ctx).operationalCost,
    };
  }, [previousWorkerRecords, workers, teams, obras, previousRange.dateFrom, previousRange.dateTo]);

  const prevWorkerSummary = prevWorkerStatsData.summary;
  const prevWorkerCost = prevWorkerStatsData.cost;

  const workerPerformance: WorkerPerformanceScore | null = useMemo(() => {
    if (filteredWorkerRecords.length === 0) return null;
    return calculateWorkerPerformanceScore(workerStats.assiduidadeTaxa, workerStats.absentismoTaxa, workerSummary.late);
  }, [filteredWorkerRecords.length, workerStats, workerSummary]);

  const workerProjectsInPeriod = useMemo(() => {
    const pIds = Array.from(new Set(filteredWorkerRecords.map((r) => r.projectId)));
    return obras.filter((o) => pIds.includes(o.id));
  }, [filteredWorkerRecords, obras]);

  const sortedWorkerRecords = useMemo(() => {
    return [...filteredWorkerRecords].sort((a, b) => {
      if (sortOrder === "desc") {
        return b.date.localeCompare(a.date);
      }
      return a.date.localeCompare(b.date);
    });
  }, [filteredWorkerRecords, sortOrder]);

  // ----------------------------------------------------
  // PROCESSAMENTO DO MODO EQUIPA
  // ----------------------------------------------------
  const selectedTeam = useMemo(() => {
    return teams.find((t) => t.id === effectiveTeamId) || teams[0] || null;
  }, [teams, effectiveTeamId]);

  const teamLeader = useMemo(() => {
    if (!selectedTeam?.leaderId) return null;
    return workers.find((w) => w.id === selectedTeam.leaderId) || null;
  }, [selectedTeam, workers]);

  const rawTeamRecords = useMemo(() => {
    if (!effectiveTeamId) return [];
    return periodRecords.filter((r) => {
      if (r.teamId !== effectiveTeamId) return false;
      if (filterObra !== "all" && r.projectId !== filterObra) return false;
      if (filterWorker !== "all" && r.workerId !== filterWorker) return false;
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      return true;
    });
  }, [periodRecords, effectiveTeamId, filterObra, filterWorker, filterStatus]);

  const previousTeamRecords = useMemo(() => {
    if (!effectiveTeamId) return [];
    return previousPeriodRecords.filter((r) => r.teamId === effectiveTeamId);
  }, [previousPeriodRecords, effectiveTeamId]);

  const teamStatsData = useMemo(() => {
    const filterRes = buildAttendanceFilterResult(
      rawTeamRecords,
      rawTeamRecords.length,
      createDefaultAttendanceFilterState(dateFrom, dateTo),
      rawTeamRecords.length === 0 ? "filters" : "none"
    );
    const ctx: AttendanceStatisticsContext = { filterResult: filterRes, workers, teams, projects: obras };
    const res = generateAttendanceStatistics(ctx);
    return {
      summary: AttendanceDashboardAdapter.toDashboardSummary(res),
      stats: AttendanceDashboardAdapter.toAttendanceStats(res),
      cost: AttendanceDashboardAdapter.toDashboardKPIs(res, ctx).operationalCost,
    };
  }, [rawTeamRecords, workers, teams, obras, dateFrom, dateTo]);

  const teamSummary = teamStatsData.summary;
  const teamStats = teamStatsData.stats;
  const teamCost = teamStatsData.cost;

  const prevTeamStatsData = useMemo(() => {
    const filterRes = buildAttendanceFilterResult(
      previousTeamRecords,
      previousTeamRecords.length,
      createDefaultAttendanceFilterState(previousRange.dateFrom, previousRange.dateTo),
      previousTeamRecords.length === 0 ? "filters" : "none"
    );
    const ctx: AttendanceStatisticsContext = { filterResult: filterRes, workers, teams, projects: obras };
    const res = generateAttendanceStatistics(ctx);
    return {
      summary: AttendanceDashboardAdapter.toDashboardSummary(res),
      cost: AttendanceDashboardAdapter.toDashboardKPIs(res, ctx).operationalCost,
    };
  }, [previousTeamRecords, workers, teams, obras, previousRange.dateFrom, previousRange.dateTo]);

  const prevTeamSummary = prevTeamStatsData.summary;
  const prevTeamCost = prevTeamStatsData.cost;

  const teamRows = useMemo(() => {
    if (!effectiveTeamId) return [];
    const rows = aggregateTeamHistoryByWorker(periodRecords, workers, effectiveTeamId, {
      dateFrom,
      dateTo,
      projectId: filterObra !== "all" ? filterObra : undefined,
      status: filterStatus !== "all" ? (filterStatus as AttendanceStatus) : undefined,
    });

    const query = searchQuery.toLowerCase().trim();
    return rows.filter((r) => {
      return (
        query === "" ||
        r.workerName.toLowerCase().includes(query) ||
        r.workerRole.toLowerCase().includes(query) ||
        (selectedTeam?.name && selectedTeam.name.toLowerCase().includes(query)) ||
        (teamLeader?.name && teamLeader.name.toLowerCase().includes(query))
      );
    });
  }, [periodRecords, workers, effectiveTeamId, dateFrom, dateTo, filterObra, filterStatus, searchQuery, selectedTeam, teamLeader]);

  const teamProjectsInPeriod = useMemo(() => {
    const pIds = Array.from(new Set(rawTeamRecords.map((r) => r.projectId)));
    return obras.filter((o) => pIds.includes(o.id));
  }, [rawTeamRecords, obras]);

  // ----------------------------------------------------
  // PROCESSAMENTO DO MODO OBRA
  // ----------------------------------------------------
  const selectedProject = useMemo(() => {
    return obras.find((o) => o.id === effectiveProjectId) || obras[0] || null;
  }, [obras, effectiveProjectId]);

  const rawProjectRecords = useMemo(() => {
    if (!effectiveProjectId) return [];
    return periodRecords.filter((r) => {
      if (r.projectId !== effectiveProjectId) return false;
      if (filterTeam !== "all" && r.teamId !== filterTeam) return false;
      if (filterWorker !== "all" && r.workerId !== filterWorker) return false;
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      return true;
    });
  }, [periodRecords, effectiveProjectId, filterTeam, filterWorker, filterStatus]);

  const previousProjectRecords = useMemo(() => {
    if (!effectiveProjectId) return [];
    return previousPeriodRecords.filter((r) => r.projectId === effectiveProjectId);
  }, [previousPeriodRecords, effectiveProjectId]);

  const projectStatsData = useMemo(() => {
    const filterRes = buildAttendanceFilterResult(
      rawProjectRecords,
      rawProjectRecords.length,
      createDefaultAttendanceFilterState(dateFrom, dateTo),
      rawProjectRecords.length === 0 ? "filters" : "none"
    );
    const ctx: AttendanceStatisticsContext = { filterResult: filterRes, workers, teams, projects: obras };
    const res = generateAttendanceStatistics(ctx);
    return {
      summary: AttendanceDashboardAdapter.toDashboardSummary(res),
      stats: AttendanceDashboardAdapter.toAttendanceStats(res),
      cost: AttendanceDashboardAdapter.toDashboardKPIs(res, ctx).operationalCost,
    };
  }, [rawProjectRecords, workers, teams, obras, dateFrom, dateTo]);

  const projectSummary = projectStatsData.summary;
  const projectStats = projectStatsData.stats;
  const projectCost = projectStatsData.cost;

  const prevProjectStatsData = useMemo(() => {
    const filterRes = buildAttendanceFilterResult(
      previousProjectRecords,
      previousProjectRecords.length,
      createDefaultAttendanceFilterState(previousRange.dateFrom, previousRange.dateTo),
      previousProjectRecords.length === 0 ? "filters" : "none"
    );
    const ctx: AttendanceStatisticsContext = { filterResult: filterRes, workers, teams, projects: obras };
    const res = generateAttendanceStatistics(ctx);
    return {
      summary: AttendanceDashboardAdapter.toDashboardSummary(res),
      cost: AttendanceDashboardAdapter.toDashboardKPIs(res, ctx).operationalCost,
    };
  }, [previousProjectRecords, workers, teams, obras, previousRange.dateFrom, previousRange.dateTo]);

  const prevProjectSummary = prevProjectStatsData.summary;
  const prevProjectCost = prevProjectStatsData.cost;

  const projectWorkerRows = useMemo(() => {
    if (!effectiveProjectId) return [];
    const rows = aggregateProjectHistoryByWorker(periodRecords, workers, teams, effectiveProjectId, {
      dateFrom,
      dateTo,
      teamId: filterTeam !== "all" ? filterTeam : undefined,
      status: filterStatus !== "all" ? (filterStatus as AttendanceStatus) : undefined,
    });

    const query = searchQuery.toLowerCase().trim();
    return rows.filter((r) => {
      return (
        query === "" ||
        r.workerName.toLowerCase().includes(query) ||
        r.workerRole.toLowerCase().includes(query) ||
        r.teamName.toLowerCase().includes(query) ||
        (selectedProject?.nome && selectedProject.nome.toLowerCase().includes(query)) ||
        (selectedProject?.cliente && selectedProject.cliente.toLowerCase().includes(query))
      );
    });
  }, [periodRecords, workers, teams, effectiveProjectId, dateFrom, dateTo, filterTeam, filterStatus, searchQuery, selectedProject]);

  const projectTeamRows = useMemo(() => {
    if (!effectiveProjectId) return [];
    const rows = aggregateProjectHistoryByTeam(periodRecords, workers, teams, effectiveProjectId, {
      dateFrom,
      dateTo,
      status: filterStatus !== "all" ? (filterStatus as AttendanceStatus) : undefined,
    });

    const query = searchQuery.toLowerCase().trim();
    return rows.filter((r) => {
      return (
        query === "" ||
        r.teamName.toLowerCase().includes(query) ||
        (selectedProject?.nome && selectedProject.nome.toLowerCase().includes(query))
      );
    });
  }, [periodRecords, workers, teams, effectiveProjectId, dateFrom, dateTo, filterStatus, searchQuery, selectedProject]);

  // Auxiliares de Navegação Interna
  const handleWorkerClickInAggr = (wId: string) => {
    setSelectedWorkerId(wId);
    setHistoryMode("worker");
  };

  const handleTeamClickInAggr = (tId: string) => {
    if (tId !== "individual") {
      setSelectedTeamId(tId);
      setHistoryMode("team");
    }
  };

  const getTimelineStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case "present":
        return <span className="font-semibold text-emerald-600 flex items-center gap-1">🟢 Presente</span>;
      case "late":
        return <span className="font-semibold text-amber-600 flex items-center gap-1">🟡 Atrasado</span>;
      case "half_day":
        return <span className="font-semibold text-sky-600 flex items-center gap-1">🔵 Meio Período</span>;
      case "absent":
        return <span className="font-semibold text-rose-600 flex items-center gap-1">🔴 Ausente</span>;
      case "justified_absence":
        return <span className="font-semibold text-purple-600 flex items-center gap-1">⚪ Ausência Justificada</span>;
      default:
        return <span>{status}</span>;
    }
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case "present":
        return <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 text-[10px] h-5">Presente</Badge>;
      case "absent":
        return <Badge className="bg-rose-600 hover:bg-rose-700 text-white border-0 text-[10px] h-5">Ausente</Badge>;
      case "late":
        return <Badge className="bg-amber-600 hover:bg-amber-700 text-white border-0 text-[10px] h-5">Atrasado</Badge>;
      case "half_day":
        return <Badge className="bg-sky-600 hover:bg-sky-700 text-white border-0 text-[10px] h-5">Meio período</Badge>;
      case "justified_absence":
        return <Badge className="bg-purple-600 hover:bg-purple-700 text-white border-0 text-[10px] h-5">Falta justificada</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] h-5">{status}</Badge>;
    }
  };

  const getPerformanceBadge = (score: WorkerPerformanceScore | null) => {
    if (!score) return null;
    switch (score) {
      case "Excelente":
        return <Badge className="bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 font-bold text-[10px] gap-1">🌟 Excelente</Badge>;
      case "Bom":
        return <Badge className="bg-sky-500/10 text-sky-700 border border-sky-500/20 font-bold text-[10px] gap-1">👍 Bom</Badge>;
      case "Regular":
        return <Badge className="bg-amber-500/10 text-amber-700 border border-amber-500/20 font-bold text-[10px] gap-1">⚖️ Regular</Badge>;
      case "Necessita Atenção":
        return <Badge className="bg-rose-500/10 text-rose-700 border border-rose-500/20 font-bold text-[10px] gap-1">⚠️ Necessita Atenção</Badge>;
    }
  };

  const renderDiffBadge = (diff?: number) => {
    if (diff === undefined || isNaN(diff)) return null;
    if (diff > 0) {
      return (
        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded flex items-center gap-0.5">
          <TrendingUp className="h-2.5 w-2.5" /> +{diff}%
        </span>
      );
    }
    if (diff < 0) {
      return (
        <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1 py-0.5 rounded flex items-center gap-0.5">
          <TrendingDown className="h-2.5 w-2.5" /> {diff}%
        </span>
      );
    }
    return <span className="text-[9px] font-semibold text-muted-foreground">0%</span>;
  };

  return (
    <>
      {/* A. CABEÇALHO DO DIALOG */}
      <DialogHeader className="p-4 bg-muted/30 border-b flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <History className="h-5 w-5" />
          </div>
          <div>
            <DialogTitle className="text-base font-bold text-foreground">
              Histórico e Análise de Presenças
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Consulte métricas históricas, assiduidade e custos consolidados.
            </p>
          </div>
        </div>

        {/* B. NAVEGAÇÃO PRINCIPAL (TABS) */}
        <div className="flex items-center border rounded-lg bg-muted/40 p-0.5 h-9">
          <button
            type="button"
            aria-pressed={historyMode === "worker"}
            aria-label="Modo Trabalhador"
            onClick={() => setHistoryMode("worker")}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all h-8 flex items-center gap-1.5 ${
              historyMode === "worker"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <User className="h-3.5 w-3.5" />
            Trabalhador
          </button>
          <button
            type="button"
            aria-pressed={historyMode === "team"}
            aria-label="Modo Equipa"
            onClick={() => setHistoryMode("team")}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all h-8 flex items-center gap-1.5 ${
              historyMode === "team"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            Equipa
          </button>
          <button
            type="button"
            aria-pressed={historyMode === "project"}
            aria-label="Modo Obra"
            onClick={() => setHistoryMode("project")}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all h-8 flex items-center gap-1.5 ${
              historyMode === "project"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Building className="h-3.5 w-3.5" />
            Obra
          </button>
        </div>
      </DialogHeader>

      {/* C. BARRA DE PERÍODO LOCAL AUTÓNOMA */}
      <div className="px-4 py-2.5 bg-muted/20 border-b flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
        <div className="flex items-center gap-1.5 text-muted-foreground font-semibold">
          <Calendar className="h-4 w-4 text-primary" />
          <span>Período:</span>
          <span className="font-bold text-foreground">{formatPeriodLabel(dateFrom, dateTo, periodMode)}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Setas de Navegação */}
          <div className="flex items-center border rounded-lg bg-background overflow-hidden h-8">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleNavigate("prev")}
              disabled={periodMode === "custom"}
              className="h-7 w-7 rounded-none hover:bg-muted text-muted-foreground disabled:opacity-40"
              aria-label="Período anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleNavigate("next")}
              disabled={periodMode === "custom"}
              className="h-7 w-7 rounded-none hover:bg-muted text-muted-foreground disabled:opacity-40 border-l"
              aria-label="Período seguinte"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Segmented Control do Período */}
          <div className="flex items-center border rounded-lg bg-muted/30 p-0.5 h-8">
            <button
              type="button"
              onClick={() => handlePeriodModeChange("day")}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all h-7 ${
                periodMode === "day" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Dia
            </button>
            <button
              type="button"
              onClick={() => handlePeriodModeChange("week")}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all h-7 ${
                periodMode === "week" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Semana
            </button>
            <button
              type="button"
              onClick={() => handlePeriodModeChange("month")}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all h-7 ${
                periodMode === "month" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mês
            </button>
            <button
              type="button"
              onClick={() => handlePeriodModeChange("custom")}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all h-7 ${
                periodMode === "custom" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Personalizado
            </button>
          </div>

          {/* Botão Hoje Contextual */}
          <Button
            type="button"
            variant="outline"
            onClick={handleHoje}
            className="h-8 text-[10px] font-bold px-2.5 border"
          >
            {hojeButtonLabel}
          </Button>
        </div>
      </div>

      {/* Inputs de Data Personalizada Inline */}
      {periodMode === "custom" && isCustomEditing && (
        <div className="px-4 py-2 bg-muted/10 border-b flex items-center gap-3 text-xs shrink-0">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">De:</span>
          <input
            type="date"
            value={customDateFrom}
            onChange={(e) => setCustomDateFrom(e.target.value)}
            className="h-7 px-2 rounded border bg-background text-xs"
          />
          <span className="text-[10px] font-bold text-muted-foreground uppercase">Até:</span>
          <input
            type="date"
            value={customDateTo}
            onChange={(e) => setCustomDateTo(e.target.value)}
            className="h-7 px-2 rounded border bg-background text-xs"
          />
          <Button
            type="button"
            size="xs"
            onClick={() => {
              setDateFrom(customDateFrom);
              setDateTo(customDateTo);
              setIsCustomEditing(false);
            }}
            className="h-7 text-[10px] bg-primary text-white"
          >
            <Check className="h-3 w-3 mr-1" /> Aplicar
          </Button>
        </div>
      )}

      {/* CORPO PRINCIPAL COM SCROLL */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        
        {/* ==========================================
            MODO TRABALHADOR
           ========================================== */}
        {historyMode === "worker" && (
          <div className="space-y-4">
            {/* D. SELEÇÃO DA ENTIDADE & PERFIL */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-xl border">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2 border-primary/20">
                  {selectedWorker?.photo ? (
                    <img src={selectedWorker.photo} alt={selectedWorker.name} className="object-cover" />
                  ) : (
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {selectedWorker ? initials(selectedWorker.name) : "?"}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm text-foreground">{selectedWorker?.name || "Selecione um trabalhador"}</h3>
                    {getPerformanceBadge(workerPerformance)}
                    {selectedWorker && (
                      <Badge variant="outline" className="text-[10px]">
                        {selectedWorker.status === "active" ? "Ativo" : "Inativo"}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
                    <span>Função: <strong className="text-foreground">{selectedWorker?.role || "—"}</strong></span>
                    <span>Equipa: <strong className="text-foreground">{workerCurrentTeam?.name || "Atribuição Individual"}</strong></span>
                    <span>Obras: <strong className="text-foreground">{workerProjectsInPeriod.length}</strong></span>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-64">
                <span className="text-[10px] font-semibold text-muted-foreground block mb-1">Selecionar Trabalhador</span>
                <Select value={effectiveWorkerId} onValueChange={setSelectedWorkerId}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Escolha um trabalhador" />
                  </SelectTrigger>
                  <SelectContent className="text-xs max-h-56">
                    {activeWorkers.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name} ({w.role || "Trabalhador"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* E. RESUMO & KPIS (TRABALHADOR) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              <Card className="p-2.5 border bg-card">
                <div className="text-[10px] text-muted-foreground font-semibold">Dias Registados</div>
                <div className="text-base font-bold text-foreground mt-0.5">{workerSummary.totalWorkers}</div>
              </Card>
              <Card className="p-2.5 border bg-card">
                <div className="text-[10px] text-muted-foreground font-semibold flex items-center justify-between">
                  <span>Presentes</span>
                  {renderDiffBadge(calcPercentageDiff(workerSummary.present + workerSummary.late + workerSummary.halfDay, prevWorkerSummary.present + prevWorkerSummary.late + prevWorkerSummary.halfDay))}
                </div>
                <div className="text-base font-bold text-emerald-600 mt-0.5">{workerSummary.present + workerSummary.late + workerSummary.halfDay}</div>
              </Card>
              <Card className="p-2.5 border bg-card">
                <div className="text-[10px] text-muted-foreground font-semibold flex items-center justify-between">
                  <span>Ausências</span>
                  {renderDiffBadge(calcPercentageDiff(workerSummary.absent, prevWorkerSummary.absent))}
                </div>
                <div className="text-base font-bold text-rose-600 mt-0.5">{workerSummary.absent}</div>
              </Card>
              <Card className="p-2.5 border bg-card">
                <div className="text-[10px] text-muted-foreground font-semibold">Faltas Justif.</div>
                <div className="text-base font-bold text-purple-600 mt-0.5">{workerSummary.justifiedAbsence}</div>
              </Card>
              <Card className="p-2.5 border bg-card">
                <div className="text-[10px] text-muted-foreground font-semibold">Atrasos</div>
                <div className="text-base font-bold text-amber-600 mt-0.5">{workerSummary.late}</div>
              </Card>
              <Card className="p-2.5 border bg-card">
                <div className="text-[10px] text-muted-foreground font-semibold">Meio Período</div>
                <div className="text-base font-bold text-sky-600 mt-0.5">{workerSummary.halfDay}</div>
              </Card>
              <Card className="p-2.5 border bg-card">
                <div className="text-[10px] text-muted-foreground font-semibold flex items-center justify-between">
                  <span>Horas Trab.</span>
                  {renderDiffBadge(calcPercentageDiff(workerSummary.workedMinutes, prevWorkerSummary.workedMinutes))}
                </div>
                <div className="text-base font-bold text-foreground mt-0.5">{formatMins(workerSummary.workedMinutes)}</div>
              </Card>
              <Card className="p-2.5 border bg-card">
                <div className="text-[10px] text-muted-foreground font-semibold">Horas Extra</div>
                <div className="text-base font-bold text-purple-600 mt-0.5">{formatMins(workerSummary.overtimeMinutes)}</div>
              </Card>
              <Card className="p-2.5 border bg-card">
                <div className="text-[10px] text-muted-foreground font-semibold">Assiduidade</div>
                <div className="text-base font-bold text-emerald-600 mt-0.5">{workerStats.assiduidadeTaxa.toFixed(1)}%</div>
              </Card>
              <Card className="p-2.5 border bg-card">
                <div className="text-[10px] text-muted-foreground font-semibold flex items-center justify-between">
                  <span>Custo Acum.</span>
                  {renderDiffBadge(calcPercentageDiff(workerCost.totalCost, prevWorkerCost.totalCost))}
                </div>
                <div className="text-base font-bold text-slate-800 mt-0.5 truncate">{formatCurrency(workerCost.totalCost)}</div>
              </Card>
            </div>

            {/* F. FILTROS E PESQUISA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                <div className="relative w-full sm:w-48">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 text-xs h-8"
                  />
                </div>

                <Select value={filterObra} onValueChange={setFilterObra}>
                  <SelectTrigger className="w-36 text-xs h-8">
                    <SelectValue placeholder="Obra" />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="all">Todas as obras</SelectItem>
                    {obras.map((o) => (
                      <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-36 text-xs h-8">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="all">Todos estados</SelectItem>
                    <SelectItem value="present">Presente</SelectItem>
                    <SelectItem value="absent">Ausente</SelectItem>
                    <SelectItem value="late">Atrasado</SelectItem>
                    <SelectItem value="half_day">Meio período</SelectItem>
                    <SelectItem value="justified_absence">Falta justif.</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterHours} onValueChange={setFilterHours}>
                  <SelectTrigger className="w-36 text-xs h-8">
                    <SelectValue placeholder="Horas" />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="all">Com e sem horas</SelectItem>
                    <SelectItem value="with_hours">Com horas</SelectItem>
                    <SelectItem value="without_hours">Sem horas</SelectItem>
                  </SelectContent>
                </Select>

                {(searchQuery || filterObra !== "all" || filterStatus !== "all" || filterHours !== "all") && (
                  <Button type="button" variant="ghost" size="xs" onClick={clearFilters} className="text-[10px] text-muted-foreground h-8">
                    <X className="h-3 w-3 mr-1" /> Limpar
                  </Button>
                )}
              </div>

              {/* Switcher Tabela / Timeline */}
              <div className="flex items-center border rounded-lg bg-muted/30 p-0.5 h-8 shrink-0">
                <button
                  type="button"
                  onClick={() => setWorkerViewMode("table")}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all h-7 ${
                    workerViewMode === "table" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Tabela
                </button>
                <button
                  type="button"
                  onClick={() => setWorkerViewMode("timeline")}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all h-7 ${
                    workerViewMode === "timeline" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Timeline
                </button>
              </div>
            </div>

            {/* G. CONTEÚDO (TABELA / TIMELINE / ESTADO VAZIO) */}
            {sortedWorkerRecords.length === 0 ? (
              <div className="p-8 text-center border rounded-xl bg-card space-y-3">
                <Info className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-xs text-muted-foreground font-semibold">
                  Não existem registos de presença para o período selecionado.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <Button type="button" size="xs" onClick={() => handlePeriodModeChange("month")} className="text-xs bg-primary text-white">
                    Ver Mês Atual
                  </Button>
                  <Button type="button" size="xs" variant="outline" onClick={handleHoje} className="text-xs">
                    Hoje
                  </Button>
                  <Button type="button" size="xs" variant="outline" onClick={clearFilters} className="text-xs">
                    Limpar Filtros
                  </Button>
                </div>
              </div>
            ) : workerViewMode === "table" ? (
              <div className="rounded-lg border bg-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 text-xs">
                      <TableHead className="w-28">
                        <button
                          type="button"
                          onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                          className="flex items-center gap-1 font-bold text-foreground hover:text-primary text-xs"
                        >
                          Data <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </TableHead>
                      <TableHead>Obra / Fase</TableHead>
                      <TableHead>Equipa</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Horários (24h)</TableHead>
                      <TableHead>Horas</TableHead>
                      <TableHead>Custo</TableHead>
                      <TableHead className="w-10 text-right">Ver</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-xs">
                    {sortedWorkerRecords.slice(0, pageLimit).map((r) => {
                      const obra = obras.find((o) => o.id === r.projectId);
                      const fase = obra?.fases?.find((f) => f.id === r.phaseId);
                      const team = r.teamId ? teams.find((t) => t.id === r.teamId) : null;
                      const cost = calculateRecordsCost([r], workers);

                      return (
                        <TableRow key={r.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => setDetailRecord(r)}>
                          <TableCell className="font-semibold">{r.date}</TableCell>
                          <TableCell>
                            <div className="font-medium text-foreground">{obra?.nome || "—"}</div>
                            <div className="text-[10px] text-muted-foreground">{fase?.nome || "Sem fase"}</div>
                          </TableCell>
                          <TableCell>{team?.name || "Individual"}</TableCell>
                          <TableCell>{getStatusBadge(r.status)}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {r.checkInTime ? `${r.checkInTime} - ${r.checkOutTime || "—"}` : "—"}
                          </TableCell>
                          <TableCell className="font-semibold">{formatAttendanceHours(r.workedMinutes, r.overtimeMinutes)}</TableCell>
                          <TableCell className="font-semibold text-slate-800">{formatCurrency(cost.totalCost)}</TableCell>
                          <TableCell className="text-right">
                            <Button type="button" variant="ghost" size="xs" onClick={(e) => { e.stopPropagation(); setDetailRecord(r); }}>
                              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {sortedWorkerRecords.length > pageLimit && (
                  <div className="p-3 bg-muted/20 text-center border-t">
                    <Button type="button" size="xs" variant="outline" onClick={() => setPageLimit((p) => p + 50)}>
                      Carregar mais registos ({sortedWorkerRecords.length - pageLimit} restantes)
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              /* Visão TIMELINE */
              <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-border/60 pl-6">
                {sortedWorkerRecords.slice(0, pageLimit).map((r) => {
                  const obra = obras.find((o) => o.id === r.projectId);
                  const fase = obra?.fases?.find((f) => f.id === r.phaseId);

                  return (
                    <div
                      key={r.id}
                      onClick={() => setDetailRecord(r)}
                      className="relative bg-card p-3 rounded-xl border hover:shadow-xs transition-all cursor-pointer space-y-1.5"
                    >
                      <div className="absolute -left-6 top-3.5 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-background" />
                      <div className="flex items-center justify-between text-xs border-b pb-1.5">
                        <span className="font-bold text-foreground">{r.date}</span>
                        {getTimelineStatusBadge(r.status)}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-muted-foreground pt-1">
                        <div>Obra: <strong className="text-foreground">{obra?.nome || "—"}</strong></div>
                        <div>Fase: <strong className="text-foreground">{fase?.nome || "Sem fase"}</strong></div>
                        <div>Horário: <strong className="text-foreground">{r.checkInTime ? `${r.checkInTime}–${r.checkOutTime}` : "—"}</strong></div>
                        <div>Horas: <strong className="text-foreground">{formatAttendanceHours(r.workedMinutes, r.overtimeMinutes)}</strong></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            MODO EQUIPA
           ========================================== */}
        {historyMode === "team" && (
          <div className="space-y-4">
            {/* D. SELEÇÃO DA EQUIPA */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-xl border">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-sm text-foreground">{selectedTeam?.name || "Selecione uma equipa"}</h3>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
                  <span>Líder: <strong className="text-foreground">{teamLeader?.name || "Sem líder definido"}</strong></span>
                  <span>Membros: <strong className="text-foreground">{teamRows.length}</strong></span>
                  <span>Obras: <strong className="text-foreground">{teamProjectsInPeriod.length}</strong></span>
                </div>
              </div>

              <div className="w-full md:w-64">
                <span className="text-[10px] font-semibold text-muted-foreground block mb-1">Selecionar Equipa</span>
                <Select value={effectiveTeamId} onValueChange={setSelectedTeamId}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Escolha uma equipa" />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    {teams.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* E. KPIS DA EQUIPA */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2.5">
              <Card className="p-2.5 border bg-card">
                <div className="text-[10px] text-muted-foreground font-semibold">Trabalhadores</div>
                <div className="text-base font-bold text-foreground mt-0.5">{teamRows.length}</div>
              </Card>
              <Card className="p-2.5 border bg-card">
                <div className="text-[10px] text-muted-foreground font-semibold flex items-center justify-between">
                  <span>Presenças</span>
                  {renderDiffBadge(calcPercentageDiff(teamSummary.present + teamSummary.late + teamSummary.halfDay, prevTeamSummary.present + prevTeamSummary.late + prevTeamSummary.halfDay))}
                </div>
                <div className="text-base font-bold text-emerald-600 mt-0.5">{teamSummary.present + teamSummary.late + teamSummary.halfDay}</div>
              </Card>
              <Card className="p-2.5 border bg-card">
                <div className="text-[10px] text-muted-foreground font-semibold flex items-center justify-between">
                  <span>Ausências</span>
                  {renderDiffBadge(calcPercentageDiff(teamSummary.absent, prevTeamSummary.absent))}
                </div>
                <div className="text-base font-bold text-rose-600 mt-0.5">{teamSummary.absent}</div>
              </Card>
              <Card className="p-2.5 border bg-card">
                <div className="text-[10px] text-muted-foreground font-semibold">Atrasos</div>
                <div className="text-base font-bold text-amber-600 mt-0.5">{teamSummary.late}</div>
              </Card>
              <Card className="p-2.5 border bg-card">
                <div className="text-[10px] text-muted-foreground font-semibold">Meio Período</div>
                <div className="text-base font-bold text-sky-600 mt-0.5">{teamSummary.halfDay}</div>
              </Card>
              <Card className="p-2.5 border bg-card">
                <div className="text-[10px] text-muted-foreground font-semibold flex items-center justify-between">
                  <span>Horas Trab.</span>
                  {renderDiffBadge(calcPercentageDiff(teamSummary.workedMinutes, prevTeamSummary.workedMinutes))}
                </div>
                <div className="text-base font-bold text-foreground mt-0.5">{formatMins(teamSummary.workedMinutes)}</div>
              </Card>
              <Card className="p-2.5 border bg-card">
                <div className="text-[10px] text-muted-foreground font-semibold">Horas Extra</div>
                <div className="text-base font-bold text-purple-600 mt-0.5">{formatMins(teamSummary.overtimeMinutes)}</div>
              </Card>
              <Card className="p-2.5 border bg-card">
                <div className="text-[10px] text-muted-foreground font-semibold">Assiduidade</div>
                <div className="text-base font-bold text-emerald-600 mt-0.5">{teamStats.assiduidadeTaxa.toFixed(1)}%</div>
              </Card>
              <Card className="p-2.5 border bg-card">
                <div className="text-[10px] text-muted-foreground font-semibold flex items-center justify-between">
                  <span>Custo Equipa</span>
                  {renderDiffBadge(calcPercentageDiff(teamCost.totalCost, prevTeamCost.totalCost))}
                </div>
                <div className="text-base font-bold text-slate-800 mt-0.5 truncate">{formatCurrency(teamCost.totalCost)}</div>
              </Card>
            </div>

            {/* F. FILTROS DA EQUIPA */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-48">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar trabalhador..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 text-xs h-8"
                />
              </div>

              <Select value={filterObra} onValueChange={setFilterObra}>
                <SelectTrigger className="w-36 text-xs h-8">
                  <SelectValue placeholder="Obra" />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="all">Todas as obras</SelectItem>
                  {obras.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-36 text-xs h-8">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="all">Todos estados</SelectItem>
                  <SelectItem value="present">Presente</SelectItem>
                  <SelectItem value="absent">Ausente</SelectItem>
                  <SelectItem value="late">Atrasado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* G. TABELA AGREGADA DA EQUIPA */}
            {teamRows.length === 0 ? (
              <div className="p-8 text-center border rounded-xl bg-card space-y-3">
                <Info className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-xs text-muted-foreground font-semibold">
                  Não existem registos de presença para o período selecionado.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <Button type="button" size="xs" onClick={() => handlePeriodModeChange("month")} className="text-xs bg-primary text-white">
                    Ver Mês Atual
                  </Button>
                  <Button type="button" size="xs" variant="outline" onClick={handleHoje} className="text-xs">
                    Hoje
                  </Button>
                  <Button type="button" size="xs" variant="outline" onClick={clearFilters} className="text-xs">
                    Limpar Filtros
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border bg-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 text-xs">
                      <TableHead>Trabalhador</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead className="text-center">Dias</TableHead>
                      <TableHead className="text-center">Presenças</TableHead>
                      <TableHead className="text-center">Ausências</TableHead>
                      <TableHead className="text-center">Atrasos</TableHead>
                      <TableHead>Horas Trab.</TableHead>
                      <TableHead>Horas Extra</TableHead>
                      <TableHead>Assiduidade</TableHead>
                      <TableHead>Custo Operacional</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-xs">
                    {teamRows.map((row) => (
                      <TableRow
                        key={row.workerId}
                        className="hover:bg-muted/30 cursor-pointer"
                        onClick={() => handleWorkerClickInAggr(row.workerId)}
                      >
                        <TableCell className="font-bold text-primary flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            {row.workerPhoto ? (
                              <img src={row.workerPhoto} alt={row.workerName} className="object-cover" />
                            ) : (
                              <AvatarFallback className="text-[8px] font-bold">{initials(row.workerName)}</AvatarFallback>
                            )}
                          </Avatar>
                          <span>{row.workerName}</span>
                        </TableCell>
                        <TableCell>{row.workerRole}</TableCell>
                        <TableCell className="text-center font-semibold">{row.diasRegistados}</TableCell>
                        <TableCell className="text-center font-bold text-emerald-600">{row.presencas}</TableCell>
                        <TableCell className="text-center font-bold text-rose-600">{row.ausencias}</TableCell>
                        <TableCell className="text-center font-bold text-amber-600">{row.atrasos}</TableCell>
                        <TableCell className="font-semibold">{formatMins(row.workedMinutes)}</TableCell>
                        <TableCell className="font-semibold text-purple-600">{formatMins(row.overtimeMinutes)}</TableCell>
                        <TableCell className="font-bold text-emerald-600">{row.assiduidadeTaxa.toFixed(1)}%</TableCell>
                        <TableCell className="font-bold text-slate-800">{formatCurrency(row.custo)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            MODO OBRA
           ========================================== */}
        {historyMode === "project" && (
          <div className="space-y-4">
            {/* D. SELEÇÃO DA OBRA */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-xl border">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-sm text-foreground">{selectedProject?.nome || "Selecione uma obra"}</h3>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
                  <span>Cliente: <strong className="text-foreground">{selectedProject?.cliente || "—"}</strong></span>
                  <span>Estado: <strong className="text-foreground">{selectedProject?.status || "Em Curso"}</strong></span>
                </div>
              </div>

              <div className="w-full md:w-64">
                <span className="text-[10px] font-semibold text-muted-foreground block mb-1">Selecionar Obra</span>
                <Select value={effectiveProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Escolha uma obra" />
                  </SelectTrigger>
                  <SelectContent className="text-xs max-h-56">
                    {obras.map((o) => (
                      <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* E. KPIS DA OBRA */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2.5">
              <Card className="p-2.5 border bg-card">
                <div className="text-[10px] text-muted-foreground font-semibold">Trabalhadores</div>
                <div className="text-base font-bold text-foreground mt-0.5">{projectWorkerRows.length}</div>
              </Card>
              <Card className="p-2.5 border bg-card">
                <div className="text-[10px] text-muted-foreground font-semibold flex items-center justify-between">
                  <span>Presenças</span>
                  {renderDiffBadge(calcPercentageDiff(projectSummary.present + projectSummary.late + projectSummary.halfDay, prevProjectSummary.present + prevProjectSummary.late + prevProjectSummary.halfDay))}
                </div>
                <div className="text-base font-bold text-emerald-600 mt-0.5">{projectSummary.present + projectSummary.late + projectSummary.halfDay}</div>
              </Card>
              <Card className="p-2.5 border bg-card">
                <div className="text-[10px] text-muted-foreground font-semibold flex items-center justify-between">
                  <span>Ausências</span>
                  {renderDiffBadge(calcPercentageDiff(projectSummary.absent, prevProjectSummary.absent))}
                </div>
                <div className="text-base font-bold text-rose-600 mt-0.5">{projectSummary.absent}</div>
              </Card>
              <Card className="p-2.5 border bg-card">
                <div className="text-[10px] text-muted-foreground font-semibold">Atrasos</div>
                <div className="text-base font-bold text-amber-600 mt-0.5">{projectSummary.late}</div>
              </Card>
              <Card className="p-2.5 border bg-card">
                <div className="text-[10px] text-muted-foreground font-semibold">Meio Período</div>
                <div className="text-base font-bold text-sky-600 mt-0.5">{projectSummary.halfDay}</div>
              </Card>
              <Card className="p-2.5 border bg-card">
                <div className="text-[10px] text-muted-foreground font-semibold flex items-center justify-between">
                  <span>Horas Trab.</span>
                  {renderDiffBadge(calcPercentageDiff(projectSummary.workedMinutes, prevProjectSummary.workedMinutes))}
                </div>
                <div className="text-base font-bold text-foreground mt-0.5">{formatMins(projectSummary.workedMinutes)}</div>
              </Card>
              <Card className="p-2.5 border bg-card">
                <div className="text-[10px] text-muted-foreground font-semibold">Horas Extra</div>
                <div className="text-base font-bold text-purple-600 mt-0.5">{formatMins(projectSummary.overtimeMinutes)}</div>
              </Card>
              <Card className="p-2.5 border bg-card">
                <div className="text-[10px] text-muted-foreground font-semibold">Assiduidade</div>
                <div className="text-base font-bold text-emerald-600 mt-0.5">{projectStats.assiduidadeTaxa.toFixed(1)}%</div>
              </Card>
              <Card className="p-2.5 border bg-card">
                <div className="text-[10px] text-muted-foreground font-semibold flex items-center justify-between">
                  <span>Custo Obra</span>
                  {renderDiffBadge(calcPercentageDiff(projectCost.totalCost, prevProjectCost.totalCost))}
                </div>
                <div className="text-base font-bold text-slate-800 mt-0.5 truncate">{formatCurrency(projectCost.totalCost)}</div>
              </Card>
            </div>

            {/* F. FILTROS DA OBRA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-48">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 text-xs h-8"
                  />
                </div>

                <Select value={filterTeam} onValueChange={setFilterTeam}>
                  <SelectTrigger className="w-36 text-xs h-8">
                    <SelectValue placeholder="Equipa" />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="all">Todas as equipas</SelectItem>
                    {teams.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center border rounded-lg bg-muted/30 p-0.5 h-8 shrink-0">
                <button
                  type="button"
                  onClick={() => setProjectViewMode("by_worker")}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all h-7 ${
                    projectViewMode === "by_worker" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Por Trabalhador
                </button>
                <button
                  type="button"
                  onClick={() => setProjectViewMode("by_team")}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all h-7 ${
                    projectViewMode === "by_team" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Por Equipa
                </button>
              </div>
            </div>

            {/* G. TABELAS DA OBRA */}
            {projectViewMode === "by_worker" ? (
              projectWorkerRows.length === 0 ? (
                <div className="p-8 text-center border rounded-xl bg-card space-y-3">
                  <Info className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="text-xs text-muted-foreground font-semibold">
                    Não existem registos de presença para o período selecionado.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <Button type="button" size="xs" onClick={() => handlePeriodModeChange("month")} className="text-xs bg-primary text-white">
                      Ver Mês Atual
                    </Button>
                    <Button type="button" size="xs" variant="outline" onClick={handleHoje} className="text-xs">
                      Hoje
                    </Button>
                    <Button type="button" size="xs" variant="outline" onClick={clearFilters} className="text-xs">
                      Limpar Filtros
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border bg-card overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 text-xs">
                        <TableHead>Trabalhador</TableHead>
                        <TableHead>Função</TableHead>
                        <TableHead>Equipa</TableHead>
                        <TableHead className="text-center">Dias</TableHead>
                        <TableHead className="text-center">Presenças</TableHead>
                        <TableHead className="text-center">Ausências</TableHead>
                        <TableHead>Horas Trab.</TableHead>
                        <TableHead>Horas Extra</TableHead>
                        <TableHead>Custo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="text-xs">
                      {projectWorkerRows.map((row) => (
                        <TableRow
                          key={row.workerId}
                          className="hover:bg-muted/30 cursor-pointer"
                          onClick={() => handleWorkerClickInAggr(row.workerId)}
                        >
                          <TableCell className="font-bold text-primary flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              {row.workerPhoto ? (
                                <img src={row.workerPhoto} alt={row.workerName} className="object-cover" />
                              ) : (
                                <AvatarFallback className="text-[8px] font-bold">{initials(row.workerName)}</AvatarFallback>
                              )}
                            </Avatar>
                            <span>{row.workerName}</span>
                          </TableCell>
                          <TableCell>{row.workerRole}</TableCell>
                          <TableCell>{row.teamName}</TableCell>
                          <TableCell className="text-center font-semibold">{row.diasRegistados}</TableCell>
                          <TableCell className="text-center font-bold text-emerald-600">{row.presencas}</TableCell>
                          <TableCell className="text-center font-bold text-rose-600">{row.ausencias}</TableCell>
                          <TableCell className="font-semibold">{formatMins(row.workedMinutes)}</TableCell>
                          <TableCell className="font-semibold text-purple-600">{formatMins(row.overtimeMinutes)}</TableCell>
                          <TableCell className="font-bold text-slate-800">{formatCurrency(row.custo)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )
            ) : (
              projectTeamRows.length === 0 ? (
                <div className="p-8 text-center border rounded-xl bg-card space-y-3">
                  <Info className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="text-xs text-muted-foreground font-semibold">
                    Não existem registos de presença para o período selecionado.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <Button type="button" size="xs" onClick={() => handlePeriodModeChange("month")} className="text-xs bg-primary text-white">
                      Ver Mês Atual
                    </Button>
                    <Button type="button" size="xs" variant="outline" onClick={handleHoje} className="text-xs">
                      Hoje
                    </Button>
                    <Button type="button" size="xs" variant="outline" onClick={clearFilters} className="text-xs">
                      Limpar Filtros
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border bg-card overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 text-xs">
                        <TableHead>Equipa</TableHead>
                        <TableHead className="text-center">Nº Trabalhadores</TableHead>
                        <TableHead className="text-center">Presenças</TableHead>
                        <TableHead className="text-center">Ausências</TableHead>
                        <TableHead>Horas Trab.</TableHead>
                        <TableHead>Horas Extra</TableHead>
                        <TableHead>Custo Operacional</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="text-xs">
                      {projectTeamRows.map((row) => (
                        <TableRow
                          key={row.teamId}
                          className="hover:bg-muted/30 cursor-pointer"
                          onClick={() => handleTeamClickInAggr(row.teamId)}
                        >
                          <TableCell className="font-bold text-primary flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{row.teamName}</span>
                          </TableCell>
                          <TableCell className="text-center font-semibold">{row.numWorkers}</TableCell>
                          <TableCell className="text-center font-bold text-emerald-600">{row.presencas}</TableCell>
                          <TableCell className="text-center font-bold text-rose-600">{row.ausencias}</TableCell>
                          <TableCell className="font-semibold">{formatMins(row.workedMinutes)}</TableCell>
                          <TableCell className="font-semibold text-purple-600">{formatMins(row.overtimeMinutes)}</TableCell>
                          <TableCell className="font-bold text-slate-800">{formatCurrency(row.custo)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )
            )}
          </div>
        )}

      </div>

      {/* DIÁLOGO DE DETALHE READ-ONLY */}
      <AttendanceRecordDetailDialog
        open={!!detailRecord}
        onOpenChange={(o) => { if (!o) setDetailRecord(null); }}
        record={detailRecord}
      />
    </>
  );
}
