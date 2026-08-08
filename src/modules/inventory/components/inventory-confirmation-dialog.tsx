/**
 * Diálogo de Confirmação: InventoryConfirmationDialog
 * Categoria: components
 */

import React, { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";

interface InventoryConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive" | "amber";
  loading?: boolean;
  onConfirm: () => void;
  children?: ReactNode;
}

export function InventoryConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "default",
  loading = false,
  onConfirm,
  children,
}: InventoryConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            {variant === "destructive" || variant === "amber" ? (
              <AlertTriangle
                className={
                  variant === "destructive" ? "w-5 h-5 text-destructive" : "w-5 h-5 text-amber-500"
                }
              />
            ) : null}
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription className="pt-2 text-sm text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>

        {children}

        <DialogFooter className="mt-4 flex flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={loading}
            className="gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{confirmLabel}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
