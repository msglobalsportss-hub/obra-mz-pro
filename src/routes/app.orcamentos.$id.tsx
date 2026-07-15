import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { PageHeader, StatusBadge } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { orcamentoById, clienteById, obraById, empresa, totalOrcamento, estadoOrcamentoLabel } from "@/lib/mock-data";
import type { EstadoOrcamento } from "@/lib/mock-data";
import { formatDate, formatMZN } from "@/lib/format";
import { Download, Send, Printer, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/orcamentos/$id")({ component: OrcamentoPreview });

const toneFor = (e: EstadoOrcamento) =>
  e === "aceite" ? "success" : e === "rejeitado" ? "destructive" : "primary";

function OrcamentoPreview() {
  const { id } = useParams({ from: "/app/orcamentos/$id" });
  const o = orcamentoById(id);
  if (!o) return <div>Orçamento não encontrado. <Link to="/app/orcamentos" className="text-primary">Voltar</Link></div>;
  const cliente = clienteById(o.clienteId);
  const obra = o.obraId ? obraById(o.obraId) : null;
  const { subtotal, total } = totalOrcamento(o);

  return (
    <div>
      <PageHeader
        title={o.numero}
        description={<><Link to="/app/orcamentos" className="hover:text-primary">Orçamentos</Link> · <StatusBadge tone={toneFor(o.estado)}>{estadoOrcamentoLabel[o.estado]}</StatusBadge></>}
        actions={
          <>
            <Button variant="outline" onClick={() => toast("A imprimir...")}><Printer className="mr-1 h-4 w-4" />Imprimir</Button>
            <Button variant="outline" onClick={() => toast.success("PDF pronto")}><Download className="mr-1 h-4 w-4" />PDF</Button>
            <Button variant="outline" onClick={() => toast.success("Aberto no WhatsApp (demo)")}><Send className="mr-1 h-4 w-4" />WhatsApp</Button>
            <Button className="bg-success hover:bg-success/90" onClick={() => toast.success("Marcado como aceite")}><CheckCircle2 className="mr-1 h-4 w-4" />Aceite</Button>
            <Button variant="outline" onClick={() => toast.error("Marcado como rejeitado")}><XCircle className="mr-1 h-4 w-4" />Rejeitar</Button>
          </>
        }
      />

      {/* A4 preview */}
      <div className="mx-auto max-w-4xl">
        <Card className="p-8 shadow-sm sm:p-12">
          {/* Header */}
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
              <div className="text-2xl font-black tracking-tight text-foreground">{o.numero}</div>
              <div className="mt-2 text-xs text-muted-foreground">Emitido em <b className="text-foreground">{formatDate(o.emissao)}</b></div>
              <div className="text-xs text-muted-foreground">Válido até <b className="text-foreground">{formatDate(o.validade)}</b></div>
            </div>
          </div>

          {/* Cliente / Obra */}
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">Cliente</div>
              <div className="mt-1 text-sm font-semibold">{cliente?.nome}</div>
              <div className="text-xs text-muted-foreground">NUIT {cliente?.nuit}</div>
              <div className="text-xs text-muted-foreground">{cliente?.telefone} · {cliente?.email}</div>
              <div className="text-xs text-muted-foreground">{cliente?.endereco}, {cliente?.cidade}</div>
            </div>
            {obra && (
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">Obra</div>
                <div className="mt-1 text-sm font-semibold">{obra.nome}</div>
                <div className="text-xs text-muted-foreground">{obra.tipo}</div>
                <div className="text-xs text-muted-foreground">{obra.endereco}, {obra.cidade}</div>
              </div>
            )}
          </div>

          {/* Título */}
          <div className="mt-6">
            <div className="text-xs uppercase text-muted-foreground">Assunto</div>
            <div className="text-base font-semibold">{o.titulo}</div>
            {o.descricao && <div className="mt-1 text-sm text-muted-foreground">{o.descricao}</div>}
          </div>

          {/* Itens */}
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
                {o.itens.map((i, idx) => (
                  <tr key={i.id}>
                    <td className="p-2 text-xs text-muted-foreground">{idx + 1}</td>
                    <td className="p-2">
                      <div className="font-medium">{i.descricao}</div>
                      <div className="text-xs text-muted-foreground">{i.categoria}</div>
                    </td>
                    <td className="hidden p-2 text-xs sm:table-cell">{i.unidade}</td>
                    <td className="p-2 text-right text-sm">{i.quantidade}</td>
                    <td className="p-2 text-right text-sm">{formatMZN(i.precoUnitario)}</td>
                    <td className="p-2 text-right text-sm font-semibold">{formatMZN(i.quantidade * i.precoUnitario - i.desconto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totais */}
          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-sm space-y-2 text-sm">
              <Row k="Subtotal" v={formatMZN(subtotal)} />
              {o.descontoGeral > 0 && <Row k="Desconto" v={`- ${formatMZN(o.descontoGeral)}`} />}
              {o.imposto > 0 && <Row k="Imposto" v={formatMZN(o.imposto)} />}
              {o.custosAdicionais > 0 && <Row k="Custos adicionais" v={formatMZN(o.custosAdicionais)} />}
              <div className="mt-2 flex items-center justify-between border-t-2 border-primary pt-3">
                <span className="text-sm font-bold uppercase tracking-wider text-primary">Total</span>
                <span className="text-xl font-black text-foreground">{formatMZN(total)}</span>
              </div>
            </div>
          </div>

          {/* Notas / Condições */}
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {o.notas && (
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">Notas</div>
                <p className="mt-1 text-xs text-muted-foreground">{o.notas}</p>
              </div>
            )}
            {o.condicoes && (
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">Condições de pagamento</div>
                <p className="mt-1 text-xs text-muted-foreground">{o.condicoes}</p>
              </div>
            )}
          </div>

          {/* Assinatura */}
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
      </div>
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
