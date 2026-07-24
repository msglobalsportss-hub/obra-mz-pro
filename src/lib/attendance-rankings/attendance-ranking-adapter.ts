import type {
  AttendanceRankingResult,
  TopWorkerCardModel,
  AttendanceRankingCardViewModel,
  AttendanceRankingTableRow,
} from "./attendance-ranking-types";
import type { Worker, Obra, Team } from "../mock-data";

/**
 * Adaptador de Apresentação de Rankings para o Dashboard.
 * Responsável por formatar medalhas, rótulos textuais e View Models sem reordenar nem recalcular scores.
 */
export function toTopWorkers(
  result: AttendanceRankingResult,
  workers?: Worker[]
): TopWorkerCardModel[] {
  const items = result.workerRankings || [];
  if (items.length === 0) return [];

  const workerMap = new Map<string, Worker>();
  if (workers) {
    workers.forEach((w) => workerMap.set(w.id, w));
  }

  return items.map((item) => {
    const workerObj = workerMap.get(item.id);
    let badgeLabel = `#${item.rank}`;
    if (item.rank === 1) badgeLabel = "🥇 #1";
    else if (item.rank === 2) badgeLabel = "🥈 #2";
    else if (item.rank === 3) badgeLabel = "🥉 #3";

    return {
      rank: item.rank,
      workerId: item.id,
      workerName: item.name || workerObj?.name || `Trabalhador ${item.id}`,
      role: workerObj?.role || "Trabalhador",
      photo: workerObj?.photo,
      score: item.score.finalScore,
      attendanceRate: item.attendanceRate,
      workedHours: item.workedHours,
      badgeLabel,
      status: workerObj?.status || "active",
    };
  });
}

export function toTopTeams(
  _result: AttendanceRankingResult,
  _teams?: Team[]
): any[] {
  return [];
}

export function toTopProjects(
  _result: AttendanceRankingResult,
  _projects?: Obra[]
): any[] {
  return [];
}

export function toRankingCards(
  result: AttendanceRankingResult,
  workers?: Worker[]
): AttendanceRankingCardViewModel {
  const topWorkers = toTopWorkers(result, workers);
  return {
    title: "Destaques do Período",
    subtitle: "Trabalhadores com melhor pontuação geral de assiduidade e horas no período.",
    items: topWorkers,
  };
}

export function toRankingTable(
  result: AttendanceRankingResult,
  workers?: Worker[]
): AttendanceRankingTableRow[] {
  const items = result.workerRankings || [];
  const workerMap = new Map<string, Worker>();
  if (workers) {
    workers.forEach((w) => workerMap.set(w.id, w));
  }

  return items.map((item) => {
    const workerObj = workerMap.get(item.id);
    return {
      rank: item.rank,
      id: item.id,
      name: item.name,
      subtext: workerObj?.role || "Trabalhador",
      score: item.score.finalScore,
      attendanceRate: item.attendanceRate,
      workedHours: item.workedHours,
      overtimeHours: item.overtimeHours,
      cost: item.cost,
      statusBadge: workerObj?.status === "active" ? "Ativo" : "Inativo",
    };
  });
}

export const AttendanceRankingDashboardAdapter = {
  toTopWorkers,
  toTopTeams,
  toTopProjects,
  toRankingCards,
  toRankingTable,
};
