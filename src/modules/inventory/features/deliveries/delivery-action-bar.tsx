import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ClipboardCheck,
  PackageCheck,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Printer,
  ArrowLeft,
  ExternalLink,
  AlertTriangle,
  Undo2,
} from "lucide-react";
import { canTransitionDeliveryStatus } from "@/lib/purchases";
import type { Delivery, DeliveryStatus } from "@/lib/purchases";
import { Link } from "@tanstack/react-router";

interface DeliveryActionBarProps {
  delivery: Delivery;
  hasDivergences: boolean;
  canConfirm: boolean;            // true se totalQtyReceived > 0
  destinationProjectId?: string;
  onStartInspection: () => void;
  onOpenConference: () => void;
  onReceiveAll: () => void;
  onCancelConference: () => void;  // volta para 'arrived' (NÃO cancela a entrega)
  onCancelDelivery: () => void;    // cancela a entrega (irreversível)
  onOpenSummary: () => void;       // abre o Resumo Final (não confirma directamente)
  onPrint: () => void;
}

const STATUS_LABELS: Partial<Record<DeliveryStatus, string>> = {
  expected: "Aguardando receção",
  draft: "Aguardando receção",
  in_transit: "Em Trânsito",
  arrived: "Chegada ao destino",
  in_inspection: "Em Conferência",
  partially_received: "Parcialmente recebida",
  received: "Recebida",
  received_with_divergence: "Recebida com divergências",
  confirmed: "Confirmada",
  rejected: "Rejeitada",
  cancelled: "Cancelada",
};

