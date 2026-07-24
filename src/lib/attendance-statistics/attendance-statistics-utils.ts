/**
 * Divisão segura contra divisão por zero e valores NaN.
 */
export function safeDivision(numerator: number, denominator: number, fallback = 0): number {
  if (!denominator || isNaN(denominator) || denominator === 0) {
    return fallback;
  }
  const result = numerator / denominator;
  return isNaN(result) || !isFinite(result) ? fallback : result;
}

/**
 * Arredondamento seguro para estatísticas.
 */
export function roundStatistic(value: number, precision = 2): number {
  if (isNaN(value) || !isFinite(value)) return 0;
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
}

/**
 * Cálculo de taxa percentual (0 - 100%).
 */
export function safePercentage(numerator: number, denominator: number, precision = 1): number {
  const ratio = safeDivision(numerator, denominator, 0);
  return roundStatistic(ratio * 100, precision);
}

/**
 * Cálculo de média simples.
 */
export function safeAverage(numerator: number, denominator: number, precision = 1): number {
  const avg = safeDivision(numerator, denominator, 0);
  return roundStatistic(avg, precision);
}

/**
 * Conversão de minutos em horas com precisão.
 */
export function minutesToHours(minutes: number, precision = 1): number {
  if (!minutes || minutes <= 0) return 0;
  return roundStatistic(minutes / 60, precision);
}
