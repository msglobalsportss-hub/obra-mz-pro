import React from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface BreadcrumbItem {
  label: string;
  to?: string;
  icon?: React.ReactNode;
}

interface PageBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function PageBreadcrumb({ items, className }: PageBreadcrumbProps) {
  const allItems: BreadcrumbItem[] = [
    { label: "Dashboard", to: "/app", icon: <Home className="w-3.5 h-3.5" /> },
    ...items,
  ];

  return (
    <TooltipProvider>
      <nav
        aria-label="Navegação estrutural"
        className={cn("flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1 flex-wrap", className)}
      >
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const isTruncated = item.label.length > 22;
          const displayLabel = isTruncated ? `${item.label.slice(0, 20)}...` : item.label;

          const content = (
            <span className="flex items-center gap-1">
              {item.icon}
              <span className={cn(isLast && "font-semibold text-slate-800 dark:text-slate-200")}>
                {displayLabel}
              </span>
            </span>
          );

          return (
            <React.Fragment key={index}>
              {index > 0 && <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />}

              {!isLast && item.to ? (
                isTruncated ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link to={item.to} className="hover:text-blue-600 transition-colors">
                        {content}
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">{item.label}</TooltipContent>
                  </Tooltip>
                ) : (
                  <Link to={item.to} className="hover:text-blue-600 transition-colors">
                    {content}
                  </Link>
                )
              ) : isTruncated ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>{content}</span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">{item.label}</TooltipContent>
                </Tooltip>
              ) : (
                content
              )}
            </React.Fragment>
          );
        })}
      </nav>
    </TooltipProvider>
  );
}
