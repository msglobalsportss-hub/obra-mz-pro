import type {
  LabourCostCalculationInput,
  LabourCostCalculationResult,
} from "./attendance-labour-cost-types";
import { calculateWorkedMinutes } from "../time-utils";

import type { AttendanceStatus } from "../mock-data";

export const WORKED_STATUSES: readonly AttendanceStatus[] = [
  "present",
  "late",
  "half_day",
];

export function isWorkedStatus(status: string): boolean {
  return (WORKED_STATUSES as readonly string[]).includes(status);
}

function round2(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

/**
 * Função pura para cálculo de horas e custos operacionais de mão de obra de presenças.
 * Não acede diretamente a stores nem causa efeitos secundários.
 */
export function calculateAttendanceLabourCost(
  input: LabourCostCalculationInput
): LabourCostCalculationResult {
  const snapshot = input.existingSnapshot;

  const paymentType = snapshot?.paymentTypeSnapshot ?? input.paymentType;
  const dailyRate = snapshot?.dailyRateSnapshot ?? input.dailyRate;
  const hourlyRate = snapshot?.hourlyRateSnapshot ?? input.hourlyRate;
  const monthlyRate = snapshot?.monthlyRateSnapshot ?? input.monthlyRate;
  const overtimeHourlyRate = snapshot?.overtimeHourlyRateSnapshot ?? input.overtimeHourlyRate;
  const currency = snapshot?.currencySnapshot ?? input.currency ?? "MZN";
  const defaultWorkingHours = snapshot?.defaultWorkingHoursSnapshot ?? input.defaultWorkingHours ?? 8;

  const isWorking = isWorkedStatus(input.status);

  // 1. Caso o estado não represente trabalho efetivo
  if (!isWorking) {
    return {
      regularHours: 0,
      overtimeHours: 0,
      workedHours: 0,
      regularLabourCost: 0,
      overtimeLabourCost: 0,
      labourCost: 0,
      paymentTypeSnapshot: paymentType,
      dailyRateSnapshot: dailyRate,
      hourlyRateSnapshot: hourlyRate,
      monthlyRateSnapshot: monthlyRate,
      overtimeHourlyRateSnapshot: overtimeHourlyRate,
      currencySnapshot: currency,
      defaultWorkingHoursSnapshot: defaultWorkingHours,
      costCalculationVersion: 1,
      hasSalaryConfig: !!paymentType,
    };
  }

  // 2. Cálculo de Horas
  let regularHours = 0;
  let overtimeHours = 0;
  let workedHours = 0;

  if (input.explicitRegularHours !== undefined && input.explicitOvertimeHours !== undefined) {
    regularHours = Math.max(0, round2(input.explicitRegularHours));
    overtimeHours = Math.max(0, round2(input.explicitOvertimeHours));
    workedHours = round2(regularHours + overtimeHours);
  } else if (input.checkInTime && input.checkOutTime) {
    const totalMins = calculateWorkedMinutes(
      input.checkInTime,
      input.checkOutTime,
      input.breakMinutes ?? 60
    );
    const calculatedHours = round2(totalMins / 60);

    workedHours = Math.max(0, calculatedHours);
    regularHours = Math.max(0, round2(Math.min(workedHours, defaultWorkingHours)));
    overtimeHours = Math.max(0, round2(workedHours - defaultWorkingHours));
  } else {
    // Fallback: usar defaultWorkingHours quando não há entrada e saída explícitas
    workedHours = round2(defaultWorkingHours);
    regularHours = round2(defaultWorkingHours);
    overtimeHours = 0;
  }

  // 3. Cálculo de Custos conforme paymentType
  let regularLabourCost = 0;
  let overtimeLabourCost = 0;
  let hasSalaryConfig = false;

  if (paymentType === "daily") {
    hasSalaryConfig = dailyRate !== undefined && dailyRate > 0;
    regularLabourCost = round2(dailyRate || 0);
    const ovtRate = overtimeHourlyRate !== undefined ? overtimeHourlyRate : 0;
    overtimeLabourCost = round2(overtimeHours * ovtRate);
  } else if (paymentType === "hourly") {
    hasSalaryConfig = hourlyRate !== undefined && hourlyRate > 0;
    regularLabourCost = round2(regularHours * (hourlyRate || 0));
    // Regra para extraordinário sem overtimeHourlyRate: usa hourlyRate regular
    const ovtRate = overtimeHourlyRate !== undefined ? overtimeHourlyRate : (hourlyRate || 0);
    overtimeLabourCost = round2(overtimeHours * ovtRate);
  } else if (paymentType === "monthly") {
    hasSalaryConfig = monthlyRate !== undefined && monthlyRate > 0;
    regularLabourCost = 0;
    overtimeLabourCost = 0;
  } else {
    hasSalaryConfig = false;
    regularLabourCost = 0;
    overtimeLabourCost = 0;
  }

  const labourCost = round2(regularLabourCost + overtimeLabourCost);

  return {
    regularHours,
    overtimeHours,
    workedHours,
    regularLabourCost,
    overtimeLabourCost,
    labourCost,
    paymentTypeSnapshot: paymentType,
    dailyRateSnapshot: dailyRate,
    hourlyRateSnapshot: hourlyRate,
    monthlyRateSnapshot: monthlyRate,
    overtimeHourlyRateSnapshot: overtimeHourlyRate,
    currencySnapshot: currency,
    defaultWorkingHoursSnapshot: defaultWorkingHours,
    costCalculationVersion: 1,
    hasSalaryConfig,
  };
}
