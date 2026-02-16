import { useState } from "react";
import { Link } from "wouter";
import { useI18n } from "@/lib/i18n";
import { SEO } from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen(!open)}
      aria-expanded={open}
      className="w-full text-left border-b border-border last:border-0"
      data-testid={`faq-item-${question.substring(0, 20).replace(/\s/g, "-").toLowerCase()}`}
    >
      <div className="flex items-center justify-between gap-3 py-4 px-1">
        <span className="text-sm font-medium text-foreground flex-1">{question}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
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
            <p className="text-sm text-muted-foreground pb-4 px-1 leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

export default function HelpCenter() {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

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
    <div className="container mx-auto px-4 py-8">
      <SEO
        title={t("help.title")}
        description={t("help.subtitle")}
        path="/help"
        structuredData={faqStructuredData}
      />

      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <HelpCircle className="h-7 w-7 text-blue-600" />
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-help-title">
              {t("help.title")}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">{t("help.subtitle")}</p>
        </div>

        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.trim()) setActiveCategory(null);
            }}
            placeholder={t("help.search_placeholder")}
            className="pl-10"
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
              <p className="text-xs text-muted-foreground mb-3">
                {filteredFaqs.length} {t("help.results_found")}
              </p>
              {filteredFaqs.length === 0 ? (
                <Card className="p-8 text-center">
                  <Search className="h-8 w-8 mx-auto mb-3 text-muted-foreground opacity-30" />
                  <p className="text-sm font-medium mb-1">{t("help.no_results")}</p>
                  <p className="text-xs text-muted-foreground mb-4">{t("help.no_results_desc")}</p>
                  <Link href="/messages">
                    <Button data-testid="button-contact-from-search">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      {t("help.contact_team")}
                    </Button>
                  </Link>
                </Card>
              ) : (
                <Card className="divide-y divide-border px-4">
                  {filteredFaqs.map((faq, i) => (
                    <div key={i}>
                      <Badge variant="secondary" className="mt-3 text-[10px]" data-testid={`badge-category-${faq.category}`}>{faq.categoryTitle}</Badge>
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
                className="mb-4 text-sm"
                data-testid="button-back-categories"
              >
                {t("help.back_categories")}
              </Button>
              <Card className="overflow-hidden">
                <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-3">
                  <selectedCategory.icon className="h-5 w-5 text-blue-600" />
                  <div>
                    <h2 className="font-semibold text-sm">{selectedCategory.title}</h2>
                    <p className="text-xs text-muted-foreground">{selectedCategory.description}</p>
                  </div>
                </div>
                <div className="px-4 divide-y divide-border">
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
                    className="p-4 cursor-pointer hover-elevate transition-all"
                    onClick={() => setActiveCategory(cat.id)}
                    data-testid={`card-category-${cat.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-md bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <cat.icon className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold mb-0.5">{cat.title}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">{cat.description}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Card className="p-5">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  {t("help.contact_title")}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-start gap-2.5">
                    <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium">{t("help.contact_messenger")}</p>
                      <Link href="/messages" className="text-xs text-blue-600 hover:underline" data-testid="link-contact-messages">
                        {t("help.contact_messenger_action")}
                      </Link>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Mail className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium">Email</p>
                      <a href="mailto:reservastrens@gmail.com" className="text-xs text-blue-600 hover:underline" data-testid="link-contact-email">
                        reservastrens@gmail.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium">{t("help.contact_phone")}</p>
                      <a href="tel:+18623501161" className="text-xs text-blue-600 hover:underline" data-testid="link-contact-phone">
                        +1 (862) 350-1161
                      </a>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="mt-6 flex items-center justify-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{t("help.response_time")}</span>
                </div>
                <span className="text-border">|</span>
                <div className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" />
                  <span>{t("help.languages")}</span>
                </div>
                <span className="text-border">|</span>
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
