/**
 * ============================================================================
 * ATTENDANCE STATISTICS ENGINE CONTRACT
 * ============================================================================
 * 
 * INPUT:
 *   AttendanceStatisticsContext (filterResult, workers, teams, projects, settings?)
 * 
 * OUTPUT:
 *   AttendanceStatisticsResult (metadata, summary, byWorker, byTeam, byProject)
 * 
 * ENGINE GUARANTEES & CONSTRAINTS:
 *   - Pure Functions Only
 *   - No React / Hooks
 *   - No Local or Shared State Mutation
 *   - No DOM / Browser API Access
 *   - No Async / Promise Operations
 *   - Immutable Data Processing
 * ============================================================================
 */

import type { AttendanceRecord, Worker, Obra, Team } from "../mock-data";
import type {
  AttendanceStatisticsContext,
  AttendanceStatisticsResult,
  AttendanceStatistics,
  EntityStatisticsItem,
} from "./attendance-statistics-types";
import {
  safePercentage,
  safeAverage,
  minutesToHours,
  roundStatistic,
} from "./attendance-statistics-utils";
import {
  createDefaultStatisticsResult,
  createEmptyAttendanceMetadata,
  defaultStatisticsSettings,
} from "./attendance-statistics-defaults";
import { calculateRecordsCost } from "../attendance-analytics";

/**
 * 1. PIPELINE STEP 1 — Contagem pura por estado de presença.
 */
export function generateAttendanceCounts(records: AttendanceRecord[]) {
  let presentCount = 0;
  let lateCount = 0;
  let absentCount = 0;
  let justifiedAbsentCount = 0;
  let halfDayCount = 0;

  for (const r of records) {
    switch (r.status) {
      case "present":
        presentCount++;
        break;
      case "late":
        lateCount++;
        break;
      case "absent":
        absentCount++;
        break;
      case "justified_absence":
        justifiedAbsentCount++;
        break;
      case "half_day":
        halfDayCount++;
        break;
    }
  }

  return {
    presentCount,
    lateCount,
    absentCount,
    justifiedAbsentCount,
    halfDayCount,
    totalPresentDays: presentCount + lateCount + halfDayCount,
  };
}

/**
 * 2. PIPELINE STEP 2 — Cálculo de taxas percentuais.
 */
export function generateAttendanceRates(
  counts: ReturnType<typeof generateAttendanceCounts>,
  totalRecords: number,
  precision = 1
) {
  return {
    attendanceRate: safePercentage(counts.totalPresentDays, totalRecords, precision),
    lateRate: safePercentage(counts.lateCount, totalRecords, precision),
    absenceRate: safePercentage(counts.absentCount, totalRecords, precision),
    justifiedRate: safePercentage(counts.justifiedAbsentCount, totalRecords, precision),
    halfDayRate: safePercentage(counts.halfDayCount, totalRecords, precision),
  };
}

/**
 * 3. PIPELINE STEP 3 — Cálculo de minutos/horas trabalhadas e extra.
 */
export function generateAttendanceHours(
  records: AttendanceRecord[],
  totalPresentDays: number,
  precision = 1
) {
  let workedMinutes = 0;
  let overtimeMinutes = 0;
  let recordsWithoutHours = 0;

  for (const r of records) {
    const worked = r.workedMinutes || 0;
    const overtime = r.overtimeMinutes || 0;

    workedMinutes += worked;
    overtimeMinutes += overtime;

    if (r.status !== "absent" && r.status !== "justified_absence" && worked <= 0) {
      recordsWithoutHours++;
    }
  }

  const workedHours = minutesToHours(workedMinutes, precision);
  const overtimeHours = minutesToHours(overtimeMinutes, precision);

  return {
    workedMinutes,
    workedHours,
    overtimeMinutes,
    overtimeHours,
    recordsWithoutHours,
    averageWorkedHours: safeAverage(workedHours, totalPresentDays, precision),
    averageOvertimeHours: safeAverage(overtimeHours, totalPresentDays, precision),
  };
}

/**
 * 4. PIPELINE STEP 4 — Custos operacionais acumulados e médios.
 */
export function generateAttendanceCosts(
  records: AttendanceRecord[],
  workers: Worker[],
  uniqueWorkersCount: number,
  uniqueDatesCount: number,
  precision = 2
) {
  const costResult = calculateRecordsCost(records, workers);
  const totalOperationalCost = costResult.totalCost;
  const recordsWithoutCost = costResult.recordsWithoutCost;

  return {
    totalOperationalCost: roundStatistic(totalOperationalCost, precision),
    recordsWithoutCost,
    averageDailyCost: safeAverage(totalOperationalCost, uniqueDatesCount, precision),
    averageWorkerCost: safeAverage(totalOperationalCost, uniqueWorkersCount, precision),
  };
}

