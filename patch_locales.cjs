const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'client', 'src', 'locales');
const locales = ['pt.json', 'en.json', 'es.json'];

const newBookingKeys = {
  "invalid_email": { pt: "Email inválido", en: "Invalid email", es: "Correo electrónico no válido" },
  "min_digits": { pt: "Mínimo 7 dígitos", en: "Min 7 digits", es: "Mínimo 7 dígitos" },
  "audio_guide_confirm": { pt: "Por favor, confirme que escutou o guia de áudio.", en: "Please confirm you have listened to the audio guide.", es: "Por favor, confirme que ha escuchado la guía de audio." },
  "terms_accept": { pt: "Você deve aceitar os termos.", en: "You must accept the terms.", es: "Debe aceptar los términos." },
  "doc_number_required": { pt: "O número do documento é obrigatório.", en: "Document number is required.", es: "El número de documento es obligatorio." },
  "doc_expiry_required": { pt: "A data de validade é obrigatória.", en: "Document expiry date is required.", es: "La fecha de vencimiento es obligatoria." },
  "issuing_country_required": { pt: "O país emissor é obrigatório.", en: "Issuing country is required.", es: "El país emisor es obligatorio." },
  "nationality_required": { pt: "A nacionalidade é obrigatória.", en: "Nationality is required.", es: "La nacionalidad es obligatoria." },
  "pax_fill_details": { pt: "Clique para preencher os dados", en: "Click to fill details", es: "Haga clic para rellenar los datos" },
  "name_coach": {
    "title": { pt: "Consultoria de Nomes", en: "Name Coach", es: "Consultoría de Nombres" },
    "intro": { pt: "Identificamos uma possível melhoria na formatação do seu nome para garantir que o bilhete seja emitido perfeitamente.", en: "We identified a possible improvement in your name formatting to ensure the ticket is issued perfectly.", es: "Identificamos una posible mejora en el formato de su nombre para asegurar que el billete se emita perfectamente." },
    "pending": { pt: "Aguardando confirmação...", en: "Awaiting confirmation...", es: "Esperando confirmación..." },
    "corrected": { pt: "Nome corrigido com sucesso.", en: "Name corrected successfully.", es: "Nombre corregido correctamente." },
    "review": { pt: "Por favor, revise o nome digitado.", en: "Please review the entered name.", es: "Por favor, revise el nombre ingresado." },
    "confirmed": { pt: "Nome confirmado.", en: "Name confirmed.", es: "Nombre confirmado." }
  }
};

const newPaymentKeys = {
  "complete_fields": { pt: "Por favor, preencha todos os campos do pagamento.", en: "Please complete all payment fields.", es: "Por favor, complete todos los campos de pago." },
  "failed": { pt: "O pagamento falhou.", en: "Payment failed.", es: "El pago falló." },
  "unexpected_error": { pt: "Ocorreu um erro inesperado.", en: "An unexpected error occurred.", es: "Ocurrió un error inesperado." },
  "midnight_checkout": { pt: "Checkout Premium", en: "Premium Checkout", es: "Checkout Premium" },
  "card_wallets": { pt: "Cartões e Carteiras Digitais", en: "Cards & Digital Wallets", es: "Tarjetas y Carteras Digitales" },
  "loading": { pt: "Carregando sistema de pagamento...", en: "Loading payment system...", es: "Cargando sistema de pago..." }
};

const newConfirmKeys = {
  "whatsapp_help_topic": { pt: "Ajuda após a reserva", en: "Help after booking", es: "Ayuda después de la reserva" },
  "whatsapp_help_details": { pt: "Página: Confirmação de Reserva", en: "Page: Booking Confirmation", es: "Página: Confirmación de Reserva" }
};

locales.forEach(locale => {
  const file = path.join(localesDir, locale);
  if (!fs.existsSync(file)) return;
  
  let data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const lang = locale.replace('.json', '');

  // Add booking keys
  if (!data.booking) data.booking = {};
  for (const [key, val] of Object.entries(newBookingKeys)) {
    if (key === 'name_coach') {
      if (!data.booking.name_coach) data.booking.name_coach = {};
      for (const [subKey, subVal] of Object.entries(val)) {
        if (!data.booking.name_coach[subKey]) data.booking.name_coach[subKey] = subVal[lang];
      }
    } else {
      if (!data.booking[key]) data.booking[key] = val[lang];
    }
  }

  // Add payment keys
  if (!data.payment) data.payment = {};
  for (const [key, val] of Object.entries(newPaymentKeys)) {
    if (!data.payment[key]) data.payment[key] = val[lang];
  }

  // Add confirm keys
  if (!data.confirm) data.confirm = {};
  for (const [key, val] of Object.entries(newConfirmKeys)) {
    if (!data.confirm[key]) data.confirm[key] = val[lang];
  }

  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`Updated ${locale}`);
});
