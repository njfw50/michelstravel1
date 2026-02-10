import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "pt" | "en" | "es";

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isLoading: boolean;
}

const translations: Record<Language, Record<string, string>> = {
  pt: {
    // Header & Footer
    "nav.flights": "Voos",
    "nav.blog": "Guia de Viagem",
    "nav.admin": "Painel Admin",
    "nav.logout": "Sair",
    "nav.signin": "Entrar",
    "footer.slogan": "Opção Eficiente. Sua companheira confiável para encontrar as melhores ofertas de voos em todo o mundo.",
    "footer.company": "Empresa",
    "footer.about": "Sobre Nós",
    "footer.careers": "Carreiras",
    "footer.press": "Imprensa",
    "footer.support": "Suporte",
    "footer.help": "Central de Ajuda",
    "footer.terms": "Termos de Uso",
    "footer.privacy": "Privacidade",
    "footer.newsletter": "Newsletter",
    "footer.subscribe": "Receba ofertas exclusivas.",
    "footer.email_placeholder": "Endereço de e-mail",
    "footer.go": "Ir",
    "footer.rights": "Todos os direitos reservados.",

    // Home
    "home.badge": "Legal em NJ, USA • Segurança e Confiabilidade",
    "home.title.1": "Opção Eficiente",
    "home.title.2": "Para Viajar",
    "home.subtitle": "Descubra os melhores destinos com a Michels Travel. Compare preços, reserve com segurança e viaje com tranquilidade.",
    "home.trust.title": "Por Que Escolher a Michels Travel?",
    "home.trust.subtitle": "Nós tornamos sua viagem simples e segura. Veja por que somos a escolha de confiança.",
    "home.trust.secure": "Reserva Segura",
    "home.trust.secure_desc": "Seus dados são protegidos com criptografia de nível empresarial e gateways de pagamento seguros.",
    "home.trust.instant": "Confirmação Imediata",
    "home.trust.instant_desc": "Sem espera. Receba seu bilhete eletrônico em seu e-mail segundos após o pagamento.",
    "home.trust.support": "Suporte Global 24/7",
    "home.trust.support_desc": "Nossa equipe de especialistas em viagens está aqui para ajudar você a qualquer hora.",
    "home.popular.title": "Destinos em Alta",
    "home.popular.subtitle": "Voos mais reservados pela nossa comunidade esta semana",
    "home.popular.view_all": "Ver Todos",
    "home.popular.from": "Voos de",
    "home.popular.check_prices": "Ver Preços",
    "home.popular.searches": "buscas",

    // Search Form
    "search.round_trip": "Ida e Volta",
    "search.one_way": "Só Ida",
    "search.multi_city": "Vários Destinos",
    "search.origin": "Origem",
    "search.destination": "Destino",
    "search.city_placeholder": "Cidade ou Aeroporto",
    "search.departure": "Ida",
    "search.return": "Volta",
    "search.date_placeholder": "Escolher data",
    "search.optional": "Opcional",
    "search.passengers_class": "Passageiros & Classe",
    "search.travelers": "Viajantes",
    "search.person": "Pessoa",
    "search.people": "Pessoas",
    "search.class": "Classe",
    "search.passengers": "Passageiros",
    "search.adults": "Adultos",
    "search.adults_desc": "12+ anos",
    "search.children": "Crianças",
    "search.children_desc": "2-11 anos",
    "search.infants": "Bebês",
    "search.infants_desc": "Menos de 2 anos",
    "search.button": "Buscar Voo",
    
    // Classes
    "class.economy": "Econômica",
    "class.premium_economy": "Econ. Premium",
    "class.business": "Executiva",
    "class.first": "Primeira",
  },
  en: {
    // Header & Footer
    "nav.flights": "Flights",
    "nav.blog": "Travel Guide",
    "nav.admin": "Admin Dashboard",
    "nav.logout": "Log out",
    "nav.signin": "Sign In",
    "footer.slogan": "Efficient Option. Your trusted companion for finding the best flight deals worldwide.",
    "footer.company": "Company",
    "footer.about": "About Us",
    "footer.careers": "Careers",
    "footer.press": "Press",
    "footer.support": "Support",
    "footer.help": "Help Center",
    "footer.terms": "Terms of Service",
    "footer.privacy": "Privacy Policy",
    "footer.newsletter": "Newsletter",
    "footer.subscribe": "Subscribe for exclusive deals.",
    "footer.email_placeholder": "Email address",
    "footer.go": "Go",
    "footer.rights": "All rights reserved.",

    // Home
    "home.badge": "Legal in NJ, USA • Safety & Reliability",
    "home.title.1": "Efficient Option",
    "home.title.2": "To Travel",
    "home.subtitle": "Discover the best destinations with Michels Travel. Compare prices, book securely, and travel with peace of mind.",
    "home.trust.title": "Why Choose Michels Travel?",
    "home.trust.subtitle": "We make your travel simple and safe. See why we are the trusted choice.",
    "home.trust.secure": "Secure Booking",
    "home.trust.secure_desc": "Your data is protected with enterprise-grade encryption and secure payment gateways.",
    "home.trust.instant": "Instant Confirmation",
    "home.trust.instant_desc": "No waiting. Receive your e-ticket in your email seconds after payment.",
    "home.trust.support": "24/7 Global Support",
    "home.trust.support_desc": "Our team of travel experts is here to help you anytime.",
    "home.popular.title": "Trending Destinations",
    "home.popular.subtitle": "Most booked flights by our community this week",
    "home.popular.view_all": "View All",
    "home.popular.from": "Flights from",
    "home.popular.check_prices": "Check Prices",
    "home.popular.searches": "searches",

    // Search Form
    "search.round_trip": "Round Trip",
    "search.one_way": "One Way",
    "search.multi_city": "Multi-City",
    "search.origin": "Origin",
    "search.destination": "Destination",
    "search.city_placeholder": "City or Airport",
    "search.departure": "Departure",
    "search.return": "Return",
    "search.date_placeholder": "Pick a date",
    "search.optional": "Optional",
    "search.passengers_class": "Travelers & Class",
    "search.travelers": "Travelers",
    "search.person": "Person",
    "search.people": "People",
    "search.class": "Class",
    "search.passengers": "Passengers",
    "search.adults": "Adults",
    "search.adults_desc": "12+ years",
    "search.children": "Children",
    "search.children_desc": "2-11 years",
    "search.infants": "Infants",
    "search.infants_desc": "Under 2 years",
    "search.button": "Search Flight",

    // Classes
    "class.economy": "Economy",
    "class.premium_economy": "Prem. Economy",
    "class.business": "Business",
    "class.first": "First Class",
  },
  es: {
    // Header & Footer
    "nav.flights": "Vuelos",
    "nav.blog": "Guía de Viaje",
    "nav.admin": "Panel Admin",
    "nav.logout": "Cerrar Sesión",
    "nav.signin": "Ingresar",
    "footer.slogan": "Opción Eficiente. Su compañero confiable para encontrar las mejores ofertas de vuelos en todo el mundo.",
    "footer.company": "Empresa",
    "footer.about": "Sobre Nosotros",
    "footer.careers": "Carreras",
    "footer.press": "Prensa",
    "footer.support": "Soporte",
    "footer.help": "Centro de Ayuda",
    "footer.terms": "Términos de Servicio",
    "footer.privacy": "Privacidad",
    "footer.newsletter": "Boletín",
    "footer.subscribe": "Suscríbase para ofertas exclusivas.",
    "footer.email_placeholder": "Dirección de correo",
    "footer.go": "Ir",
    "footer.rights": "Todos los derechos reservados.",

    // Home
    "home.badge": "Legal en NJ, USA • Seguridad y Confiabilidad",
    "home.title.1": "Opción Eficiente",
    "home.title.2": "Para Viajar",
    "home.subtitle": "Descubra los mejores destinos con Michels Travel. Compare precios, reserve con seguridad y viaje con tranquilidad.",
    "home.trust.title": "¿Por Qué Elegir Michels Travel?",
    "home.trust.subtitle": "Hacemos su viaje simple y seguro. Vea por qué somos la elección confiable.",
    "home.trust.secure": "Reserva Segura",
    "home.trust.secure_desc": "Sus datos están protegidos con encriptación empresarial y pasarelas de pago seguras.",
    "home.trust.instant": "Confirmación Inmediata",
    "home.trust.instant_desc": "Sin esperas. Reciba su boleto electrónico en su correo segundos después del pago.",
    "home.trust.support": "Soporte Global 24/7",
    "home.trust.support_desc": "Nuestro equipo de expertos en viajes está aquí para ayudarle en cualquier momento.",
    "home.popular.title": "Destinos Populares",
    "home.popular.subtitle": "Vuelos más reservados por nuestra comunidad esta semana",
    "home.popular.view_all": "Ver Todos",
    "home.popular.from": "Vuelos desde",
    "home.popular.check_prices": "Ver Precios",
    "home.popular.searches": "búsquedas",

    // Search Form
    "search.round_trip": "Ida y Vuelta",
    "search.one_way": "Solo Ida",
    "search.multi_city": "Múltiples Destinos",
    "search.origin": "Origen",
    "search.destination": "Destino",
    "search.city_placeholder": "Ciudad o Aeropuerto",
    "search.departure": "Ida",
    "search.return": "Vuelta",
    "search.date_placeholder": "Elegir fecha",
    "search.optional": "Opcional",
    "search.passengers_class": "Pasajeros y Clase",
    "search.travelers": "Viajeros",
    "search.person": "Persona",
    "search.people": "Personas",
    "search.class": "Clase",
    "search.passengers": "Pasajeros",
    "search.adults": "Adultos",
    "search.adults_desc": "12+ años",
    "search.children": "Niños",
    "search.children_desc": "2-11 años",
    "search.infants": "Bebés",
    "search.infants_desc": "Menos de 2 años",
    "search.button": "Buscar Vuelo",

    // Classes
    "class.economy": "Económica",
    "class.premium_economy": "Econ. Premium",
    "class.business": "Ejecutiva",
    "class.first": "Primera",
  }
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedLang = localStorage.getItem("michels-travel-lang") as Language;
    if (savedLang && (savedLang === "pt" || savedLang === "en" || savedLang === "es")) {
      setLanguageState(savedLang);
    }
    setIsLoading(false);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("michels-travel-lang", lang);
  };

  const t = (key: string) => {
    const lang = language || "pt"; // Default to Portuguese if not set (though modal should force set)
    return translations[lang][key] || key;
  };

  return (
    <I18nContext.Provider value={{ language: language as Language, setLanguage, t, isLoading }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useI18n must be used within a I18nProvider");
  }
  return context;
}
