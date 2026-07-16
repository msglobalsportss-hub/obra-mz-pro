import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { PageHeader, StatusBadge } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { totalOrcamento, estadoOrcamentoLabel, type EstadoOrcamento } from "@/lib/mock-data";
import { formatDate, formatMZN } from "@/lib/format";
import { Send, Printer, CheckCircle2, XCircle, Pencil, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useObraMZStore } from "@/store/obramz-store";
import { openWhatsApp } from "@/lib/whatsapp";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { useState } from "react";

export const Route = createFileRoute("/app/orcamentos/$id")({ component: OrcamentoPreview });

const toneFor = (e: EstadoOrcamento) =>
  e === "aceite" ? "success" :
  e === "rejeitado" || e === "expirado" || e === "cancelado" ? "destructive" :
  e === "enviado" || e === "visualizado" ? "primary" : "muted";

function OrcamentoPreview() {
  const { id } = useParams({ from: "/app/orcamentos/$id" });
  const nav = useNavigate();
  const orc = useObraMZStore((s) => s.orcamentos.find((o) => o.id === id));
  const cliente = useObraMZStore((s) => (orc ? s.clientes.find((c) => c.id === orc.clienteId) : undefined));
  const obra = useObraMZStore((s) => (orc?.obraId ? s.obras.find((o) => o.id === orc.obraId) : undefined));
  const empresa = useObraMZStore((s) => s.empresa);
  const updateEstado = useObraMZStore((s) => s.updateOrcamentoEstado);
  const duplicate = useObraMZStore((s) => s.duplicateOrcamento);
  const deleteOrc = useObraMZStore((s) => s.deleteOrcamento);

  const [confirmDel, setConfirmDel] = useState(false);

  if (!orc) {
    return (
      <Card className="p-8 text-center">
        <div className="text-sm font-semibold">Orçamento não encontrado.</div>
        <div className="mt-2"><Link to="/app/orcamentos" className="text-primary">Voltar</Link></div>
      </Card>
    );
  }

  const { subtotal, total } = totalOrcamento(orc);

  const share = () => {
    if (!cliente) return;
    const msg = `Olá ${cliente.nome},\n\nSegue o orçamento *${orc.numero}* — ${orc.titulo}.\nValor total: *${formatMZN(total)}*\nValidade: ${formatDate(orc.validade)}\n\nCumprimentos,\n${empresa.nome}`;
    openWhatsApp(cliente.telefone, msg);
  };

  const changeEstado = (e: EstadoOrcamento) => {
    updateEstado(orc.id, e);
    toast.success(`Marcado como ${estadoOrcamentoLabel[e]}`);
  };

  const handleDuplicate = () => {
    const d = duplicate(orc.id);
    if (d) {
      toast.success(`Duplicado como ${d.numero}`);
      nav({ to: "/app/orcamentos/$id", params: { id: d.id } });
    }
  };

  return (
    <div>
      <PageHeader
        title={orc.numero}
        description={<><Link to="/app/orcamentos" className="hover:text-primary">Orçamentos</Link> · <StatusBadge tone={toneFor(orc.estado)}>{estadoOrcamentoLabel[orc.estado]}</StatusBadge></>}
        actions={
          <>
            <Button variant="outline" onClick={() => window.print()}><Printer className="mr-1 h-4 w-4" />Imprimir / PDF</Button>
            <Button variant="outline" onClick={share}><Send className="mr-1 h-4 w-4" />WhatsApp</Button>
            <Link to="/app/orcamentos/novo" search={{ editar: orc.id }}>
              <Button variant="outline"><Pencil className="mr-1 h-4 w-4" />Editar</Button>
            </Link>
            <Button variant="outline" onClick={handleDuplicate}><Copy className="mr-1 h-4 w-4" />Duplicar</Button>
            {orc.estado !== "aceite" && (
              <Button className="bg-success hover:bg-success/90" onClick={() => changeEstado("aceite")}><CheckCircle2 className="mr-1 h-4 w-4" />Aceite</Button>
            )}
            {orc.estado !== "rejeitado" && (
              <Button variant="outline" onClick={() => changeEstado("rejeitado")}><XCircle className="mr-1 h-4 w-4" />Rejeitar</Button>
            )}
            <Button variant="outline" className="text-destructive" onClick={() => setConfirmDel(true)}><Trash2 className="mr-1 h-4 w-4" />Eliminar</Button>
          </>
        }
      />

      <div className="mx-auto max-w-4xl">
        <Card className="p-8 shadow-sm sm:p-12">
          <div className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-primary pb-6">
            <div className="flex items-start gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-lg bg-primary text-primary-foreground text-xl font-black">O</div>
              <div>
                <div className="text-lg font-bold text-foreground">{empresa.nome}</div>
                <div className="text-xs text-muted-foreground">NUIT {empresa.nuit}</div>
                <div className="text-xs text-muted-foreground">{empresa.telefone} · {empresa.email}</div>
                <div className="text-xs text-muted-foreground">{empresa.endereco}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wider text-primary">Orçamento</div>
              <div className="text-2xl font-black tracking-tight text-foreground">{orc.numero}</div>
              <div className="mt-2 text-xs text-muted-foreground">Emitido em <b className="text-foreground">{formatDate(orc.emissao)}</b></div>
              <div className="text-xs text-muted-foreground">Válido até <b className="text-foreground">{formatDate(orc.validade)}</b></div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">Cliente</div>
              <div className="mt-1 text-sm font-semibold">{cliente?.nome ?? "—"}</div>
              {cliente?.nuit && <div className="text-xs text-muted-foreground">NUIT {cliente.nuit}</div>}
              {cliente && <div className="text-xs text-muted-foreground">{cliente.telefone}{cliente.email && ` · ${cliente.email}`}</div>}
              {cliente && <div className="text-xs text-muted-foreground">{[cliente.endereco, cliente.cidade].filter(Boolean).join(", ")}</div>}
            </div>
            {obra && (
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">Obra</div>
                <div className="mt-1 text-sm font-semibold">{obra.nome}</div>
                <div className="text-xs text-muted-foreground">{obra.tipo}</div>
                <div className="text-xs text-muted-foreground">{[obra.endereco, obra.cidade].filter(Boolean).join(", ")}</div>
              </div>
            )}
          </div>

          <div className="mt-6">
            <div className="text-xs uppercase text-muted-foreground">Assunto</div>
            <div className="text-base font-semibold">{orc.titulo}</div>
            {orc.descricao && <div className="mt-1 text-sm text-muted-foreground">{orc.descricao}</div>}
          </div>

          <div className="mt-6 overflow-hidden rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="bg-primary text-primary-foreground">
                <tr>
                  <th className="p-2 text-left text-xs font-semibold uppercase tracking-wider">#</th>
                  <th className="p-2 text-left text-xs font-semibold uppercase tracking-wider">Descrição</th>
                  <th className="hidden p-2 text-left text-xs font-semibold uppercase tracking-wider sm:table-cell">Un.</th>
                  <th className="p-2 text-right text-xs font-semibold uppercase tracking-wider">Qtd</th>
                  <th className="p-2 text-right text-xs font-semibold uppercase tracking-wider">Preço</th>
                  <th className="p-2 text-right text-xs font-semibold uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {orc.itens.map((i, idx) => (
                  <tr key={i.id}>
                    <td className="p-2 text-xs text-muted-foreground">{idx + 1}</td>
                    <td className="p-2">
                      <div className="font-medium">{i.descricao}</div>
                      <div className="text-xs text-muted-foreground">{i.categoria}</div>
                    </td>
                    <td className="hidden p-2 text-xs sm:table-cell">{i.unidade}</td>
                    <td className="p-2 text-right text-sm">{i.quantidade}</td>
                    <td className="p-2 text-right text-sm">{formatMZN(i.precoUnitario)}</td>
                    <td className="p-2 text-right text-sm font-semibold">{formatMZN(Math.max(0, i.quantidade * i.precoUnitario - i.desconto))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-sm space-y-2 text-sm">
              <Row k="Subtotal" v={formatMZN(subtotal)} />
              {orc.descontoGeral > 0 && <Row k="Desconto" v={`- ${formatMZN(orc.descontoGeral)}`} />}
              {orc.imposto > 0 && <Row k="Imposto" v={formatMZN(orc.imposto)} />}
              {orc.custosAdicionais > 0 && <Row k="Custos adicionais" v={formatMZN(orc.custosAdicionais)} />}
              <div className="mt-2 flex items-center justify-between border-t-2 border-primary pt-3">
                <span className="text-sm font-bold uppercase tracking-wider text-primary">Total</span>
                <span className="text-xl font-black text-foreground">{formatMZN(total)}</span>
              </div>
            </div>
          </div>

          {(orc.notas || orc.condicoes) && (
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {orc.notas && (
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">Notas</div>
                  <p className="mt-1 whitespace-pre-line text-xs text-muted-foreground">{orc.notas}</p>
                </div>
              )}
              {orc.condicoes && (
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">Condições de pagamento</div>
                  <p className="mt-1 whitespace-pre-line text-xs text-muted-foreground">{orc.condicoes}</p>
                </div>
              )}
            </div>
          )}

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            <div>
              <div className="h-16 border-b border-dashed border-border" />
              <div className="mt-1 text-center text-xs text-muted-foreground">Empresa</div>
            </div>
            <div>
              <div className="h-16 border-b border-dashed border-border" />
              <div className="mt-1 text-center text-xs text-muted-foreground">Cliente</div>
            </div>
          </div>

          <div className="mt-8 border-t border-border pt-4 text-center text-[11px] text-muted-foreground">
            {empresa.nome} · NUIT {empresa.nuit} · {empresa.telefone} · {empresa.email}
          </div>
        </Card>

        {orc.historico.length > 0 && (
          <Card className="mt-6 p-5">
            <div className="mb-2 text-sm font-semibold">Histórico</div>
            <ol className="space-y-2 text-sm">
              {[...orc.historico].reverse().map((h) => (
                <li key={h.id} className="flex justify-between gap-3">
                  <span>{h.descricao}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatDate(h.data)}</span>
                </li>
              ))}
            </ol>
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={confirmDel}
        onOpenChange={setConfirmDel}
        title={`Eliminar orçamento ${orc.numero}?`}
        description="Esta ação não pode ser desfeita."
        confirmLabel="Eliminar"
        tone="destructive"
        onConfirm={() => {
          deleteOrc(orc.id);
          toast.success("Orçamento eliminado");
          nav({ to: "/app/orcamentos" });
        }}
      />
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}
