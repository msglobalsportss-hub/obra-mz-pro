import type {
  AttendanceStatistics,
  AttendanceStatisticsResult,
  AttendanceStatisticsMetadata,
  AttendanceStatisticsSettings,
} from "./attendance-statistics-types";

export const defaultStatisticsSettings: AttendanceStatisticsSettings = {
  precision: 2,
  roundingMode: "round",
  currency: "MTn",
  attendanceCostSettings: {},
  futureAnalyticsSettings: {},
};

export function createEmptyAttendanceStatistics(): AttendanceStatistics {
  return {
    totalRecords: 0,
    presentCount: 0,
    lateCount: 0,
    absentCount: 0,
    justifiedAbsentCount: 0,
    halfDayCount: 0,
    attendanceRate: 0,
    lateRate: 0,
    absenceRate: 0,
    justifiedRate: 0,
    halfDayRate: 0,
    workedMinutes: 0,
    workedHours: 0,
    overtimeMinutes: 0,
    overtimeHours: 0,
    averageWorkedHours: 0,
    averageOvertimeHours: 0,
    workersCount: 0,
    teamsCount: 0,
    projectsCount: 0,
    totalOperationalCost: 0,
    averageDailyCost: 0,
    averageWorkerCost: 0,
    recordsWithoutCost: 0,
    recordsWithoutHours: 0,
  };
}

export function createEmptyAttendanceMetadata(
  filteredRecordCount = 0
): AttendanceStatisticsMetadata {
  return {
    engineVersion: 1,
    generatedAt: new Date().toISOString(),
    generatedBy: "attendance-statistics-engine",
    filteredRecordCount,
    cacheable: false,
  };
}

export function createDefaultStatisticsResult(
  filteredRecordCount = 0
): AttendanceStatisticsResult {
  return {
    metadata: createEmptyAttendanceMetadata(filteredRecordCount),
    summary: createEmptyAttendanceStatistics(),
    byStatus: undefined,
    byWorker: undefined,
    byTeam: undefined,
    byProject: undefined,
    byDate: undefined,
    benchmark: undefined,
    comparisons: undefined,
    trends: undefined,
  };
}
