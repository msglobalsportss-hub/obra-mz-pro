import type { AttendanceFilterState } from "./attendance-filter-types";
import { isValidDateString } from "../attendance-period-utils";

export function createDefaultAttendanceFilterState(
  initialDateFrom?: string,
  initialDateTo?: string
): AttendanceFilterState {
  const todayISO = new Date().toISOString().slice(0, 10);
  const safeFrom = isValidDateString(initialDateFrom) ? initialDateFrom! : todayISO;
  const safeTo = isValidDateString(initialDateTo) ? initialDateTo! : safeFrom;

  return {
    version: 1,
    periodMode: "day",
    dateFrom: safeFrom,
    dateTo: safeTo,
    selectedProjectIds: [],
    selectedWorkerIds: [],
    selectedTeamIds: [],
    selectedPhaseIds: [],
    selectedStatuses: [],
    selectedSources: [],
    searchQuery: "",
    onlyWithHours: false,
    onlyWithoutHours: false,
    onlyWithOvertime: false,
    onlyWithoutOvertime: false,
    onlyWithCost: false,
    onlyWithoutCost: false,
    minimumCost: null,
    maximumCost: null,
    onlyActiveWorkers: false,
    onlyInactiveWorkers: false,
    onlyActiveTeams: false,
    onlyInactiveTeams: false,
    sortField: "date",
    sortDirection: "desc",
    page: 1,
    pageSize: 50,
  };
}

export function resetAttendanceFilters(
  currentState?: AttendanceFilterState
): AttendanceFilterState {
  const todayISO = new Date().toISOString().slice(0, 10);
  return {
    version: 1,
    periodMode: "day",
    dateFrom: todayISO,
    dateTo: todayISO,
    selectedProjectIds: [],
    selectedWorkerIds: [],
    selectedTeamIds: [],
    selectedPhaseIds: [],
    selectedStatuses: [],
    selectedSources: [],
    searchQuery: "",
    onlyWithHours: false,
    onlyWithoutHours: false,
    onlyWithOvertime: false,
    onlyWithoutOvertime: false,
    onlyWithCost: false,
    onlyWithoutCost: false,
    minimumCost: null,
    maximumCost: null,
    onlyActiveWorkers: false,
    onlyInactiveWorkers: false,
    onlyActiveTeams: false,
    onlyInactiveTeams: false,
    sortField: "date",
    sortDirection: "desc",
    page: 1,
    pageSize: currentState?.pageSize || 50,
  };
}
