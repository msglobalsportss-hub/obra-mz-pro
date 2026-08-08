import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock, Circle, Activity, ArrowRight, Truck, Package, HardHat, FileText } from "lucide-react";
import { formatDate } from "@/lib/format";

export interface UnifiedTimelineEvent {
  id: string;
  stage: "po_created" | "po_approved" | "delivery_created" | "delivery_received" | "stock_updated" | "site_consumed";
  title: string;
  description: string;
  date?: string;
  user?: string;
  status: "completed" | "current" | "pending";
}

interface UnifiedTimelineProps {
  events: UnifiedTimelineEvent[];
}

const STAGE_ICON_MAP = {
  po_created: FileText,
  po_approved: CheckCircle2,
  delivery_created: Truck,
  delivery_received: Clock,
  stock_updated: Package,
  site_consumed: HardHat,
};

export function UnifiedTimeline({ events }: UnifiedTimelineProps) {
  if (!events || events.length === 0) return null;

  return (
    <Card className="border-border/60 bg-card shadow-sm">
      <CardHeader className="py-3 px-4 bg-muted/20 border-b border-border/60">
        <CardTitle className="text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <span>Histórico Cronológico Unificado Inter-Módulos</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-normal">Fluxo completo do pedido ao consumo</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="relative pl-6 border-l-2 border-primary/30 space-y-4 text-xs">
          {events.map((evt, idx) => {
            const isCompleted = evt.status === "completed";
            const isCurrent = evt.status === "current";
            const IconComp = STAGE_ICON_MAP[evt.stage] || Activity;

            return (
              <div key={evt.id || idx} className="relative group">
                {/* Ponto indicador da linha do tempo */}
                <div
                  className={`absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full border-2 transition-all flex items-center justify-center ${
                    isCompleted
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : isCurrent
                      ? "bg-blue-600 border-blue-600 text-white animate-pulse"
                      : "bg-background border-muted-foreground/40 text-muted-foreground"
                  }`}
                />

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-bold ${
                        isCompleted
                          ? "text-foreground"
                          : isCurrent
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      {evt.title}
                    </span>
                    {evt.date && (
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {formatDate(evt.date)}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    {evt.description}
                  </p>
                  {evt.user && (
                    <span className="text-[10px] text-muted-foreground/80 block">
                      Responsável: {evt.user}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
