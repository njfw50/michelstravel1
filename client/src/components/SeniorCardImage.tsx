import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const SeniorCardImage = () => (
  <div className="flex justify-center mb-4">
    <img
      src="/assets/images/senior-airport.png"
      alt="Idoso no aeroporto com bilhete na mão"
      style={{ width: "100%", maxWidth: 420, height: "auto", borderRadius: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}
    />
  </div>
);

export default SeniorCardImage;
