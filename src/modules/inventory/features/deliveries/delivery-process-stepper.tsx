import React from "react";
import { CheckCircle2, Clock, Circle } from "lucide-react";

export type StepStatus = "completed" | "current" | "pending";

export interface DeliveryStep {
  id: number;
  label: string;
  sublabel: string;
  status: StepStatus;
}

interface DeliveryProcessStepperProps {
  steps: DeliveryStep[];
}

export function DeliveryProcessStepper({ steps }: DeliveryProcessStepperProps) {
  return (
    <div className="w-full bg-card border border-border/60 rounded-xl p-4 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative">
        {steps.map((step, idx) => {
          const isCompleted = step.status === "completed";
          const isCurrent = step.status === "current";

          return (
            <div
              key={step.id}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                isCurrent
                  ? "bg-primary/5 border-primary text-primary shadow-sm"
                  : isCompleted
                  ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                  : "bg-muted/20 border-border/50 text-muted-foreground"
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                ) : isCurrent ? (
                  <div className="relative flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary animate-pulse" />
                  </div>
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground/60" />
                )}
              </div>
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                    Passo {idx + 1}
                  </span>
                  {isCompleted && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">✓</span>
                  )}
                  {isCurrent && (
                    <span className="text-[10px] font-bold text-primary">⏳ Em Curso</span>
                  )}
                </div>
                <h4 className="text-xs font-bold truncate leading-snug">{step.label}</h4>
                <p className="text-[11px] opacity-80 truncate leading-snug">{step.sublabel}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
