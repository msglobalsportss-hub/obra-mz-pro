import type { AttendanceRecord, Worker } from "../mock-data";
import type {
  CurrencyLabourSummary,
  DailyLabourSummaryResult,
} from "./attendance-labour-cost-types";

function round2(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

/**
 * Função pura para agregação do resumo diário de mão de obra.
 * Suporta Múltiplas Moedas sem as somar silenciosamente.
 */
export function calculateDailyLabourSummary(
  records: AttendanceRecord[] = [],
  workersMap?: Map<string, Worker>
): DailyLabourSummaryResult {
  const byCurrency: Record<string, CurrencyLabourSummary> = {};

  for (const record of records) {
    const worker = workersMap?.get(record.workerId);
    const currency = record.currencySnapshot || worker?.currency || "MZN";

    if (!byCurrency[currency]) {
      byCurrency[currency] = {
        currency,
        totalWorkers: 0,
        presentWorkers: 0,
        absentWorkers: 0,
        leaveWorkers: 0,
        regularHours: 0,
        overtimeHours: 0,
        workedHours: 0,
        regularLabourCost: 0,
        overtimeLabourCost: 0,
        totalLabourCost: 0,
        workersWithoutSalaryConfig: 0,
      };
    }

    const summary = byCurrency[currency]!;
    summary.totalWorkers++;

    const isWorkingStatus =
      record.status === "present" || record.status === "late" || record.status === "half_day";

    if (isWorkingStatus) {
      summary.presentWorkers++;
    } else if (record.status === "absent") {
      summary.absentWorkers++;
    } else if (record.status === "justified_absence") {
      summary.leaveWorkers++;
    }

    const regHours = record.regularHours ?? (isWorkingStatus ? 8 : 0);
    const ovtHours = record.overtimeHours ?? 0;
    const wrkHours = record.workedHours ?? (regHours + ovtHours);

    summary.regularHours = round2(summary.regularHours + regHours);
    summary.overtimeHours = round2(summary.overtimeHours + ovtHours);
    summary.workedHours = round2(summary.workedHours + wrkHours);

    summary.regularLabourCost = round2(summary.regularLabourCost + (record.regularLabourCost ?? 0));
    summary.overtimeLabourCost = round2(summary.overtimeLabourCost + (record.overtimeLabourCost ?? 0));
    summary.totalLabourCost = round2(summary.totalLabourCost + (record.labourCost ?? 0));

    const hasSalaryConfig =
      record.paymentTypeSnapshot !== undefined || (worker && worker.paymentType !== undefined);

    if (!hasSalaryConfig) {
      summary.workersWithoutSalaryConfig++;
    }
  }

  const currencies = Object.keys(byCurrency);
  const primaryCurrency = currencies.includes("MZN") ? "MZN" : currencies[0] || "MZN";

  return {
    byCurrency,
    primaryCurrency,
    hasMultipleCurrencies: currencies.length > 1,
    totalRecordsCount: records.length,
  };
}
