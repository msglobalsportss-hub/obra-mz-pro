import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, Download, RotateCcw } from "lucide-react";

interface PhotoItem {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt?: string;
  uploadedByUserName?: string;
}

interface DeliveryPhotoGalleryProps {
  photos: PhotoItem[];
  initialIndex?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeliveryPhotoGallery({
  photos,
  initialIndex = 0,
  open,
  onOpenChange,
}: DeliveryPhotoGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);

  // Resetar zoom ao mudar de imagem
  useEffect(() => {
    setZoom(1);
  }, [currentIndex]);

  // Resetar para índice inicial quando abre
  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
      setZoom(1);
    }
  }, [open, initialIndex]);

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % photos.length);
  }, [photos.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i - 1 + photos.length) % photos.length);
  }, [photos.length]);

  // Navegação por teclado
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "Escape") onOpenChange(false);
      if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(z + 0.25, 3));
      if (e.key === "-") setZoom((z) => Math.max(z - 0.25, 0.5));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, goNext, goPrev, onOpenChange]);

  if (photos.length === 0) return null;

  const current = photos[currentIndex];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl w-full p-0 bg-black/95 border-black overflow-hidden"
        style={{ maxHeight: "90vh" }}
      >
        <DialogTitle className="sr-only">
          Galeria de Fotografias — {current?.fileName}
        </DialogTitle>

        {/* Barra Superior */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
          <div className="text-white/80 text-xs">
            <span className="font-semibold text-white">{current?.fileName}</span>
            {current?.uploadedByUserName && (
              <span className="ml-2 text-white/60">· {current.uploadedByUserName}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-white/60 text-xs mr-2">
              {currentIndex + 1} / {photos.length}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
              className="h-7 w-7 p-0 text-white/80 hover:text-white hover:bg-white/10"
              title="Diminuir zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setZoom(1)}
              className="h-7 px-2 text-white/80 hover:text-white hover:bg-white/10 text-xs font-mono"
              title="Zoom real"
            >
              {Math.round(zoom * 100)}%
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}
              className="h-7 w-7 p-0 text-white/80 hover:text-white hover:bg-white/10"
              title="Aumentar zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setZoom(1)}
              className="h-7 w-7 p-0 text-white/80 hover:text-white hover:bg-white/10"
              title="Repor zoom"
            >
              <RotateCcw className="w-3 h-3" />
            </Button>
            <a href={current?.fileUrl} download={current?.fileName} target="_blank" rel="noopener noreferrer">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-white/80 hover:text-white hover:bg-white/10"
                title="Download"
              >
                <Download className="w-3.5 h-3.5" />
              </Button>
            </a>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-7 w-7 p-0 text-white/80 hover:text-white hover:bg-white/10 ml-1"
              title="Fechar (Esc)"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Área da Imagem */}
        <div className="relative flex items-center justify-center" style={{ height: "75vh" }}>
          {/* Botão Anterior */}
          {photos.length > 1 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={goPrev}
              className="absolute left-3 z-10 h-10 w-10 p-0 text-white/80 hover:text-white hover:bg-white/10 rounded-full"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
          )}

          {/* Imagem com zoom */}
          <div className="overflow-hidden flex items-center justify-center w-full h-full">
            <img
              src={current?.fileUrl}
              alt={current?.fileName}
              className="object-contain max-w-full max-h-full transition-transform duration-200"
              style={{ transform: `scale(${zoom})`, cursor: zoom > 1 ? "zoom-out" : "zoom-in" }}
              onClick={() => setZoom((z) => z > 1 ? 1 : Math.min(z + 0.5, 2))}
              draggable={false}
            />
          </div>

          {/* Botão Seguinte */}
          {photos.length > 1 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={goNext}
              className="absolute right-3 z-10 h-10 w-10 p-0 text-white/80 hover:text-white hover:bg-white/10 rounded-full"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          )}
        </div>

        {/* Miniaturas na base */}
        {photos.length > 1 && (
          <div className="flex items-center justify-center gap-2 px-4 pb-4 pt-2 bg-gradient-to-t from-black/80 to-transparent flex-wrap">
            {photos.map((photo, idx) => (
              <button
                key={photo.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-12 h-12 rounded overflow-hidden border-2 transition-all shrink-0 ${
                  idx === currentIndex ? "border-white scale-110" : "border-white/30 opacity-60 hover:opacity-80"
                }`}
              >
                <img src={photo.fileUrl} alt={photo.fileName} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
