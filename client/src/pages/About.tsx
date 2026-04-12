import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { Heart, MapPin, Users, ShieldCheck, Globe, Plane, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { SEO } from "@/components/SEO";

export default function About() {
  const { t } = useI18n();
  const [_, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-slate-950">
      <SEO
        title="Sobre Nós"
        description="Conheça a Michels Travel, operação registrada em New Jersey com foco em passagens aéreas, atendimento humano e pagamento seguro."
        path="/about"
        structuredData={[
          {
            "@context": "https://schema.org",
            "@type": "AboutPage",
            "name": "Sobre Nós | Michels Travel",
            "url": "https://www.michelstravel.agency/about",
            "description": "Página institucional da Michels Travel com informações sobre atendimento, operação e proposta de valor.",
            "mainEntity": {
              "@type": "TravelAgency",
              "name": "Michels Travel",
              "url": "https://www.michelstravel.agency",
              "telephone": "+1-862-350-1161",
              "email": "contact@michelstravel.agency",
              "address": {
                "@type": "PostalAddress",
                "addressRegion": "NJ",
                "addressCountry": "US"
              }
            }
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.michelstravel.agency/" },
              { "@type": "ListItem", "position": 2, "name": "Sobre Nós", "item": "https://www.michelstravel.agency/about" }
            ]
          }
        ]}
      />
      <div className="relative py-28 md:py-36 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-slate-950 to-slate-950" />
        <div className="relative z-10 container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="text-xs font-bold text-blue-400 uppercase tracking-[0.2em] mb-4 block">Michels Travel</span>
            <h1 className="text-5xl md:text-7xl font-display font-extrabold text-white mb-6 leading-[0.95]" data-testid="text-about-title">
              {t("about.title")}
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed" data-testid="text-about-subtitle">
              {t("about.subtitle")}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-16 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-3xl font-display font-extrabold text-white">{t("about.story_title")}</h2>
          </div>
          <div className="space-y-5 text-slate-400 leading-relaxed text-base pl-2 md:pl-[52px]">
            <p>{t("about.story_p1")}</p>
            <p>{t("about.story_p2")}</p>
            <p>{t("about.story_p3")}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-blue-700 flex items-center justify-center shadow-lg shadow-blue-700/20">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-3xl font-display font-extrabold text-white">{t("about.mission_title")}</h2>
          </div>
          <div className="space-y-5 text-slate-400 leading-relaxed text-base pl-2 md:pl-[52px]">
            <p>{t("about.mission_p1")}</p>
            <p>{t("about.mission_p2")}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { icon: Globe, titleKey: "about.value1_title", descKey: "about.value1_desc", color: "bg-blue-500" },
              { icon: ShieldCheck, titleKey: "about.value2_title", descKey: "about.value2_desc", color: "bg-emerald-500" },
              { icon: Users, titleKey: "about.value3_title", descKey: "about.value3_desc", color: "bg-blue-600" },
            ].map((v, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-2xl bg-white/5 border border-white/5 text-center group transition-all duration-300 hover:shadow-2xl hover:border-blue-500/30"
              >
                <div className={`h-14 w-14 rounded-xl ${v.color} flex items-center justify-center mx-auto mb-5 shadow-lg`}>
                  <v.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-white mb-3 text-lg">{t(v.titleKey)}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{t(v.descKey)}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <Plane className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-3xl font-display font-extrabold text-white">{t("about.today_title")}</h2>
          </div>
          <div className="space-y-5 text-slate-400 leading-relaxed text-base pl-2 md:pl-[52px]">
            <p>{t("about.today_p1")}</p>
            <p>{t("about.today_p2")}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center py-16 relative overflow-hidden rounded-3xl bg-blue-950/20 border border-white/5"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-transparent to-slate-900/10 pointer-events-none" />
          <div className="relative z-10 px-8">
            <h3 className="text-3xl md:text-4xl font-display font-extrabold text-white mb-4">{t("about.cta_title")}</h3>
            <p className="text-slate-400 mb-8 max-w-lg mx-auto leading-relaxed">{t("about.cta_desc")}</p>
            <Button
              onClick={() => setLocation("/")}
              className="rounded-full px-10 py-6 font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/20 text-lg transition-transform hover:scale-105 active:scale-95"
              data-testid="button-about-cta"
            >
              {t("about.cta_button")} <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
