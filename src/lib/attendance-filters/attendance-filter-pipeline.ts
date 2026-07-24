import type {
  AttendanceFilterState,
  AttendanceFilterResult,
  AttendanceEmptyReason,
  SortField,
  SortDirection,
} from "./attendance-filter-types";
import type { AttendanceRecord, Worker, Obra, Team } from "../mock-data";
import { calculateRecordsCost } from "../attendance-analytics";
import { countActiveAdvancedFilters } from "./attendance-filter-utils";

/**
 * 1. Normalização de dados (garante arrays válidos e ausência de nulos incorretos).
 */
export function normalizeAttendanceRecords(records: AttendanceRecord[]): AttendanceRecord[] {
  if (!Array.isArray(records)) return [];
  return records.filter((r) => r && typeof r === "object" && Boolean(r.id));
}

/**
 * 2. Filtragem de Período (Data Inicial e Data Final).
 */
export function filterAttendanceByPeriod(
  records: AttendanceRecord[],
  dateFrom: string,
  dateTo: string
): AttendanceRecord[] {
  if (!dateFrom && !dateTo) return records;

  return records.filter((r) => {
    if (dateFrom && r.date < dateFrom) return false;
    if (dateTo && r.date > dateTo) return false;
    return true;
  });
}

/**
 * 3. Filtragem Avançada (Multi-seleção de obras, trabalhadores, equipas, fases, estados, horas, custos, etc.).
 */
export function filterAttendanceAdvanced(
  records: AttendanceRecord[],
  workers: Worker[],
  obras: Obra[],
  teams: Team[],
  filterState: AttendanceFilterState
): AttendanceRecord[] {
  if (!records || records.length === 0) return [];

  // Mapeamentos rápidos em memória
  const workerMap = new Map<string, Worker>();
  workers.forEach((w) => workerMap.set(w.id, w));

  const teamMap = new Map<string, Team>();
  teams.forEach((t) => teamMap.set(t.id, t));

  return records.filter((r) => {
    // 3.1 Multi-seleção de Obras
    if (filterState.selectedProjectIds.length > 0) {
      if (!filterState.selectedProjectIds.includes(r.projectId)) return false;
    }

    // 3.2 Multi-seleção de Trabalhadores
    if (filterState.selectedWorkerIds.length > 0) {
      if (!filterState.selectedWorkerIds.includes(r.workerId)) return false;
    }

    // 3.3 Multi-seleção de Equipas
    if (filterState.selectedTeamIds.length > 0) {
      if (!r.teamId || !filterState.selectedTeamIds.includes(r.teamId)) return false;
    }

    // 3.4 Multi-seleção de Fases
    if (filterState.selectedPhaseIds.length > 0) {
      if (!r.phaseId || !filterState.selectedPhaseIds.includes(r.phaseId)) return false;
    }

    // 3.5 Multi-seleção de Estados
    if (filterState.selectedStatuses.length > 0) {
      if (!filterState.selectedStatuses.includes(r.status)) return false;
    }

    // 3.6 Horas Trabalhadas
    const workedMins = r.workedMinutes || 0;
    if (filterState.onlyWithHours && workedMins <= 0) return false;
    if (filterState.onlyWithoutHours && workedMins > 0) return false;

    // 3.7 Horas Extra
    const overtimeMins = r.overtimeMinutes || 0;
    if (filterState.onlyWithOvertime && overtimeMins <= 0) return false;
    if (filterState.onlyWithoutOvertime && overtimeMins > 0) return false;

    // 3.8 Custo Operacional
    const costResult = calculateRecordsCost([r], workers);
    const cost = costResult.totalCost;

    if (filterState.onlyWithCost && cost <= 0) return false;
    if (filterState.onlyWithoutCost && cost > 0) return false;
    if (filterState.minimumCost !== null && cost < filterState.minimumCost) return false;
    if (filterState.maximumCost !== null && cost > filterState.maximumCost) return false;

    // 3.9 Estado Ativo/Inativo do Trabalhador
    const worker = workerMap.get(r.workerId);
    if (filterState.onlyActiveWorkers && worker?.status !== "active") return false;
    if (filterState.onlyInactiveWorkers && worker?.status !== "inactive") return false;

    // 3.10 Estado Ativo/Inativo da Equipa
    if (r.teamId) {
      const team = teamMap.get(r.teamId);
      if (filterState.onlyActiveTeams && team?.status !== "active") return false;
      if (filterState.onlyInactiveTeams && team?.status !== "inactive") return false;
    } else if (filterState.onlyActiveTeams) {
      return false;
    }

    return true;
  });
}

/**
 * 4. Pesquisa Instantânea por Texto (Trabalhador, Obra, Fase, Equipa).
 */
export function searchAttendance(
  records: AttendanceRecord[],
  workers: Worker[],
  obras: Obra[],
  teams: Team[],
  searchQuery: string
): AttendanceRecord[] {
  const query = searchQuery.toLowerCase().trim();
  if (!query) return records;

  const workerMap = new Map<string, Worker>();
  workers.forEach((w) => workerMap.set(w.id, w));

  const obraMap = new Map<string, Obra>();
  obras.forEach((o) => obraMap.set(o.id, o));

  const teamMap = new Map<string, Team>();
  teams.forEach((t) => teamMap.set(t.id, t));

  return records.filter((r) => {
    const worker = workerMap.get(r.workerId);
    const obra = obraMap.get(r.projectId);
    const phase = obra?.fases?.find((f) => f.id === r.phaseId);
    const team = r.teamId ? teamMap.get(r.teamId) : null;

    return (
      (worker?.name && worker.name.toLowerCase().includes(query)) ||
      (worker?.role && worker.role.toLowerCase().includes(query)) ||
      (obra?.nome && obra.nome.toLowerCase().includes(query)) ||
      (phase?.nome && phase.nome.toLowerCase().includes(query)) ||
      (team?.name && team.name.toLowerCase().includes(query))
    );
  });
}

