import { useState } from "react";
import { Link } from "wouter";
import { useI18n } from "@/lib/i18n";
import { SEO } from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AGENCY_EMAIL,
  AGENCY_WHATSAPP_DISPLAY,
  buildWhatsAppHref,
  buildWhatsAppMessage,
} from "@/lib/contact";
import {
  Search,
  Plane,
  CreditCard,
  Luggage,
  UserCircle,
  HelpCircle,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  Clock,
  Shield,
  Globe,
  Bot,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { openChatbotAssistant } from "@/lib/chatbot";

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button onClick={() => setOpen(!open)} aria-expanded={open} className="w-full text-left border-b border-white/5 last:border-0" data-testid={`faq-item-${question.substring(0, 20).replace(/\s/g, "-").toLowerCase()}`}>
      <div className="flex items-center justify-between gap-3 py-4 px-1">
        <span className="text-sm font-medium text-white flex-1">{question}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-slate-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />
        )}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-sm text-slate-300 pb-4 px-1 leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

export default function HelpCenter() {
  const { t, language } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const whatsAppHref = buildWhatsAppHref(
    buildWhatsAppMessage({
      topic: "Central de ajuda",
      details: ["Pagina: Help Center"],
    }),
  );

  const categories = [
    {
      id: "booking",
      icon: Plane,
      title: t("help.cat_booking"),
      description: t("help.cat_booking_desc"),
      faqs: [
        { q: t("help.faq_search_q"), a: t("help.faq_search_a") },
        { q: t("help.faq_booking_steps_q"), a: t("help.faq_booking_steps_a") },
        { q: t("help.faq_multi_city_q"), a: t("help.faq_multi_city_a") },
        { q: t("help.faq_passengers_q"), a: t("help.faq_passengers_a") },
      ],
    },
    {
      id: "payment",
      icon: CreditCard,
      title: t("help.cat_payment"),
      description: t("help.cat_payment_desc"),
      faqs: [
        { q: t("help.faq_payment_methods_q"), a: t("help.faq_payment_methods_a") },
        { q: t("help.faq_payment_secure_q"), a: t("help.faq_payment_secure_a") },
        { q: t("help.faq_currency_q"), a: t("help.faq_currency_a") },
      ],
    },
    {
      id: "trips",
      icon: Luggage,
      title: t("help.cat_trips"),
      description: t("help.cat_trips_desc"),
      faqs: [
        { q: t("help.faq_manage_booking_q"), a: t("help.faq_manage_booking_a") },
        { q: t("help.faq_cancel_q"), a: t("help.faq_cancel_a") },
        { q: t("help.faq_baggage_q"), a: t("help.faq_baggage_a") },
        { q: t("help.faq_reference_q"), a: t("help.faq_reference_a") },
      ],
    },
    {
      id: "account",
      icon: UserCircle,
      title: t("help.cat_account"),
      description: t("help.cat_account_desc"),
      faqs: [
        { q: t("help.faq_create_account_q"), a: t("help.faq_create_account_a") },
        { q: t("help.faq_edit_profile_q"), a: t("help.faq_edit_profile_a") },
      ],
    },
    {
      id: "support",
      icon: MessageSquare,
      title: t("help.cat_support"),
      description: t("help.cat_support_desc"),
      faqs: [
        { q: t("help.faq_contact_q"), a: t("help.faq_contact_a") },
        { q: t("help.faq_response_time_q"), a: t("help.faq_response_time_a") },
        { q: t("help.faq_live_help_q"), a: t("help.faq_live_help_a") },
      ],
    },
  ];

  const allFaqs = categories.flatMap((cat) =>
    cat.faqs.map((faq) => ({ ...faq, category: cat.id, categoryTitle: cat.title }))
  );

  const filteredFaqs = searchQuery.trim()
    ? allFaqs.filter(
      (faq) =>
        faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : [];

  const selectedCategory = activeCategory
    ? categories.find((c) => c.id === activeCategory)
    : null;

  const chatbotCopy =
    language === "en"
      ? {
        eyebrow: "AI travel desk",
        title: "Chat with Mia inside Help",
        description:
          "Use Mia here to search flights, check a booking, or ask for guided help before payment.",
        primaryCta: "Open Mia",
        secondaryCta: "Check my booking",
      }
      : language === "es"
        ? {
          eyebrow: "Asistente de viajes con IA",
          title: "Hable con Mia dentro de Ayuda",
          description:
            "Use Mia aquí para buscar vuelos, consultar una reserva o recibir ayuda guiada antes del pago.",
          primaryCta: "Abrir Mia",
          secondaryCta: "Consultar mi reserva",
        }
        : {
          eyebrow: "Assistente de viagem com IA",
          title: "Fale com a Mia dentro da Ajuda",
          description:
            "Use a Mia aqui para buscar voos, consultar uma reserva ou receber ajuda guiada antes do pagamento.",
          primaryCta: "Abrir Mia",
          secondaryCta: "Consultar minha reserva",
        };

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": allFaqs.map((faq) => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-slate-950 container mx-auto px-4 py-8">
      <SEO
        title={t("help.title")}
        description={t("help.subtitle")}
        path="/help"
        structuredData={faqStructuredData}
      />

      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <HelpCircle className="h-7 w-7 text-blue-400" />
            <h1 className="text-2xl font-bold text-white" data-testid="text-help-title">
              {t("help.title")}
            </h1>
          </div>
          <p className="text-sm text-slate-300">{t("help.subtitle")}</p>
        </div>

        <Card className="mb-6 overflow-hidden border-white/10 bg-gradient-to-br from-slate-900 via-[#0d1635] to-slate-950 shadow-2xl">
          <div className="p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-400">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{chatbotCopy.eyebrow}</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">{chatbotCopy.title}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-slate-300">{chatbotCopy.description}</p>
                  </div>
                </div>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto">
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => openChatbotAssistant()}
                  data-testid="button-help-open-chatbot"
                >
                  <Bot className="mr-2 h-4 w-4" />
                  {chatbotCopy.primaryCta}
                </Button>
                <Button
                  variant="outline"
                  className="border-slate-700 text-white hover:bg-white/5"
                  onClick={() =>
                    openChatbotAssistant({
                      message:
                        language === "en"
                          ? "I want to check my booking. My reference starts with MT-."
                          : language === "es"
                            ? "Quiero consultar mi reserva. Mi referencia empieza con MT-."
                            : "Quero consultar minha reserva. Minha referência começa com MT-.",
                    })
                  }
                  data-testid="button-help-booking-chatbot"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  {chatbotCopy.secondaryCta}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.trim()) setActiveCategory(null);
            }}
            placeholder={t("help.search_placeholder")}
            className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
            data-testid="input-help-search"
          />
        </div>

        <AnimatePresence mode="wait">
          {searchQuery.trim() ? (
            <motion.div
              key="search-results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <p className="text-xs text-slate-400 mb-3">
                {filteredFaqs.length} {t("help.results_found")}
              </p>
              {filteredFaqs.length === 0 ? (
                <Card className="p-8 text-center bg-slate-900 border-white/5">
                  <Search className="h-8 w-8 mx-auto mb-3 text-slate-600 opacity-30" />
                  <p className="text-sm font-medium mb-1 text-white">{t("help.no_results")}</p>
                  <p className="text-xs text-slate-400 mb-4">{t("help.no_results_desc")}</p>
                  <a href={whatsAppHref} target="_blank" rel="noreferrer">
                    <Button data-testid="button-contact-from-search" className="bg-blue-600 hover:bg-blue-700">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Abrir WhatsApp
                    </Button>
                  </a>
                </Card>
              ) : (
                <Card className="divide-y divide-white/5 border-white/5 bg-slate-900 px-4">
                  {filteredFaqs.map((faq, i) => (
                    <div key={i}>
                      <Badge variant="secondary" className="mt-3 text-[10px] bg-white/5 text-slate-300" data-testid={`badge-category-${faq.category}`}>{faq.categoryTitle}</Badge>
                      <FAQItem question={faq.q} answer={faq.a} />
                    </div>
                  ))}
                </Card>
              )}
            </motion.div>
          ) : selectedCategory ? (
            <motion.div
              key={`cat-${selectedCategory.id}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Button
                variant="ghost"
                onClick={() => setActiveCategory(null)}
                className="mb-4 text-sm text-slate-400 hover:text-white hover:bg-white/5"
                data-testid="button-back-categories"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t("help.back_categories")}
              </Button>
              <Card className="overflow-hidden border-white/5 bg-slate-900">
                <div className="p-4 border-b border-white/5 bg-white/5 flex items-center gap-3">
                  <selectedCategory.icon className="h-5 w-5 text-blue-400" />
                  <div>
                    <h2 className="font-semibold text-sm text-white">{selectedCategory.title}</h2>
                    <p className="text-xs text-slate-400">{selectedCategory.description}</p>
                  </div>
                </div>
                <div className="px-4 divide-y divide-white/5">
                  {selectedCategory.faqs.map((faq, i) => (
                    <FAQItem key={i} question={faq.q} answer={faq.a} />
                  ))}
                </div>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="categories"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                {categories.map((cat) => (
                  <Card
                    key={cat.id}
                    className="p-4 cursor-pointer hover:bg-white/5 transition-all border-white/5 bg-slate-900"
                    onClick={() => setActiveCategory(cat.id)}
                    data-testid={`card-category-${cat.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-md bg-white/5 flex items-center justify-center flex-shrink-0">
                        <cat.icon className="h-4 w-4 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold mb-0.5 text-white">{cat.title}</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">{cat.description}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Card className="p-5 border-white/5 bg-slate-900">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-white">
                  <Mail className="h-4 w-4 text-blue-400" />
                  {t("help.contact_title")}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-start gap-2.5">
                    <MessageSquare className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-white">WhatsApp</p>
                      <a href={whatsAppHref} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:text-blue-300 hover:underline" data-testid="link-contact-messages">
                        Abrir conversa
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Mail className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-white">Email</p>
                      <a href={`mailto:${AGENCY_EMAIL}`} className="text-xs text-blue-400 hover:text-blue-300 hover:underline" data-testid="link-contact-email">
                        {AGENCY_EMAIL}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Phone className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-white">WhatsApp direto</p>
                      <a href={whatsAppHref} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:text-blue-300 hover:underline" data-testid="link-contact-phone">
                        {AGENCY_WHATSAPP_DISPLAY}
                      </a>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="mt-6 flex items-center justify-center gap-3 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{t("help.response_time")}</span>
                </div>
                <span className="text-slate-800">|</span>
                <div className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" />
                  <span>{t("help.languages")}</span>
                </div>
                <span className="text-slate-800">|</span>
                <div className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" />
                  <span>{t("help.secure")}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const ArrowLeft = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
);
