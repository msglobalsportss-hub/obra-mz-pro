import type { AttendanceStatus, PaymentType } from "../mock-data";

export interface LabourCostCalculationInput {
  status: AttendanceStatus;
  paymentType?: PaymentType;
  dailyRate?: number;
  hourlyRate?: number;
  monthlyRate?: number;
  overtimeHourlyRate?: number;
  currency?: string;
  defaultWorkingHours?: number;
  checkInTime?: string;
  checkOutTime?: string;
  breakMinutes?: number;
  explicitRegularHours?: number;
  explicitOvertimeHours?: number;

  // Para preservação de snapshot na edição de registo existente
  existingSnapshot?: {
    paymentTypeSnapshot?: PaymentType;
    dailyRateSnapshot?: number;
    hourlyRateSnapshot?: number;
    monthlyRateSnapshot?: number;
    overtimeHourlyRateSnapshot?: number;
    currencySnapshot?: string;
    defaultWorkingHoursSnapshot?: number;
  };
}

export interface LabourCostCalculationResult {
  regularHours: number;
  overtimeHours: number;
  workedHours: number;
  regularLabourCost: number;
  overtimeLabourCost: number;
  labourCost: number;
  paymentTypeSnapshot?: PaymentType;
  dailyRateSnapshot?: number;
  hourlyRateSnapshot?: number;
  monthlyRateSnapshot?: number;
  overtimeHourlyRateSnapshot?: number;
  currencySnapshot: string;
  defaultWorkingHoursSnapshot: number;
  costCalculationVersion: number;
  hasSalaryConfig: boolean;
}

export interface CurrencyLabourSummary {
  currency: string;
  totalWorkers: number;
  presentWorkers: number;
  absentWorkers: number;
  leaveWorkers: number;
  regularHours: number;
  overtimeHours: number;
  workedHours: number;
  regularLabourCost: number;
  overtimeLabourCost: number;
  totalLabourCost: number;
  workersWithoutSalaryConfig: number;
}

export interface DailyLabourSummaryResult {
  byCurrency: Record<string, CurrencyLabourSummary>;
  primaryCurrency: string;
  hasMultipleCurrencies: boolean;
  totalRecordsCount: number;
}