/**
 * 5. Ordenação Personalizada (Data, Nome, Obra, Equipa, Estado, Horas, Custo).
 */
export function sortAttendance(
  records: AttendanceRecord[],
  workers: Worker[],
  obras: Obra[],
  teams: Team[],
  sortField: SortField,
  sortDirection: SortDirection
): AttendanceRecord[] {
  if (!records || records.length <= 1) return records;

  const copy = [...records];
  const mult = sortDirection === "asc" ? 1 : -1;

  const workerMap = new Map<string, Worker>();
  workers.forEach((w) => workerMap.set(w.id, w));

  const obraMap = new Map<string, Obra>();
  obras.forEach((o) => obraMap.set(o.id, o));

  const teamMap = new Map<string, Team>();
  teams.forEach((t) => teamMap.set(t.id, t));

  copy.sort((a, b) => {
    switch (sortField) {
      case "date":
        return a.date.localeCompare(b.date) * mult;
      case "workerName": {
        const wA = workerMap.get(a.workerId)?.name || "";
        const wB = workerMap.get(b.workerId)?.name || "";
        return wA.localeCompare(wB) * mult;
      }
      case "projectName": {
        const oA = obraMap.get(a.projectId)?.nome || "";
        const oB = obraMap.get(b.projectId)?.nome || "";
        return oA.localeCompare(oB) * mult;
      }
      case "teamName": {
        const tA = a.teamId ? teamMap.get(a.teamId)?.name || "" : "";
        const tB = b.teamId ? teamMap.get(b.teamId)?.name || "" : "";
        return tA.localeCompare(tB) * mult;
      }
      case "status":
        return a.status.localeCompare(b.status) * mult;
      case "workedMinutes": {
        const minA = a.workedMinutes || 0;
        const minB = b.workedMinutes || 0;
        return (minA - minB) * mult;
      }
      case "cost": {
        const costA = calculateRecordsCost([a], workers).totalCost;
        const costB = calculateRecordsCost([b], workers).totalCost;
        return (costA - costB) * mult;
      }
      default:
        return 0;
    }
  });

  return copy;
}

/**
 * 6. Paginação (Placeholder preparado para fases futuras).
 */
export function paginateAttendance(
  records: AttendanceRecord[],
  page: number,
  pageSize: number
): AttendanceRecord[] {
  if (!records || records.length === 0) return [];
  if (pageSize <= 0) return records;

  const validPage = Math.max(1, page || 1);
  const start = (validPage - 1) * pageSize;
  return records.slice(start, start + pageSize);
}

/**
 * 7. Determinação da Causa de Estado Vazio (`emptyReason`).
 */
export function determineEmptyReason(
  totalRecords: number,
  afterPeriodCount: number,
  afterAdvancedCount: number,
  afterSearchCount: number,
  filterState: AttendanceFilterState
): AttendanceEmptyReason {
  if (afterSearchCount > 0) return "none";
  if (totalRecords === 0) return "no_records";
  if (afterPeriodCount === 0) return "period";
  if (afterAdvancedCount === 0) return "filters";
  if (filterState.searchQuery.trim() !== "" && afterSearchCount === 0) return "search";
  return "filters";
}

/**
 * 8. Construção do Objeto de Resultado (`AttendanceFilterResult`).
 */
export function buildAttendanceFilterResult(
  records: AttendanceRecord[],
  totalRecords: number,
  filterState: AttendanceFilterState,
  emptyReason: AttendanceEmptyReason
): AttendanceFilterResult {
  const activeCount = countActiveAdvancedFilters(filterState);
  const hasSearch = Boolean(filterState.searchQuery.trim());
  const hasPeriod = Boolean(filterState.dateFrom || filterState.dateTo);

  return {
    records,
    totalRecords,
    totalFiltered: records.length,
    hasFilters: activeCount > 0 || hasSearch || hasPeriod,
    activeFilterCount: activeCount,
    emptyReason,
    metadata: {
      appliedVersion: filterState.version,
      appliedPeriodMode: filterState.periodMode,
    },
  };
}

/**
 * 9. ORQUESTRADOR PRINCIPAL DO PIPELINE
 */
export function runAttendanceFilterPipeline(
  records: AttendanceRecord[],
  workers: Worker[],
  obras: Obra[],
  teams: Team[],
  filterState: AttendanceFilterState
): AttendanceFilterResult {
  const normalized = normalizeAttendanceRecords(records);
  const totalCount = normalized.length;

  // Passo 1: Período
  const periodFiltered = filterAttendanceByPeriod(
    normalized,
    filterState.dateFrom,
    filterState.dateTo
  );

  // Passo 2: Filtros Avançados
  const advancedFiltered = filterAttendanceAdvanced(
    periodFiltered,
    workers,
    obras,
    teams,
    filterState
  );

  // Passo 3: Pesquisa
  const searchFiltered = searchAttendance(
    advancedFiltered,
    workers,
    obras,
    teams,
    filterState.searchQuery
  );

  // Passo 4: Ordenação
  const sorted = sortAttendance(
    searchFiltered,
    workers,
    obras,
    teams,
    filterState.sortField,
    filterState.sortDirection
  );

  // Passo 5: Determinar Causa de Estado Vazio
  const emptyReason = determineEmptyReason(
    totalCount,
    periodFiltered.length,
    advancedFiltered.length,
    sorted.length,
    filterState
  );

  // Passo 6: Construir Resultado (sem fatiar a paginação na visualização padrão)
  return buildAttendanceFilterResult(sorted, totalCount, filterState, emptyReason);
}
