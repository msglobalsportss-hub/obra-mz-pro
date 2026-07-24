import type { AttendanceRecord, Worker, AttendanceStatus } from "./mock-data";
import { ATTENDANCE_COST_DEFAULTS } from "./attendance-cost-settings";

/**
 * Filtro opcional para seleção e agregação de presenças.
 */
export interface AttendanceFilter {
  projectId?: string;
  workerId?: string;
  teamId?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Resultado individual do cálculo de custo de uma presença.
 */
export interface RecordCostResult {
  cost: number;
  isAvailable: boolean;
  rateSource?: "hourly" | "daily" | "monthly_estimated";
}

/**
 * Resultado agregado contendo o custo financeiro total e aviso se existirem lacunas de salários.
 */
export interface AggregateCostResult {
  totalCost: number;
  hasUnavailableCosts: boolean;
}

/**
 * Resumo estatístico das presenças no período filtrado.
 */
export interface AttendanceSummary {
  totalWorkers: number;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  justifiedAbsence: number;
  workedMinutes: number;
  overtimeMinutes: number;
  workersWithCost: number;
  workersWithoutCost: number;
}

/**
 * Indicadores principais (KPIs) para a página de controlo operacional.
 */
export interface AttendanceKPIs {
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  workedMinutes: number;
  overtimeMinutes: number;
  operationalCost: AggregateCostResult;
}

/**
 * Estatísticas percentuais e médias de assiduidade.
 */
export interface AttendanceStats {
  assiduidadeTaxa: number;
  absentismoTaxa: number;
  avgWorkedMinutes: number;
  avgOvertimeMinutes: number;
  avgPresentWorkersPerDay: number;
}

/**
 * Histórico de presenças agregadas por entidade.
 */
export interface EntityHistory {
  presencas: AttendanceRecord[];
  totalPresencas: number;
  workedMinutes: number;
  overtimeMinutes: number;
  cost: AggregateCostResult;
}

// ==========================================
// 1. HELPERS E FILTRAGEM
// ==========================================

/**
 * Filtra um array de registos de presenças com base nos critérios fornecidos.
 */
export function filterRecords(records: AttendanceRecord[], filters?: AttendanceFilter): AttendanceRecord[] {
  if (!filters) return records;

  return records.filter((r) => {
    if (filters.projectId && r.projectId !== filters.projectId) return false;
    if (filters.workerId && r.workerId !== filters.workerId) return false;
    if (filters.teamId && r.teamId !== filters.teamId) return false;
    if (filters.dateFrom && r.date < filters.dateFrom) return false;
    if (filters.dateTo && r.date > filters.dateTo) return false;
    return true;
  });
}

/**
 * Previne divisão por zero e retorna valor padrão de segurança.
 */
function safeDivide(numerator: number, denominator: number, fallback = 0): number {
  if (!denominator || denominator === 0) return fallback;
  return numerator / denominator;
}

/**
 * Agrupa registos por uma determinada propriedade (ex: date, workerId, teamId, projectId).
 */
function groupBy<T>(array: T[], keyGetter: (item: T) => string): Record<string, T[]> {
  const map: Record<string, T[]> = {};
  array.forEach((item) => {
    const key = keyGetter(item);
    if (!map[key]) {
      map[key] = [];
    }
    map[key]!.push(item);
  });
  return map;
}

// ==========================================
// 2. CUSTOS OPERACIONAIS (MOTOR DE CUSTOS)
// ==========================================

/**
 * Calcula o custo operacional estimado para um único registo de presença.
 *
 * REGRAS DE NEGÓCIO:
 * 1. Se o estado for 'absent' (Ausente) ou 'justified_absence' (Falta Justificada), o custo é 0.
 * 2. Se o trabalhador não possuir custo definido (hourlyRate ou dailyRate), considera-se indisponível.
 * 3. Se possuir custo horário (hourlyRate):
 *    - Se possuir horas registadas (entrada/saída): (horasNormais * hourlyRate) + (horasExtra * hourlyRate * 1.5).
 *    - Se não possuir horas: calcula jornada padrão de 8h (ou 4h para meio dia).
 * 4. Se possuir apenas custo diário (dailyRate):
 *    - Se possuir horas: infere-se taxa horária como (dailyRate / 8), aplicando a fórmula acima.
 *    - Se não possuir horas: utiliza dailyRate diretamente (ou metade para meio dia).
 * 5. Custo mensal (monthlyRate) não é estimado automaticamente até existir definição de dias úteis padrão.
 */
export function calculateRecordCost(record: AttendanceRecord, worker: Worker | undefined): RecordCostResult {
  if (!worker) {
    return { cost: 0, isAvailable: false };
  }

  // Regra 1: Ausências não geram custo de mão de obra
  if (record.status === "absent" || record.status === "justified_absence") {
    return { cost: 0, isAvailable: true };
  }

  // Obter taxas
  const hasHourly = worker.hourlyRate !== undefined && worker.hourlyRate > 0;
  const hasDaily = worker.dailyRate !== undefined && worker.dailyRate > 0;
  const hasMonthly = worker.monthlyRate !== undefined && worker.monthlyRate > 0;

  // Regra de prioridades e suporte a monthlyRate
  if (!hasHourly && !hasDaily && !hasMonthly) {
    return { cost: 0, isAvailable: false };
  }

  let hourlyRate = 0;
  let dailyRate = 0;
  let rateSource: "hourly" | "daily" | "monthly_estimated";

  if (hasHourly) {
    hourlyRate = worker.hourlyRate!;
    dailyRate = hourlyRate * ATTENDANCE_COST_DEFAULTS.workingHoursPerDay;
    rateSource = "hourly";
  } else if (hasDaily) {
    dailyRate = worker.dailyRate!;
    hourlyRate = dailyRate / ATTENDANCE_COST_DEFAULTS.workingHoursPerDay;
    rateSource = "daily";
  } else {
    // monthlyRate estimado
    dailyRate = worker.monthlyRate! / ATTENDANCE_COST_DEFAULTS.workingDaysPerMonth;
    hourlyRate = dailyRate / ATTENDANCE_COST_DEFAULTS.workingHoursPerDay;
    rateSource = "monthly_estimated";
  }

  const hasHours = record.workedMinutes !== undefined && record.checkInTime !== undefined;

  if (hasHours) {
    const workedHours = record.workedMinutes! / 60;
    const overtimeHours = (record.overtimeMinutes || 0) / 60;
    
    // Horas extra valorizadas a 1.5x
    const cost = (workedHours * hourlyRate) + (overtimeHours * hourlyRate * 1.5);
    return { cost, isAvailable: true, rateSource };
  } else {
    // Presença simples sem horas registadas
    if (record.status === "half_day") {
      return { cost: dailyRate / 2, isAvailable: true, rateSource };
    }
    return { cost: dailyRate, isAvailable: true, rateSource };
  }
}

/**
 * Calcula o custo operacional acumulado de um conjunto de registos de presença.
 */
export function calculateRecordsCost(records: AttendanceRecord[], workers: Worker[]): AggregateCostResult {
  let totalCost = 0;
  let hasUnavailableCosts = false;

  records.forEach((r) => {
    const worker = workers.find((w) => w.id === r.workerId);
    const result = calculateRecordCost(r, worker);
    if (result.isAvailable) {
      totalCost += result.cost;
    } else {
      hasUnavailableCosts = true;
    }
  });

  return { totalCost, hasUnavailableCosts };
}

/**
 * Calcula o custo acumulado de uma obra (projeto) específica.
 */
export function calculateProjectCost(records: AttendanceRecord[], workers: Worker[], projectId: string): AggregateCostResult {
  const projectRecords = records.filter((r) => r.projectId === projectId);
  return calculateRecordsCost(projectRecords, workers);
}

/**
 * Calcula o custo acumulado de uma equipa específica.
 */
export function calculateTeamCost(records: AttendanceRecord[], workers: Worker[], teamId: string): AggregateCostResult {
  const teamRecords = records.filter((r) => r.teamId === teamId);
  return calculateRecordsCost(teamRecords, workers);
}

/**
 * Calcula o custo acumulado de um trabalhador específico.
 */
export function calculateWorkerCost(records: AttendanceRecord[], workers: Worker[], workerId: string): AggregateCostResult {
  const workerRecords = records.filter((r) => r.workerId === workerId);
  return calculateRecordsCost(workerRecords, workers);
}

/**
 * Calcula o custo operacional agregado para um determinado dia.
 */
export function calculateDailyCost(records: AttendanceRecord[], workers: Worker[], date: string): AggregateCostResult {
  const dailyRecords = records.filter((r) => r.date === date);
  return calculateRecordsCost(dailyRecords, workers);
}

// ==========================================
// 3. RESUMOS E KPIs
// ==========================================

/**
 * Calcula o resumo operacional agregando presenças, ausências e totais de horas.
 */
export function getAttendanceSummary(
  records: AttendanceRecord[],
  workers: Worker[],
  filters?: AttendanceFilter
): AttendanceSummary {
  const filtered = filterRecords(records, filters);

  const uniqueWorkers = new Set<string>();
  let present = 0;
  let absent = 0;
  let late = 0;
  let halfDay = 0;
  let justifiedAbsence = 0;
  let workedMinutes = 0;
  let overtimeMinutes = 0;

  const workersWithCost = new Set<string>();
  const workersWithoutCost = new Set<string>();

  filtered.forEach((r) => {
    uniqueWorkers.add(r.workerId);

    const worker = workers.find((w) => w.id === r.workerId);
    const hasHourly = worker?.hourlyRate !== undefined && worker.hourlyRate > 0;
    const hasDaily = worker?.dailyRate !== undefined && worker.dailyRate > 0;
    const hasMonthly = worker?.monthlyRate !== undefined && worker.monthlyRate > 0;
    const hasCost = hasHourly || hasDaily || hasMonthly;

    if (hasCost) {
      workersWithCost.add(r.workerId);
    } else {
      workersWithoutCost.add(r.workerId);
    }

    // Contagem de estados
    switch (r.status) {
      case "present":
        present++;
        break;
      case "absent":
        absent++;
        break;
      case "late":
        late++;
        break;
      case "half_day":
        halfDay++;
        break;
      case "justified_absence":
        justifiedAbsence++;
        break;
    }

    workedMinutes += r.workedMinutes || 0;
    overtimeMinutes += r.overtimeMinutes || 0;
  });

  return {
    totalWorkers: uniqueWorkers.size,
    present,
    absent,
    late,
    halfDay,
    justifiedAbsence,
    workedMinutes,
    overtimeMinutes,
    workersWithCost: workersWithCost.size,
    workersWithoutCost: workersWithoutCost.size,
  };
}

/**
 * Devolve os KPIs e o custo financeiro operacional do período de forma otimizada.
 */
export function getAttendanceKPIs(
  records: AttendanceRecord[],
  workers: Worker[],
  filters?: AttendanceFilter
): AttendanceKPIs {
  const filtered = filterRecords(records, filters);
  const summary = getAttendanceSummary(filtered, workers);
  const cost = calculateRecordsCost(filtered, workers);

  return {
    present: summary.present,
    absent: summary.absent,
    late: summary.late,
    halfDay: summary.halfDay,
    workedMinutes: summary.workedMinutes,
    overtimeMinutes: summary.overtimeMinutes,
    operationalCost: cost,
  };
}

// ==========================================
// 4. ESTATÍSTICAS
// ==========================================

/**
 * Calcula médias e taxas operacionais baseadas nas presenças.
 */
export function getAttendanceStats(
  records: AttendanceRecord[],
  workers: Worker[],
  filters?: AttendanceFilter
): AttendanceStats {
  const filtered = filterRecords(records, filters);
  const total = filtered.length;

  if (total === 0) {
    return {
      assiduidadeTaxa: 0,
      absentismoTaxa: 0,
      avgWorkedMinutes: 0,
      avgOvertimeMinutes: 0,
      avgPresentWorkersPerDay: 0,
    };
  }

  const summary = getAttendanceSummary(filtered, workers);
  
  // Taxas
  const presentTotal = summary.present + summary.late + summary.halfDay;
  const absentTotal = summary.absent + summary.justifiedAbsence;

  const assiduidadeTaxa = safeDivide(presentTotal, total) * 100;
  const absentismoTaxa = safeDivide(absentTotal, total) * 100;

  // Médias de horas baseadas apenas em trabalhadores ativos
  const avgWorkedMinutes = safeDivide(summary.workedMinutes, presentTotal);
  const avgOvertimeMinutes = safeDivide(summary.overtimeMinutes, presentTotal);

  // Média de presentes por dia
  const recordsByDate = groupBy(filtered, (r) => r.date);
  const datesCount = Object.keys(recordsByDate).length;
  
  let totalPresentAcrossDays = 0;
  Object.values(recordsByDate).forEach((dayRecords) => {
    const pCount = dayRecords.filter(
      (r) => r.status === "present" || r.status === "late" || r.status === "half_day"
    ).length;
    totalPresentAcrossDays += pCount;
  });

  const avgPresentWorkersPerDay = safeDivide(totalPresentAcrossDays, datesCount);

  return {
    assiduidadeTaxa,
    absentismoTaxa,
    avgWorkedMinutes,
    avgOvertimeMinutes,
    avgPresentWorkersPerDay,
  };
}

// ==========================================
// 5. HISTÓRICOS
// ==========================================

/**
 * Devolve o histórico agregado detalhado de um determinado trabalhador.
 */
export function getWorkerHistory(
  records: AttendanceRecord[],
  workers: Worker[],
  workerId: string,
  filters?: AttendanceFilter
): EntityHistory {
  const workerRecords = records.filter((r) => r.workerId === workerId);
  const filtered = filterRecords(workerRecords, filters);
  
  let workedMinutes = 0;
  let overtimeMinutes = 0;

  filtered.forEach((r) => {
    workedMinutes += r.workedMinutes || 0;
    overtimeMinutes += r.overtimeMinutes || 0;
  });

  const cost = calculateRecordsCost(filtered, workers);

  return {
    presencas: filtered,
    totalPresencas: filtered.length,
    workedMinutes,
    overtimeMinutes,
    cost,
  };
}

/**
 * Devolve o histórico agregado detalhado de uma equipa.
 */
export function getTeamHistory(
  records: AttendanceRecord[],
  workers: Worker[],
  teamId: string,
  filters?: AttendanceFilter
): EntityHistory {
  const teamRecords = records.filter((r) => r.teamId === teamId);
  const filtered = filterRecords(teamRecords, filters);

  let workedMinutes = 0;
  let overtimeMinutes = 0;

  filtered.forEach((r) => {
    workedMinutes += r.workedMinutes || 0;
    overtimeMinutes += r.overtimeMinutes || 0;
  });

  const cost = calculateRecordsCost(filtered, workers);

  return {
    presencas: filtered,
    totalPresencas: filtered.length,
    workedMinutes,
    overtimeMinutes,
    cost,
  };
}

/**
 * Devolve o histórico agregado detalhado de uma obra (projeto).
 */
export function getProjectHistory(
  records: AttendanceRecord[],
  workers: Worker[],
  projectId: string,
  filters?: AttendanceFilter
): EntityHistory {
  const projectRecords = records.filter((r) => r.projectId === projectId);
  const filtered = filterRecords(projectRecords, filters);

  let workedMinutes = 0;
  let overtimeMinutes = 0;

  filtered.forEach((r) => {
    workedMinutes += r.workedMinutes || 0;
    overtimeMinutes += r.overtimeMinutes || 0;
  });

  const cost = calculateRecordsCost(filtered, workers);

  return {
    presencas: filtered,
    totalPresencas: filtered.length,
    workedMinutes,
    overtimeMinutes,
    cost,
  };
}

// ==========================================
// 6. VIEW MODELS & REFINAMENTOS FASE 3
// ==========================================

export type WorkerPerformanceScore = "Excelente" | "Bom" | "Regular" | "Necessita Atenção";

export function calculateWorkerPerformanceScore(
  assiduidadeTaxa: number = 0,
  absentismoTaxa: number = 0,
  atrasos: number = 0
): WorkerPerformanceScore {
  const ass = isNaN(assiduidadeTaxa) ? 0 : assiduidadeTaxa;
  const abs = isNaN(absentismoTaxa) ? 0 : absentismoTaxa;
  const atr = isNaN(atrasos) ? 0 : atrasos;
  if (ass >= 95 && atr === 0) return "Excelente";
  if (ass >= 85 && abs <= 10) return "Bom";
  if (ass >= 70 && abs <= 25) return "Regular";
  return "Necessita Atenção";
}

export interface HistoryKpiItem {
  label: string;
  value: string | number;
  diffPercent?: number;
  icon?: string;
  warning?: string;
}

export interface HistoryViewModel<T = any> {
  title: string;
  subtitle: string;
  periodLabel: string;
  kpis: HistoryKpiItem[];
  rows: T[];
  totalCount: number;
}

export function calcPercentageDiff(currentVal: number = 0, previousVal: number = 0): number | undefined {
  const c = typeof currentVal === "number" && !isNaN(currentVal) ? currentVal : 0;
  const p = typeof previousVal === "number" && !isNaN(previousVal) ? previousVal : 0;
  if (p === 0) {
    return c > 0 ? 100 : 0;
  }
  const diff = ((c - p) / p) * 100;
  const rounded = Math.round(diff * 10) / 10;
  return isNaN(rounded) ? undefined : rounded;
}

export interface TeamWorkerRow {
  workerId: string;
  workerName: string;
  workerRole: string;
  workerPhoto?: string;
  diasRegistados: number;
  presencas: number;
  ausencias: number;
  atrasos: number;
  workedMinutes: number;
  overtimeMinutes: number;
  assiduidadeTaxa: number;
  custo: number;
}

export function aggregateTeamHistoryByWorker(
  records: AttendanceRecord[],
  workers: Worker[],
  teamId: string,
  filters?: AttendanceFilter
): TeamWorkerRow[] {
  const teamHistory = getTeamHistory(records, workers, teamId, filters);
  const recordsByWorker = groupBy(teamHistory.presencas, (r) => r.workerId);

  const rows: TeamWorkerRow[] = [];

  Object.entries(recordsByWorker).forEach(([wId, wRecords]) => {
    const worker = workers.find((w) => w.id === wId);
    const summary = getAttendanceSummary(wRecords, workers);
    const stats = getAttendanceStats(wRecords, workers);
    const cost = calculateRecordsCost(wRecords, workers);

    rows.push({
      workerId: wId,
      workerName: worker?.name || "Desconhecido",
      workerRole: worker?.role || "—",
      workerPhoto: worker?.photo,
      diasRegistados: wRecords.length,
      presencas: summary.present + summary.late + summary.halfDay,
      ausencias: summary.absent + summary.justifiedAbsence,
      atrasos: summary.late,
      workedMinutes: summary.workedMinutes,
      overtimeMinutes: summary.overtimeMinutes,
      assiduidadeTaxa: stats.assiduidadeTaxa,
      custo: cost.totalCost,
    });
  });

  return rows;
}

export interface ProjectWorkerRow {
  workerId: string;
  workerName: string;
  workerRole: string;
  workerPhoto?: string;
  teamName: string;
  diasRegistados: number;
  presencas: number;
  ausencias: number;
  workedMinutes: number;
  overtimeMinutes: number;
  custo: number;
}

export function aggregateProjectHistoryByWorker(
  records: AttendanceRecord[],
  workers: Worker[],
  teams: { id: string; name: string }[],
  projectId: string,
  filters?: AttendanceFilter
): ProjectWorkerRow[] {
  const projHistory = getProjectHistory(records, workers, projectId, filters);
  const recordsByWorker = groupBy(projHistory.presencas, (r) => r.workerId);

  const rows: ProjectWorkerRow[] = [];

  Object.entries(recordsByWorker).forEach(([wId, wRecords]) => {
    const worker = workers.find((w) => w.id === wId);
    const summary = getAttendanceSummary(wRecords, workers);
    const cost = calculateRecordsCost(wRecords, workers);
    
    // Identificar equipa a partir do primeiro registo
    const teamId = wRecords[0]?.teamId;
    const team = teamId ? teams.find((t) => t.id === teamId) : null;

    rows.push({
      workerId: wId,
      workerName: worker?.name || "Desconhecido",
      workerRole: worker?.role || "—",
      workerPhoto: worker?.photo,
      teamName: team?.name || "Atribuição Individual",
      diasRegistados: wRecords.length,
      presencas: summary.present + summary.late + summary.halfDay,
      ausencias: summary.absent + summary.justifiedAbsence,
      workedMinutes: summary.workedMinutes,
      overtimeMinutes: summary.overtimeMinutes,
      custo: cost.totalCost,
    });
  });

  return rows;
}

export interface ProjectTeamRow {
  teamId: string;
  teamName: string;
  numWorkers: number;
  presencas: number;
  ausencias: number;
  workedMinutes: number;
  overtimeMinutes: number;
  custo: number;
}

export function aggregateProjectHistoryByTeam(
  records: AttendanceRecord[],
  workers: Worker[],
  teams: { id: string; name: string }[],
  projectId: string,
  filters?: AttendanceFilter
): ProjectTeamRow[] {
  const projHistory = getProjectHistory(records, workers, projectId, filters);
  const recordsByTeam = groupBy(projHistory.presencas, (r) => r.teamId || "individual");

  const rows: ProjectTeamRow[] = [];

  Object.entries(recordsByTeam).forEach(([tId, tRecords]) => {
    const team = teams.find((t) => t.id === tId);
    const summary = getAttendanceSummary(tRecords, workers);
    const cost = calculateRecordsCost(tRecords, workers);
    const uniqueWorkers = new Set(tRecords.map((r) => r.workerId)).size;

    rows.push({
      teamId: tId,
      teamName: team?.name || "Atribuição Individual",
      numWorkers: uniqueWorkers,
      presencas: summary.present + summary.late + summary.halfDay,
      ausencias: summary.absent + summary.justifiedAbsence,
      workedMinutes: summary.workedMinutes,
      overtimeMinutes: summary.overtimeMinutes,
      custo: cost.totalCost,
    });
  });

  return rows;
}