export function DeliveryActionBar({
  delivery,
  hasDivergences,
  canConfirm,
  destinationProjectId,
  onStartInspection,
  onOpenConference,
  onReceiveAll,
  onCancelConference,
  onCancelDelivery,
  onOpenSummary,
  onPrint,
}: DeliveryActionBarProps) {
  const [showCancelDeliveryDialog, setShowCancelDeliveryDialog] = useState(false);
  const [showReceiveAllWarning, setShowReceiveAllWarning] = useState(false);

  const status = delivery.status;
  const isConfirmed = status === "confirmed";
  const isCancelled = status === "cancelled" || status === "rejected";

  // --- Ação "Receber Tudo" ---
  const handleReceiveAll = () => {
    if (hasDivergences) {
      setShowReceiveAllWarning(true);
    } else {
      onReceiveAll();
    }
  };

  if (isCancelled || isConfirmed) {
    // Estados finais — sem ações operacionais
    return (
      <div className="flex flex-wrap items-center gap-2 py-3 px-4 bg-muted/20 border border-border/60 rounded-xl">
        <Link to="/app/inventory/deliveries">
          <Button size="sm" variant="outline" className="gap-1.5 h-8">
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar às Entregas
          </Button>
        </Link>
        {isConfirmed && destinationProjectId && (
          <Link to="/app/obras/$id" params={{ id: destinationProjectId }}>
            <Button size="sm" className="gap-1.5 h-8 bg-emerald-600 hover:bg-emerald-700 text-white">
              <ExternalLink className="w-3.5 h-3.5" />
              Abrir Obra
            </Button>
          </Link>
        )}
        {isConfirmed && (
          <Button size="sm" variant="outline" onClick={onPrint} className="gap-1.5 h-8">
            <Printer className="w-3.5 h-3.5" />
            Imprimir Ficha
          </Button>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {STATUS_LABELS[status]}
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 py-3 px-4 bg-muted/20 border border-border/60 rounded-xl">

        {/* Ações Primárias — visíveis conforme estado */}

        {/* Iniciar Conferência (expected/draft/arrived) */}
        {(status === "expected" || status === "draft" || status === "arrived") &&
          canTransitionDeliveryStatus(status, "in_inspection") && (
            <Button
              size="sm"
              onClick={onStartInspection}
              className="gap-1.5 h-8 bg-blue-600 hover:bg-blue-700 text-white"
              id="btn-iniciar-conferencia"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              Iniciar Conferência
            </Button>
          )}

        {/* Receber Tudo (in_inspection) */}
        {status === "in_inspection" && (
          <Button
            size="sm"
            onClick={handleReceiveAll}
            variant={hasDivergences ? "outline" : "default"}
            className={`gap-1.5 h-8 ${hasDivergences ? "border-amber-400 text-amber-700 hover:bg-amber-50" : "bg-primary text-primary-foreground"}`}
            id="btn-receber-tudo"
          >
            {hasDivergences ? (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            ) : (
              <PackageCheck className="w-3.5 h-3.5" />
            )}
            Receber Tudo
          </Button>
        )}

        {/* Conferir Carga (in_inspection ou partially_received) */}
        {(status === "in_inspection" || status === "partially_received") && (
          <Button
            size="sm"
            onClick={onOpenConference}
            className="gap-1.5 h-8 bg-primary text-primary-foreground hover:bg-primary/90"
            id="btn-conferir-carga"
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            {status === "partially_received" ? "Nova Receção Parcial" : "Conferir Carga"}
          </Button>
        )}

        {/* Confirmar Receção (partially_received / received / received_with_divergence) */}
        {(status === "partially_received" || status === "received" || status === "received_with_divergence") &&
          canConfirm && (
            <Button
              size="sm"
              onClick={onOpenSummary}
              className="gap-1.5 h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
              id="btn-confirmar-rececao"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Confirmar Receção
            </Button>
          )}

        {/* Voltar às Entregas (sempre) */}
        <Link to="/app/inventory/deliveries">
          <Button size="sm" variant="outline" className="gap-1.5 h-8">
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar
          </Button>
        </Link>

        {/* Dropdown — Ações Secundárias */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1.5 h-8 ml-auto" id="btn-mais-opcoes">
              <MoreVertical className="w-3.5 h-3.5" />
              Mais opções
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">

            {/* Cancelar Conferência — volta para 'arrived', NÃO cancela a entrega */}
            {status === "in_inspection" && (
              <DropdownMenuItem onClick={onCancelConference} className="gap-2 text-xs">
                <Undo2 className="w-3.5 h-3.5 text-muted-foreground" />
                <div>
                  <div className="font-medium">Cancelar Conferência</div>
                  <div className="text-[10px] text-muted-foreground">Entrega mantida. Apenas pausa a conferência.</div>
                </div>
              </DropdownMenuItem>
            )}

            <DropdownMenuItem onClick={onPrint} className="gap-2 text-xs">
              <Printer className="w-3.5 h-3.5 text-muted-foreground" />
              Imprimir Ficha
            </DropdownMenuItem>

            {canTransitionDeliveryStatus(status, "cancelled") && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowCancelDeliveryDialog(true)}
                  className="gap-2 text-xs text-rose-600 focus:text-rose-700 focus:bg-rose-50"
                  id="btn-cancelar-entrega"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <div>
                    <div className="font-medium">Cancelar Entrega</div>
                    <div className="text-[10px] text-rose-500">Operação irreversível.</div>
                  </div>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <span className="text-xs text-muted-foreground ml-2">
          {STATUS_LABELS[status]}
        </span>
      </div>

      {/* Aviso inline "Receber Tudo" com divergências */}
      {showReceiveAllWarning && (
        <Alert className="border-amber-400 bg-amber-50/60 text-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <AlertDescription className="text-xs flex items-center justify-between gap-4">
            <span>
              <strong>Existem divergências identificadas nesta entrega.</strong>{" "}
              Para uma receção correta, utilize <em>"Conferir Carga"</em> e registe as quantidades reais por item.
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" variant="outline" onClick={() => setShowReceiveAllWarning(false)} className="h-7 text-xs">
                Usar Conferir Carga
              </Button>
              <Button
                size="sm"
                onClick={() => { setShowReceiveAllWarning(false); onReceiveAll(); }}
                className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white"
              >
                Continuar na mesma
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Diálogo de confirmação — Cancelar Entrega (destrutivo) */}
      <AlertDialog open={showCancelDeliveryDialog} onOpenChange={setShowCancelDeliveryDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
              <XCircle className="w-5 h-5" />
              Cancelar Entrega {delivery.deliveryNumber}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm space-y-2">
              <p>Esta operação é <strong>irreversível</strong>.</p>
              <p>A entrega será cancelada e não poderá ser retomada. O Pedido de Compra associado permanece ativo.</p>
              <p className="text-rose-600 font-medium">Esta ação é diferente de "Cancelar Conferência" — cancela definitivamente toda a entrega.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { setShowCancelDeliveryDialog(false); onCancelDelivery(); }}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Cancelar Entrega Definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
