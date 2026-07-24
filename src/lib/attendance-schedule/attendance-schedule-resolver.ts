import type { Worker, Team, ProjectAssignment } from "../mock-data";
import type {
  AttendanceSchedule,
  ScheduledWorkerResult,
} from "./attendance-schedule-types";
import { resolveScheduleDayState } from "./attendance-schedule-utils";

/**
 * Resolução individual opcional para um único trabalhador numa obra e data.
 * NOT_ASSIGNED é utilizado apenas neste contexto individual.
 */
export function resolveWorkerScheduleForDate(
  workerId: string,
  projectId: string,
  date: string,
  schedules: AttendanceSchedule[],
  workers: Worker[]
): ScheduledWorkerResult {
  const workerMap = new Map<string, Worker>();
  workers.forEach((w) => workerMap.set(w.id, w));

  const worker = workerMap.get(workerId);
  if (!worker || worker.status !== "active") {
    return {
      worker: worker || ({ id: workerId, name: `Trabalhador ${workerId}`, status: "inactive" } as Worker),
      dayState: "NOT_ASSIGNED",
      isWorkingDay: false,
      reason: "Trabalhador inativo ou inexistente.",
    };
  }

  // Procurar escala ativa no período
  const activeSchedule = schedules.find(
    (s) =>
      s.projectId === projectId &&
      s.workerId === workerId &&
      s.status === "active" &&
      date >= s.startDate &&
      date <= s.endDate
  );

  if (!activeSchedule) {
    return {
      worker,
      dayState: "NOT_ASSIGNED",
      isWorkingDay: false,
      reason: "Sem escala de presença para a data.",
    };
  }

  const dayState = resolveScheduleDayState(activeSchedule, date);
  const isWorkingDay = dayState === "SCHEDULED";

  return {
    worker,
    schedule: activeSchedule,
    dayState,
    isWorkingDay,
  };
}

/**
 * Função central para resolver os trabalhadores previstos para uma obra e data na Chamada Diária.
 * 
 * Regras:
 * - Filtra escalas da obra solicitada, status === "active", e data dentro do intervalo [startDate, endDate].
 * - Associa apenas a trabalhadores ativos no cadastro.
 * - Elimina duplicações de trabalhadores (prioriza a escala atualizada mais recente).
 * - Se NÃO existirem escalas ativas para a obra na data, aplica o FALLBACK TEMPORÁRIO para ProjectAssignment.
 */
export function resolveWorkersScheduledForDate(
  projectId: string,
  date: string,
  schedules: AttendanceSchedule[] = [],
  assignments: ProjectAssignment[] = [],
  workers: Worker[] = [],
  teams: Team[] = []
): ScheduledWorkerResult[] {
  if (!projectId || !date) return [];

  const workerMap = new Map<string, Worker>();
  workers.forEach((w) => workerMap.set(w.id, w));

  const teamMap = new Map<string, Team>();
  teams.forEach((t) => teamMap.set(t.id, t));

  // 1. Procurar escalas ativas da obra que incluam a data
  const matchingSchedules = schedules.filter(
    (s) =>
      s.projectId === projectId &&
      s.status === "active" &&
      date >= s.startDate &&
      date <= s.endDate
  );

  // FALLBACK TEMPORÁRIO: Se não existirem escalas ativas para esta obra/data, resolver via ProjectAssignment
  if (matchingSchedules.length === 0) {
    const activeWorkers = workers.filter((w) => w.status === "active" && w.id !== "invalid-orphan");
    const fallbackResults: ScheduledWorkerResult[] = [];
    const processedWorkerIds = new Set<string>();

    for (const w of activeWorkers) {
      if (processedWorkerIds.has(w.id)) continue;

      // Atribuição individual
      const indAssign = assignments.find(
        (a) =>
          a.projectId === projectId &&
          a.status === "active" &&
          (a.assignmentType === "worker" || !a.assignmentType) &&
          a.workerId === w.id &&
          date >= a.startDate &&
          (!a.endDate || date <= a.endDate)
      );

      if (indAssign) {
        processedWorkerIds.add(w.id);
        fallbackResults.push({
          worker: w,
          assignment: indAssign,
          dayState: "SCHEDULED",
          isWorkingDay: true,
          isFallbackAssignment: true,
        });
        continue;
      }

      // Atribuição por equipa
      const teamAssign = assignments.find((a) => {
        if (a.projectId !== projectId || a.status !== "active") return false;
        if (a.assignmentType !== "team" && !a.teamId) return false;
        if (date < a.startDate || (a.endDate && date > a.endDate)) return false;

        if (a.assignedWorkerIds && a.assignedWorkerIds.includes(w.id)) return true;
        if (a.teamId) {
          const t = teamMap.get(a.teamId);
          if (t && t.workerIds.includes(w.id)) return true;
        }
        return false;
      });

      if (teamAssign) {
        processedWorkerIds.add(w.id);
        const teamObj = teamAssign.teamId ? teamMap.get(teamAssign.teamId) : undefined;
        fallbackResults.push({
          worker: w,
          assignment: teamAssign,
          team: teamObj,
          dayState: "SCHEDULED",
          isWorkingDay: true,
          isFallbackAssignment: true,
        });
      }
    }

    return fallbackResults;
  }

  // 2. Resolver via AttendanceSchedules existentes
  // Deduplicar escalas por workerId (priorizar a mais recente updatedAt)
  const scheduleByWorkerMap = new Map<string, AttendanceSchedule>();
  for (const s of matchingSchedules) {
    const existing = scheduleByWorkerMap.get(s.workerId);
    if (!existing || s.updatedAt > existing.updatedAt) {
      scheduleByWorkerMap.set(s.workerId, s);
    }
  }

  const results: ScheduledWorkerResult[] = [];

  for (const [wId, schedule] of scheduleByWorkerMap.entries()) {
    const workerObj = workerMap.get(wId);
    // Deve associar apenas a trabalhadores ativos
    if (!workerObj || workerObj.status !== "active" || workerObj.id === "invalid-orphan") {
      continue;
    }

    const dayState = resolveScheduleDayState(schedule, date);
    const isWorkingDay = dayState === "SCHEDULED";

    const teamObj = schedule.teamId ? teamMap.get(schedule.teamId) : undefined;

    results.push({
      worker: workerObj,
      schedule,
      team: teamObj,
      dayState,
      isWorkingDay,
      isFallbackAssignment: false,
    });
  }

  return results;
}
