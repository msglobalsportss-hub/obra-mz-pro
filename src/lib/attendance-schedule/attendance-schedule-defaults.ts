import type { AttendanceSchedule, DayOfWeek } from "./attendance-schedule-types";

export const defaultWorkingDays: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
];

export function createEmptyAttendanceSchedule(
  projectId = "",
  workerId = ""
): Omit<AttendanceSchedule, "id" | "createdAt" | "updatedAt"> {
  const today = new Date().toISOString().slice(0, 10);
  return {
    projectId,
    workerId,
    startDate: today,
    endDate: today,
    workingDays: [...defaultWorkingDays],
    excludedDates: [],
    includedDates: [],
    status: "active",
  };
}
