import { useEffect, useState, useRef } from "react";
import type { Worker } from "@/lib/mock-data";
import { roles } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useObraMZStore } from "@/store/obramz-store";
import { toast } from "sonner";
import { Camera, Upload, Loader2, User, Phone, ShieldAlert, Award, FileText } from "lucide-react";

async function resizeWorkerPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const maxDimension = 600; // Fotos de perfil não precisam de mais de 600px

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Erro de contexto Canvas."));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Comprimir em JPEG com qualidade 0.7
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Falha ao carregar a imagem."));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

type WorkerFormDialogProps = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  workerToEdit?: Worker | null;
};

export function WorkerFormDialog({
  open,
  onOpenChange,
  workerToEdit = null,
}: WorkerFormDialogProps) {
  const createWorker = useObraMZStore((s) => s.createWorker);
  const updateWorker = useObraMZStore((s) => s.updateWorker);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [photo, setPhoto] = useState<string>("");
  const [status, setStatus] = useState<Worker["status"]>("active");
  const [hireDate, setHireDate] = useState("");
  const [paymentType, setPaymentType] = useState<Worker["paymentType"]>("daily");
  const [rate, setRate] = useState<string>("");
  const [notes, setNotes] = useState("");

  // Novos campos da Sprint 2
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<string>("none");
  const [documentType, setDocumentType] = useState<string>("none");
  const [documentNumber, setDocumentNumber] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [nationality, setNationality] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");

  const [processingImage, setProcessingImage] = useState(false);

  // Carregar dados de edição ou resetar
  useEffect(() => {
    if (open) {
      if (workerToEdit) {
        setName(workerToEdit.name);
        setPhone(workerToEdit.phone || "");
        setRole(workerToEdit.role);
        setPhoto(workerToEdit.photo || "");
        setStatus(workerToEdit.status);
        setHireDate(workerToEdit.hireDate || "");
        setPaymentType(workerToEdit.paymentType);
        setNotes(workerToEdit.notes || "");
        
        // Novos campos
        setEmail(workerToEdit.email || "");
        setDateOfBirth(workerToEdit.dateOfBirth || "");
        setGender(workerToEdit.gender || "none");
        setDocumentType(workerToEdit.documentType || "none");
        setDocumentNumber(workerToEdit.documentNumber || "");
        setAddress(workerToEdit.address || "");
        setEmergencyContactName(workerToEdit.emergencyContactName || "");
        setEmergencyContactPhone(workerToEdit.emergencyContactPhone || "");
        setNationality(workerToEdit.nationality || "");
        setEmployeeCode(workerToEdit.employeeCode || "");
        
        // Mapear o rate correspondente
        if (workerToEdit.paymentType === "daily") {
          setRate(workerToEdit.dailyRate?.toString() || "");
        } else if (workerToEdit.paymentType === "hourly") {
          setRate(workerToEdit.hourlyRate?.toString() || "");
        } else if (workerToEdit.paymentType === "monthly") {
          setRate(workerToEdit.monthlyRate?.toString() || "");
        }
      } else {
        setName("");
        setPhone("");
        setRole("");
        setPhoto("");
        setStatus("active");
        setHireDate("");
        setPaymentType("daily");
        setRate("");
        setNotes("");
        
        // Novos campos
        setEmail("");
        setDateOfBirth("");
        setGender("none");
        setDocumentType("none");
        setDocumentNumber("");
        setAddress("");
        setEmergencyContactName("");
        setEmergencyContactPhone("");
        setNationality("");
        setEmployeeCode("");
      }
    }
  }, [open, workerToEdit]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Ficheiro inválido. Selecione uma imagem.");
      return;
    }

    setProcessingImage(true);
    try {
      const compressedPhoto = await resizeWorkerPhoto(file);
      setPhoto(compressedPhoto);
      toast.success("Foto de perfil carregada e otimizada.");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao otimizar a fotografia.");
    } finally {
      setProcessingImage(false);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("O nome do trabalhador é obrigatório.");
      return;
    }
    if (!role) {
      toast.error("Selecione uma função para o trabalhador.");
      return;
    }
    
    // Validação de E-mail se preenchido
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Por favor, introduza um e-mail com formato válido.");
      return;
    }

    // Datas futuras inválidas para nascimento ou contratação
    const today = new Date().toISOString().slice(0, 10);
    if (dateOfBirth && dateOfBirth > today) {
      toast.error("A data de nascimento não pode ser no futuro.");
      return;
    }
    if (hireDate && hireDate > today) {
      toast.error("A data de contratação não pode ser no futuro.");
      return;
    }

    const numericRate = parseFloat(rate);
    if (isNaN(numericRate) || numericRate < 0) {
      toast.error("A taxa de pagamento deve ser um número válido e não negativo.");
      return;
    }

    const payload: Omit<Worker, "id" | "createdAt" | "updatedAt"> = {
      name: name.trim(),
      phone: phone.trim() || undefined,
      role,
      photo: photo || undefined,
      status,
      hireDate: hireDate || undefined,
      paymentType,
      dailyRate: paymentType === "daily" ? numericRate : undefined,
      hourlyRate: paymentType === "hourly" ? numericRate : undefined,
      monthlyRate: paymentType === "monthly" ? numericRate : undefined,
      notes: notes.trim() || undefined,
      
      // Novos campos
      email: email.trim() || undefined,
      dateOfBirth: dateOfBirth || undefined,
      gender: gender === "none" ? undefined : (gender as any),
      documentType: documentType === "none" ? undefined : (documentType as any),
      documentNumber: documentNumber.trim() || undefined,
      address: address.trim() || undefined,
      emergencyContactName: emergencyContactName.trim() || undefined,
      emergencyContactPhone: emergencyContactPhone.trim() || undefined,
      nationality: nationality.trim() || undefined,
      employeeCode: employeeCode.trim() || undefined,
    };

    try {
      if (workerToEdit) {
        updateWorker(workerToEdit.id, payload);
        toast.success("Trabalhador atualizado com sucesso!");
      } else {
        createWorker(payload);
        toast.success("Trabalhador registado com sucesso!");
      }
      onOpenChange(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {workerToEdit ? "Editar Ficha de Trabalhador" : "Registar Novo Trabalhador"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Foto de Perfil */}
          <div className="flex flex-col items-center gap-2 bg-muted/20 p-3 rounded-lg border">
            <Label className="font-semibold text-xs text-muted-foreground uppercase">Fotografia de Perfil</Label>
            <div className="relative group h-24 w-24 rounded-full overflow-hidden border border-border bg-muted flex items-center justify-center">
              {photo ? (
                <img
                  src={photo}
                  alt="Perfil"
                  className="h-full w-full object-cover"
                />
              ) : (
                <Camera className="h-8 w-8 text-muted-foreground/60" />
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 text-white" />
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="xs"
              className="text-xs h-7"
              disabled={processingImage}
              onClick={() => fileInputRef.current?.click()}
            >
              {processingImage ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              {photo ? "Alterar foto" : "Carregar foto"}
            </Button>
            {photo && (
              <Button
                type="button"
                variant="link"
                className="text-destructive text-[10px] h-4 p-0"
                onClick={() => setPhoto("")}
              >
                Remover foto
              </Button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={processingImage}
            />
          </div>

          {/* Secção 1: Informações Básicas */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-primary" />
              1. Informação Básica
            </h4>
            
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="worker-name">Nome Completo *</Label>
                <Input
                  id="worker-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex.: António Nhaca"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="worker-code">Código de Trabalhador (ID Interno)</Label>
                <Input
                  id="worker-code"
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
                  placeholder="Ex.: EMP-2026-004"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="worker-phone">Telefone</Label>
                <Input
                  id="worker-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex.: +258 84 123 4567"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="worker-email">E-mail</Label>
                <Input
                  id="worker-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ex.: funcionario@empresa.co.mz"
                />
              </div>
            </div>
          </div>

          {/* Secção 2: Dados Pessoais */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-primary" />
              2. Dados Pessoais
            </h4>
            
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="worker-dob">Data de Nascimento</Label>
                <Input
                  id="worker-dob"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="worker-nationality">Nacionalidade</Label>
                <Input
                  id="worker-nationality"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  placeholder="Ex.: Moçambicana"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="worker-gender">Género</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger id="worker-gender">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Não informado</SelectItem>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="female">Feminino</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefere não dizer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="worker-doctype">Tipo de Documento</Label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger id="worker-doctype">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Não informado</SelectItem>
                    <SelectItem value="bi">B.I. (Bilhete de Identidade)</SelectItem>
                    <SelectItem value="passport">Passaporte</SelectItem>
                    <SelectItem value="dire">D.I.R.E.</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="worker-docnum">Número do Documento</Label>
                <Input
                  id="worker-docnum"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  placeholder="Número de BI, Passaporte ou DIRE"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="worker-address">Morada / Endereço Completo</Label>
                <Input
                  id="worker-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Bairro, Avenida, Cidade ou Província"
                />
              </div>
            </div>
          </div>

          {/* Secção 3: Contactos de Emergência */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1 flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-primary" />
              3. Contacto de Emergência
            </h4>
            
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="worker-em-name">Nome do Contacto</Label>
                <Input
                  id="worker-em-name"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  placeholder="Ex.: Maria Nhaca (Esposa)"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="worker-em-phone">Telefone do Contacto</Label>
                <Input
                  id="worker-em-phone"
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                  placeholder="Ex.: +258 84 999 8888"
                />
              </div>
            </div>
          </div>

          {/* Secção 4: Dados Profissionais e Remuneração */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1 flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-primary" />
              4. Contrato e Remuneração
            </h4>
            
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="worker-role">Função / Cargo *</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger id="worker-role">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="worker-hire">Data de Contratação</Label>
                <Input
                  id="worker-hire"
                  type="date"
                  value={hireDate}
                  onChange={(e) => setHireDate(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="worker-paytype">Regime de Pagamento *</Label>
                <Select
                  value={paymentType}
                  onValueChange={(v: any) => {
                    setPaymentType(v);
                    setRate(""); // Limpar
                  }}
                >
                  <SelectTrigger id="worker-paytype">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diário</SelectItem>
                    <SelectItem value="hourly">Horário</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="worker-rate">
                  {paymentType === "daily" && "Taxa Diária (MZN) *"}
                  {paymentType === "hourly" && "Valor por Hora (MZN) *"}
                  {paymentType === "monthly" && "Salário Mensal (MZN) *"}
                </Label>
                <Input
                  id="worker-rate"
                  type="number"
                  min={0}
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="Ex.: 1500"
                />
              </div>

              {workerToEdit && (
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="worker-status">Estado de Atividade</Label>
                  <Select
                    value={status}
                    onValueChange={(v: any) => setStatus(v)}
                  >
                    <SelectTrigger id="worker-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo (Alocável / Disponível)</SelectItem>
                      <SelectItem value="inactive">Inativo (Disponibilizado / Suspenso)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Secção 5: Observações */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1">
              5. Notas / Observações
            </h4>
            <div className="space-y-1">
              <Label htmlFor="worker-notes">Observações</Label>
              <Textarea
                id="worker-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Indique qualificações específicas, atestados médicos ou outras informações..."
                rows={3}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button className="bg-primary hover:bg-primary-dark" onClick={handleSave} disabled={processingImage}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
