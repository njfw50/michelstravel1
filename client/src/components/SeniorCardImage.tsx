import React from "react";
import seniorAirportImg from "@/assets/images/senior-airport.png";

const SeniorCardImage: React.FC = () => (
  <div className="relative w-full overflow-hidden rounded-[20px] shadow-[0_8px_32px_-8px_rgba(15,23,42,0.45)]">
    <img
      src={seniorAirportImg}
      alt="Viajante sênior no aeroporto consultando o painel de voos"
      className="w-full h-full object-cover object-center"
      style={{ display: "block", aspectRatio: "4/5" }}
    />
    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/10 to-transparent" />
    <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 pt-8">
      <span className="inline-block rounded-full bg-blue-500/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
        Michels Travel
      </span>
      <p className="mt-2 text-sm font-semibold leading-snug text-white/90">
        Viaje com calma. Estamos aqui em cada etapa.
      </p>
    </div>
  </div>
);

export default SeniorCardImage;
