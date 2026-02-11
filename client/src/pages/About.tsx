import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { Heart, MapPin, Users, ShieldCheck, Globe, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function About() {
  const { t } = useI18n();
  const [_, setLocation] = useLocation();

  return (
    <div className="min-h-screen">
      <div className="relative bg-black/20 backdrop-blur-md border-b border-white/10 py-24 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent" />
        <div className="relative z-10 container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-6 drop-shadow-lg" data-testid="text-about-title">
              {t("about.title")}
            </h1>
            <p className="text-xl text-white/60 max-w-2xl mx-auto leading-relaxed" data-testid="text-about-subtitle">
              {t("about.subtitle")}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-6">
            <Heart className="h-6 w-6 text-amber-400" />
            <h2 className="text-2xl font-display font-bold text-white">{t("about.story_title")}</h2>
          </div>
          <div className="space-y-5 text-white/60 leading-relaxed text-base">
            <p>{t("about.story_p1")}</p>
            <p>{t("about.story_p2")}</p>
            <p>{t("about.story_p3")}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-6">
            <MapPin className="h-6 w-6 text-amber-400" />
            <h2 className="text-2xl font-display font-bold text-white">{t("about.mission_title")}</h2>
          </div>
          <div className="space-y-5 text-white/60 leading-relaxed text-base">
            <p>{t("about.mission_p1")}</p>
            <p>{t("about.mission_p2")}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Globe, titleKey: "about.value1_title", descKey: "about.value1_desc", color: "text-teal-400" },
              { icon: ShieldCheck, titleKey: "about.value2_title", descKey: "about.value2_desc", color: "text-emerald-400" },
              { icon: Users, titleKey: "about.value3_title", descKey: "about.value3_desc", color: "text-amber-400" },
            ].map((v, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-center"
              >
                <v.icon className={`h-8 w-8 ${v.color} mx-auto mb-4`} />
                <h3 className="font-bold text-white mb-2">{t(v.titleKey)}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{t(v.descKey)}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-6">
            <Plane className="h-6 w-6 text-amber-400" />
            <h2 className="text-2xl font-display font-bold text-white">{t("about.today_title")}</h2>
          </div>
          <div className="space-y-5 text-white/60 leading-relaxed text-base">
            <p>{t("about.today_p1")}</p>
            <p>{t("about.today_p2")}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center py-10 border-t border-white/10"
        >
          <h3 className="text-2xl font-display font-bold text-white mb-4">{t("about.cta_title")}</h3>
          <p className="text-white/50 mb-8 max-w-lg mx-auto">{t("about.cta_desc")}</p>
          <Button
            onClick={() => setLocation("/")}
            className="rounded-full px-8 py-5 font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg shadow-amber-900/30"
            data-testid="button-about-cta"
          >
            {t("about.cta_button")}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
