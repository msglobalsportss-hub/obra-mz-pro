import type { Worker, Obra, Team, ProjectAssignment } from "../mock-data";

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type ScheduleStatus = "active" | "inactive" | "cancelled";

export type AttendanceScheduleDayState =
  | "SCHEDULED"
  | "NON_WORKING_DAY"
  | "NOT_ASSIGNED"
  | "CANCELLED"
  | "HOLIDAY";

export interface AttendanceSchedule {
  id: string;
  projectId: string;
  workerId: string;
  teamId?: string;
  assignmentId?: string;
  startDate: string;        // YYYY-MM-DD
  endDate: string;          // YYYY-MM-DD
  workingDays: DayOfWeek[];
  excludedDates?: string[]; // YYYY-MM-DD
  includedDates?: string[]; // YYYY-MM-DD
  status: ScheduleStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledWorkerResult {
  worker: Worker;
  schedule?: AttendanceSchedule;
  assignment?: ProjectAssignment;
  team?: Team;
  dayState: AttendanceScheduleDayState;
  isWorkingDay: boolean;
  isFallbackAssignment?: boolean;
  reason?: string;
}

export interface ScheduleOverlapValidationResult {
  valid: boolean;
  conflicts: AttendanceSchedule[];
}
