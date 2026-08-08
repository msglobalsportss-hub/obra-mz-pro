import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PageBreadcrumb, type BreadcrumbItem } from "@/components/shared/breadcrumb";

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  className?: string;
}) {
  return (
    <div className={cn("mb-6 space-y-2", className)}>
      {breadcrumbs && <PageBreadcrumb items={breadcrumbs} />}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
            {title}
          </h1>
          {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}

export function StatusBadge({
  tone, children,
}: {
  tone: "success" | "warning" | "info" | "destructive" | "muted" | "primary";
  children: ReactNode;
}) {
  const map = {
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning-foreground",
    info: "bg-blue-50 text-blue-700",
    destructive: "bg-red-50 text-destructive",
    muted: "bg-muted text-muted-foreground",
    primary: "bg-primary-soft text-primary-dark",
  } as const;
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
      map[tone],
    )}>
      <span className={cn("h-1.5 w-1.5 rounded-full", {
        "bg-success": tone === "success",
        "bg-warning": tone === "warning",
        "bg-blue-600": tone === "info",
        "bg-destructive": tone === "destructive",
        "bg-muted-foreground": tone === "muted",
        "bg-primary": tone === "primary",
      })} />
      {children}
    </span>
  );
}
