import { useState, useEffect } from "react";
import { useObraMZStore } from "@/store/obramz-store";
import type { Supplier, PaymentTermType } from "@/lib/suppliers";
import { MOZAMBIQUE_PROVINCES, PAYMENT_TERM_LABELS } from "@/lib/suppliers";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface SupplierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierToEdit?: Supplier | null;
}

export function SupplierFormDialog({ open, onOpenChange, supplierToEdit }: SupplierFormDialogProps) {
  const addSupplier = useObraMZStore((s) => s.addSupplier);
  const updateSupplier = useObraMZStore((s) => s.updateSupplier);

  const [name, setName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [nuit, setNuit] = useState("");
  const [country, setCountry] = useState("Moçambique");
  const [province, setProvince] = useState("Maputo Cidade");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [secondaryPhone, setSecondaryPhone] = useState("");
  const [email, setEmail] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactPersonPhone, setContactPersonPhone] = useState("");
  const [rating, setRating] = useState<number>(4);
  const [paymentTermType, setPaymentTermType] = useState<PaymentTermType | "">("credit_30");
  const [paymentTermDays, setPaymentTermDays] = useState<string>("30");
  const [paymentTermsNotes, setPaymentTermsNotes] = useState("");
  const [defaultLeadTimeDays, setDefaultLeadTimeDays] = useState<string>("3");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");

  useEffect(() => {
    if (supplierToEdit) {
      setName(supplierToEdit.name || "");
      setLegalName(supplierToEdit.legalName || "");
      setNuit(supplierToEdit.nuit || "");
      setCountry(supplierToEdit.country || "Moçambique");
      setProvince(supplierToEdit.province || "Maputo Cidade");
      setCity(supplierToEdit.city || "");
      setAddress(supplierToEdit.address || "");
      setPhone(supplierToEdit.phone || "");
      setSecondaryPhone(supplierToEdit.secondaryPhone || "");
      setEmail(supplierToEdit.email || "");
      setContactPerson(supplierToEdit.contactPerson || "");
      setContactPersonPhone(supplierToEdit.contactPersonPhone || "");
      setRating(supplierToEdit.rating || 4);
      setPaymentTermType(supplierToEdit.paymentTermType || "");
      setPaymentTermDays(supplierToEdit.paymentTermDays !== undefined ? String(supplierToEdit.paymentTermDays) : "");
      setPaymentTermsNotes(supplierToEdit.paymentTermsNotes || "");
      setDefaultLeadTimeDays(supplierToEdit.defaultLeadTimeDays !== undefined ? String(supplierToEdit.defaultLeadTimeDays) : "");
      setNotes(supplierToEdit.notes || "");
      setStatus(supplierToEdit.status || "active");
    } else {
      setName("");
      setLegalName("");
      setNuit("");
      setCountry("Moçambique");
      setProvince("Maputo Cidade");
      setCity("");
      setAddress("");
      setPhone("");
      setSecondaryPhone("");
      setEmail("");
      setContactPerson("");
      setContactPersonPhone("");
      setRating(4);
      setPaymentTermType("credit_30");
      setPaymentTermDays("30");
      setPaymentTermsNotes("");
      setDefaultLeadTimeDays("3");
      setNotes("");
      setStatus("active");
    }
  }, [supplierToEdit, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Partial<Supplier> = {
        name,
        legalName: legalName || undefined,
        nuit: nuit || undefined,
        country,
        province: country === "Moçambique" ? province : province || undefined,
        city,
        address: address || undefined,
        phone,
        secondaryPhone: secondaryPhone || undefined,
        email: email || undefined,
        contactPerson: contactPerson || undefined,
        contactPersonPhone: contactPersonPhone || undefined,
        rating,
        paymentTermType: (paymentTermType as PaymentTermType) || undefined,
        paymentTermDays: paymentTermDays ? parseInt(paymentTermDays, 10) : undefined,
        paymentTermsNotes: paymentTermsNotes || undefined,
        defaultLeadTimeDays: defaultLeadTimeDays ? parseInt(defaultLeadTimeDays, 10) : undefined,
        notes: notes || undefined,
        status,
      };

      if (supplierToEdit) {
        updateSupplier(supplierToEdit.id, payload);
        toast.success("Fornecedor atualizado com sucesso.");
      } else {
        addSupplier(payload as any);
        toast.success("Fornecedor criado com sucesso.");
      }
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao guardar fornecedor.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{supplierToEdit ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="name">Nome Comercial / Fantasia *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Cimentos de Moçambique, SARL"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="legalName">Razão Social</Label>
              <Input
                id="legalName"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="Ex: Cimentos de Moçambique S.A."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="nuit">NUIT (9 dígitos em MZ)</Label>
              <Input
                id="nuit"
                value={nuit}
                onChange={(e) => setNuit(e.target.value)}
                placeholder="Ex: 400012345"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="country">País *</Label>
              <Input
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Moçambique"
                required
              />
            </div>

            {country === "Moçambique" ? (
              <div className="space-y-1.5">
                <Label htmlFor="province">Província *</Label>
                <Select value={province} onValueChange={setProvince}>
                  <SelectTrigger id="province">
                    <SelectValue placeholder="Selecione a província" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOZAMBIQUE_PROVINCES.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="province">Província / Estado</Label>
                <Input
                  id="province"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  placeholder="Ex: Gauteng"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="city">Cidade / Distrito *</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex: Maputo / Matola"
                required
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="address">Endereço Físico</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ex: Av. das Indústrias, Km 5"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Telefone Principal *</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: +258 21 750 100"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="secondaryPhone">Telefone Secundário</Label>
              <Input
                id="secondaryPhone"
                value={secondaryPhone}
                onChange={(e) => setSecondaryPhone(e.target.value)}
                placeholder="Ex: +258 84 300 4000"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email Comercial</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: vendas@fornecedor.co.mz"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rating">Avaliação Comercial (1 a 5)</Label>
              <Select value={String(rating)} onValueChange={(v) => setRating(parseInt(v, 10))}>
                <SelectTrigger id="rating">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">⭐⭐⭐⭐⭐ (Excelente)</SelectItem>
                  <SelectItem value="4">⭐⭐⭐⭐ (Muito Bom)</SelectItem>
                  <SelectItem value="3">⭐⭐⭐ (Bom / Regular)</SelectItem>
                  <SelectItem value="2">⭐⭐ (Razoável)</SelectItem>
                  <SelectItem value="1">⭐ (Fraco)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contactPerson">Pessoa de Contacto</Label>
              <Input
                id="contactPerson"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Ex: Eng. Alberto Sita"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contactPersonPhone">Tel. da Pessoa de Contacto</Label>
              <Input
                id="contactPersonPhone"
                value={contactPersonPhone}
                onChange={(e) => setContactPersonPhone(e.target.value)}
                placeholder="Ex: +258 84 111 2233"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="paymentTermType">Condições de Pagamento Padrão</Label>
              <Select value={paymentTermType} onValueChange={(v) => setPaymentTermType(v as PaymentTermType)}>
                <SelectTrigger id="paymentTermType">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_TERM_LABELS).map(([k, label]) => (
                    <SelectItem key={k} value={k}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="defaultLeadTimeDays">Prazo Padrão de Entrega (dias)</Label>
              <Input
                id="defaultLeadTimeDays"
                type="number"
                min="0"
                value={defaultLeadTimeDays}
                onChange={(e) => setDefaultLeadTimeDays(e.target.value)}
                placeholder="Ex: 3"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="status">Estado</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as "active" | "inactive")}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo (Soft Delete)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="notes">Observações Internas</Label>
              <Textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações ou histórico do fornecedor..."
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {supplierToEdit ? "Guardar Alterações" : "Criar Fornecedor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
