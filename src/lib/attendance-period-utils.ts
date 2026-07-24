/**
 * Utilitários de controle e cálculo de períodos de presenças (Dia, Semana, Mês, Personalizado).
 */

export type AttendancePeriodMode = "day" | "week" | "month" | "custom";

const monthsPt = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
];

function parseSafeDate(dateStr?: string): Date {
  if (!dateStr || typeof dateStr !== "string") {
    return new Date();
  }
  const clean = dateStr.slice(0, 10);
  const d = new Date(clean + "T00:00:00");
  if (isNaN(d.getTime())) {
    return new Date();
  }
  return d;
}

export function isValidDateString(dateStr?: string): boolean {
  if (!dateStr || typeof dateStr !== "string" || dateStr.length < 10) {
    return false;
  }
  const clean = dateStr.slice(0, 10);
  const d = new Date(clean + "T00:00:00");
  return !isNaN(d.getTime());
}

function formatDateISO(d: Date): string {
  if (isNaN(d.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }
  return d.toISOString().slice(0, 10);
}

/**
 * Retorna o intervalo do próprio dia da data de referência.
 */
export function getDayRange(refDate: string): { dateFrom: string; dateTo: string } {
  const d = parseSafeDate(refDate);
  const iso = formatDateISO(d);
  return { dateFrom: iso, dateTo: iso };
}

/**
 * Retorna o intervalo da semana da data de referência (segunda-feira a domingo).
 */
export function getWeekRange(refDate: string): { dateFrom: string; dateTo: string } {
  const d = parseSafeDate(refDate);
  const day = d.getDay(); // 0 = Domingo, 1 = Segunda, etc.
  
  // Calcular diferença para segunda-feira (se for domingo, recua 6 dias; senão, recua day-1)
  const diffToMonday = day === 0 ? -6 : 1 - day;
  
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  return {
    dateFrom: formatDateISO(monday),
    dateTo: formatDateISO(sunday),
  };
}

/**
 * Retorna o intervalo do mês da data de referência (dia 1 até o último dia do mês).
 */
export function getMonthRange(refDate: string): { dateFrom: string; dateTo: string } {
  const d = parseSafeDate(refDate);
  const y = d.getFullYear();
  const m = d.getMonth(); // 0-indexed
  
  const firstDay = new Date(y, m, 1);
  const lastDay = new Date(y, m + 1, 0);
  
  return {
    dateFrom: formatDateISO(firstDay),
    dateTo: formatDateISO(lastDay),
  };
}

/**
 * Deteta o modo correspondente ao intervalo fornecido.
 */
export function detectPeriodMode(dateFrom: string, dateTo: string, refDate: string): AttendancePeriodMode {
  if (!dateFrom || !dateTo) return "day";
  
  if (dateFrom === dateTo && dateFrom === refDate) {
    return "day";
  }
  
  const week = getWeekRange(refDate);
  if (dateFrom === week.dateFrom && dateTo === week.dateTo) {
    return "week";
  }
  
  const month = getMonthRange(refDate);
  if (dateFrom === month.dateFrom && dateTo === month.dateTo) {
    return "month";
  }
  
  return "custom";
}

/**
 * Navega um período para trás ou para a frente com base na data de referência.
 * Retorna a nova data de referência em YYYY-MM-DD.
 */
export function shiftPeriod(
  refDate: string,
  mode: AttendancePeriodMode,
  direction: "prev" | "next"
): string {
  const d = parseSafeDate(refDate);
  const step = direction === "next" ? 1 : -1;
  
  if (mode === "day") {
    d.setDate(d.getDate() + step);
    return formatDateISO(d);
  }
  
  if (mode === "week") {
    d.setDate(d.getDate() + (step * 7));
    return formatDateISO(d);
  }
  
  if (mode === "month") {
    const day = d.getDate();
    const targetMonth = d.getMonth() + step;
    const dateObj = new Date(d.getFullYear(), targetMonth, 1);
    
    // Limitar o dia do mês para não extrapolar o novo mês
    const lastDayOfNewMonth = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0).getDate();
    const newDay = Math.min(day, lastDayOfNewMonth);
    
    dateObj.setDate(newDay);
    return formatDateISO(dateObj);
  }
  
  return formatDateISO(d);
}

/**
 * Formata um rótulo legível em português do período selecionado.
 */
export function formatPeriodLabel(dateFrom: string, dateTo: string, mode: AttendancePeriodMode): string {
  if (!dateFrom || !dateTo) return "";
  
  const d1 = parseSafeDate(dateFrom);
  const d2 = parseSafeDate(dateTo);
  
  const day1 = d1.getDate();
  const month1 = monthsPt[d1.getMonth()] || "";
  const year1 = d1.getFullYear();
  
  const day2 = d2.getDate();
  const month2 = monthsPt[d2.getMonth()] || "";
  const year2 = d2.getFullYear();
  
  if (mode === "day") {
    return `${day1} de ${month1} de ${year1}`;
  }
  
  if (mode === "month") {
    return `${month1.charAt(0).toUpperCase() + month1.slice(1)} de ${year1}`;
  }
  
  // Semana ou Personalizado
  if (year1 === year2) {
    if (month1 === month2) {
      return `${day1} a ${day2} de ${month1} de ${year1}`;
    } else {
      return `${day1} de ${month1} a ${day2} de ${month2} de ${year1}`;
    }
  } else {
    return `${day1} de ${month1} de ${year1} a ${day2} de ${month2} de ${year2}`;
  }
}

/**
 * Retorna as datas do período imediatamente anterior para alimentação de comparações percentuais.
 */
export function getPreviousPeriodRange(
  dateFrom: string,
  dateTo: string,
  mode: AttendancePeriodMode
): { dateFrom: string; dateTo: string } {
  if (!dateFrom || !dateTo) return { dateFrom: "", dateTo: "" };

  const d1 = parseSafeDate(dateFrom);
  const d2 = parseSafeDate(dateTo);

  if (mode === "day") {
    const prevDate = shiftPeriod(formatDateISO(d1), "day", "prev");
    return { dateFrom: prevDate, dateTo: prevDate };
  }

  if (mode === "week") {
    const prevDate = shiftPeriod(formatDateISO(d1), "week", "prev");
    return getWeekRange(prevDate);
  }

  if (mode === "month") {
    const prevDate = shiftPeriod(formatDateISO(d1), "month", "prev");
    return getMonthRange(prevDate);
  }

  // Personalizado: calcular duração em dias e recuar essa mesma quantidade de dias
  const durationDays = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  const prevToObj = new Date(d1);
  prevToObj.setDate(d1.getDate() - 1);

  const prevFromObj = new Date(prevToObj);
  prevFromObj.setDate(prevToObj.getDate() - durationDays + 1);

  return {
    dateFrom: formatDateISO(prevFromObj),
    dateTo: formatDateISO(prevToObj),
  };
}
