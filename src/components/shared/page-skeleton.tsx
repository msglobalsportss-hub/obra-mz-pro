import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-slate-200 dark:bg-slate-800 rounded-md", className)} />;
}

export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse p-4 sm:p-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <SkeletonBlock className="h-4 w-48" />
          <SkeletonBlock className="h-8 w-64" />
          <SkeletonBlock className="h-4 w-80" />
        </div>
        <SkeletonBlock className="h-9 w-32 shrink-0" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4 space-y-3">
            <div className="flex justify-between items-center">
              <SkeletonBlock className="h-3 w-24" />
              <SkeletonBlock className="h-8 w-8 rounded-lg" />
            </div>
            <SkeletonBlock className="h-7 w-32" />
            <SkeletonBlock className="h-3 w-40" />
          </Card>
        ))}
      </div>

      {/* Table / Content Skeleton */}
      <Card className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <SkeletonBlock className="h-9 w-64" />
          <SkeletonBlock className="h-9 w-40" />
        </div>

        <div className="space-y-3 pt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-12 w-full" />
          ))}
        </div>
      </Card>
    </div>
  );
}
