/**
 * ============================================================================
 * ATTENDANCE RANKING ENGINE CONTRACT
 * ============================================================================
 * 
 * INPUT:
 *   AttendanceRankingContext (statisticsResult, filterResult, workers, teams, projects, settings?)
 * 
 * OUTPUT:
 *   AttendanceRankingResult (metadata, summary, workerRankings, teamRankings: [], projectRankings: [])
 * 
 * GUARANTEES & CONSTRAINTS:
 *   - Pure Functions Only
 *   - Immutable Data Processing
 *   - No React / Hooks / Zustand
 *   - No DOM / Browser API Access
 *   - No Async / Promise Operations
 *   - No UI Logic / Visual Formatting (no badges, cards, top 5 labels)
 *   - Zero Recalculation of AttendanceRecords (Consumes ONLY statisticsResult entity maps!)
 * ============================================================================
 */

import type { Worker } from "../mock-data";
import type { EntityStatisticsItem } from "../attendance-statistics/attendance-statistics-types";
import type {
  AttendanceRankingContext,
  AttendanceRankingResult,
  AttendanceRankingItem,
  AttendanceRankingSettings,
  ScoreWeights,
  AttendanceRankingOrder,
  AttendanceRankingSummary,
  AttendanceRankingMetadata,
} from "./attendance-ranking-types";
import {
  resolveAttendanceRankingSettings,
  createDefaultRankingResult,
} from "./attendance-ranking-defaults";
import { computeRankingScore, compareRankingItems } from "./attendance-ranking-utils";

/**
 * 1. GERAÇÃO DE CANDIDATOS A PARTIR DE STATISTICS_RESULT.BY_WORKER
 */
export function generateWorkerCandidates(
  context: AttendanceRankingContext,
  settings: AttendanceRankingSettings
): { candidates: AttendanceRankingItem[]; totalWorkersInContext: number } {
  const byWorkerMap = context.statisticsResult?.byWorker || {};
  const workerMap = new Map<string, Worker>();
  context.workers.forEach((w) => workerMap.set(w.id, w));

  const candidates: AttendanceRankingItem[] = [];

  // Se includeInactive for true, consideramos também trabalhadores sem presenças no período
  const processedIds = new Set<string>();

  for (const [wId, stat] of Object.entries(byWorkerMap)) {
    processedIds.add(wId);
    const workerObj = workerMap.get(wId);

    // Se includeInactive é false e o trabalhador não está ativo no cadastro
    if (!settings.includeInactive && workerObj && workerObj.status !== "active") {
      continue;
    }

    candidates.push({
      id: wId,
      name: stat.name || workerObj?.name || `Trabalhador ${wId}`,
      type: "worker",
      attendanceRate: stat.attendanceRate || 0,
      absenceRate: stat.absenceRate || 0,
      lateRate: stat.lateRate || 0,
      workedHours: stat.workedHours || 0,
      overtimeHours: stat.overtimeHours || 0,
      workedDays: stat.workedDays || 0,
      attendanceDays: stat.attendanceDays || 0,
      cost: stat.cost || 0,
      score: {
        attendanceRate: 0,
        workedHours: 0,
        overtimeHours: 0,
        absencePenalty: 0,
        latePenalty: 0,
        costEfficiency: 0,
        finalScore: 0,
      },
      rank: 0,
      previousRank: undefined,
      movement: "same",
      trend: "neutral",
      delta: 0,
    });
  }

  // Se includeInactive for true, adicionar inativos sem estatísticas zeradas
  if (settings.includeInactive) {
    for (const w of context.workers) {
      if (!processedIds.has(w.id)) {
        candidates.push({
          id: w.id,
          name: w.name,
          type: "worker",
          attendanceRate: 0,
          absenceRate: 0,
          lateRate: 0,
          workedHours: 0,
          overtimeHours: 0,
          workedDays: 0,
          attendanceDays: 0,
          cost: 0,
          score: {
            attendanceRate: 0,
            workedHours: 0,
            overtimeHours: 0,
            absencePenalty: 0,
            latePenalty: 0,
            costEfficiency: 0,
            finalScore: 0,
          },
          rank: 0,
          previousRank: undefined,
          movement: "new",
          trend: "neutral",
          delta: 0,
        });
      }
    }
  }

  return {
    candidates,
    totalWorkersInContext: context.workers.length || candidates.length,
  };
}

/**
 * 2. FILTRAGEM DE ENTIDADES ELEGÍVEIS
 */
export function filterEligibleEntities(
  candidates: AttendanceRankingItem[],
  settings: AttendanceRankingSettings
): AttendanceRankingItem[] {
  return candidates.filter((item) => {
    if (item.attendanceDays < settings.minimumAttendanceDays) return false;
    if (item.workedHours < settings.minimumWorkedHours) return false;
    return true;
  });
}

/**
 * 3. CÁLCULO DE SCORES E NORMALIZAÇÃO
 */
export function calculateRankingScores(
  items: AttendanceRankingItem[],
  weights: ScoreWeights
): AttendanceRankingItem[] {
  if (items.length === 0) return [];

  let maxWorked = 0;
  let maxOvertime = 0;

  for (const item of items) {
    if (item.workedHours > maxWorked) maxWorked = item.workedHours;
    if (item.overtimeHours > maxOvertime) maxOvertime = item.overtimeHours;
  }

  return items.map((item) => {
    const score = computeRankingScore(
      item.attendanceRate,
      item.absenceRate,
      item.lateRate,
      item.workedHours,
      item.overtimeHours,
      weights,
      maxWorked,
      maxOvertime
    );

    return {
      ...item,
      score,
    };
  });
}

