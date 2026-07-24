import type {
  AttendanceFilterState,
  FilterGroupChipItem,
  FilterChipCategory,
} from "./attendance-filter-types";
import type { Worker, Obra, Team, AttendanceStatus } from "../mock-data";
import { formatPeriodLabel } from "../attendance-period-utils";

const statusLabelMap: Record<AttendanceStatus, string> = {
  present: "Presente",
  absent: "Ausente",
  late: "Atrasado",
  half_day: "Meio período",
  justified_absence: "Falta justificada",
};

export function countActiveAdvancedFilters(state: AttendanceFilterState): number {
  let count = 0;

  if (state.selectedProjectIds.length > 0) count++;
  if (state.selectedWorkerIds.length > 0) count++;
  if (state.selectedTeamIds.length > 0) count++;
  if (state.selectedPhaseIds.length > 0) count++;
  if (state.selectedStatuses.length > 0) count++;
  if (state.selectedSources.length > 0) count++;

  if (state.onlyWithHours || state.onlyWithoutHours) count++;
  if (state.onlyWithOvertime || state.onlyWithoutOvertime) count++;
  if (state.onlyWithCost || state.onlyWithoutCost || state.minimumCost !== null || state.maximumCost !== null) count++;

  if (state.onlyActiveWorkers || state.onlyInactiveWorkers) count++;
  if (state.onlyActiveTeams || state.onlyInactiveTeams) count++;

  return count;
}

export function getGroupedFilterChips(
  state: AttendanceFilterState,
  workers: Worker[],
  obras: Obra[],
  teams: Team[]
): FilterGroupChipItem[] {
  const chips: FilterGroupChipItem[] = [];

  // 1. Período
  if (state.dateFrom && state.dateTo) {
    const periodLabel = formatPeriodLabel(state.dateFrom, state.dateTo, state.periodMode);
    if (periodLabel) {
      chips.push({
        id: "chip-period",
        category: "period",
        label: `Período: ${periodLabel}`,
      });
    }
  }

  // 2. Obras
  if (state.selectedProjectIds.length > 0) {
    if (state.selectedProjectIds.length === 1) {
      const obra = obras.find((o) => o.id === state.selectedProjectIds[0]);
      chips.push({
        id: "chip-projects",
        category: "projects",
        label: `Obra: ${obra?.nome || state.selectedProjectIds[0]}`,
        count: 1,
      });
    } else {
      chips.push({
        id: "chip-projects",
        category: "projects",
        label: `Obras: ${state.selectedProjectIds.length} selecionadas`,
        count: state.selectedProjectIds.length,
      });
    }
  }

  // 3. Trabalhadores
  if (state.selectedWorkerIds.length > 0) {
    if (state.selectedWorkerIds.length === 1) {
      const worker = workers.find((w) => w.id === state.selectedWorkerIds[0]);
      chips.push({
        id: "chip-workers",
        category: "workers",
        label: `Trabalhador: ${worker?.name || state.selectedWorkerIds[0]}`,
        count: 1,
      });
    } else {
      chips.push({
        id: "chip-workers",
        category: "workers",
        label: `Trabalhadores: ${state.selectedWorkerIds.length} selecionados`,
        count: state.selectedWorkerIds.length,
      });
    }
  }

  // 4. Equipas
  if (state.selectedTeamIds.length > 0) {
    if (state.selectedTeamIds.length === 1) {
      const team = teams.find((t) => t.id === state.selectedTeamIds[0]);
      chips.push({
        id: "chip-teams",
        category: "teams",
        label: `Equipa: ${team?.name || state.selectedTeamIds[0]}`,
        count: 1,
      });
    } else {
      chips.push({
        id: "chip-teams",
        category: "teams",
        label: `Equipas: ${state.selectedTeamIds.length} selecionadas`,
        count: state.selectedTeamIds.length,
      });
    }
  }

  // 5. Fases
  if (state.selectedPhaseIds.length > 0) {
    chips.push({
      id: "chip-phases",
      category: "phases",
      label: `Fases: ${state.selectedPhaseIds.length} selecionadas`,
      count: state.selectedPhaseIds.length,
    });
  }

  // 6. Estados
  if (state.selectedStatuses.length > 0) {
    if (state.selectedStatuses.length === 1) {
      const st = state.selectedStatuses[0];
      chips.push({
        id: "chip-statuses",
        category: "statuses",
        label: `Estado: ${statusLabelMap[st] || st}`,
        count: 1,
      });
    } else {
      chips.push({
        id: "chip-statuses",
        category: "statuses",
        label: `Estados: ${state.selectedStatuses.length} selecionados`,
        count: state.selectedStatuses.length,
      });
    }
  }

  // 7. Origem
  if (state.selectedSources.length > 0) {
    chips.push({
      id: "chip-sources",
      category: "sources",
      label: `Origem: ${state.selectedSources.length} selecionada(s)`,
      count: state.selectedSources.length,
    });
  }

  // 8. Horas
  if (state.onlyWithHours) {
    chips.push({
      id: "chip-hours",
      category: "hours",
      label: "Apenas com horas",
    });
  } else if (state.onlyWithoutHours) {
    chips.push({
      id: "chip-hours",
      category: "hours",
      label: "Apenas sem horas",
    });
  }

  // 9. Horas Extra
  if (state.onlyWithOvertime) {
    chips.push({
      id: "chip-overtime",
      category: "overtime",
      label: "Apenas com horas extra",
    });
  } else if (state.onlyWithoutOvertime) {
    chips.push({
      id: "chip-overtime",
      category: "overtime",
      label: "Apenas sem horas extra",
    });
  }

  // 10. Custos
  if (state.onlyWithCost) {
    chips.push({ id: "chip-cost", category: "cost", label: "Apenas com custo" });
  } else if (state.onlyWithoutCost) {
    chips.push({ id: "chip-cost", category: "cost", label: "Apenas sem custo" });
  } else if (state.minimumCost !== null || state.maximumCost !== null) {
    const minText = state.minimumCost !== null ? `≥ ${state.minimumCost} MTn` : "";
    const maxText = state.maximumCost !== null ? `≤ ${state.maximumCost} MTn` : "";
    chips.push({
      id: "chip-cost",
      category: "cost",
      label: `Custo: ${[minText, maxText].filter(Boolean).join(" e ")}`,
    });
  }

  // 11. Estado do Trabalhador
  if (state.onlyActiveWorkers) {
    chips.push({ id: "chip-worker-status", category: "workerStatus", label: "Apenas trabalhadores ativos" });
  } else if (state.onlyInactiveWorkers) {
    chips.push({ id: "chip-worker-status", category: "workerStatus", label: "Apenas trabalhadores inativos" });
  }

  // 12. Estado da Equipa
  if (state.onlyActiveTeams) {
    chips.push({ id: "chip-team-status", category: "teamStatus", label: "Apenas equipas ativas" });
  } else if (state.onlyInactiveTeams) {
    chips.push({ id: "chip-team-status", category: "teamStatus", label: "Apenas equipas inativas" });
  }

  // 13. Pesquisa
  if (state.searchQuery.trim()) {
    chips.push({
      id: "chip-search",
      category: "search",
      label: `Pesquisa: "${state.searchQuery.trim()}"`,
    });
  }

  return chips;
}

