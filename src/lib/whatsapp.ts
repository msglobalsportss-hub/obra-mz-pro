/** Constrói uma URL wa.me para enviar mensagem via WhatsApp. */
export function buildWhatsAppUrl(rawPhone: string, message: string): string {
  const digits = (rawPhone || "").replace(/\D+/g, "");
  const normalized = digits.startsWith("258") ? digits : digits ? `258${digits}` : "";
  const base = normalized ? `https://wa.me/${normalized}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(message)}`;
}

export function openWhatsApp(rawPhone: string, message: string) {
  const url = buildWhatsAppUrl(rawPhone, message);
  if (typeof window !== "undefined") window.open(url, "_blank", "noopener");
}
