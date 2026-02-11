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

    // Home extras
    "home.airlines": "Companhias Aéreas Parceiras",
    "home.airlines_sub": "500+ companhias em todo o mundo",
    "home.trending": "Em Alta",

    // Flight Card
    "flight.total_price": "Preço Total",
    "flight.price_per_adult": "Preço por adulto",
    "flight.select": "Selecionar",
    "flight.direct": "Direto",
    "flight.stop": "Parada",
    "flight.stops": "Paradas",

    // Search Results
    "results.searching": "Buscando voos...",
    "results.flights_found": "voos encontrados",
    "results.filters": "Filtros",
    "results.stops_filter": "Paradas",
    "results.airlines_filter": "Companhias",
    "results.sort_cheapest": "Mais barato primeiro",
    "results.sort_fastest": "Mais rápido primeiro",
    "results.sort_best": "Melhor custo-benefício",
    "results.no_flights": "Nenhum voo encontrado",
    "results.no_flights_desc": "Tente alterar as datas ou filtros de busca.",
    "results.error": "Falha ao carregar voos. Tente novamente.",
    "results.searching_airlines": "Buscando em centenas de companhias...",

    // Booking
    "booking.title": "Complete Sua Reserva",
    "booking.subtitle": "Preencha seus dados abaixo e prossiga para pagamento seguro",
    "booking.passenger_details": "Dados do Passageiro",
    "booking.first_name": "Nome",
    "booking.last_name": "Sobrenome",
    "booking.email": "Endereço de Email",
    "booking.passport": "Número do Passaporte",
    "booking.flight_summary": "Resumo do Voo",
    "booking.base_fare": "Tarifa Base",
    "booking.taxes": "Taxas e Encargos",
    "booking.total": "Total",
    "booking.pay": "Pagar",
    "booking.processing": "Processando...",
    "booking.secure_payment": "Pagamento seguro via Stripe. Cancelamento gratuito em 24 horas. Sem taxas ocultas.",
    "booking.loading": "Carregando detalhes do voo...",
    "booking.initiated": "Reserva Iniciada!",
    "booking.redirect": "Redirecionando para pagamento...",
    "booking.failed": "Reserva Falhou",
    "booking.failed_desc": "Houve um erro ao processar sua reserva.",
    "booking.error": "Erro",
    "booking.error_desc": "Não foi possível encontrar os detalhes do voo.",

    // Admin
    "admin.dashboard": "Painel de Controle",
    "admin.welcome": "Bem-vindo de volta",
    "admin.happening": "Aqui está o que está acontecendo.",
    "admin.total_revenue": "Receita Total",
    "admin.commissions": "Comissões",
    "admin.total_bookings": "Total de Reservas",
    "admin.recent_searches": "Buscas Recentes",
    "admin.revenue_overview": "Visão Geral da Receita",
    "admin.recent_bookings": "Reservas Recentes",
    "admin.no_bookings": "Nenhuma reserva ainda.",
    "admin.test_mode": "Modo de Teste",
    "admin.test_mode_desc": "Quando ativado, o sistema usa dados simulados da Duffel e não processa reservas reais.",
    "admin.test_mode_enabled": "MODO DE TESTE ATIVO",
    "admin.test_mode_disabled": "MODO PRODUÇÃO",
    "admin.test_mode_banner": "MODO DE TESTE - Dados simulados, nenhuma reserva real será processada",
    "admin.test_mode_warning": "Atenção: Para desativar o modo de teste, você precisa configurar um token de produção da Duffel (duffel_live_*).",
    "admin.test_mode_toggle_on": "Ativar Modo de Teste",
    "admin.test_mode_toggle_off": "Desativar Modo de Teste",
    "admin.test_mode_safe": "Proteção ativa - nenhuma emissão real será feita",
    "admin.test_mode_live": "Cuidado - reservas reais serão processadas",
    "admin.token_status": "Status do Token",
    "admin.token_test": "Token de Teste",
    "admin.token_production": "Token de Produção",
    "admin.login_title": "Painel Administrativo",
    "admin.login_subtitle": "Digite a senha de administrador para acessar o painel.",
    "admin.password_label": "Senha do Admin",
    "admin.password_placeholder": "Digite a senha...",
    "admin.login_button": "Entrar no Painel",
    "admin.login_footer": "Acesso restrito",
    "admin.login_failed": "Senha incorreta",
    "admin.login_error": "Erro de login",
    "admin.logout": "Sair do Painel",
    "admin.commission_title": "Comissão / Markup",
    "admin.commission_desc": "Defina a porcentagem de comissão aplicada sobre cada reserva.",
    "admin.commission_label": "Taxa de Comissão",
    "admin.commission_save": "Salvar",
    "admin.commission_saved": "Comissão Atualizada",
    "admin.commission_updated": "Nova taxa de comissão:",
    "admin.commission_error": "Erro",
    "admin.commission_range": "A comissão deve ser entre 0% e 100%.",
    "admin.commission_example": "Exemplo: em uma reserva de $1.000, sua comissão será",

    // Blog
    "blog.subtitle": "Dicas, guias e inspiração para sua próxima aventura.",
    "blog.read_article": "Ler Artigo",
    "blog.no_posts": "Nenhum artigo ainda",
    "blog.no_posts_desc": "Volte em breve para novos conteúdos de viagem.",
    "blog.post_not_found": "Artigo não encontrado",
    "blog.post_not_found_desc": "O artigo que você procura não está disponível.",
    "blog.back_to_guide": "Voltar ao Guia",

    // Checkout
    "checkout.success_title": "Pagamento Confirmado!",
    "checkout.success_desc": "Sua reserva foi processada com sucesso. Você receberá um e-mail com os detalhes do seu voo em instantes.",
    "checkout.back_home": "Voltar para Início",
    "checkout.cancel_title": "Pagamento Cancelado",
    "checkout.cancel_desc": "O processo de pagamento foi interrompido. Nenhuma cobrança foi realizada no seu cartão.",
    "checkout.try_again": "Tentar Novamente",

    // Errors
    "errors.page_not_found": "A página que você procura não foi encontrada.",
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

    // Home extras
    "home.airlines": "Partner Airlines",
    "home.airlines_sub": "500+ airlines worldwide",
    "home.trending": "Trending",

    // Flight Card
    "flight.total_price": "Total Price",
    "flight.price_per_adult": "Price per adult",
    "flight.select": "Select",
    "flight.direct": "Direct",
    "flight.stop": "Stop",
    "flight.stops": "Stops",

    // Search Results
    "results.searching": "Searching flights...",
    "results.flights_found": "flights found",
    "results.filters": "Filters",
    "results.stops_filter": "Stops",
    "results.airlines_filter": "Airlines",
    "results.sort_cheapest": "Cheapest first",
    "results.sort_fastest": "Fastest first",
    "results.sort_best": "Best value",
    "results.no_flights": "No flights found",
    "results.no_flights_desc": "Try changing your search dates or filters.",
    "results.error": "Failed to load flights. Please try again.",
    "results.searching_airlines": "Searching hundreds of airlines...",

    // Booking
    "booking.title": "Complete Your Booking",
    "booking.subtitle": "Fill in your details below and proceed to secure payment",
    "booking.passenger_details": "Passenger Details",
    "booking.first_name": "First Name",
    "booking.last_name": "Last Name",
    "booking.email": "Email Address",
    "booking.passport": "Passport Number",
    "booking.flight_summary": "Flight Summary",
    "booking.base_fare": "Base Fare",
    "booking.taxes": "Taxes & Fees",
    "booking.total": "Total",
    "booking.pay": "Pay",
    "booking.processing": "Processing...",
    "booking.secure_payment": "Secure payment via Stripe. Free cancellation within 24 hours. No hidden fees.",
    "booking.loading": "Loading flight details...",
    "booking.initiated": "Booking Initiated!",
    "booking.redirect": "Redirecting to payment...",
    "booking.failed": "Booking Failed",
    "booking.failed_desc": "There was an error processing your booking.",
    "booking.error": "Error",
    "booking.error_desc": "Could not find flight details.",

    // Admin
    "admin.dashboard": "Dashboard",
    "admin.welcome": "Welcome back",
    "admin.happening": "Here's what's happening.",
    "admin.total_revenue": "Total Revenue",
    "admin.commissions": "Commissions",
    "admin.total_bookings": "Total Bookings",
    "admin.recent_searches": "Recent Searches",
    "admin.revenue_overview": "Revenue Overview",
    "admin.recent_bookings": "Recent Bookings",
    "admin.no_bookings": "No bookings yet.",
    "admin.test_mode": "Test Mode",
    "admin.test_mode_desc": "When enabled, the system uses simulated Duffel data and does not process real bookings.",
    "admin.test_mode_enabled": "TEST MODE ACTIVE",
    "admin.test_mode_disabled": "PRODUCTION MODE",
    "admin.test_mode_banner": "TEST MODE - Simulated data, no real bookings will be processed",
    "admin.test_mode_warning": "Warning: To disable test mode, you need to configure a production Duffel token (duffel_live_*).",
    "admin.test_mode_toggle_on": "Enable Test Mode",
    "admin.test_mode_toggle_off": "Disable Test Mode",
    "admin.test_mode_safe": "Protection active - no real tickets will be issued",
    "admin.test_mode_live": "Caution - real bookings will be processed",
    "admin.token_status": "Token Status",
    "admin.token_test": "Test Token",
    "admin.token_production": "Production Token",
    "admin.login_title": "Admin Panel",
    "admin.login_subtitle": "Enter the admin password to access the dashboard.",
    "admin.password_label": "Admin Password",
    "admin.password_placeholder": "Enter password...",
    "admin.login_button": "Access Panel",
    "admin.login_footer": "Restricted access",
    "admin.login_failed": "Incorrect password",
    "admin.login_error": "Login Error",
    "admin.logout": "Logout",
    "admin.commission_title": "Commission / Markup",
    "admin.commission_desc": "Set the commission percentage applied to each booking.",
    "admin.commission_label": "Commission Rate",
    "admin.commission_save": "Save",
    "admin.commission_saved": "Commission Updated",
    "admin.commission_updated": "New commission rate:",
    "admin.commission_error": "Error",
    "admin.commission_range": "Commission must be between 0% and 100%.",
    "admin.commission_example": "Example: on a $1,000 booking, your commission will be",

    // Blog
    "blog.subtitle": "Tips, guides, and inspiration for your next adventure.",
    "blog.read_article": "Read Article",
    "blog.no_posts": "No articles yet",
    "blog.no_posts_desc": "Check back soon for new travel content.",
    "blog.post_not_found": "Article not found",
    "blog.post_not_found_desc": "The article you're looking for is not available.",
    "blog.back_to_guide": "Back to Guide",

    // Checkout
    "checkout.success_title": "Payment Confirmed!",
    "checkout.success_desc": "Your booking was processed successfully. You will receive an email with your flight details shortly.",
    "checkout.back_home": "Back to Home",
    "checkout.cancel_title": "Payment Cancelled",
    "checkout.cancel_desc": "The payment process was interrupted. No charges were made to your card.",
    "checkout.try_again": "Try Again",

    // Errors
    "errors.page_not_found": "The page you're looking for could not be found.",
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

    // Home extras
    "home.airlines": "Aerolíneas Asociadas",
    "home.airlines_sub": "500+ aerolíneas en todo el mundo",
    "home.trending": "Popular",

    // Flight Card
    "flight.total_price": "Precio Total",
    "flight.price_per_adult": "Precio por adulto",
    "flight.select": "Seleccionar",
    "flight.direct": "Directo",
    "flight.stop": "Escala",
    "flight.stops": "Escalas",

    // Search Results
    "results.searching": "Buscando vuelos...",
    "results.flights_found": "vuelos encontrados",
    "results.filters": "Filtros",
    "results.stops_filter": "Escalas",
    "results.airlines_filter": "Aerolíneas",
    "results.sort_cheapest": "Más barato primero",
    "results.sort_fastest": "Más rápido primero",
    "results.sort_best": "Mejor valor",
    "results.no_flights": "No se encontraron vuelos",
    "results.no_flights_desc": "Intente cambiar las fechas o filtros de búsqueda.",
    "results.error": "Error al cargar vuelos. Intente de nuevo.",
    "results.searching_airlines": "Buscando en cientos de aerolíneas...",

    // Booking
    "booking.title": "Complete Su Reserva",
    "booking.subtitle": "Complete sus datos abajo y proceda al pago seguro",
    "booking.passenger_details": "Datos del Pasajero",
    "booking.first_name": "Nombre",
    "booking.last_name": "Apellido",
    "booking.email": "Correo Electrónico",
    "booking.passport": "Número de Pasaporte",
    "booking.flight_summary": "Resumen del Vuelo",
    "booking.base_fare": "Tarifa Base",
    "booking.taxes": "Impuestos y Cargos",
    "booking.total": "Total",
    "booking.pay": "Pagar",
    "booking.processing": "Procesando...",
    "booking.secure_payment": "Pago seguro vía Stripe. Cancelación gratuita en 24 horas. Sin cargos ocultos.",
    "booking.loading": "Cargando detalles del vuelo...",
    "booking.initiated": "Reserva Iniciada!",
    "booking.redirect": "Redirigiendo al pago...",
    "booking.failed": "Reserva Fallida",
    "booking.failed_desc": "Hubo un error al procesar su reserva.",
    "booking.error": "Error",
    "booking.error_desc": "No se pudieron encontrar los detalles del vuelo.",

    // Admin
    "admin.dashboard": "Panel de Control",
    "admin.welcome": "Bienvenido de nuevo",
    "admin.happening": "Esto es lo que está sucediendo.",
    "admin.total_revenue": "Ingresos Totales",
    "admin.commissions": "Comisiones",
    "admin.total_bookings": "Total de Reservas",
    "admin.recent_searches": "Búsquedas Recientes",
    "admin.revenue_overview": "Resumen de Ingresos",
    "admin.recent_bookings": "Reservas Recientes",
    "admin.no_bookings": "Sin reservas aún.",
    "admin.test_mode": "Modo de Prueba",
    "admin.test_mode_desc": "Cuando está activado, el sistema usa datos simulados de Duffel y no procesa reservas reales.",
    "admin.test_mode_enabled": "MODO DE PRUEBA ACTIVO",
    "admin.test_mode_disabled": "MODO PRODUCCIÓN",
    "admin.test_mode_banner": "MODO DE PRUEBA - Datos simulados, ninguna reserva real será procesada",
    "admin.test_mode_warning": "Advertencia: Para desactivar el modo de prueba, necesita configurar un token de producción de Duffel (duffel_live_*).",
    "admin.test_mode_toggle_on": "Activar Modo de Prueba",
    "admin.test_mode_toggle_off": "Desactivar Modo de Prueba",
    "admin.test_mode_safe": "Protección activa - no se emitirán boletos reales",
    "admin.test_mode_live": "Precaución - se procesarán reservas reales",
    "admin.token_status": "Estado del Token",
    "admin.token_test": "Token de Prueba",
    "admin.token_production": "Token de Producción",
    "admin.login_title": "Panel Administrativo",
    "admin.login_subtitle": "Ingrese la contraseña de administrador para acceder al panel.",
    "admin.password_label": "Contraseña de Admin",
    "admin.password_placeholder": "Ingrese la contraseña...",
    "admin.login_button": "Acceder al Panel",
    "admin.login_footer": "Acceso restringido",
    "admin.login_failed": "Contraseña incorrecta",
    "admin.login_error": "Error de inicio de sesión",
    "admin.logout": "Cerrar Sesión",
    "admin.commission_title": "Comisión / Markup",
    "admin.commission_desc": "Establezca el porcentaje de comisión aplicado a cada reserva.",
    "admin.commission_label": "Tasa de Comisión",
    "admin.commission_save": "Guardar",
    "admin.commission_saved": "Comisión Actualizada",
    "admin.commission_updated": "Nueva tasa de comisión:",
    "admin.commission_error": "Error",
    "admin.commission_range": "La comisión debe ser entre 0% y 100%.",
    "admin.commission_example": "Ejemplo: en una reserva de $1,000, su comisión será",

    // Blog
    "blog.subtitle": "Consejos, guías e inspiración para su próxima aventura.",
    "blog.read_article": "Leer Artículo",
    "blog.no_posts": "Sin artículos aún",
    "blog.no_posts_desc": "Vuelva pronto para nuevo contenido de viaje.",
    "blog.post_not_found": "Artículo no encontrado",
    "blog.post_not_found_desc": "El artículo que busca no está disponible.",
    "blog.back_to_guide": "Volver a la Guía",

    // Checkout
    "checkout.success_title": "Pago Confirmado!",
    "checkout.success_desc": "Su reserva fue procesada con éxito. Recibirá un correo con los detalles de su vuelo en breve.",
    "checkout.back_home": "Volver al Inicio",
    "checkout.cancel_title": "Pago Cancelado",
    "checkout.cancel_desc": "El proceso de pago fue interrumpido. No se realizaron cargos a su tarjeta.",
    "checkout.try_again": "Intentar de Nuevo",

    // Errors
    "errors.page_not_found": "La página que busca no fue encontrada.",
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
