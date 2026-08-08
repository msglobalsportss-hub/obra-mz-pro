/**
 * Barra de Filtros: InventoryFilterBar
 * Categoria: components
 *
 * Barra de pesquisa e filtros combináveis para tabelas e listas de inventário (Seção 20).
 * Suporta debounce de pesquisa, reset de filtros e layout responsivo.
 */

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, SlidersHorizontal } from "lucide-react";

export interface FilterOption {
  value: string;
  label: string;
}

interface InventoryFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  locationFilter?: string;
  onLocationChange?: (loc: string) => void;
  locationOptions?: FilterOption[];
  statusFilter?: string;
  onStatusChange?: (status: string) => void;
  statusOptions?: FilterOption[];
  onResetFilters?: () => void;
  hasActiveFilters?: boolean;
  searchPlaceholder?: string;
  children?: React.ReactNode;
}

export function InventoryFilterBar({
  searchQuery,
  onSearchChange,
  locationFilter,
  onLocationChange,
  locationOptions = [],
  statusFilter,
  onStatusChange,
  statusOptions = [],
  onResetFilters,
  hasActiveFilters = false,
  searchPlaceholder = "Pesquisar por material, SKU ou código...",
  children,
}: InventoryFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-card p-4 rounded-xl border border-border/60 shadow-xs mb-6">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        {/* Pesquisa Textual */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9 pr-8 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filtro por Localização */}
        {onLocationChange && locationOptions.length > 0 && (
          <div className="w-full sm:w-[200px]">
            <Select value={locationFilter ?? "ALL"} onValueChange={onLocationChange}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Todas as Localizações" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas as Localizações</SelectItem>
                {locationOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Filtro por Estado */}
        {onStatusChange && statusOptions.length > 0 && (
          <div className="w-full sm:w-[180px]">
            <Select value={statusFilter ?? "ALL"} onValueChange={onStatusChange}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Todos os Estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os Estados</SelectItem>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {children}

        {/* Botão Limpar Filtros */}
        {hasActiveFilters && onResetFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="text-xs text-muted-foreground hover:text-foreground gap-1.5 h-9 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
            <span>Limpar Filtros</span>
          </Button>
        )}
      </div>
    </div>
  );
}