/**
 * 5. PIPELINE STEP 5 — Entidades únicas (Trabalhadores, Equipas, Obras).
 */
export function generateAttendanceEntities(records: AttendanceRecord[]) {
  const workerSet = new Set<string>();
  const teamSet = new Set<string>();
  const projectSet = new Set<string>();
  const dateSet = new Set<string>();

  for (const r of records) {
    if (r.workerId) workerSet.add(r.workerId);
    if (r.teamId) teamSet.add(r.teamId);
    if (r.projectId) projectSet.add(r.projectId);
    if (r.date) dateSet.add(r.date);
  }

  return {
    workersCount: workerSet.size,
    teamsCount: teamSet.size,
    projectsCount: projectSet.size,
    uniqueDatesCount: dateSet.size,
  };
}

/**
 * 6. PIPELINE STEP 6 — Agregação por Trabalhador.
 */
export function generateWorkerStatisticsMap(
  records: AttendanceRecord[],
  workers: Worker[],
  precision = 2
): Record<string, EntityStatisticsItem> {
  const workerMap = new Map<string, Worker>();
  workers.forEach((w) => workerMap.set(w.id, w));

  const result: Record<string, EntityStatisticsItem> = {};

  // Agrupar registos por workerId
  const recordsByWorker = new Map<string, AttendanceRecord[]>();
  for (const r of records) {
    if (!r.workerId) continue;
    const list = recordsByWorker.get(r.workerId) || [];
    list.push(r);
    recordsByWorker.set(r.workerId, list);
  }

  for (const [wId, wRecords] of recordsByWorker.entries()) {
    const workerObj = workerMap.get(wId);
    const workerName = workerObj?.name || `Trabalhador ${wId}`;
    const totalRecs = wRecords.length;

    const counts = generateAttendanceCounts(wRecords);
    const rates = generateAttendanceRates(counts, totalRecs, precision);
    const hours = generateAttendanceHours(wRecords, counts.totalPresentDays, precision);

    const costRes = calculateRecordsCost(wRecords, workers);

    const dateSet = new Set<string>();
    const attendanceDateSet = new Set<string>();
    for (const r of wRecords) {
      if (r.date) {
        dateSet.add(r.date);
        if (r.status === "present" || r.status === "late" || r.status === "half_day") {
          attendanceDateSet.add(r.date);
        }
      }
    }

    result[wId] = {
      id: wId,
      name: workerName,
      totalRecords: totalRecs,
      presentCount: counts.presentCount,
      lateCount: counts.lateCount,
      absentCount: counts.absentCount,
      justifiedAbsentCount: counts.justifiedAbsentCount,
      halfDayCount: counts.halfDayCount,
      attendanceRate: rates.attendanceRate,
      absenceRate: rates.absenceRate,
      lateRate: rates.lateRate,
      workedMinutes: hours.workedMinutes,
      workedHours: hours.workedHours,
      overtimeMinutes: hours.overtimeMinutes,
      overtimeHours: hours.overtimeHours,
      workedDays: dateSet.size,
      attendanceDays: attendanceDateSet.size,
      cost: roundStatistic(costRes.totalCost, precision),
    };
  }

  return result;
}

/**
 * 7. PIPELINE STEP 7 — Agregação por Equipa.
 */
