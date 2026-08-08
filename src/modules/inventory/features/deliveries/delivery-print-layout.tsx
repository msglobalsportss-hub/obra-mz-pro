/**
 * DeliveryPrintLayout
 *
 * Layout isolado de impressão.
 * Visível apenas via @media print.
 * Estrutura preparada para futura geração de PDF via html2pdf ou react-pdf.
 *
 * QR Code gerado com a biblioteca qrcode.react (verificar disponibilidade;
 * se não existir, fallback para texto com URL).
 */

import React from "react";
import { formatDate } from "@/lib/format";
import type { Delivery, DeliveryItem, PurchaseOrder } from "@/lib/purchases";

interface DeliveryPrintLayoutProps {
  delivery: Delivery;
  deliveryItems: DeliveryItem[];
  purchaseOrder?: PurchaseOrder;
  supplierName: string;
  destinationLabel: string;
  companyName?: string;
  companyNif?: string;
  /** URL completo da entrega para o QR Code */
  deliveryUrl: string;
}

/** Componente QR Code com fallback seguro */
function QRCodeSafe({ value, size = 80 }: { value: string; size?: number }) {
  try {
    // Tentar importar qrcode.react dinamicamente
    // Se não existir, mostra URL textual
    const QRCode = require("qrcode.react").QRCodeSVG;
    return <QRCode value={value} size={size} />;
  } catch {
    // Fallback: mostrar URL em texto pequeno
    return (
      <div
        style={{
          width: size,
          height: size,
          border: "1px solid #ccc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 4,
          fontSize: 7,
          wordBreak: "break-all",
          textAlign: "center",
          color: "#666",
        }}
      >
        {value}
      </div>
    );
  }
}

