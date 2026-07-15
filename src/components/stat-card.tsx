import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label, value, hint, icon: Icon, tone = "default", className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  tone?: "default" | "primary" | "success" | "warning" | "destructive";
  className?: string;
}) {
  const toneMap = {
    default: "bg-muted text-foreground",
    primary: "bg-primary-soft text-primary-dark",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning-foreground",
    destructive: "bg-red-50 text-destructive",
  } as const;

  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">{value}</div>
          {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
        </div>
        {Icon && (
          <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-lg", toneMap[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </Card>
  );
}
