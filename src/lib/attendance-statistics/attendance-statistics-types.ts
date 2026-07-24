import type { AttendanceFilterResult } from "../attendance-filters/attendance-filter-types";
import type { Worker, Obra, Team } from "../mock-data";

export interface AttendanceStatisticsSettings {
  precision?: number;
  roundingMode?: "round" | "floor" | "ceil";
  currency?: string;
  attendanceCostSettings?: Record<string, any>;
  futureAnalyticsSettings?: Record<string, any>;
}

export interface AttendanceStatisticsContext {
  filterResult: AttendanceFilterResult;
  workers: Worker[];
  teams: Team[];
  projects: Obra[];
  settings?: AttendanceStatisticsSettings;
}

export interface AttendanceStatistics {
  totalRecords: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  justifiedAbsentCount: number;
  halfDayCount: number;
  attendanceRate: number;
  lateRate: number;
  absenceRate: number;
  justifiedRate: number;
  halfDayRate: number;
  workedMinutes: number;
  workedHours: number;
  overtimeMinutes: number;
  overtimeHours: number;
  averageWorkedHours: number;
  averageOvertimeHours: number;
  workersCount: number;
  teamsCount: number;
  projectsCount: number;
  totalOperationalCost: number;
  averageDailyCost: number;
  averageWorkerCost: number;
  recordsWithoutCost: number;
  recordsWithoutHours: number;
}

export interface EntityStatisticsItem {
  id: string;
  name: string;
  totalRecords: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  justifiedAbsentCount: number;
  halfDayCount: number;
  attendanceRate: number;
  absenceRate: number;
  lateRate: number;
  workedMinutes: number;
  workedHours: number;
  overtimeMinutes: number;
  overtimeHours: number;
  workedDays: number;
  attendanceDays: number;
  cost: number;
}

export interface AttendanceStatisticsMetadata {
  engineVersion: 1;
  generatedAt: string;
  generatedBy: "attendance-statistics-engine";
  filteredRecordCount: number;
  cacheable: false;
}

export interface AttendanceStatisticsResult {
  metadata: AttendanceStatisticsMetadata;
  summary: AttendanceStatistics;
  byStatus?: undefined;
  byWorker?: Record<string, EntityStatisticsItem>;
  byTeam?: Record<string, EntityStatisticsItem>;
  byProject?: Record<string, EntityStatisticsItem>;
  byDate?: undefined;
  benchmark?: undefined;
  comparisons?: undefined;
  trends?: undefined;
}
