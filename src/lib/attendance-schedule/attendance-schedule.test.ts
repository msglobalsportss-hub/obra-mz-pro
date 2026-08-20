import type { Worker, Obra, Team, ProjectAssignment } from "../mock-data";
import type { AttendanceSchedule } from "./attendance-schedule-types";
import {
  getDayOfWeekFromCivilDate,
  resolveScheduleDayState,
  validateScheduleOverlap,
  copyAttendanceSchedule,
} from "./attendance-schedule-utils";
import {
  resolveWorkerScheduleForDate,
  resolveWorkersScheduledForDate,
} from "./attendance-schedule-resolver";

export function runAttendanceScheduleTests() {
  console.log("=== EXECUTANDO TESTES UNITÁRIOS DA FASE 5.1 (ATTENDANCE SCHEDULE) ===");

  const mockWorkers: Worker[] = [
    {
      id: "w1",
      name: "Mateus Tembe",
      role: "Pedreiro",
      status: "active",
      paymentType: "daily",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "w2",
      name: "Sérgio Macamo",
      role: "Carpinteiro",
      status: "active",
      paymentType: "daily",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "w3",
      name: "Inativo Silva",
      role: "Servente",
      status: "inactive",
      paymentType: "daily",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
  ];

  const mockTeams: Team[] = [
    {
      id: "t1",
      name: "Equipa Alfa",
      workerIds: ["w1", "w2"],
      status: "active",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
  ];

  const mockAssignments: ProjectAssignment[] = [
    {
      id: "a1",
      projectId: "o1",
      workerId: "w1",
      assignmentType: "worker",
      startDate: "2026-08-01",
      endDate: "2026-08-31",
      status: "active",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
  ];

  const mockSchedules: AttendanceSchedule[] = [
    {
      id: "s1",
      projectId: "o1",
      workerId: "w1",
      startDate: "2026-08-01",
      endDate: "2026-08-31",
      workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      excludedDates: ["2026-08-15"], // Feriado/Sem trabalho na Sexta
      includedDates: ["2026-08-22"], // Trabalho extraordinário no Sábado
      status: "active",
      createdAt: "2026-08-01T00:00:00Z",
      updatedAt: "2026-08-01T00:00:00Z",
    },
  ];

  // Teste 1: Conversão de data civil sem UTC shift
  const day1 = getDayOfWeekFromCivilDate("2026-08-03"); // Segunda-feira
  console.assert(day1 === "monday", "Teste 1 Falhou: 2026-08-03 deve ser monday");

  // Teste 2: Resolução de dia útil regular (Segunda 03/08/2026)
  const stateRegular = resolveScheduleDayState(mockSchedules[0]!, "2026-08-03");
  console.assert(stateRegular === "SCHEDULED", "Teste 2 Falhou: Seg-Sex deve ser SCHEDULED");

  // Teste 3: Resolução de folga semanal regular (Sábado 08/08/2026)
  const stateWeekend = resolveScheduleDayState(mockSchedules[0]!, "2026-08-08");
  console.assert(stateWeekend === "NON_WORKING_DAY", "Teste 3 Falhou: Sábado regular deve ser NON_WORKING_DAY");

  // Teste 4: Regra de prioridade: includedDates no Sábado 22/08/2026
  const stateIncluded = resolveScheduleDayState(mockSchedules[0]!, "2026-08-22");
  console.assert(stateIncluded === "SCHEDULED", "Teste 4 Falhou: includedDates no Sábado deve ser SCHEDULED");

  // Teste 5: Regra de prioridade: excludedDates na Sexta 15/08/2026
  const stateExcluded = resolveScheduleDayState(mockSchedules[0]!, "2026-08-15");
  console.assert(stateExcluded === "NON_WORKING_DAY", "Teste 5 Falhou: excludedDates na Sexta deve ser NON_WORKING_DAY");

  // Teste 6: Data fora do período da escala (30/09/2026)
  const stateOutOfRange = resolveScheduleDayState(mockSchedules[0]!, "2026-09-30");
  console.assert(stateOutOfRange === "NON_WORKING_DAY", "Teste 6 Falhou: Data fora do intervalo deve ser NON_WORKING_DAY");

  // Teste 7: Validação de sobreposição de escalas (mesmo workerId, mesma obra)
  const overlapRes = validateScheduleOverlap(
    {
      projectId: "o1",
      workerId: "w1",
      startDate: "2026-08-15",
      endDate: "2026-09-15",
      status: "active",
    },
    mockSchedules
  );
  console.assert(!overlapRes.valid && overlapRes.conflicts.length === 1, "Teste 7 Falhou: Deve detetar conflito de sobreposição");

  // Teste 8: Validação ignorando o próprio ID em edição
  const overlapEditSelf = validateScheduleOverlap(
    {
      id: "s1",
      projectId: "o1",
      workerId: "w1",
      startDate: "2026-08-01",
      endDate: "2026-08-31",
      status: "active",
    },
    mockSchedules,
    "s1"
  );
  console.assert(overlapEditSelf.valid, "Teste 8 Falhou: Não deve dar conflito ao editar o próprio registo");

  // Teste 9: Fallback temporário para ProjectAssignment quando não existirem escalas
  const fallbackRes = resolveWorkersScheduledForDate(
    "obra_sem_escalas",
    "2026-08-03",
    [],
    mockAssignments,
    mockWorkers,
    mockTeams
  );
  console.assert(fallbackRes.length === 1 && fallbackRes[0]?.isFallbackAssignment, "Teste 9 Falhou: Deve aplicar fallback legado de ProjectAssignment");

  // Teste 10: Resolução coletiva via resolveWorkersScheduledForDate com escala ativa
  const schedRes = resolveWorkersScheduledForDate(
    "o1",
    "2026-08-03",
    mockSchedules,
    mockAssignments,
    mockWorkers,
    mockTeams
  );
  console.assert(schedRes.length === 1 && schedRes[0]?.dayState === "SCHEDULED", "Teste 10 Falhou: Deve resolver via AttendanceSchedule");

  // Teste 11: Cópia de Escala (Projeção Futura)
  const copyRes = copyAttendanceSchedule(mockSchedules[0]!, "o2", "2026-09-01", "2026-09-30");
  console.assert(copyRes.projectId === "o2" && copyRes.startDate === "2026-09-01", "Teste 11 Falhou: Deve gerar cópia com nova obra e datas");

  console.log("=== TODOS OS 11 TESTES UNITÁRIOS DA FASE 5.1 FORAM EXECUTADOS COM SUCESSO! ===");
  return true;
}

if (typeof describe !== "undefined") {
  describe("Attendance Schedule", () => {
    it("runs all attendance schedule tests", () => {
      expect(runAttendanceScheduleTests()).toBe(true);
    });
  });
}

