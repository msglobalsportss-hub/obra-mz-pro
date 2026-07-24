import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X, RotateCcw } from "lucide-react";
import type { AttendanceFilterState, FilterChipCategory } from "@/lib/attendance-filters/attendance-filter-types";
import type { Worker, Obra, Team } from "@/lib/mock-data";
import {
  countActiveAdvancedFilters,
  getGroupedFilterChips,
  removeFilterGroupChip,
} from "@/lib/attendance-filters/attendance-filter-utils";
import { resetAttendanceFilters } from "@/lib/attendance-filters/attendance-filter-defaults";

type AttendanceFilterToolbarProps = {
  state: AttendanceFilterState;
  onChange: (newState: AttendanceFilterState) => void;
  onOpenAdvancedSheet: () => void;
  workers: Worker[];
  obras: Obra[];
  teams: Team[];
  className?: string;
  actionsRight?: React.ReactNode;
};

export function AttendanceFilterToolbar({
  state,
  onChange,
  onOpenAdvancedSheet,
  workers,
  obras,
  teams,
  className = "",
  actionsRight,
}: AttendanceFilterToolbarProps) {
  const activeCount = countActiveAdvancedFilters(state);
  const groupedChips = getGroupedFilterChips(state, workers, obras, teams);

  const handleSearchChange = (val: string) => {
    onChange({ ...state, searchQuery: val });
  };

  const handleRemoveChip = (category: FilterChipCategory) => {
    const nextState = removeFilterGroupChip(state, category);
    onChange(nextState);
  };

  const handleResetAll = () => {
    const reset = resetAttendanceFilters(state);
    reset.dateFrom = state.dateFrom;
    reset.dateTo = state.dateTo;
    reset.periodMode = state.periodMode;
    onChange(reset);
  };

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Linha Principal da Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Campo de Pesquisa Instantânea */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Pesquisar operário, obra, equipa..."
              value={state.searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8 text-xs h-9 bg-card"
            />
            {state.searchQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Botão Mais Filtros */}
          <Button
            type="button"
            variant={activeCount > 0 ? "default" : "outline"}
            onClick={onOpenAdvancedSheet}
            className={`h-9 text-xs font-semibold gap-1.5 border transition-all ${
              activeCount > 0
                ? "bg-primary text-white shadow-xs"
                : "bg-card text-foreground hover:bg-muted"
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            Mais Filtros
            {activeCount > 0 && (
              <Badge className="bg-white/20 text-white border-0 text-[10px] h-4 px-1.5 font-bold rounded-full ml-0.5">
                {activeCount}
              </Badge>
            )}
          </Button>

          {/* Botão Limpar Tudo (se existirem chips/pesquisa ativos) */}
          {(groupedChips.length > 0 || state.searchQuery) && (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={handleResetAll}
              className="h-9 text-xs text-muted-foreground hover:text-rose-600 font-medium"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Limpar Todos
            </Button>
          )}
        </div>

        {/* Espaço Reservado para Ações Futuras (Exportar, Guardar Filtro) */}
        {actionsRight && <div className="flex items-center gap-2 shrink-0">{actionsRight}</div>}
      </div>

      {/* Linha de Chips Agrupados */}
      {groupedChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {groupedChips.map((chip) => (
            <Badge
              key={chip.id}
              variant="secondary"
              className="text-[11px] font-medium py-1 px-2.5 gap-1.5 bg-muted/60 hover:bg-muted text-foreground border shadow-2xs transition-all flex items-center"
            >
              <span>{chip.label}</span>
              <button
                type="button"
                onClick={() => handleRemoveChip(chip.category)}
                className="text-muted-foreground hover:text-rose-600 rounded-full p-0.5"
                aria-label={`Remover filtro ${chip.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
