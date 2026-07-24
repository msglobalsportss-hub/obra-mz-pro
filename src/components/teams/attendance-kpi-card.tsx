import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

type AttendanceKpiCardProps = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  warningText?: string;
  tooltipText?: string;
};

export function AttendanceKpiCard({
  title,
  value,
  icon,
  iconBg = "bg-primary/10",
  iconColor = "text-primary",
  warningText,
  tooltipText,
}: AttendanceKpiCardProps) {
  return (
    <Card className="bg-card hover:shadow-xs transition-all border border-border/80 cursor-help" title={tooltipText}>
      <CardContent className="p-4 flex items-center justify-between">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">
            {title}
          </div>
          <div className="text-xl font-black text-foreground truncate">
            {value}
          </div>
          {warningText && (
            <div className="flex items-center gap-1 text-[9px] text-amber-600 font-semibold mt-1">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              <span className="truncate">{warningText}</span>
            </div>
          )}
        </div>
        <div className={`h-9 w-9 rounded-lg ${iconBg} ${iconColor} flex items-center justify-center shrink-0 ml-2`}>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