export function DeliveryPrintLayout({
  delivery,
  deliveryItems,
  purchaseOrder,
  supplierName,
  destinationLabel,
  companyName = "ObraMZ",
  companyNif,
  deliveryUrl,
}: DeliveryPrintLayoutProps) {
  const totalOrdered = deliveryItems.reduce((s, i) => s + (i.quantityExpected || 0), 0);
  const totalAccepted = deliveryItems.reduce((s, i) => s + (i.acceptedQuantity || 0), 0);
  const totalRejected = deliveryItems.reduce((s, i) => s + (i.rejectedQuantity || 0), 0);

  return (
    <div
      id="delivery-print-layout"
      className="hidden print:block"
      style={{
        fontFamily: "Arial, sans-serif",
        fontSize: 10,
        color: "#111",
        padding: "20px 24px",
        maxWidth: 780,
        margin: "0 auto",
      }}
    >
      {/* Cabeçalho */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, paddingBottom: 10, borderBottom: "2px solid #111" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: "bold", marginBottom: 2 }}>{companyName}</div>
          {companyNif && <div style={{ fontSize: 9, color: "#555" }}>NIF: {companyNif}</div>}
          <div style={{ marginTop: 6, fontSize: 13, fontWeight: "bold" }}>FICHA DE ENTREGA</div>
          <div style={{ fontSize: 10, color: "#333" }}>
            {delivery.deliveryNumber}
            {delivery.deliveryNoteNumber && ` · Guia: ${delivery.deliveryNoteNumber}`}
          </div>
        </div>
        <QRCodeSafe value={deliveryUrl} size={80} />
      </div>

      {/* Dados da Entrega */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12, fontSize: 9 }}>
        <tbody>
          <tr>
            <td style={{ fontWeight: "bold", color: "#555", paddingBottom: 3, width: "20%" }}>Fornecedor:</td>
            <td style={{ paddingBottom: 3, width: "30%" }}>{supplierName}</td>
            <td style={{ fontWeight: "bold", color: "#555", paddingBottom: 3, width: "20%" }}>Pedido de Compra:</td>
            <td style={{ paddingBottom: 3, width: "30%" }}>{purchaseOrder?.orderNumber || delivery.purchaseOrderId}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: "bold", color: "#555", paddingBottom: 3 }}>Destino:</td>
            <td style={{ paddingBottom: 3 }}>{destinationLabel}</td>
            <td style={{ fontWeight: "bold", color: "#555", paddingBottom: 3 }}>Data Prevista:</td>
            <td style={{ paddingBottom: 3 }}>{formatDate(delivery.deliveryDate)}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: "bold", color: "#555", paddingBottom: 3 }}>Responsável:</td>
            <td style={{ paddingBottom: 3 }}>{delivery.receivedByUserName || "—"}</td>
            <td style={{ fontWeight: "bold", color: "#555", paddingBottom: 3 }}>Data de Chegada:</td>
            <td style={{ paddingBottom: 3 }}>{delivery.arrivedAt ? formatDate(delivery.arrivedAt) : "—"}</td>
          </tr>
          {delivery.vehiclePlate && (
            <tr>
              <td style={{ fontWeight: "bold", color: "#555", paddingBottom: 3 }}>Matrícula:</td>
              <td style={{ paddingBottom: 3 }}>{delivery.vehiclePlate}</td>
              <td style={{ fontWeight: "bold", color: "#555", paddingBottom: 3 }}>Motorista:</td>
              <td style={{ paddingBottom: 3 }}>{delivery.driverName || "—"}</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Tabela de Materiais */}
      <div style={{ fontSize: 10, fontWeight: "bold", marginBottom: 4 }}>MATERIAIS</div>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14, fontSize: 9 }}>
        <thead>
          <tr style={{ backgroundColor: "#f0f0f0" }}>
            <th style={{ border: "1px solid #ccc", padding: "4px 6px", textAlign: "left" }}>Material</th>
            <th style={{ border: "1px solid #ccc", padding: "4px 6px", textAlign: "right", width: 70 }}>Pedido</th>
            <th style={{ border: "1px solid #ccc", padding: "4px 6px", textAlign: "right", width: 70 }}>Entregue</th>
            <th style={{ border: "1px solid #ccc", padding: "4px 6px", textAlign: "right", width: 70 }}>Aceite</th>
            <th style={{ border: "1px solid #ccc", padding: "4px 6px", textAlign: "right", width: 70 }}>Rejeitado</th>
            <th style={{ border: "1px solid #ccc", padding: "4px 6px", textAlign: "left" }}>Observações</th>
          </tr>
        </thead>
        <tbody>
          {deliveryItems.map((item) => (
            <tr key={item.id}>
              <td style={{ border: "1px solid #ccc", padding: "4px 6px" }}>
                {item.materialId}
              </td>
              <td style={{ border: "1px solid #ccc", padding: "4px 6px", textAlign: "right", fontFamily: "monospace" }}>{item.quantityExpected}</td>
              <td style={{ border: "1px solid #ccc", padding: "4px 6px", textAlign: "right", fontFamily: "monospace" }}>{item.receivedBaseQuantity || 0}</td>
              <td style={{ border: "1px solid #ccc", padding: "4px 6px", textAlign: "right", fontFamily: "monospace" }}>{item.acceptedQuantity || 0}</td>
              <td style={{ border: "1px solid #ccc", padding: "4px 6px", textAlign: "right", fontFamily: "monospace", color: (item.rejectedQuantity || 0) > 0 ? "#c00" : undefined }}>
                {item.rejectedQuantity || 0}
              </td>
              <td style={{ border: "1px solid #ccc", padding: "4px 6px", color: "#555" }}>{item.notes || item.rejectionReason || ""}</td>
            </tr>
          ))}
          {/* Linha de Totais */}
          <tr style={{ backgroundColor: "#f9f9f9", fontWeight: "bold" }}>
            <td style={{ border: "1px solid #ccc", padding: "4px 6px" }}>TOTAL</td>
            <td style={{ border: "1px solid #ccc", padding: "4px 6px", textAlign: "right", fontFamily: "monospace" }}>{totalOrdered}</td>
            <td style={{ border: "1px solid #ccc", padding: "4px 6px" }}></td>
            <td style={{ border: "1px solid #ccc", padding: "4px 6px", textAlign: "right", fontFamily: "monospace", color: "#077" }}>{totalAccepted}</td>
            <td style={{ border: "1px solid #ccc", padding: "4px 6px", textAlign: "right", fontFamily: "monospace", color: totalRejected > 0 ? "#c00" : undefined }}>{totalRejected || 0}</td>
            <td style={{ border: "1px solid #ccc", padding: "4px 6px" }}></td>
          </tr>
        </tbody>
      </table>

      {/* Documentos */}
      {(delivery.documents?.length || 0) > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: "bold", marginBottom: 4 }}>DOCUMENTOS ANEXADOS</div>
          <div style={{ fontSize: 9, color: "#333" }}>
            {delivery.documents?.map((d) => `✓ ${d.fileName} (${(d.fileSize / 1024).toFixed(0)} KB)`).join("  ·  ")}
          </div>
        </div>
      )}

      {/* Assinaturas */}
      <div style={{ marginTop: 20, borderTop: "1px solid #ccc", paddingTop: 16 }}>
        <div style={{ fontSize: 10, fontWeight: "bold", marginBottom: 14 }}>ASSINATURAS</div>
        <div style={{ display: "flex", gap: 40 }}>
          <div style={{ flex: 1 }}>
            <div style={{ borderBottom: "1px solid #333", marginBottom: 4, height: 36 }}></div>
            <div style={{ fontSize: 9, color: "#555" }}>Fiel de Armazém / Responsável pela Receção</div>
            <div style={{ fontSize: 9, color: "#555", marginTop: 2 }}>Nome: ______________________________</div>
            <div style={{ fontSize: 9, color: "#555", marginTop: 2 }}>Data: _____ / _____ / _________</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ borderBottom: "1px solid #333", marginBottom: 4, height: 36 }}></div>
            <div style={{ fontSize: 9, color: "#555" }}>Motorista / Transportador</div>
            <div style={{ fontSize: 9, color: "#555", marginTop: 2 }}>Nome: ______________________________</div>
            <div style={{ fontSize: 9, color: "#555", marginTop: 2 }}>Data: _____ / _____ / _________</div>
          </div>
        </div>
      </div>

      {/* Rodapé Automático */}
      <div style={{ marginTop: 16, paddingTop: 8, borderTop: "1px solid #eee", fontSize: 8, color: "#777", display: "flex", justifyContent: "space-between" }}>
        <span>Documento gerado pelo ObraMZ · {new Date().toLocaleDateString("pt-PT")} {new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}</span>
        <span className="font-mono">{deliveryUrl}</span>
      </div>
    </div>
  );
}