/**
 * 4. SANITIZAÇÃO E NORMALIZAÇÃO IMUTÁVEL
 */
export function sanitizeRanking(items: AttendanceRankingItem[]): AttendanceRankingItem[] {
  return items.map((item) => {
    const sanitizeNum = (val: number, isRate = false): number => {
      if (isNaN(val) || !isFinite(val)) return 0;
      const safeVal = Math.max(0, val);
      return isRate ? Math.min(100, safeVal) : safeVal;
    };

    const sanitizedScore = {
      attendanceRate: sanitizeNum(item.score.attendanceRate, true),
      workedHours: sanitizeNum(item.score.workedHours),
      overtimeHours: sanitizeNum(item.score.overtimeHours),
      absencePenalty: sanitizeNum(item.score.absencePenalty, true),
      latePenalty: sanitizeNum(item.score.latePenalty, true),
      costEfficiency: sanitizeNum(item.score.costEfficiency),
      finalScore: sanitizeNum(item.score.finalScore, true),
    };

    return {
      ...item,
      name: item.name && item.name.trim() ? item.name.trim() : `Entidade ${item.id}`,
      attendanceRate: sanitizeNum(item.attendanceRate, true),
      absenceRate: sanitizeNum(item.absenceRate, true),
      lateRate: sanitizeNum(item.lateRate, true),
      workedHours: sanitizeNum(item.workedHours),
      overtimeHours: sanitizeNum(item.overtimeHours),
      workedDays: sanitizeNum(item.workedDays),
      attendanceDays: sanitizeNum(item.attendanceDays),
      cost: sanitizeNum(item.cost),
      score: sanitizedScore,
    };
  });
}

/**
 * 5. ORDENAÇÃO DETERMINÍSTICA (BEST / WORST)
 */
export function sortRanking(
  items: AttendanceRankingItem[],
  order: AttendanceRankingOrder
): AttendanceRankingItem[] {
  const copy = [...items];
  copy.sort((a, b) => compareRankingItems(a, b, order));
  return copy;
}

/**
 * 6. ATRIBUIÇÃO DE POSIÇÕES (RANKS ORDINAIS SEQUENCIAIS 1, 2, 3...)
 */
export function assignRankingPositions(items: AttendanceRankingItem[]): AttendanceRankingItem[] {
  return items.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}

/**
 * 7. LIMITAÇÃO DOS ITENS APÓS CLASSIFICAÇÃO GLOBAL (topLimit)
 */
export function limitRankingItems(
  items: AttendanceRankingItem[],
  topLimit: number
): AttendanceRankingItem[] {
  if (topLimit <= 0) return items;
  return items.slice(0, topLimit);
}

/**
 * 8. ORQUESTRADOR PRINCIPAL DO MOTOR DE RANKINGS
 */
export function generateAttendanceRankings(
  context: AttendanceRankingContext
): AttendanceRankingResult {
  const settings = resolveAttendanceRankingSettings(context.settings);
  const filteredRecordCount = context.filterResult?.totalFiltered || 0;

  // Se não existirem registos ou estatísticas no contexto, devolve resultado padrão
  if (!context.statisticsResult || context.statisticsResult.summary.totalRecords === 0) {
    return createDefaultRankingResult(filteredRecordCount, settings);
  }

  // 1. Candidatos Trabalhadores
  const { candidates: workerCandidates, totalWorkersInContext } = generateWorkerCandidates(
    context,
    settings
  );

  // 2. Filtragem de Elegibilidade
  const eligibleWorkerItems = filterEligibleEntities(workerCandidates, settings);

  // 3. Cálculo de Scores
  const scoredWorkerItems = calculateRankingScores(
    eligibleWorkerItems,
    settings.scoreWeights
  );

  // 4. Sanitização
  const sanitizedWorkerItems = sanitizeRanking(scoredWorkerItems);

  // 5. Ordenação Determinística
  const sortedWorkerItems = sortRanking(sanitizedWorkerItems, settings.order);

  // 6. Atribuição de Posições Globais (1, 2, 3...)
  const rankedWorkerItems = assignRankingPositions(sortedWorkerItems);

  // 7. Aplicação do Limite Visual (topLimit)
  const finalWorkerRankings = limitRankingItems(rankedWorkerItems, settings.topLimit);

  // 8. Resumo Operacional dos Rankings
  const summary: AttendanceRankingSummary = {
    totalWorkers: totalWorkersInContext,
    eligibleWorkers: eligibleWorkerItems.length,
    rankedWorkers: finalWorkerRankings.length,
    totalTeams: context.teams.length,
    eligibleTeams: 0,
    rankedTeams: 0,
    totalProjects: context.projects.length,
    eligibleProjects: 0,
    rankedProjects: 0,
  };

  // 9. Metadados com timestamp determinístico único
  const metadata: AttendanceRankingMetadata = {
    engineVersion: 1,
    algorithmVersion: 1,
    generatedAt: new Date().toISOString(),
    generatedBy: "attendance-ranking-engine",
    filteredRecordCount,
    rankingOrder: settings.order,
    topLimit: settings.topLimit,
    eligibleEntityCount: eligibleWorkerItems.length,
    returnedEntityCount: finalWorkerRankings.length,
  };

  return {
    metadata,
    summary,
    workerRankings: finalWorkerRankings,
    teamRankings: [], // Retorna array vazio estruturado (nunca undefined)
    projectRankings: [], // Retorna array vazio estruturado (nunca undefined)
    byDate: undefined,
    futureAnalytics: undefined,
  };
}
