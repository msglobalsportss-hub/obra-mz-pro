/**
 * Utilidades para tratamento de tempos e durações do módulo de presenças.
 */

export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [hStr, mStr] = timeStr.split(":");
  const h = parseInt(hStr || "0", 10);
  const m = parseInt(mStr || "0", 10);
  return h * 60 + m;
}

export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function formatMins(mins: number | undefined | null): string {
  if (mins === undefined || mins === null) return "—";
  const roundedMins = Math.round(mins);
  if (roundedMins === 0) return "—";
  
  const h = Math.floor(roundedMins / 60);
  const m = roundedMins % 60;
  
  if (h === 0) {
    return `${m}min`;
  }
  if (m === 0) {
    return `${h}h`;
  }
  return `${h}h${String(m).padStart(2, "0")}`;
}

export function formatAttendanceHours(worked: number | undefined | null, overtime: number | undefined | null): string {
  const workedStr = formatMins(worked);
  if (workedStr === "—") return "—";
  if (overtime && overtime > 0) {
    const extraStr = formatMins(overtime);
    return `${workedStr} + ${extraStr} extra`;
  }
  return workedStr;
}

export function calculateWorkedMinutes(checkIn: string, checkOut: string, breakMins: number): number {
  if (!checkIn || !checkOut) return 0;
  const inMins = timeToMinutes(checkIn);
  const outMins = timeToMinutes(checkOut);
  if (outMins <= inMins) return 0;
  const duration = outMins - inMins;
  const breakVal = Math.max(0, breakMins);
  return Math.max(0, duration - breakVal);
}

export function validateTimeFields(
  checkIn: string,
  checkOut: string,
  breakMins: number,
  overtimeMins: number
): string | null {
  if (checkIn && !checkOut) return "Preencha a hora de saída.";
  if (!checkIn && checkOut) return "Preencha a hora de entrada.";

  if (checkIn && checkOut) {
    const inMins = timeToMinutes(checkIn);
    const outMins = timeToMinutes(checkOut);
    if (outMins <= inMins) {
      return "A hora de saída deve ser posterior à hora de entrada.";
    }
    const duration = outMins - inMins;
    if (breakMins < 0) {
      return "A pausa não pode ser negativa.";
    }
    if (breakMins > duration) {
      return "A pausa não pode ser superior à duração entre a entrada e a saída.";
    }
  }

  if (overtimeMins < 0) {
    return "As horas extra não podem ser negativas.";
  }

  return null;
}
