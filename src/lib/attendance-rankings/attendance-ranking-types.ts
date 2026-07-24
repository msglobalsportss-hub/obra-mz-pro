import type { AttendanceStatisticsResult } from "../attendance-statistics/attendance-statistics-types";
import type { AttendanceFilterResult } from "../attendance-filters/attendance-filter-types";
import type { Worker, Obra, Team } from "../mock-data";

export type AttendanceRankingOrder = "BEST" | "WORST";

export type AttendanceRankingEntityType = "worker" | "team" | "project";

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export interface ScoreWeights {
  attendanceRate: number;
  workedHours: number;
  overtimeHours: number;
  absencePenalty: number;
  latePenalty: number;
  costEfficiency?: number;
}

export interface RankingScore {
  attendanceRate: number;
  workedHours: number;
  overtimeHours: number;
  absencePenalty: number;
  latePenalty: number;
  costEfficiency: number;
  finalScore: number;
}

export interface AttendanceRankingItem {
  id: string;
  name: string;
  type: AttendanceRankingEntityType;
  attendanceRate: number;
  absenceRate: number;
  lateRate: number;
  workedHours: number;
  overtimeHours: number;
  workedDays: number;
  attendanceDays: number;
  cost: number;
  score: RankingScore;
  rank: number;
  previousRank?: number;
  movement?: "up" | "down" | "same" | "new";
  trend?: "positive" | "negative" | "neutral";
  delta?: number;
  metadata?: Record<string, any>;
}

export interface AttendanceRankingSettings {
  topLimit: number;
  order: AttendanceRankingOrder;
  includeInactive: boolean;
  minimumAttendanceDays: number;
  minimumWorkedHours: number;
  scoreWeights: ScoreWeights;
}

export interface AttendanceRankingMetadata {
  engineVersion: 1;
  algorithmVersion: 1;
  generatedAt: string;
  generatedBy: "attendance-ranking-engine";
  filteredRecordCount: number;
  rankingOrder: AttendanceRankingOrder;
  topLimit: number;
  eligibleEntityCount: number;
  returnedEntityCount: number;
}

export interface AttendanceRankingSummary {
  totalWorkers: number;
  eligibleWorkers: number;
  rankedWorkers: number;
  totalTeams: number;
  eligibleTeams: number;
  rankedTeams: number;
  totalProjects: number;
  eligibleProjects: number;
  rankedProjects: number;
}

export interface AttendanceRankingContext {
  statisticsResult: AttendanceStatisticsResult;
  filterResult: AttendanceFilterResult;
  workers: Worker[];
  teams: Team[];
  projects: Obra[];
  settings?: DeepPartial<AttendanceRankingSettings>;
}

export interface AttendanceRankingResult {
  metadata: AttendanceRankingMetadata;
  summary: AttendanceRankingSummary;
  workerRankings: AttendanceRankingItem[];
  teamRankings: AttendanceRankingItem[];
  projectRankings: AttendanceRankingItem[];
  byDate?: undefined;
  futureAnalytics?: undefined;
}

// View Models formais para o Adapter UI
export interface TopWorkerCardModel {
  rank: number;
  workerId: string;
  workerName: string;
  role: string;
  photo?: string;
  score: number;
  attendanceRate: number;
  workedHours: number;
  badgeLabel: string;
  status: "active" | "inactive";
}

export interface AttendanceRankingCardViewModel {
  title: string;
  subtitle: string;
  items: TopWorkerCardModel[];
}

export interface AttendanceRankingTableRow {
  rank: number;
  id: string;
  name: string;
  subtext?: string;
  score: number;
  attendanceRate: number;
  workedHours: number;
  overtimeHours: number;
  cost: number;
  statusBadge?: string;
}
