import type {
  AttendanceSchedule,
  DayOfWeek,
  AttendanceScheduleDayState,
  ScheduleOverlapValidationResult,
} from "./attendance-schedule-types";

/**
 * Traduz o identificador do dia da semana para Português.
 */
export function translateDayOfWeek(day: DayOfWeek): string {
  const map: Record<DayOfWeek, string> = {
    monday: "Segunda",
    tuesday: "Terça",
    wednesday: "Quarta",
    thursday: "Quinta",
    friday: "Sexta",
    saturday: "Sábado",
    sunday: "Domingo",
  };
  return map[day] || day;
}

/**
 * Converte data civil YYYY-MM-DD para DayOfWeek sem conversões fuso/UTC ambíguas.
 */
export function getDayOfWeekFromCivilDate(dateStr: string): DayOfWeek {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return "monday";
  const parts = dateStr.split("-");
  const year = parseInt(parts[0]!, 10);
  const month = parseInt(parts[1]!, 10) - 1;
  const day = parseInt(parts[2]!, 10);

  const dateObj = new Date(Date.UTC(year, month, day));
  const dayNum = dateObj.getUTCDay(); // 0 = Sunday, 1 = Monday ... 6 = Saturday

  const days: DayOfWeek[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  return days[dayNum] || "monday";
}

/**
 * Função pura interna para resolver o estado de um dia na escala.
 * Regra de Prioridade:
 * 1. includedDates → SCHEDULED (Trabalho Extraordinário)
 * 2. excludedDates → NON_WORKING_DAY (Folga / Sem trabalho)
 * 3. workingDays → SCHEDULED (Dia útil regular)
 * 4. Caso contrário → NON_WORKING_DAY
 */
export function resolveScheduleDayState(
  schedule: AttendanceSchedule,
  date: string
): AttendanceScheduleDayState {
  if (schedule.status !== "active") {
    return "CANCELLED";
  }

  // Validar se a data está dentro do período civil da escala (inclusivo)
  if (date < schedule.startDate || date > schedule.endDate) {
    return "NON_WORKING_DAY";
  }

  // 1. Exceção incluída (Trabalho Extraordinário)
  if (schedule.includedDates && schedule.includedDates.includes(date)) {
    return "SCHEDULED";
  }

  // 2. Exceção excluída (Sem Trabalho / Folga)
  if (schedule.excludedDates && schedule.excludedDates.includes(date)) {
    return "NON_WORKING_DAY";
  }

  // 3. Regra de dias de semana regulares
  const dayOfWeek = getDayOfWeekFromCivilDate(date);
  if (schedule.workingDays && schedule.workingDays.includes(dayOfWeek)) {
    return "SCHEDULED";
  }

  // 4. Caso contrário
  return "NON_WORKING_DAY";
}

/**
 * Validação estruturada de sobreposição de escalas de presença.
 * Condições:
 * - Mesmo workerId e mesmo projectId
 * - Apenas escalas com status === "active"
 * - Ignora scheduleIdToIgnore se for edição
 * - Condição de sobreposição: newStart <= existingEnd && newEnd >= existingStart
 */
export function validateScheduleOverlap(
  newSchedule: Partial<AttendanceSchedule>,
  existingSchedules: AttendanceSchedule[],
  scheduleIdToIgnore?: string
): ScheduleOverlapValidationResult {
  const { workerId, projectId, startDate, endDate } = newSchedule;

  if (!workerId || !projectId || !startDate || !endDate) {
    return { valid: true, conflicts: [] };
  }

  const conflicts = existingSchedules.filter((s) => {
    if (scheduleIdToIgnore && s.id === scheduleIdToIgnore) return false;
    if (s.status !== "active") return false;
    if (s.workerId !== workerId || s.projectId !== projectId) return false;

    // Sobreposição de datas YYYY-MM-DD
    const overlaps = startDate <= s.endDate && endDate >= s.startDate;
    return overlaps;
  });

  return {
    valid: conflicts.length === 0,
    conflicts,
  };
}

/**
 * Validação abrangente de formulário de escala de presença.
 */
export function validateScheduleForm(data: {
  projectId: string;
  startDate: string;
  endDate: string;
  workingDays: DayOfWeek[];
  includedDates?: string[];
  excludedDates?: string[];
  scheduleType: "worker" | "team";
  workerId?: string;
  teamId?: string;
}): string | null {
  if (!data.projectId) return "Selecione a obra.";
  if (!data.startDate) return "Preencha a data inicial.";
  if (!data.endDate) return "Preencha a data final.";
  if (data.endDate < data.startDate) return "A data final não pode ser anterior à data inicial.";

  if (data.scheduleType === "worker" && !data.workerId) {
    return "Selecione o trabalhador.";
  }
  if (data.scheduleType === "team" && !data.teamId) {
    return "Selecione a equipa.";
  }

  const hasWorkingDays = data.workingDays && data.workingDays.length > 0;
  const hasIncluded = data.includedDates && data.includedDates.length > 0;
  if (!hasWorkingDays && !hasIncluded) {
    return "Selecione pelo menos um dia da semana ou uma data extraordinária de trabalho.";
  }

  // Verificar datas incluídas fora do intervalo
  if (data.includedDates) {
    for (const d of data.includedDates) {
      if (d < data.startDate || d > data.endDate) {
        return `A data extraordinária ${d} está fora do período da escala (${data.startDate} a ${data.endDate}).`;
      }
    }
  }

  // Verificar datas excluídas fora do intervalo
  if (data.excludedDates) {
    for (const d of data.excludedDates) {
      if (d < data.startDate || d > data.endDate) {
        return `A data sem trabalho ${d} está fora do período da escala (${data.startDate} a ${data.endDate}).`;
      }
    }
  }

  // Verificar datas duplicadas entre incluídas e excluídas
  if (data.includedDates && data.excludedDates) {
    const includedSet = new Set(data.includedDates);
    for (const d of data.excludedDates) {
      if (includedSet.has(d)) {
        return `A data ${d} não pode estar presente em datas extraordinárias e datas sem trabalho ao mesmo tempo.`;
      }
    }
  }

  return null;
}

/**
 * Utilitário estrutural para cópia de escalas (Projeção Futura).
 */
export function copyAttendanceSchedule(
  sourceSchedule: AttendanceSchedule,
  targetProjectId: string,
  newStartDate: string,
  newEndDate: string
): Omit<AttendanceSchedule, "id" | "createdAt" | "updatedAt"> {
  return {
    projectId: targetProjectId,
    workerId: sourceSchedule.workerId,
    teamId: sourceSchedule.teamId,
    assignmentId: sourceSchedule.assignmentId,
    startDate: newStartDate,
    endDate: newEndDate,
    workingDays: [...sourceSchedule.workingDays],
    excludedDates: sourceSchedule.excludedDates ? [...sourceSchedule.excludedDates] : [],
    includedDates: sourceSchedule.includedDates ? [...sourceSchedule.includedDates] : [],
    status: "active",
    notes: sourceSchedule.notes ? `Cópia: ${sourceSchedule.notes}` : undefined,
  };
}
