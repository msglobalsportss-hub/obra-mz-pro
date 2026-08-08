import React from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Home,
  ShoppingCart,
  FileText,
  ChevronRight,
  Plus,
} from "lucide-react";

interface PurchaseHeaderProps {
  onNewOrder: () => void;
}

export function PurchaseHeader({ onNewOrder }: PurchaseHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
          <Link to="/app" className="flex items-center gap-1 hover:text-blue-600 transition-colors">
            <Home className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <Link to="/app/compras" className="flex items-center gap-1 hover:text-blue-600 transition-colors">
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Compras</span>
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Pedidos de Compra</span>
          </span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
          <ShoppingCart className="w-7 h-7 text-blue-600" />
          Pedidos de Compra
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Gestão de cotações, pedidos de compra, recepções de material e entradas de stock.
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        <Button
          size="sm"
          onClick={onNewOrder}
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm text-xs font-semibold"
        >
          <Plus className="w-4 h-4" /> Novo Pedido
        </Button>
      </div>
    </div>
  );
}
