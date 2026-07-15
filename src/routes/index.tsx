import { createFileRoute, Link } from "@tanstack/react-router";
import {
  HardHat, FileText, Wallet, ShieldCheck, ArrowRight, Check, ChevronDown,
  MessageCircle, LayoutDashboard, Users, BarChart3, Sparkles, Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ObraMZ — Orçamentos e obras organizados num só lugar" },
      { name: "description", content: "Micro SaaS para empreiteiros em Moçambique. Crie orçamentos profissionais, controle obras e organize pagamentos." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground font-black">O</div>
            <span className="text-lg font-bold tracking-tight">ObraMZ</span>
          </Link>
          <nav className="hidden items-center gap-7 md:flex">
            <a href="#funcionalidades" className="text-sm font-medium text-muted-foreground hover:text-foreground">Funcionalidades</a>
            <a href="#como" className="text-sm font-medium text-muted-foreground hover:text-foreground">Como funciona</a>
            <a href="#planos" className="text-sm font-medium text-muted-foreground hover:text-foreground">Planos</a>
            <a href="#faq" className="text-sm font-medium text-muted-foreground hover:text-foreground">Perguntas frequentes</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/entrar" className="hidden sm:block">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link to="/criar-conta">
              <Button size="sm" className="bg-primary hover:bg-primary-dark">Começar agora</Button>
            </Link>
            <button className="grid h-9 w-9 place-items-center rounded-md md:hidden" onClick={() => setOpen(!open)}>
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
        {open && (
          <div className="border-t border-border/60 bg-background md:hidden">
            <div className="flex flex-col gap-1 p-3">
              <a href="#funcionalidades" onClick={() => setOpen(false)} className="rounded px-3 py-2 text-sm hover:bg-muted">Funcionalidades</a>
              <a href="#como" onClick={() => setOpen(false)} className="rounded px-3 py-2 text-sm hover:bg-muted">Como funciona</a>
              <a href="#planos" onClick={() => setOpen(false)} className="rounded px-3 py-2 text-sm hover:bg-muted">Planos</a>
              <a href="#faq" onClick={() => setOpen(false)} className="rounded px-3 py-2 text-sm hover:bg-muted">Perguntas frequentes</a>
              <Link to="/entrar" className="rounded px-3 py-2 text-sm hover:bg-muted">Entrar</Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary-soft/50 via-background to-background" />
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:py-24 lg:px-8">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-dark">
              <Sparkles className="h-3.5 w-3.5" />
              Feito para empreiteiros em Moçambique
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Orçamentos e obras organizados num <span className="text-primary">só lugar</span>.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Crie orçamentos profissionais, acompanhe pagamentos e organize as suas obras sem depender de planilhas complicadas.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/criar-conta">
                <Button size="lg" className="w-full bg-primary hover:bg-primary-dark sm:w-auto">
                  Começar gratuitamente <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/app">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Ver demonstração
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5"><Check className="h-4 w-4 text-success" /> Sem cartão de crédito</div>
              <div className="flex items-center gap-1.5"><Check className="h-4 w-4 text-success" /> Em português</div>
              <div className="flex items-center gap-1.5"><Check className="h-4 w-4 text-success" /> Valores em MZN</div>
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/20 to-primary-dark/10 blur-2xl" />
            <div className="relative rounded-2xl border border-border bg-card p-4 shadow-xl">
              <div className="mb-3 flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                <div className="ml-auto text-[11px] text-muted-foreground">app.obramz.co.mz</div>
              </div>
              <div className="grid gap-3">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { l: "Obras ativas", v: "12" },
                    { l: "Recebido", v: "3,2M" },
                    { l: "Pendente", v: "1,8M" },
                  ].map((s) => (
                    <div key={s.l} className="rounded-lg border border-border bg-background p-3">
                      <div className="text-[10px] uppercase text-muted-foreground">{s.l}</div>
                      <div className="text-lg font-bold">{s.v}</div>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg border border-border bg-background p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-sm font-semibold">Obras recentes</div>
                    <span className="text-[11px] text-primary">Ver todas</span>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { n: "Moradia T3 — Machava", p: 62 },
                      { n: "Renovação Polana", p: 85 },
                      { n: "Armazém Beira", p: 45 },
                    ].map((o) => (
                      <div key={o.n}>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="truncate font-medium">{o.n}</span>
                          <span className="text-muted-foreground">{o.p}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${o.p}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-border bg-primary-soft/50 p-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
                    <HardHat className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold">Novo orçamento</div>
                    <div className="text-[11px] text-muted-foreground">ORC-2026-0084 • 220.000 MZN</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-y border-border bg-muted/40 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Tudo o que o seu negócio precisa</h2>
            <p className="mt-3 text-muted-foreground">Ferramentas simples para gerir a operação diária da sua empreiteira.</p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: FileText, t: "Orçamentos em minutos", d: "Modelos prontos, itens reutilizáveis e cálculo automático." },
              { icon: HardHat, t: "Controlo das obras", d: "Estado, progresso, prazos e responsáveis num só painel." },
              { icon: Wallet, t: "Pagamentos organizados", d: "M-Pesa, e-Mola, transferência e numerário — tudo registado." },
              { icon: ShieldCheck, t: "Documentos profissionais", d: "PDFs elegantes com a sua marca, prontos para enviar." },
            ].map((b) => (
              <Card key={b.t} className="p-6">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary-soft text-primary-dark">
                  <b.icon className="h-5 w-5" />
                </div>
                <div className="mt-4 text-base font-semibold">{b.t}</div>
                <div className="mt-1 text-sm text-muted-foreground">{b.d}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como" className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">Como funciona</div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Do primeiro contacto ao orçamento enviado</h2>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              { n: "01", t: "Registe o cliente", d: "Guarde contactos, NUIT e histórico de obras num único lugar." },
              { n: "02", t: "Crie o orçamento", d: "Adicione itens, unidades e mão de obra. O total é calculado automaticamente." },
              { n: "03", t: "Envie pelo WhatsApp", d: "Gere o PDF profissional e partilhe diretamente com o cliente." },
            ].map((s) => (
              <div key={s.n} className="relative rounded-2xl border border-border bg-card p-6">
                <div className="text-4xl font-black text-primary/20">{s.n}</div>
                <div className="mt-2 text-lg font-semibold">{s.t}</div>
                <div className="mt-2 text-sm text-muted-foreground">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section id="funcionalidades" className="bg-muted/40 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Funcionalidades principais</h2>
            <p className="mt-3 text-muted-foreground">Feito para o dia-a-dia real de uma empreiteira em Moçambique.</p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Users, t: "Gestão de clientes", d: "Particulares e empresas, com NUIT e histórico." },
              { icon: HardHat, t: "Gestão de obras", d: "Estados, progresso, prazos e responsáveis." },
              { icon: FileText, t: "Orçamentos por categoria", d: "Fundação, alvenaria, cobertura, pintura e mais." },
              { icon: Wallet, t: "Pagamentos e recibos", d: "Registe pagamentos M-Pesa, e-Mola ou transferência." },
              { icon: BarChart3, t: "Relatórios claros", d: "Veja quanto orçou, recebeu e quanto está pendente." },
              { icon: LayoutDashboard, t: "Dashboard visual", d: "Números importantes num só ecrã." },
            ].map((f) => (
              <Card key={f.t} className="p-6">
                <div className="flex items-start gap-4">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-base font-semibold">{f.t}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{f.d}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Planos simples e transparentes</h2>
            <p className="mt-3 text-muted-foreground">Escolha o plano certo para o tamanho da sua empresa.</p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {[
              {
                nome: "Inicial", destaque: false,
                features: ["Até 5 obras", "Até 30 clientes", "Orçamentos em PDF", "1 utilizador"],
              },
              {
                nome: "Profissional", destaque: true,
                features: ["Obras ilimitadas", "Clientes ilimitados", "Controlo de pagamentos", "Relatórios", "Até 3 utilizadores"],
              },
              {
                nome: "Empresa", destaque: false,
                features: ["Todas as funcionalidades", "Mais utilizadores", "Suporte prioritário", "Personalização"],
              },
            ].map((p) => (
              <Card key={p.nome} className={p.destaque ? "relative border-primary p-8 shadow-lg ring-2 ring-primary/20" : "p-8"}>
                {p.destaque && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground">
                    Mais popular
                  </div>
                )}
                <div className="text-sm font-semibold uppercase tracking-wider text-primary">Plano</div>
                <div className="mt-1 text-2xl font-bold">{p.nome}</div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-foreground">Em breve</span>
                </div>
                <div className="text-xs text-muted-foreground">Preços definidos em breve</div>
                <ul className="mt-6 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {f}
                    </li>
                  ))}
                </ul>
                <Link to="/criar-conta" className="mt-6 block">
                  <Button className={p.destaque ? "w-full bg-primary hover:bg-primary-dark" : "w-full"} variant={p.destaque ? "default" : "outline"}>
                    Começar
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-muted/40 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Perguntas frequentes</h2>
          </div>
          <Accordion type="single" collapsible className="mt-10">
            {[
              { q: "O ObraMZ funciona no telemóvel?", a: "Sim. A aplicação foi desenhada para computador, tablet e telemóvel." },
              { q: "Posso usar em português?", a: "Toda a plataforma está em português, adaptada à realidade de Moçambique." },
              { q: "Os valores são em Meticais?", a: "Sim. Todos os valores são apresentados em MZN, com formato local." },
              { q: "Preciso instalar alguma coisa?", a: "Não. O ObraMZ funciona no navegador do computador ou telemóvel." },
              { q: "Posso enviar orçamentos pelo WhatsApp?", a: "Sim. Gera-se o PDF e partilha-se com um clique." },
            ].map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary-dark p-10 text-center text-primary-foreground sm:p-16">
            <h2 className="text-3xl font-bold sm:text-4xl">Pronto para organizar as suas obras?</h2>
            <p className="mt-3 text-primary-foreground/90">Comece hoje. Simples, rápido e feito para si.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/criar-conta">
                <Button size="lg" variant="secondary">Criar conta gratuita</Button>
              </Link>
              <Link to="/app">
                <Button size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20">
                  Ver demonstração
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-5">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground font-black">O</div>
                <span className="font-bold">ObraMZ</span>
              </div>
              <p className="mt-3 max-w-xs text-sm text-muted-foreground">
                Gestão de orçamentos e obras para pequenos e médios empreiteiros em Moçambique.
              </p>
            </div>
            {[
              { t: "Produto", l: ["Funcionalidades", "Planos", "Demonstração"] },
              { t: "Suporte", l: ["Ajuda", "Contactos", "Estado do serviço"] },
              { t: "Legal", l: ["Termos", "Privacidade"] },
            ].map((c) => (
              <div key={c.t}>
                <div className="text-sm font-semibold">{c.t}</div>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {c.l.map((x) => (
                    <li key={x}><a className="hover:text-foreground" href="#">{x}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
            <div>© 2026 ObraMZ. Todos os direitos reservados.</div>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-3.5 w-3.5" />
              <span>+258 84 000 0000</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
