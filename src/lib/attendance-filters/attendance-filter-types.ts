import type { AttendanceRecord, AttendanceStatus, Worker, Obra, Team } from "../mock-data";
import type { AttendancePeriodMode } from "../attendance-period-utils";

export type AttendanceRecordSource = "manual" | "roll_call" | "imported" | "system";

export type AttendanceEmptyReason = "none" | "no_records" | "period" | "filters" | "search";

export type SortField =
  | "date"
  | "workerName"
  | "projectName"
  | "teamName"
  | "status"
  | "workedMinutes"
  | "cost";

export type SortDirection = "asc" | "desc";

export interface AttendanceFilterState {
  version: 1;
  periodMode: AttendancePeriodMode;
  dateFrom: string;
  dateTo: string;
  selectedProjectIds: string[];
  selectedWorkerIds: string[];
  selectedTeamIds: string[];
  selectedPhaseIds: string[];
  selectedStatuses: AttendanceStatus[];
  selectedSources: AttendanceRecordSource[];
  searchQuery: string;
  onlyWithHours: boolean;
  onlyWithoutHours: boolean;
  onlyWithOvertime: boolean;
  onlyWithoutOvertime: boolean;
  onlyWithCost: boolean;
  onlyWithoutCost: boolean;
  minimumCost: number | null;
  maximumCost: number | null;
  onlyActiveWorkers: boolean;
  onlyInactiveWorkers: boolean;
  onlyActiveTeams: boolean;
  onlyInactiveTeams: boolean;
  sortField: SortField;
  sortDirection: SortDirection;
  page: number;
  pageSize: number;
}

export interface AttendancePipelineContext {
  records: AttendanceRecord[];
  workers: Worker[];
  obras: Obra[];
  teams: Team[];
}

export interface AttendanceFilterResult {
  records: AttendanceRecord[];
  totalRecords: number;
  totalFiltered: number;
  hasFilters: boolean;
  activeFilterCount: number;
  emptyReason: AttendanceEmptyReason;
  metadata?: Record<string, any>;
}

export type FilterChipCategory =
  | "period"
  | "projects"
  | "workers"
  | "teams"
  | "phases"
  | "statuses"
  | "sources"
  | "hours"
  | "overtime"
  | "cost"
  | "workerStatus"
  | "teamStatus"
  | "search";

export interface FilterGroupChipItem {
  id: string;
  category: FilterChipCategory;
  label: string;
  count?: number;
}
