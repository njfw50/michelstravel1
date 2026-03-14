import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import {
  ArrowRight,
  CheckCircle2,
  Globe,
  Headphones,
  MapPin,
  MessageCircle,
  PhoneCall,
  Plane,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import {
  AGENCY_WHATSAPP_DISPLAY,
  AGENCY_PHONE_TEL,
  buildWhatsAppHref,
  buildWhatsAppMessage,
} from "@/lib/contact";

const faqItems = [
  {
    question: "Vocês atendem clientes do Ironbound em português?",
    answer:
      "Sim. A Michels Travel atende clientes em português, inglês e espanhol, com suporte humano para pesquisa, reserva, pagamento e acompanhamento da viagem.",
  },
  {
    question: "Vocês ajudam com voos de Newark para o Brasil?",
    answer:
      "Sim. Uma das demandas mais comuns da região é a busca de voos saindo de Newark para cidades como São Paulo e Rio de Janeiro, além de conexões para outros destinos.",
  },
  {
    question: "Posso falar com alguém antes de emitir a passagem?",
    answer:
      "Pode. Se você quiser comparar opções, validar bagagem, horário, escalas ou regras de alteração antes de pagar, o atendimento humano pode te orientar antes da emissão.",
  },
  {
    question: "Por que escolher a Michels Travel para viajar saindo de Newark?",
    answer:
      "Porque você encontra atendimento em português, busca mais direta para voos saindo de Newark e apoio humano para comparar tarifa, bagagem, escalas e regras antes de pagar.",
  },
];

const popularRoutes = [
  { label: "Newark para São Paulo", destination: "GRU", dateOffset: 21 },
  { label: "Newark para Rio de Janeiro", destination: "GIG", dateOffset: 24 },
  { label: "Newark para Orlando", destination: "MCO", dateOffset: 15 },
  { label: "Newark para Lisboa", destination: "LIS", dateOffset: 28 },
];

function formatFutureDate(offsetDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().split("T")[0];
}

export default function IronboundNewark() {
  const [, setLocation] = useLocation();
  const whatsAppHref = buildWhatsAppHref(
    buildWhatsAppMessage({
      language: "pt",
      topic: "Atendimento em Ironbound Newark",
      details: ["Pagina: Ironbound Newark"],
    }),
  );

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Agência de Viagens em Ironbound, Newark | Michels Travel",
      url: "https://www.michelstravel.agency/agencia-de-viagens-ironbound-newark",
      description:
        "Página local da Michels Travel para clientes de Ironbound e Newark que buscam passagens aéreas, voos para o Brasil e atendimento humano em português.",
      about: {
        "@type": "Service",
        name: "Atendimento de agência de viagens para Ironbound e Newark",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      serviceType: "Agência de viagens e passagens aéreas em Ironbound, Newark",
      name: "Michels Travel | Atendimento local para Ironbound, Newark",
      url: "https://www.michelstravel.agency/agencia-de-viagens-ironbound-newark",
      areaServed: [
        { "@type": "Place", name: "Ironbound, Newark, NJ" },
        { "@type": "City", name: "Newark" },
        { "@type": "Place", name: "New Jersey" },
      ],
      provider: {
        "@type": "TravelAgency",
        name: "Michels Travel",
        url: "https://www.michelstravel.agency",
        telephone: AGENCY_PHONE_TEL,
        email: "contact@michelstravel.agency",
        availableLanguage: ["Portuguese", "English", "Spanish"],
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://www.michelstravel.agency/",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Agência de viagens em Ironbound, Newark",
          item: "https://www.michelstravel.agency/agencia-de-viagens-ironbound-newark",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_28%,#f8fafc_100%)]">
      <SEO
        title="Agência de Viagens em Ironbound, Newark"
        description="Atendimento em português para clientes de Ironbound e Newark que buscam passagens aéreas, voos para o Brasil e suporte humano antes e depois da reserva."
        path="/agencia-de-viagens-ironbound-newark"
        structuredData={structuredData}
      />

      <section className="relative overflow-hidden px-4 pb-16 pt-28 md:pb-24 md:pt-36">
        <div className="absolute inset-0">
          <div className="absolute left-[-5%] top-10 h-64 w-64 rounded-full bg-blue-200/35 blur-3xl" />
          <div className="absolute right-[-8%] top-24 h-80 w-80 rounded-full bg-emerald-200/30 blur-3xl" />
        </div>

        <div className="relative container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-w-4xl text-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/90 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-700 shadow-sm">
              <MapPin className="h-3.5 w-3.5" />
              Ironbound, Newark, NJ
            </span>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-950 md:text-6xl">
              Agência de viagens para quem busca atendimento forte em Ironbound, Newark
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-slate-600 md:text-xl">
              Se o seu foco é sair de Newark, comparar voos com mais clareza e falar com alguém em português
              antes de emitir, esta é a página local da Michels Travel para a região de Ironbound.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                className="rounded-full bg-blue-600 px-7 py-6 text-base font-bold text-white hover:bg-blue-700"
                onClick={() => setLocation("/search")}
              >
                Buscar passagens <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <a href={whatsAppHref} target="_blank" rel="noreferrer">
                <Button variant="outline" className="rounded-full px-7 py-6 text-base font-bold">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  {`WhatsApp ${AGENCY_WHATSAPP_DISPLAY}`}
                </Button>
              </a>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-3 text-left sm:grid-cols-3">
              {[
                "Atendimento em português, inglês e espanhol",
                "Apoio para voos entre Newark e o Brasil",
                "Suporte humano antes e depois da reserva",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/80 bg-white/90 px-4 py-4 text-sm font-medium text-slate-700 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.35)]"
                >
                  <CheckCircle2 className="mb-2 h-4 w-4 text-emerald-500" />
                  {item}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-4 py-12 md:py-16">
        <div className="container mx-auto max-w-6xl">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Plane,
                title: "Voos saindo de Newark",
                description:
                  "Conteúdo e atendimento orientados para quem pesquisa saídas por EWR e quer opções mais alinhadas à rotina de Newark e North Jersey.",
              },
              {
                icon: Headphones,
                title: "Suporte humano de verdade",
                description:
                  "A ideia não é só vender bilhete. É ajudar a decidir entre tarifa, bagagem, horários, escalas, regras e melhor caminho antes do pagamento.",
              },
              {
                icon: Globe,
                title: "Foco forte em Brasil e comunidade lusófona",
                description:
                  "A região de Ironbound tem demanda clara por viagens ao Brasil, Portugal e conexões internacionais. A página fala a linguagem dessa busca.",
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
              >
                <Card className="h-full rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_30px_80px_-48px_rgba(15,23,42,0.35)]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-5 text-2xl font-extrabold text-slate-950">{item.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-10 md:py-14">
        <div className="container mx-auto max-w-6xl">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_35px_100px_-60px_rgba(15,23,42,0.4)] md:p-10">
            <div className="max-w-3xl">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Rotas frequentes</span>
              <h2 className="mt-3 text-3xl font-extrabold text-slate-950 md:text-4xl">
                Pesquisas comuns de clientes em Newark
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Essas rotas deixam a busca mais rápida para quem já sabe de onde quer sair e quer
                comparar opções com mais clareza.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {popularRoutes.map((route) => (
                <button
                  key={route.label}
                  type="button"
                  onClick={() => {
                    const params = new URLSearchParams({
                      origin: "EWR",
                      destination: route.destination,
                      date: formatFutureDate(route.dateOffset),
                      passengers: "1",
                      adults: "1",
                      children: "0",
                      infants: "0",
                      cabinClass: "economy",
                    });
                    setLocation(`/search?${params.toString()}`);
                  }}
                  className="group rounded-3xl border border-slate-200 bg-slate-50 px-5 py-5 text-left transition-all duration-200 hover:border-blue-200 hover:bg-blue-50"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Saindo de EWR</span>
                      <div className="mt-2 text-lg font-bold text-slate-900">{route.label}</div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-blue-600" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 md:py-14">
        <div className="container mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[32px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-8 md:p-10">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Atendimento pensado para sua viagem</span>
              <h2 className="mt-3 text-3xl font-extrabold text-slate-950 md:text-4xl">
                O que você encontra aqui antes de reservar
              </h2>
              <div className="mt-6 space-y-5 text-base leading-8 text-slate-600">
                <p>
                  Você encontra uma forma mais direta de pesquisar voos saindo de Newark, falar com alguém em português
                  e comparar o que realmente pesa na compra: tarifa, bagagem, escalas e regras.
                </p>
                <p>
                  Em vez de navegar por páginas genéricas, você chega a uma página feita para quem mora, trabalha
                  ou circula por Newark e quer decidir a viagem com mais segurança.
                </p>
                <p>
                  Se ficar em dúvida, você pode sair da busca e falar com a equipe antes do pagamento.
                </p>
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-slate-950 p-8 text-white md:p-10">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">Seu próximo passo</span>
              <h2 className="mt-3 text-3xl font-extrabold">Escolha como prefere continuar</h2>
              <div className="mt-6 space-y-4 text-sm leading-7 text-slate-300">
                <p className="flex gap-3">
                  <ShieldCheck className="mt-1 h-4 w-4 flex-shrink-0 text-emerald-400" />
                  Atendimento claro para quem quer decidir sem pressa.
                </p>
                <p className="flex gap-3">
                  <MessageCircle className="mt-1 h-4 w-4 flex-shrink-0 text-blue-300" />
                  Caminho direto para conversa no WhatsApp ou busca de passagem.
                </p>
                <p className="flex gap-3">
                  <MapPin className="mt-1 h-4 w-4 flex-shrink-0 text-blue-300" />
                  Ajuda pensada para quem sai de Newark e arredores.
                </p>
              </div>

              <div className="mt-8 flex flex-col gap-3">
                <a href={whatsAppHref} target="_blank" rel="noreferrer">
                  <Button className="w-full rounded-full bg-white text-slate-950 hover:bg-slate-100">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Abrir WhatsApp
                  </Button>
                </a>
                <a href={whatsAppHref} target="_blank" rel="noreferrer">
                  <Button variant="outline" className="w-full rounded-full border-white/30 bg-transparent text-white hover:bg-white/10">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Enviar mensagem no WhatsApp
                  </Button>
                </a>
                <Link href="/passagens-para-o-brasil-saindo-de-newark">
                  <Button variant="outline" className="w-full rounded-full border-white/30 bg-transparent text-white hover:bg-white/10">
                    <Plane className="mr-2 h-4 w-4" />
                    Ver pagina Brasil saindo de Newark
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 md:py-16">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">FAQ local</span>
            <h2 className="mt-3 text-3xl font-extrabold text-slate-950 md:text-4xl">
              Perguntas comuns antes de reservar
            </h2>
          </div>

          <div className="mt-10 space-y-4">
            {faqItems.map((item, index) => (
              <motion.div
                key={item.question}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="rounded-3xl border border-slate-200 bg-white p-6 md:p-7">
                  <h3 className="text-lg font-bold text-slate-950">{item.question}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.answer}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
