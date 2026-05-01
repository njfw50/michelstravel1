const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'client', 'src', 'locales');
const files = ['pt.json', 'en.json', 'es.json'];

const newTripsKeys = {
  pt: {
    title: "Minhas Viagens",
    subtitle: "Acompanhe suas reservas, cartões de embarque e histórico de viagens.",
    lookup_title: "Localizar uma Reserva",
    lookup_desc: "Insira seu código e e-mail para encontrar sua passagem",
    lookup_ref_placeholder: "Código (Ex: MT-ABC123)",
    lookup_email_placeholder: "E-mail da reserva",
    lookup_button: "Buscar",
    lookup_searching: "Buscando...",
    lookup_not_found: "Reserva não encontrada",
    lookup_not_found_desc: "Verifique o código e o e-mail digitados.",
    login_title: "Faça login para acesso completo",
    login_desc: "Entre na sua conta para ver todas as suas viagens em um só lugar, baixar e-tickets e gerenciar bagagens.",
    no_trips: "Nenhuma viagem ainda",
    no_trips_desc: "Quando você reservar um voo, ele aparecerá aqui.",
    search_flights: "Buscar Voos",
    your_bookings: "Suas Reservas",
    booked_on: "Reservado em",
    ticket_issued: "Bilhete Emitido",
    schedule_changed: "Horário Alterado pela Companhia",
    ticket_cancelled: "Bilhete Cancelado",
    ticket_failed: "Falha na Emissão",
    airline_ref: "Localizador (PNR)",
    ticket_number: "Número do E-Ticket",
    schedule_changed_desc: "A companhia aérea fez alterações no seu voo. Revise os detalhes acima.",
    ticket_failed_desc: "Houve um problema na emissão. Nossa equipe já foi notificada.",
    cancelled_success: "Reserva cancelada com sucesso",
    refund_amount: "Reembolso",
    cancel_confirm: "Tem certeza que deseja cancelar esta viagem?",
    yes_cancel: "Sim, Cancelar",
    cancel_booking: "Cancelar Viagem",
    contact_note: "Para alterações, cancelamentos ou inclusão de bagagens, contate-nos até 24 horas antes do voo. Estamos aqui para ajudar!"
  },
  en: {
    title: "My Trips",
    subtitle: "Track your bookings, boarding passes, and travel history.",
    lookup_title: "Look Up a Booking",
    lookup_desc: "Enter your reference code and email to find your booking",
    lookup_ref_placeholder: "Reference (e.g. MT-ABC123)",
    lookup_email_placeholder: "Email used for booking",
    lookup_button: "Search",
    lookup_searching: "Searching...",
    lookup_not_found: "Booking not found",
    lookup_not_found_desc: "Please check your reference code and email address.",
    login_title: "Sign in for full access",
    login_desc: "Sign in to see all your bookings in one place, download e-tickets, and manage bags.",
    no_trips: "No trips yet",
    no_trips_desc: "When you book a flight, it will appear here.",
    search_flights: "Search Flights",
    your_bookings: "Your Bookings",
    booked_on: "Booked on",
    ticket_issued: "Ticket Issued",
    schedule_changed: "Schedule Changed by Airline",
    ticket_cancelled: "Ticket Cancelled",
    ticket_failed: "Ticket Issue Failed",
    airline_ref: "Airline Reference (PNR)",
    ticket_number: "E-Ticket Number",
    schedule_changed_desc: "The airline has made changes to your flight schedule. Please review the updated details above.",
    ticket_failed_desc: "There was an issue issuing your ticket. Our team has been notified.",
    cancelled_success: "Booking cancelled successfully",
    refund_amount: "Refund",
    cancel_confirm: "Are you sure you want to cancel this booking?",
    yes_cancel: "Yes, Cancel",
    cancel_booking: "Cancel Booking",
    contact_note: "For changes, cancellations, or baggage questions, contact us at least 24 hours before your flight departure. We're here to help!"
  },
  es: {
    title: "Mis Viajes",
    subtitle: "Rastree sus reservas, tarjetas de embarque e historial de viajes.",
    lookup_title: "Buscar una Reserva",
    lookup_desc: "Ingrese su código y correo electrónico para encontrar su reserva",
    lookup_ref_placeholder: "Código (Ej: MT-ABC123)",
    lookup_email_placeholder: "Correo electrónico",
    lookup_button: "Buscar",
    lookup_searching: "Buscando...",
    lookup_not_found: "Reserva no encontrada",
    lookup_not_found_desc: "Por favor revise su código y correo electrónico.",
    login_title: "Inicie sesión para acceso completo",
    login_desc: "Inicie sesión para ver todas sus reservas, descargar e-tickets y gestionar equipaje.",
    no_trips: "Sin viajes aún",
    no_trips_desc: "Cuando reserve un vuelo, aparecerá aquí.",
    search_flights: "Buscar Vuelos",
    your_bookings: "Sus Reservas",
    booked_on: "Reservado el",
    ticket_issued: "Boleto Emitido",
    schedule_changed: "Horario Cambiado por la Aerolínea",
    ticket_cancelled: "Boleto Cancelado",
    ticket_failed: "Fallo en Emisión",
    airline_ref: "Referencia de Aerolínea (PNR)",
    ticket_number: "Número de E-Ticket",
    schedule_changed_desc: "La aerolínea ha realizado cambios en el horario de su vuelo. Revise los detalles.",
    ticket_failed_desc: "Hubo un problema al emitir su boleto. Nuestro equipo ha sido notificado.",
    cancelled_success: "Reserva cancelada con éxito",
    refund_amount: "Reembolso",
    cancel_confirm: "¿Está seguro de que desea cancelar esta reserva?",
    yes_cancel: "Sí, Cancelar",
    cancel_booking: "Cancelar Viaje",
    contact_note: "Para cambios, cancelaciones o equipaje, contáctenos al menos 24 horas antes del vuelo."
  }
};

files.forEach(file => {
  const filePath = path.join(localesDir, file);
  const lang = file.replace('.json', '');
  
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    if (!data.trips) {
      data.trips = {};
    }
    
    // Merge new keys
    data.trips = { ...data.trips, ...newTripsKeys[lang] };
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Updated ${file}`);
  }
});
