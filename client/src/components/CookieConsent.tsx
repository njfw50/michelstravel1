import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Cookie, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";

const COOKIE_CONSENT_KEY = "michels-travel-cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-[200] p-4 md:p-6"
          data-testid="banner-cookie-consent"
        >
          <div className="container mx-auto max-w-4xl">
            <div className="bg-background dark:bg-card border border-border rounded-md shadow-2xl p-5 md:p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex-shrink-0 h-10 w-10 rounded-md bg-blue-50 dark:bg-blue-950 flex items-center justify-center mt-0.5">
                    <Cookie className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-cookie-message">
                      {t("cookie.message")}
                    </p>
                    <a
                      href="#"
                      className="inline-flex items-center gap-1 text-xs text-blue-500 dark:text-blue-400 font-medium mt-1.5 transition-colors"
                      data-testid="link-cookie-privacy"
                    >
                      <Shield className="h-3 w-3" />
                      {t("cookie.privacy")}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDecline}
                    className="flex-1 md:flex-none rounded-md"
                    data-testid="button-cookie-decline"
                  >
                    {t("cookie.decline")}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAccept}
                    className="flex-1 md:flex-none rounded-md"
                    data-testid="button-cookie-accept"
                  >
                    {t("cookie.accept")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