export function generateTeamStatisticsMap(
  records: AttendanceRecord[],
  teams: Team[],
  workers: Worker[],
  precision = 2
): Record<string, EntityStatisticsItem> {
  const teamMap = new Map<string, Team>();
  teams.forEach((t) => teamMap.set(t.id, t));

  const result: Record<string, EntityStatisticsItem> = {};

  const recordsByTeam = new Map<string, AttendanceRecord[]>();
  for (const r of records) {
    if (!r.teamId) continue;
    const list = recordsByTeam.get(r.teamId) || [];
    list.push(r);
    recordsByTeam.set(r.teamId, list);
  }

  for (const [tId, tRecords] of recordsByTeam.entries()) {
    const teamObj = teamMap.get(tId);
    const teamName = teamObj?.name || `Equipa ${tId}`;
    const totalRecs = tRecords.length;

    const counts = generateAttendanceCounts(tRecords);
    const rates = generateAttendanceRates(counts, totalRecs, precision);
    const hours = generateAttendanceHours(tRecords, counts.totalPresentDays, precision);
    const costRes = calculateRecordsCost(tRecords, workers);

    const dateSet = new Set<string>();
    const attendanceDateSet = new Set<string>();
    for (const r of tRecords) {
      if (r.date) {
        dateSet.add(r.date);
        if (r.status === "present" || r.status === "late" || r.status === "half_day") {
          attendanceDateSet.add(r.date);
        }
      }
    }

    result[tId] = {
      id: tId,
      name: teamName,
      totalRecords: totalRecs,
      presentCount: counts.presentCount,
      lateCount: counts.lateCount,
      absentCount: counts.absentCount,
      justifiedAbsentCount: counts.justifiedAbsentCount,
      halfDayCount: counts.halfDayCount,
      attendanceRate: rates.attendanceRate,
      absenceRate: rates.absenceRate,
      lateRate: rates.lateRate,
      workedMinutes: hours.workedMinutes,
      workedHours: hours.workedHours,
      overtimeMinutes: hours.overtimeMinutes,
      overtimeHours: hours.overtimeHours,
      workedDays: dateSet.size,
      attendanceDays: attendanceDateSet.size,
      cost: roundStatistic(costRes.totalCost, precision),
    };
  }

  return result;
}

/**
 * 8. PIPELINE STEP 8 — Agregação por Obra.
 */
export function generateProjectStatisticsMap(
  records: AttendanceRecord[],
  projects: Obra[],
  workers: Worker[],
  precision = 2
): Record<string, EntityStatisticsItem> {
  const projectMap = new Map<string, Obra>();
  projects.forEach((p) => projectMap.set(p.id, p));

  const result: Record<string, EntityStatisticsItem> = {};

  const recordsByProject = new Map<string, AttendanceRecord[]>();
  for (const r of records) {
    if (!r.projectId) continue;
    const list = recordsByProject.get(r.projectId) || [];
    list.push(r);
    recordsByProject.set(r.projectId, list);
  }

  for (const [pId, pRecords] of recordsByProject.entries()) {
    const projectObj = projectMap.get(pId);
    const projectName = projectObj?.nome || `Obra ${pId}`;
    const totalRecs = pRecords.length;

    const counts = generateAttendanceCounts(pRecords);
    const rates = generateAttendanceRates(counts, totalRecs, precision);
    const hours = generateAttendanceHours(pRecords, counts.totalPresentDays, precision);
    const costRes = calculateRecordsCost(pRecords, workers);

    const dateSet = new Set<string>();
    const attendanceDateSet = new Set<string>();
    for (const r of pRecords) {
      if (r.date) {
        dateSet.add(r.date);
        if (r.status === "present" || r.status === "late" || r.status === "half_day") {
          attendanceDateSet.add(r.date);
        }
      }
    }

    result[pId] = {
      id: pId,
      name: projectName,
      totalRecords: totalRecs,
      presentCount: counts.presentCount,
      lateCount: counts.lateCount,
      absentCount: counts.absentCount,
      justifiedAbsentCount: counts.justifiedAbsentCount,
      halfDayCount: counts.halfDayCount,
      attendanceRate: rates.attendanceRate,
      absenceRate: rates.absenceRate,
      lateRate: rates.lateRate,
      workedMinutes: hours.workedMinutes,
      workedHours: hours.workedHours,
      overtimeMinutes: hours.overtimeMinutes,
      overtimeHours: hours.overtimeHours,
      workedDays: dateSet.size,
      attendanceDays: attendanceDateSet.size,
      cost: roundStatistic(costRes.totalCost, precision),
    };
  }

  return result;
}

/**
 * 9. PIPELINE STEP 9 — Sanitização e Normalização de Inconsistências.
 */
