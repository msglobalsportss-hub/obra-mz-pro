import type { AttendanceStatisticsResult, AttendanceStatisticsContext } from "./attendance-statistics-types";
import type { AttendanceKPIs, AttendanceSummary, AttendanceStats } from "../attendance-analytics";
import { calculateRecordsCost } from "../attendance-analytics";

/**
 * Adaptador específico para o Dashboard de Presenças (Cards de KPIs e Resumos Operacionais).
 */
export function adaptToDashboardKPIs(
  result: AttendanceStatisticsResult,
  context: AttendanceStatisticsContext
): AttendanceKPIs {
  const summary = result.summary;
  const records = context.filterResult?.records || [];
  const cost = calculateRecordsCost(records, context.workers);

  return {
    present: summary.presentCount,
    absent: summary.absentCount,
    late: summary.lateCount,
    halfDay: summary.halfDayCount,
    workedMinutes: summary.workedMinutes,
    overtimeMinutes: summary.overtimeMinutes,
    operationalCost: cost,
  };
}

/**
 * Mapeia o AttendanceStatisticsResult para o modelo AttendanceSummary do Dashboard.
 */
export function adaptToDashboardSummary(result: AttendanceStatisticsResult): AttendanceSummary {
  const summary = result.summary;

  return {
    totalWorkers: summary.workersCount,
    present: summary.presentCount,
    absent: summary.absentCount,
    late: summary.lateCount,
    halfDay: summary.halfDayCount,
    justifiedAbsence: summary.justifiedAbsentCount,
    workedMinutes: summary.workedMinutes,
    overtimeMinutes: summary.overtimeMinutes,
    workersWithCost: Math.max(0, summary.totalRecords - summary.recordsWithoutCost),
    workersWithoutCost: summary.recordsWithoutCost,
  };
}

/**
 * Mapeia o AttendanceStatisticsResult para o modelo AttendanceStats.
 */
export function adaptToAttendanceStats(result: AttendanceStatisticsResult): AttendanceStats {
  const summary = result.summary;
  const totalPresentDays = summary.presentCount + summary.lateCount + summary.halfDayCount;

  return {
    assiduidadeTaxa: summary.attendanceRate,
    absentismoTaxa: summary.absenceRate,
    avgWorkedMinutes: totalPresentDays > 0 ? Math.round(summary.workedMinutes / totalPresentDays) : 0,
    avgOvertimeMinutes: totalPresentDays > 0 ? Math.round(summary.overtimeMinutes / totalPresentDays) : 0,
    avgPresentWorkersPerDay: summary.presentCount,
  };
}

/**
 * Objeto Adaptador do Dashboard
 */
export const AttendanceDashboardAdapter = {
  toDashboardKPIs: adaptToDashboardKPIs,
  toDashboardSummary: adaptToDashboardSummary,
  toAttendanceStats: adaptToAttendanceStats,
};

/**
 * Alias retrocompatível para o AttendanceDashboardAdapter
 */
export const AttendanceStatisticsAdapter = AttendanceDashboardAdapter;
