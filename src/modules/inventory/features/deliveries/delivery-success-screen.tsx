import React from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Building2, HardHat, BarChart2, PackagePlus, ArrowLeft, ListOrdered } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Delivery } from "@/lib/purchases";

interface DeliverySuccessScreenProps {
  delivery: Delivery;
  /** Nome do destino (obra ou armazém) */
  destinationName: string;
  totalAccepted: number;
  movementsCreated: number;
  documentsArchived: number;
  purchaseOrderNumber?: string;
  onNewDelivery: () => void;
  onBackToList: () => void;
}

export function DeliverySuccessScreen({
  delivery,
  destinationName,
  totalAccepted,
  movementsCreated,
  documentsArchived,
  purchaseOrderNumber,
  onNewDelivery,
  onBackToList,
}: DeliverySuccessScreenProps) {
  const isProject = delivery.destinationType !== "central_stock";

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center space-y-8 max-w-lg mx-auto">

      {/* Ícone de Sucesso */}
      <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-4 border-emerald-500/30 flex items-center justify-center">
        <CheckCircle2 className="w-10 h-10 text-emerald-600" />
      </div>

      {/* Título e Subtítulo */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Receção Concluída</h2>
        <p className="text-sm text-muted-foreground">
          <span className="font-mono font-bold text-foreground">{delivery.deliveryNumber}</span>
          {delivery.deliveryNoteNumber && (
            <span className="text-muted-foreground"> · Guia: {delivery.deliveryNoteNumber}</span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          O stock foi atualizado com sucesso. Os materiais foram enviados para:
        </p>
        <p className="text-sm font-bold text-foreground flex items-center justify-center gap-1.5">
          {isProject ? (
            <HardHat className="w-4 h-4 text-amber-500" />
          ) : (
            <Building2 className="w-4 h-4 text-blue-500" />
          )}
          {isProject ? "Obra" : "Armazém"} · {destinationName}
        </p>
      </div>

      {/* Resumo dos Resultados */}
      <div className="w-full space-y-2 text-sm text-left">
        {[
          { icon: CheckCircle2, color: "text-emerald-600", label: `${totalAccepted} unidades de stock atualizadas` },
          { icon: CheckCircle2, color: "text-emerald-600", label: `${movementsCreated} movimentos de stock registados` },
          { icon: CheckCircle2, color: "text-emerald-600", label: `${documentsArchived} documento(s) arquivado(s)` },
          ...(purchaseOrderNumber ? [{ icon: CheckCircle2, color: "text-emerald-600", label: `Pedido de Compra ${purchaseOrderNumber} atualizado` }] : []),
        ].map(({ icon: Icon, color, label }) => (
          <div key={label} className={`flex items-center gap-2 ${color}`}>
            <Icon className="w-4 h-4 shrink-0" />
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* Ações de Continuação */}
      <div className="w-full grid grid-cols-2 gap-3">
        {isProject && delivery.destinationProjectId && (
          <Link to="/app/obras/$id" params={{ id: delivery.destinationProjectId }} className="col-span-2">
            <Button className="w-full gap-2 bg-amber-600 hover:bg-amber-700 text-white">
              <HardHat className="w-4 h-4" />
              Abrir Obra
            </Button>
          </Link>
        )}

        <Link to="/app/inventory/movements">
          <Button variant="outline" className="w-full gap-2">
            <BarChart2 className="w-4 h-4" />
            Ver Movimentos
          </Button>
        </Link>

        <Button variant="outline" onClick={onNewDelivery} className="w-full gap-2">
          <PackagePlus className="w-4 h-4" />
          Nova Entrega
        </Button>

        <Button
          variant="ghost"
          onClick={onBackToList}
          className="col-span-2 gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar à Lista de Entregas
        </Button>
      </div>
    </div>
  );
}