export function sanitizeAttendanceStatistics(stats: AttendanceStatistics): AttendanceStatistics {
  const sanitizeNum = (val: number, isRate = false): number => {
    if (isNaN(val) || !isFinite(val)) return 0;
    const safeVal = Math.max(0, val);
    if (isRate) {
      return Math.min(100, safeVal);
    }
    return safeVal;
  };

  return {
    totalRecords: sanitizeNum(stats.totalRecords),
    presentCount: sanitizeNum(stats.presentCount),
    lateCount: sanitizeNum(stats.lateCount),
    absentCount: sanitizeNum(stats.absentCount),
    justifiedAbsentCount: sanitizeNum(stats.justifiedAbsentCount),
    halfDayCount: sanitizeNum(stats.halfDayCount),

    attendanceRate: sanitizeNum(stats.attendanceRate, true),
    lateRate: sanitizeNum(stats.lateRate, true),
    absenceRate: sanitizeNum(stats.absenceRate, true),
    justifiedRate: sanitizeNum(stats.justifiedRate, true),
    halfDayRate: sanitizeNum(stats.halfDayRate, true),

    workedMinutes: sanitizeNum(stats.workedMinutes),
    workedHours: sanitizeNum(stats.workedHours),
    overtimeMinutes: sanitizeNum(stats.overtimeMinutes),
    overtimeHours: sanitizeNum(stats.overtimeHours),

    averageWorkedHours: sanitizeNum(stats.averageWorkedHours),
    averageOvertimeHours: sanitizeNum(stats.averageOvertimeHours),

    workersCount: sanitizeNum(stats.workersCount),
    teamsCount: sanitizeNum(stats.teamsCount),
    projectsCount: sanitizeNum(stats.projectsCount),

    totalOperationalCost: sanitizeNum(stats.totalOperationalCost),
    averageDailyCost: sanitizeNum(stats.averageDailyCost),
    averageWorkerCost: sanitizeNum(stats.averageWorkerCost),

    recordsWithoutCost: sanitizeNum(stats.recordsWithoutCost),
    recordsWithoutHours: sanitizeNum(stats.recordsWithoutHours),
  };
}

/**
 * 10. ORQUESTRADOR PRINCIPAL DO MOTOR DE ESTATÍSTICAS
 */
export function generateAttendanceStatistics(
  context: AttendanceStatisticsContext
): AttendanceStatisticsResult {
  const records = context.filterResult?.records || [];
  const totalRecords = records.length;

  if (totalRecords === 0) {
    return createDefaultStatisticsResult(0);
  }

  const effectiveSettings = context.settings ?? defaultStatisticsSettings;
  const precision = effectiveSettings.precision ?? 2;

  // Etapa 1: Contagens por Estado
  const counts = generateAttendanceCounts(records);

  // Etapa 2: Taxas Percentuais
  const rates = generateAttendanceRates(counts, totalRecords, precision);

  // Etapa 3: Minutos e Horas
  const hours = generateAttendanceHours(records, counts.totalPresentDays, precision);

  // Etapa 4: Entidades Únicas
  const entities = generateAttendanceEntities(records);

  // Etapa 5: Custos Operacionais
  const costs = generateAttendanceCosts(
    records,
    context.workers,
    entities.workersCount,
    entities.uniqueDatesCount,
    precision
  );

  // Etapas 6-8: Agregações por Entidade (byWorker, byTeam, byProject)
  const byWorker = generateWorkerStatisticsMap(records, context.workers, precision);
  const byTeam = generateTeamStatisticsMap(records, context.teams, context.workers, precision);
  const byProject = generateProjectStatisticsMap(records, context.projects, context.workers, precision);

  // Construção do objeto de estatísticas brutas
  const rawSummary: AttendanceStatistics = {
    totalRecords,
    presentCount: counts.presentCount,
    lateCount: counts.lateCount,
    absentCount: counts.absentCount,
    justifiedAbsentCount: counts.justifiedAbsentCount,
    halfDayCount: counts.halfDayCount,
    attendanceRate: rates.attendanceRate,
    lateRate: rates.lateRate,
    absenceRate: rates.absenceRate,
    justifiedRate: rates.justifiedRate,
    halfDayRate: rates.halfDayRate,
    workedMinutes: hours.workedMinutes,
    workedHours: hours.workedHours,
    overtimeMinutes: hours.overtimeMinutes,
    overtimeHours: hours.overtimeHours,
    averageWorkedHours: hours.averageWorkedHours,
    averageOvertimeHours: hours.averageOvertimeHours,
    workersCount: entities.workersCount,
    teamsCount: entities.teamsCount,
    projectsCount: entities.projectsCount,
    totalOperationalCost: costs.totalOperationalCost,
    averageDailyCost: costs.averageDailyCost,
    averageWorkerCost: costs.averageWorkerCost,
    recordsWithoutCost: costs.recordsWithoutCost,
    recordsWithoutHours: hours.recordsWithoutHours,
  };

  // Etapa 9: Sanitização e Normalização
  const sanitizedSummary = sanitizeAttendanceStatistics(rawSummary);

  // Etapa 10: Metadados
  const metadata = createEmptyAttendanceMetadata(totalRecords);

  return {
    metadata,
    summary: sanitizedSummary,
    byStatus: undefined,
    byWorker,
    byTeam,
    byProject,
    byDate: undefined,
    benchmark: undefined,
    comparisons: undefined,
    trends: undefined,
  };
}
