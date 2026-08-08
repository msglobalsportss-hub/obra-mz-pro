import React from "react";
import { Badge } from "@/components/ui/badge";
import type { PurchaseOrderStatus, DeliveryStatus } from "@/lib/purchases";
import { purchaseOrderStatusLabel, deliveryStatusLabel } from "@/lib/purchases";
import {
  Pencil,
  CheckCircle2,
  Send,
  Clock,
  PackageCheck,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface PurchaseOrderStatusBadgeProps {
  status: PurchaseOrderStatus;
  className?: string;
  showIcon?: boolean;
}

export function PurchaseOrderStatusBadge({
  status,
  className,
  showIcon = true,
}: PurchaseOrderStatusBadgeProps) {
  const icons: Record<PurchaseOrderStatus, React.ReactNode> = {
    draft: <Pencil className="w-3 h-3 shrink-0 mr-1" />,
    pending_approval: <AlertCircle className="w-3 h-3 shrink-0 mr-1" />,
    approved: <CheckCircle2 className="w-3 h-3 shrink-0 mr-1" />,
    sent: <Send className="w-3 h-3 shrink-0 mr-1" />,
    partially_received: <Clock className="w-3 h-3 shrink-0 mr-1" />,
    received: <PackageCheck className="w-3 h-3 shrink-0 mr-1" />,
    cancelled: <XCircle className="w-3 h-3 shrink-0 mr-1" />,
  };

  const customStyles: Record<PurchaseOrderStatus, string> = {
    draft: "border-slate-300 text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    pending_approval: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
    approved: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
    sent: "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800",
    partially_received: "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800",
    received: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
    cancelled: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
  };

  return (
    <Badge
      variant="outline"
      className={`inline-flex items-center font-medium px-2.5 py-0.5 text-xs rounded-full transition-colors ${customStyles[status]} ${className || ""}`}
    >
      {showIcon && icons[status]}
      <span>{purchaseOrderStatusLabel[status] || status}</span>
    </Badge>
  );
}

interface DeliveryStatusBadgeProps {
  status: DeliveryStatus;
  className?: string;
}

export function DeliveryStatusBadge({ status, className }: DeliveryStatusBadgeProps) {
  const customStyles: Record<DeliveryStatus, string> = {
    draft: "border-slate-300 text-slate-700 bg-slate-50 dark:bg-slate-900/50 dark:text-slate-300 dark:border-slate-700",
    confirmed: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
    cancelled: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
  };

  return (
    <Badge
      variant="outline"
      className={`font-medium px-2.5 py-0.5 text-xs rounded-full transition-colors ${customStyles[status]} ${className || ""}`}
    >
      {deliveryStatusLabel[status] || status}
    </Badge>
  );
}
