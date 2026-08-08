import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Upload, Trash2, ExternalLink, Image, Paperclip, CheckCircle2 } from "lucide-react";
import type { DeliveryDocument } from "@/lib/purchases";
import { toast } from "sonner";

interface DeliveryDocumentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliveryNumber: string;
  documents: DeliveryDocument[];
  onAddDocument: (doc: DeliveryDocument) => void;
  onRemoveDocument: (docId: string) => void;
  canManageDocs?: boolean;
}

export function DeliveryDocumentsModal({
  open,
  onOpenChange,
  deliveryNumber,
  documents = [],
  onAddDocument,
  onRemoveDocument,
  canManageDocs = true,
}: DeliveryDocumentsModalProps) {
  const [category, setCategory] = useState<DeliveryDocument["category"]>("remittance_note");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("O ficheiro excede o limite máximo de 10MB.");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    const newDoc: DeliveryDocument = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      deliveryId: deliveryNumber,
      fileName: selectedFile.name,
      fileType: selectedFile.type || "application/pdf",
      fileSize: selectedFile.size,
      fileUrl: URL.createObjectURL(selectedFile),
      category,
      uploadedAt: new Date().toISOString(),
      uploadedByUserName: "Fiel de Armazém",
    };

    onAddDocument(newDoc);
    setSelectedFile(null);
    toast.success(`Documento "${selectedFile.name}" associado à entrega com sucesso!`);
  };

  const getCategoryBadge = (cat: DeliveryDocument["category"]) => {
    const map: Record<DeliveryDocument["category"], { label: string; color: string }> = {
      remittance_note: { label: "Guia de Remessa", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
      invoice: { label: "Fatura", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
      cargo_photo: { label: "Foto da Carga", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
      material_photo: { label: "Foto dos Materiais", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
      proof_of_delivery: { label: "Comprovativo", color: "bg-teal-500/10 text-teal-600 border-teal-500/20" },
      signature: { label: "Assinatura", color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" },
      other: { label: "Outro", color: "bg-slate-500/10 text-slate-600 border-slate-500/20" },
    };

    const cfg = map[cat] || map.other;
    return (
      <Badge variant="outline" className={`text-[10px] ${cfg.color}`}>
        {cfg.label}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm font-bold">
            <Paperclip className="w-4 h-4 text-primary" />
            <span>Documentos e Evidências da Entrega {deliveryNumber}</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Lista real de anexos guardados e formulário de upload de evidências físicas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Formulário de Upload */}
          {canManageDocs && (
            <form onSubmit={handleUpload} className="p-3 bg-muted/40 rounded-lg border border-border/60 space-y-2 text-xs">
              <Label className="text-[11px] font-bold">Anexar Novo Documento / Foto</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Select value={category} onValueChange={(v) => setCategory(v as any)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="remittance_note">Guia de Remessa</SelectItem>
                    <SelectItem value="invoice">Fatura do Fornecedor</SelectItem>
                    <SelectItem value="cargo_photo">Foto da Carga / Veículo</SelectItem>
                    <SelectItem value="material_photo">Foto dos Materiais</SelectItem>
                    <SelectItem value="proof_of_delivery">Comprovativo de Entrega</SelectItem>
                    <SelectItem value="signature">Assinatura do Recetor</SelectItem>
                    <SelectItem value="other">Outro Documento</SelectItem>
                  </SelectContent>
                </Select>

                <Input type="file" onChange={handleFileChange} className="h-8 text-xs" accept=".pdf,image/*" />
              </div>

              <div className="flex justify-end pt-1">
                <Button type="submit" disabled={!selectedFile} size="xs" className="gap-1 bg-primary text-primary-foreground">
                  <Upload className="w-3 h-3" />
                  <span>Anexar Ficheiro</span>
                </Button>
              </div>
            </form>
          )}

          {/* Lista dos Documentos Reais */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Anexos Registados ({documents.length})</Label>
            {documents.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
                Sem documentos ou fotografias anexados a esta entrega.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-2.5 border rounded-lg bg-background flex items-center justify-between gap-2 text-xs hover:border-border"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1.5 rounded bg-muted text-muted-foreground shrink-0">
                        {doc.fileType.startsWith("image/") ? <Image className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <div className="font-semibold text-foreground truncate text-xs">{doc.fileName}</div>
                        <div className="flex items-center gap-2">
                          {getCategoryBadge(doc.category)}
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {(doc.fileSize / 1024).toFixed(0)} KB
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="xs" variant="ghost" asChild className="h-7 w-7 p-0">
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" title="Abrir / Download">
                          <ExternalLink className="w-3.5 h-3.5 text-primary" />
                        </a>
                      </Button>
                      {canManageDocs && (
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => {
                            onRemoveDocument(doc.id);
                            toast.success("Documento removido.");
                          }}
                          className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50"
                          title="Remover"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