export function removeFilterGroupChip(
  state: AttendanceFilterState,
  category: FilterChipCategory
): AttendanceFilterState {
  const next = { ...state };

  switch (category) {
    case "period":
      // Não limpa datas totalmente, repõe o dia de hoje
      const today = new Date().toISOString().slice(0, 10);
      next.dateFrom = today;
      next.dateTo = today;
      next.periodMode = "day";
      break;
    case "projects":
      next.selectedProjectIds = [];
      break;
    case "workers":
      next.selectedWorkerIds = [];
      break;
    case "teams":
      next.selectedTeamIds = [];
      break;
    case "phases":
      next.selectedPhaseIds = [];
      break;
    case "statuses":
      next.selectedStatuses = [];
      break;
    case "sources":
      next.selectedSources = [];
      break;
    case "hours":
      next.onlyWithHours = false;
      next.onlyWithoutHours = false;
      break;
    case "overtime":
      next.onlyWithOvertime = false;
      next.onlyWithoutOvertime = false;
      break;
    case "cost":
      next.onlyWithCost = false;
      next.onlyWithoutCost = false;
      next.minimumCost = null;
      next.maximumCost = null;
      break;
    case "workerStatus":
      next.onlyActiveWorkers = false;
      next.onlyInactiveWorkers = false;
      break;
    case "teamStatus":
      next.onlyActiveTeams = false;
      next.onlyInactiveTeams = false;
      break;
    case "search":
      next.searchQuery = "";
      break;
  }

  return next;
}
