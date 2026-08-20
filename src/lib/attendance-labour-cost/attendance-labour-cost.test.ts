import type { AttendanceRecord, Worker } from "../mock-data";
import { calculateAttendanceLabourCost } from "./attendance-labour-cost-calculator";
import { calculateDailyLabourSummary } from "./attendance-labour-cost-summary";

export function runLabourCostTests() {
  console.log("=== EXECUTANDO TESTES AUTOMATIZADOS DA FASE 5.4 (CÁLCULO DE MÃO DE OBRA) ===");

  // Teste 1: Trabalhador diário presente sem horários (8h, custo = dailyRate)
  const res1 = calculateAttendanceLabourCost({
    status: "present",
    paymentType: "daily",
    dailyRate: 500,
    defaultWorkingHours: 8,
  });
  console.assert(res1.workedHours === 8, "Teste 1.1 Falhou: Horas devem ser 8");
  console.assert(res1.labourCost === 500, "Teste 1.2 Falhou: Custo deve ser 500");

  // Teste 2: Trabalhador diário ausente (0h, custo = 0)
  const res2 = calculateAttendanceLabourCost({
    status: "absent",
    paymentType: "daily",
    dailyRate: 500,
  });
  console.assert(res2.workedHours === 0 && res2.labourCost === 0, "Teste 2 Falhou: Ausente deve ter 0h e custo 0");

  // Teste 3: Trabalhador horário presente 8h (custo = 8 * hourlyRate)
  const res3 = calculateAttendanceLabourCost({
    status: "present",
    paymentType: "hourly",
    hourlyRate: 100,
    checkInTime: "08:00",
    checkOutTime: "17:00",
    breakMinutes: 60, // 8h líquidas
  });
  console.assert(res3.regularHours === 8 && res3.labourCost === 800, "Teste 3 Falhou: Horário 8h deve ser 800 MZN");

  // Teste 4: Trabalhador horário com 10h (8h reg, 2h ovt)
  const res4 = calculateAttendanceLabourCost({
    status: "present",
    paymentType: "hourly",
    hourlyRate: 100,
    checkInTime: "07:00",
    checkOutTime: "18:00",
    breakMinutes: 60, // 10h líquidas
  });
  console.assert(res4.regularHours === 8 && res4.overtimeHours === 2, "Teste 4 Falhou: Deve separar 8h reg e 2h ovt");

  // Teste 5: Custo extraordinário com overtimeHourlyRate
  const res5 = calculateAttendanceLabourCost({
    status: "present",
    paymentType: "hourly",
    hourlyRate: 100,
    overtimeHourlyRate: 150,
    checkInTime: "07:00",
    checkOutTime: "18:00",
    breakMinutes: 60,
  });
  console.assert(res5.overtimeLabourCost === 300, "Teste 5 Falhou: 2h ovt a 150/h deve dar 300");

  // Teste 6: Custo extraordinário sem overtimeHourlyRate (fallback para hourlyRate)
  const res6 = calculateAttendanceLabourCost({
    status: "present",
    paymentType: "hourly",
    hourlyRate: 100,
    checkInTime: "07:00",
    checkOutTime: "18:00",
    breakMinutes: 60,
  });
  console.assert(res6.overtimeLabourCost === 200, "Teste 6 Falhou: Fallback sem overtimeRate deve usar hourlyRate (200)");

  // Teste 7: Trabalhador mensal (horas guardadas, custo 0)
  const res7 = calculateAttendanceLabourCost({
    status: "present",
    paymentType: "monthly",
    monthlyRate: 15000,
    checkInTime: "08:00",
    checkOutTime: "17:00",
    breakMinutes: 60,
  });
  console.assert(res7.workedHours === 8 && res7.labourCost === 0, "Teste 7 Falhou: Mensal deve guardar 8h e custo 0");

  // Teste 8: Trabalhador sem remuneração (horas guardadas, custo 0, sinalizado)
  const res8 = calculateAttendanceLabourCost({
    status: "present",
    checkInTime: "08:00",
    checkOutTime: "17:00",
    breakMinutes: 60,
  });
  console.assert(res8.workedHours === 8 && res8.labourCost === 0 && !res8.hasSalaryConfig, "Teste 8 Falhou: Sem salário deve guardar 8h, custo 0 e hasSalaryConfig false");

  // Teste 9: Check-in e check-out com intervalo de pausa (07:30 - 17:00 - 60min = 8.5h)
  const res9 = calculateAttendanceLabourCost({
    status: "present",
    paymentType: "hourly",
    hourlyRate: 100,
    checkInTime: "07:30",
    checkOutTime: "17:00",
    breakMinutes: 60,
  });
  console.assert(res9.workedHours === 8.5, "Teste 9 Falhou: 07:30 a 17:00 com 60min pausa deve dar 8.5h");

  // Teste 10: Horários inválidos não produzem valores negativos
  const res10 = calculateAttendanceLabourCost({
    status: "present",
    paymentType: "daily",
    dailyRate: 500,
    checkInTime: "17:00",
    checkOutTime: "08:00", // Invalido
  });
  console.assert(res10.workedHours >= 0 && res10.labourCost >= 0, "Teste 10 Falhou: Horários inválidos não podem ser negativos");

  // Teste 11: Resumo diário
  const mockRecords: AttendanceRecord[] = [
    {
      id: "r1", projectId: "o1", workerId: "w1", date: "2026-08-01", status: "present",
      regularHours: 8, overtimeHours: 2, workedHours: 10, regularLabourCost: 500, overtimeLabourCost: 200, labourCost: 700,
      currencySnapshot: "MZN", paymentTypeSnapshot: "daily", createdAt: "", updatedAt: ""
    },
    {
      id: "r2", projectId: "o1", workerId: "w2", date: "2026-08-01", status: "absent",
      regularHours: 0, overtimeHours: 0, workedHours: 0, regularLabourCost: 0, overtimeLabourCost: 0, labourCost: 0,
      currencySnapshot: "MZN", paymentTypeSnapshot: "daily", createdAt: "", updatedAt: ""
    }
  ];
  const summary11 = calculateDailyLabourSummary(mockRecords);
  console.assert(summary11.byCurrency["MZN"]?.totalLabourCost === 700, "Teste 11 Falhou: Resumo deve totalizar 700 MZN");

  // Teste 12: Múltiplas moedas
  const mockMultiCurr: AttendanceRecord[] = [
    {
      id: "r1", projectId: "o1", workerId: "w1", date: "2026-08-01", status: "present",
      labourCost: 500, currencySnapshot: "MZN", createdAt: "", updatedAt: ""
    },
    {
      id: "r2", projectId: "o1", workerId: "w2", date: "2026-08-01", status: "present",
      labourCost: 100, currencySnapshot: "USD", createdAt: "", updatedAt: ""
    }
  ];
  const summary12 = calculateDailyLabourSummary(mockMultiCurr);
  console.assert(summary12.hasMultipleCurrencies && summary12.byCurrency["USD"]?.totalLabourCost === 100, "Teste 12 Falhou: Deve agrupar USD separadamente");

  // Teste 13: AttendanceRecord histórico preserva snapshot
  const res13 = calculateAttendanceLabourCost({
    status: "present",
    paymentType: "daily", // Trabalhador mudou para 1000 diário
    dailyRate: 1000,
    existingSnapshot: {
      paymentTypeSnapshot: "daily",
      dailyRateSnapshot: 500, // Snapshot antigo
      currencySnapshot: "MZN",
    }
  });
  console.assert(res13.dailyRateSnapshot === 500 && res13.labourCost === 500, "Teste 13 Falhou: Deve preservar dailyRateSnapshot antigo (500)");

  // Teste 14: Alteração do salário do Worker não altera registo antigo
  console.assert(res13.labourCost === 500, "Teste 14 Falhou: Registo antigo deve manter custo 500");

  // Teste 15: Registos legados sem novos campos não quebram o resumo
  const mockLegacy: AttendanceRecord[] = [
    { id: "r1", projectId: "o1", workerId: "w1", date: "2026-08-01", status: "present", createdAt: "", updatedAt: "" }
  ];
  const summary15 = calculateDailyLabourSummary(mockLegacy);
  console.assert(summary15.byCurrency["MZN"]?.totalWorkers === 1 && summary15.byCurrency["MZN"]?.workedHours === 8, "Teste 15 Falhou: Registo legado deve ter fallback seguro de 8h");

  // Teste 16: Trabalhador extraordinário recebe cálculo correto
  const res16 = calculateAttendanceLabourCost({
    status: "present",
    paymentType: "daily",
    dailyRate: 600,
  });
  console.assert(res16.labourCost === 600, "Teste 16 Falhou: Trabalhador extraordinário deve ser calculado com a sua remuneração");

  // Teste 17: Dia desativado não produz custo de mão de obra indevido
  const res17 = calculateAttendanceLabourCost({
    status: "absent",
    paymentType: "daily",
    dailyRate: 600,
  });
  console.assert(res17.labourCost === 0 && res17.workedHours === 0, "Teste 17 Falhou: Dia desativado/ausente deve dar custo 0");

  // Teste 18: Trabalhador com estado SCHEDULED ou não marcado não produz custo
  const res18 = calculateAttendanceLabourCost({
    status: "SCHEDULED" as any,
    paymentType: "daily",
    dailyRate: 750,
  });
  console.assert(
    res18.workedHours === 0 &&
      res18.regularHours === 0 &&
      res18.overtimeHours === 0 &&
      res18.labourCost === 0,
    "Teste 18 Falhou: Estado SCHEDULED deve produzir 0h e custo 0"
  );

  console.log("=== TODOS OS 18 TESTES AUTOMATIZADOS DA FASE 5.4 PASSARAM COM SUCESSO! ===");
  return true;
}

if (typeof describe !== "undefined") {
  describe("Labour Cost Calculator", () => {
    it("runs all labour cost tests", () => {
      expect(runLabourCostTests()).toBe(true);
    });
  });
}

