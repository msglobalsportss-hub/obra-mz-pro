import React, { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/format";
import {
  FileText,
  Upload,
  Trash2,
  ExternalLink,
  Image,
  Paperclip,
  Receipt,
  FileSignature,
  Camera,
  FolderOpen,
  ZoomIn,
} from "lucide-react";
import type { DeliveryDocument } from "@/lib/purchases";
import { DeliveryPhotoGallery } from "./delivery-photo-gallery";
import { toast } from "sonner";

interface DeliveryDocumentsSectionProps {
  documents: DeliveryDocument[];
  onAddDocument: (doc: DeliveryDocument) => void;
  onRemoveDocument: (docId: string) => void;
  canManageDocs?: boolean;
}

type DocCategory = DeliveryDocument["category"];

const CATEGORIES: { key: DocCategory; label: string; icon: React.ElementType; color: string }[] = [
  { key: "remittance_note", label: "Guia de Remessa", icon: FileText, color: "text-blue-600" },
  { key: "invoice",         label: "Fatura",          icon: Receipt,   color: "text-emerald-600" },
  { key: "cargo_photo",     label: "Foto da Carga",   icon: Camera,    color: "text-amber-600" },
  { key: "material_photo",  label: "Foto Materiais",  icon: Image,     color: "text-purple-600" },
  { key: "proof_of_delivery", label: "Comprovativo", icon: Paperclip, color: "text-teal-600" },
  { key: "signature",       label: "Assinatura",      icon: FileSignature, color: "text-indigo-600" },
  { key: "other",           label: "Outros",          icon: FolderOpen, color: "text-slate-600" },
];

const PHOTO_CATEGORIES: DocCategory[] = ["cargo_photo", "material_photo"];

export function DeliveryDocumentsSection({
  documents = [],
  onAddDocument,
  onRemoveDocument,
  canManageDocs = true,
}: DeliveryDocumentsSectionProps) {
  const [category, setCategory] = useState<DocCategory>("remittance_note");
  const [isDragging, setIsDragging] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const photos = documents.filter((d) => PHOTO_CATEGORIES.includes(d.category) && d.fileType.startsWith("image/"));

  const processFile = useCallback((file: File, cat: DocCategory) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("O ficheiro excede o limite máximo de 10MB.");
      return;
    }

    const newDoc: DeliveryDocument = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      deliveryId: "",
      fileName: file.name,
      fileType: file.type || "application/octet-stream",
      fileSize: file.size,
      fileUrl: URL.createObjectURL(file),
      category: cat,
      uploadedAt: new Date().toISOString(),
      uploadedByUserName: "Fiel de Armazém",
    };

    onAddDocument(newDoc);
    toast.success(`"${file.name}" associado à entrega.`);
  }, [onAddDocument]);

  const handleFiles = useCallback((files: FileList | File[], cat: DocCategory) => {
    Array.from(files).forEach((f) => processFile(f, cat));
  }, [processFile]);

  // Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files, category);
    }
  };

  const openPhoto = (doc: DeliveryDocument) => {
    const idx = photos.findIndex((p) => p.id === doc.id);
    setGalleryIndex(Math.max(0, idx));
    setGalleryOpen(true);
  };

  return (
    <>
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="py-3 px-4 bg-muted/20 border-b border-border/60">
          <CardTitle className="text-xs font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-primary" />
              <span>Documentos e Evidências ({documents.length})</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-normal">PDF, PNG, JPG · máx. 10MB</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          {/* Upload & Tirar Fotografia */}
          {canManageDocs && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Categoria:</span>
                  <Select value={category} onValueChange={(v) => setCategory(v as DocCategory)}>
                    <SelectTrigger className="h-8 text-xs w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.key} value={cat.key} className="text-xs">{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Botão Tirar Fotografia para Telemóvel/Câmara */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => cameraInputRef.current?.click()}
                  className="h-8 gap-1.5 text-xs border-purple-200 text-purple-700 dark:border-purple-900/40 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/20"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>📷 Tirar Fotografia</span>
                </Button>

                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      handleFiles(e.target.files, "cargo_photo");
                      e.target.value = "";
                    }
                  }}
                />
              </div>

              <div
                role="button"
                tabIndex={0}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                  isDragging
                    ? "border-primary bg-primary/5 scale-[1.01]"
                    : "border-border/60 hover:border-primary/50 hover:bg-muted/30"
                }`}
              >
                <Upload className={`w-6 h-6 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                <div className="text-center">
                  <p className="text-xs font-medium text-foreground">
                    {isDragging ? "Largar aqui para anexar" : "Arraste os ficheiros aqui"}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    ou{" "}
                    <span className="text-primary underline underline-offset-2">clique para selecionar</span>
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  accept=".pdf,image/*"
                  onChange={(e) => {
                    if (e.target.files) {
                      handleFiles(e.target.files, category);
                      e.target.value = "";
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* Documentos por Categoria */}
          {documents.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground border border-dashed rounded-lg">
              Nenhum documento ou fotografia anexado a esta entrega.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {CATEGORIES.map(({ key: catKey, label: catLabel, icon: CatIcon, color: catColor }) => {
                const catDocs = documents.filter((d) => d.category === catKey);
                if (!canManageDocs && catDocs.length === 0) return null;

                return (
                  <div key={catKey} className="border border-border/60 rounded-lg overflow-hidden">
                    {/* Cabeçalho da categoria */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-muted/20 border-b border-border/60">
                      <CatIcon className={`w-3.5 h-3.5 ${catColor}`} />
                      <span className="text-xs font-semibold text-foreground">{catLabel}</span>
                      <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0">
                        {catDocs.length}
                      </Badge>
                    </div>

                    {/* Ficheiros desta categoria */}
                    <div className="p-2 space-y-1.5 min-h-[60px]">
                      {catDocs.length === 0 ? (
                        <div className="flex items-center justify-center py-3 text-[11px] text-muted-foreground">
                          ○ Sem ficheiros
                        </div>
                      ) : (
                        catDocs.map((doc) => {
                          const isPhoto = PHOTO_CATEGORIES.includes(doc.category) && doc.fileType.startsWith("image/");

                          return (
                            <div key={doc.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/40 transition-colors group">
                              {/* Thumbnail para imagens */}
                              {isPhoto ? (
                                <button
                                  onClick={() => openPhoto(doc)}
                                  className="w-10 h-10 rounded overflow-hidden border border-border/60 shrink-0 relative hover:opacity-80 transition-opacity"
                                  title="Abrir galeria"
                                >
                                  <img src={doc.fileUrl} alt={doc.fileName} className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <ZoomIn className="w-3 h-3 text-white" />
                                  </div>
                                </button>
                              ) : (
                                <div className="w-10 h-10 rounded bg-muted border border-border/60 shrink-0 flex items-center justify-center text-muted-foreground">
                                  <FileText className="w-4 h-4" />
                                </div>
                              )}

                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-medium truncate text-foreground">{doc.fileName}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {(doc.fileSize / 1024).toFixed(0)} KB
                                  {doc.uploadedAt && ` · ${formatDate(doc.uploadedAt)}`}
                                </p>
                              </div>

                              <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  asChild
                                  className="h-6 w-6 p-0"
                                  title="Abrir"
                                >
                                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </Button>
                                {canManageDocs && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onRemoveDocument(doc.id)}
                                    className="h-6 w-6 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                                    title="Remover"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Galeria Lightbox */}
      <DeliveryPhotoGallery
        photos={photos.map((d) => ({
          id: d.id,
          fileName: d.fileName,
          fileUrl: d.fileUrl,
          fileSize: d.fileSize,
          uploadedAt: d.uploadedAt,
          uploadedByUserName: d.uploadedByUserName,
        }))}
        initialIndex={galleryIndex}
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
      />
    </>
  );
}
