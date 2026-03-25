export type Locale = "pt" | "en" | "es";

export interface Translations {
  // General
  appName: string;
  securePrivate: string;
  localProcessing: string;
  back: string;
  backToStart: string;
  scannerApplied: string;
  securityNote: string;
  close: string;

  // Landing
  heroEyebrow: string;
  heroTitle1: string;
  heroTitle2: string;
  heroDesc: string;
  scanDocument: string;
  fillManually: string;
  howItWorks: string;
  simpleAs123: string;
  step1Title: string;
  step1Desc: string;
  step2Title: string;
  step2Desc: string;
  step3Title: string;
  step3Desc: string;
  featuresEyebrow: string;
  featuresTitle: string;
  featuresDesc: string;
  feat1Title: string;
  feat1Desc: string;
  feat2Title: string;
  feat2Desc: string;
  feat3Title: string;
  feat3Desc: string;
  feat4Title: string;
  feat4Desc: string;
  feat5Title: string;
  feat5Desc: string;
  feat6Title: string;
  feat6Desc: string;
  ctaTitle: string;
  ctaDesc: string;
  ctaButton: string;
  footerNote: string;

  // Scanner
  scannerEyebrow: string;
  scannerTitle: string;
  scannerDesc: string;
  takePhoto: string;
  takePhotoDesc: string;
  uploadImage: string;
  uploadImageDesc: string;
  tipsTitle: string;
  tipLight: string;
  tipFocus: string;
  tipFull: string;
  tipFlat: string;
  acceptedDocs: string;
  passport: string;
  nationalId: string;
  driversLicense: string;
  visa: string;
  travelDocument: string;
  securityLocal: string;

  // Processing
  processingTitle: string;
  preparingImage: string;
  holdSteady: string;
  enhancingQuality: string;
  applyingFilters: string;
  readingMrz: string;
  expandedAttempt: string;
  fullRead: string;
  readingGeneral: string;
  readingFull: string;
  tryingRotation: string;
  finalizing: string;
  completed: string;

  // Review
  reviewSuccess: string;
  reviewDesc: string;
  confidenceLabel: string;
  confidenceHigh: string;
  confidenceMedium: string;
  confidenceLow: string;
  attention: string;
  firstName: string;
  lastName: string;
  documentNumber: string;
  expiryDate: string;
  birthDate: string;
  gender: string;
  genderSelect: string;
  genderMale: string;
  genderFemale: string;
  nationality: string;
  issuingCountry: string;
  tryAgain: string;
  confirmData: string;

  // Error
  errorTitle: string;
  errorPartial: string;
  errorNoData: string;
  errorGeneric: string;
  retryTipsTitle: string;
  retryTipLight: string;
  retryTipFocus: string;
  retryTipFull: string;
  retryTipMrz: string;
  cancel: string;

  // Booking form
  bookingEyebrow: string;
  bookingTitle: string;
  bookingDescScan: string;
  bookingDescManual: string;
  scanAppliedBanner: string;
  rescan: string;
  scanFasterBanner: string;
  personalInfo: string;
  title: string;
  titleMr: string;
  titleMrs: string;
  titleMs: string;
  titleDr: string;
  documentInfo: string;
  documentType: string;
  passportType: string;
  nationalIdType: string;
  driversLicenseType: string;
  travelDocType: string;
  otherType: string;
  contact: string;
  email: string;
  phone: string;
  encryptionNote: string;
  submitBooking: string;
  bookingSent: string;
  bookingSentDesc: string;
  passengerSummary: string;
  nameLabel: string;
  docLabel: string;
  natLabel: string;
  newBooking: string;

  // Warnings
  warnDocNumber: string;
  warnBirthDate: string;
  warnExpiryDate: string;
  warnDocType: string;
  warnLowConf: string;

  // Scanner session
  scannerSessionTitle: string;
  scannerSessionDesc: string;
  sendToSite: string;
  dataSent: string;
  dataSentDesc: string;
  closeWindow: string;
  waitingReturn: string;
}

const pt: Translations = {
  appName: "Michels Travel",
  securePrivate: "Seguro e Privado",
  localProcessing: "Processamento Local",
  back: "Voltar",
  backToStart: "Voltar ao Início",
  scannerApplied: "Dados do scanner aplicados",
  securityNote: "Seus dados são processados localmente e nunca são armazenados",
  close: "Fechar",

  heroEyebrow: "Scanner Inteligente",
  heroTitle1: "Escaneie seu documento,",
  heroTitle2: "preencha tudo automaticamente",
  heroDesc: "Tire uma foto do seu passaporte, identidade ou carteira de motorista. Nosso scanner lê os dados e preenche o formulário de reserva para você.",
  scanDocument: "Escanear Documento",
  fillManually: "Preencher Manualmente",
  howItWorks: "Como Funciona",
  simpleAs123: "Simples como 1, 2, 3",
  step1Title: "Escaneie",
  step1Desc: "Tire uma foto ou envie uma imagem do seu documento de identidade",
  step2Title: "Leitura Automática",
  step2Desc: "Nosso scanner inteligente lê e extrai todos os dados do documento",
  step3Title: "Confirme e Pronto",
  step3Desc: "Revise os dados, corrija se necessário, e o formulário é preenchido",
  featuresEyebrow: "Recursos",
  featuresTitle: "Feito para todos",
  featuresDesc: "Interface intuitiva pensada para todas as idades e níveis de experiência com tecnologia.",
  feat1Title: "Documentos de Qualquer País",
  feat1Desc: "Passaportes, identidades e carteiras de motorista de todo o mundo. Suporte a MRZ internacional.",
  feat2Title: "Processamento Local",
  feat2Desc: "Seus dados são processados no seu dispositivo. Nenhuma imagem é enviada para servidores externos.",
  feat3Title: "Acessível para Todos",
  feat3Desc: "Textos grandes, botões amplos, instruções claras. Pensado para idosos e todas as idades.",
  feat4Title: "Rápido e Preciso",
  feat4Desc: "Leitura em segundos com múltiplas tentativas automáticas para máxima precisão.",
  feat5Title: "Revisão Editável",
  feat5Desc: "Todos os campos podem ser corrigidos antes de confirmar. Você tem controle total.",
  feat6Title: "Preenchimento Automático",
  feat6Desc: "Os dados confirmados são inseridos automaticamente no formulário de reserva.",
  ctaTitle: "Pronto para começar?",
  ctaDesc: "Escaneie seu documento agora e preencha sua reserva em segundos.",
  ctaButton: "Escanear Agora",
  footerNote: "Scanner de Documentos — Processamento 100% local e seguro",

  scannerEyebrow: "Scanner de Documentos",
  scannerTitle: "Escaneie seu documento",
  scannerDesc: "Tire uma foto ou envie uma imagem do seu passaporte, identidade ou carteira de motorista. Os dados serão preenchidos automaticamente.",
  takePhoto: "Tirar Foto",
  takePhotoDesc: "Use a câmera do celular",
  uploadImage: "Enviar Imagem",
  uploadImageDesc: "Selecione do dispositivo",
  tipsTitle: "Dicas para uma boa leitura",
  tipLight: "Boa iluminação, sem sombras",
  tipFocus: "Imagem nítida e focada",
  tipFull: "Documento inteiro visível",
  tipFlat: "Superfície plana, sem dobras",
  acceptedDocs: "Documentos aceitos de qualquer país",
  passport: "Passaporte",
  nationalId: "Carteira de Identidade",
  driversLicense: "Carteira de Motorista",
  visa: "Visto",
  travelDocument: "Documento de Viagem",
  securityLocal: "Seus dados são processados localmente e nunca são armazenados",

  processingTitle: "Processando documento",
  preparingImage: "Preparando imagem...",
  holdSteady: "Segure firme enquanto processamos",
  enhancingQuality: "Melhorando qualidade...",
  applyingFilters: "Aplicando filtros de contraste",
  readingMrz: "Lendo zona MRZ...",
  expandedAttempt: "Tentativa ampliada...",
  fullRead: "Leitura completa...",
  readingGeneral: "Lendo texto geral...",
  readingFull: "Lendo documento completo...",
  tryingRotation: "Tentando rotação...",
  finalizing: "Finalizando análise...",
  completed: "concluído",

  reviewSuccess: "Documento lido com sucesso",
  reviewDesc: "Confira os dados abaixo e corrija se necessário",
  confidenceLabel: "Confiança",
  confidenceHigh: "Alta",
  confidenceMedium: "Média",
  confidenceLow: "Baixa",
  attention: "Atenção",
  firstName: "Nome",
  lastName: "Sobrenome",
  documentNumber: "Número do Documento",
  expiryDate: "Validade",
  birthDate: "Data de Nascimento",
  gender: "Sexo",
  genderSelect: "Selecione",
  genderMale: "Masculino",
  genderFemale: "Feminino",
  nationality: "Nacionalidade",
  issuingCountry: "País Emissor",
  tryAgain: "Tentar Novamente",
  confirmData: "Confirmar Dados",

  errorTitle: "Não foi possível ler o documento",
  errorPartial: "Conseguimos ler parcialmente, mas os dados estão incompletos. Tente novamente com melhor iluminação.",
  errorNoData: "Não foi possível identificar dados no documento. Verifique se a imagem está nítida e bem iluminada.",
  errorGeneric: "Ocorreu um erro durante o processamento. Tente novamente.",
  retryTipsTitle: "Dicas para tentar novamente",
  retryTipLight: "Use boa iluminação, sem reflexos",
  retryTipFocus: "Mantenha o documento em foco",
  retryTipFull: "Enquadre o documento inteiro",
  retryTipMrz: "Para passaportes, mostre a página com MRZ (códigos na parte inferior)",
  cancel: "Cancelar",

  bookingEyebrow: "Formulário de Reserva",
  bookingTitle: "Dados do Passageiro",
  bookingDescScan: "Os campos foram preenchidos automaticamente pelo scanner. Complete os dados restantes.",
  bookingDescManual: "Preencha os dados do passageiro para a reserva.",
  scanAppliedBanner: "Dados preenchidos pelo scanner",
  rescan: "Escanear Novamente",
  scanFasterBanner: "Quer preencher mais rápido? Use o scanner de documentos.",
  personalInfo: "Informações Pessoais",
  title: "Título",
  titleMr: "Sr.",
  titleMrs: "Sra.",
  titleMs: "Srta.",
  titleDr: "Dr.",
  documentInfo: "Documento de Identidade",
  documentType: "Tipo de Documento",
  passportType: "Passaporte",
  nationalIdType: "Carteira de Identidade",
  driversLicenseType: "Carteira de Motorista",
  travelDocType: "Documento de Viagem",
  otherType: "Outro",
  contact: "Contato",
  email: "E-mail",
  phone: "Telefone",
  encryptionNote: "Seus dados são protegidos com criptografia de ponta a ponta",
  submitBooking: "Enviar Reserva",
  bookingSent: "Reserva Enviada!",
  bookingSentDesc: "Seus dados foram enviados com sucesso. Você receberá uma confirmação por e-mail em breve.",
  passengerSummary: "Resumo do Passageiro",
  nameLabel: "Nome",
  docLabel: "Documento",
  natLabel: "Nacionalidade",
  newBooking: "Nova Reserva",

  warnDocNumber: "Verificação do número do documento falhou",
  warnBirthDate: "Verificação da data de nascimento falhou",
  warnExpiryDate: "Verificação da data de validade falhou",
  warnDocType: "Tipo de documento inesperado",
  warnLowConf: "Confiança baixa — confira os dados manualmente",

  scannerSessionTitle: "Scanner para Reserva",
  scannerSessionDesc: "Escaneie seu documento aqui. Os dados serão enviados de volta para o formulário de reserva no computador.",
  sendToSite: "Enviar para o Formulário",
  dataSent: "Dados Enviados!",
  dataSentDesc: "Os dados foram enviados para o formulário de reserva. Você pode fechar esta janela.",
  closeWindow: "Fechar Janela",
  waitingReturn: "Aguardando retorno dos dados...",
};

const en: Translations = {
  appName: "Michels Travel",
  securePrivate: "Secure & Private",
  localProcessing: "Local Processing",
  back: "Back",
  backToStart: "Back to Start",
  scannerApplied: "Scanner data applied",
  securityNote: "Your data is processed locally and never stored",
  close: "Close",

  heroEyebrow: "Smart Scanner",
  heroTitle1: "Scan your document,",
  heroTitle2: "auto-fill everything",
  heroDesc: "Take a photo of your passport, ID card, or driver's license. Our scanner reads the data and fills in the booking form for you.",
  scanDocument: "Scan Document",
  fillManually: "Fill Manually",
  howItWorks: "How It Works",
  simpleAs123: "Simple as 1, 2, 3",
  step1Title: "Scan",
  step1Desc: "Take a photo or upload an image of your identity document",
  step2Title: "Auto Read",
  step2Desc: "Our smart scanner reads and extracts all data from the document",
  step3Title: "Confirm & Done",
  step3Desc: "Review the data, correct if needed, and the form is filled",
  featuresEyebrow: "Features",
  featuresTitle: "Made for Everyone",
  featuresDesc: "Intuitive interface designed for all ages and technology experience levels.",
  feat1Title: "Documents from Any Country",
  feat1Desc: "Passports, IDs, and driver's licenses from around the world. International MRZ support.",
  feat2Title: "Local Processing",
  feat2Desc: "Your data is processed on your device. No images are sent to external servers.",
  feat3Title: "Accessible for All",
  feat3Desc: "Large text, wide buttons, clear instructions. Designed for seniors and all ages.",
  feat4Title: "Fast & Accurate",
  feat4Desc: "Reading in seconds with multiple automatic attempts for maximum accuracy.",
  feat5Title: "Editable Review",
  feat5Desc: "All fields can be corrected before confirming. You have full control.",
  feat6Title: "Auto-Fill",
  feat6Desc: "Confirmed data is automatically inserted into the booking form.",
  ctaTitle: "Ready to start?",
  ctaDesc: "Scan your document now and fill your booking in seconds.",
  ctaButton: "Scan Now",
  footerNote: "Document Scanner — 100% local and secure processing",

  scannerEyebrow: "Document Scanner",
  scannerTitle: "Scan your document",
  scannerDesc: "Take a photo or upload an image of your passport, ID, or driver's license. Data will be auto-filled.",
  takePhoto: "Take Photo",
  takePhotoDesc: "Use your phone camera",
  uploadImage: "Upload Image",
  uploadImageDesc: "Select from device",
  tipsTitle: "Tips for a good read",
  tipLight: "Good lighting, no shadows",
  tipFocus: "Sharp and focused image",
  tipFull: "Entire document visible",
  tipFlat: "Flat surface, no folds",
  acceptedDocs: "Accepted documents from any country",
  passport: "Passport",
  nationalId: "National ID",
  driversLicense: "Driver's License",
  visa: "Visa",
  travelDocument: "Travel Document",
  securityLocal: "Your data is processed locally and never stored",

  processingTitle: "Processing document",
  preparingImage: "Preparing image...",
  holdSteady: "Hold steady while we process",
  enhancingQuality: "Enhancing quality...",
  applyingFilters: "Applying contrast filters",
  readingMrz: "Reading MRZ zone...",
  expandedAttempt: "Expanded attempt...",
  fullRead: "Full read...",
  readingGeneral: "Reading general text...",
  readingFull: "Reading full document...",
  tryingRotation: "Trying rotation...",
  finalizing: "Finalizing analysis...",
  completed: "completed",

  reviewSuccess: "Document read successfully",
  reviewDesc: "Check the data below and correct if needed",
  confidenceLabel: "Confidence",
  confidenceHigh: "High",
  confidenceMedium: "Medium",
  confidenceLow: "Low",
  attention: "Attention",
  firstName: "First Name",
  lastName: "Last Name",
  documentNumber: "Document Number",
  expiryDate: "Expiry Date",
  birthDate: "Date of Birth",
  gender: "Gender",
  genderSelect: "Select",
  genderMale: "Male",
  genderFemale: "Female",
  nationality: "Nationality",
  issuingCountry: "Issuing Country",
  tryAgain: "Try Again",
  confirmData: "Confirm Data",

  errorTitle: "Could not read the document",
  errorPartial: "We partially read the document, but data is incomplete. Try again with better lighting.",
  errorNoData: "Could not identify data in the document. Make sure the image is clear and well-lit.",
  errorGeneric: "An error occurred during processing. Please try again.",
  retryTipsTitle: "Tips to try again",
  retryTipLight: "Use good lighting, no glare",
  retryTipFocus: "Keep the document in focus",
  retryTipFull: "Frame the entire document",
  retryTipMrz: "For passports, show the page with MRZ (codes at the bottom)",
  cancel: "Cancel",

  bookingEyebrow: "Booking Form",
  bookingTitle: "Passenger Details",
  bookingDescScan: "Fields were auto-filled by the scanner. Complete the remaining data.",
  bookingDescManual: "Fill in the passenger details for the booking.",
  scanAppliedBanner: "Data filled by scanner",
  rescan: "Scan Again",
  scanFasterBanner: "Want to fill faster? Use the document scanner.",
  personalInfo: "Personal Information",
  title: "Title",
  titleMr: "Mr.",
  titleMrs: "Mrs.",
  titleMs: "Ms.",
  titleDr: "Dr.",
  documentInfo: "Identity Document",
  documentType: "Document Type",
  passportType: "Passport",
  nationalIdType: "National ID",
  driversLicenseType: "Driver's License",
  travelDocType: "Travel Document",
  otherType: "Other",
  contact: "Contact",
  email: "Email",
  phone: "Phone",
  encryptionNote: "Your data is protected with end-to-end encryption",
  submitBooking: "Submit Booking",
  bookingSent: "Booking Sent!",
  bookingSentDesc: "Your data was sent successfully. You will receive a confirmation email shortly.",
  passengerSummary: "Passenger Summary",
  nameLabel: "Name",
  docLabel: "Document",
  natLabel: "Nationality",
  newBooking: "New Booking",

  warnDocNumber: "Document number check failed",
  warnBirthDate: "Birth date check failed",
  warnExpiryDate: "Expiry date check failed",
  warnDocType: "Unexpected document type",
  warnLowConf: "Low confidence — check data manually",

  scannerSessionTitle: "Scanner for Booking",
  scannerSessionDesc: "Scan your document here. The data will be sent back to the booking form on your computer.",
  sendToSite: "Send to Form",
  dataSent: "Data Sent!",
  dataSentDesc: "The data was sent to the booking form. You can close this window.",
  closeWindow: "Close Window",
  waitingReturn: "Waiting for data return...",
};

const es: Translations = {
  appName: "Michels Travel",
  securePrivate: "Seguro y Privado",
  localProcessing: "Procesamiento Local",
  back: "Volver",
  backToStart: "Volver al Inicio",
  scannerApplied: "Datos del escáner aplicados",
  securityNote: "Sus datos se procesan localmente y nunca se almacenan",
  close: "Cerrar",

  heroEyebrow: "Escáner Inteligente",
  heroTitle1: "Escanee su documento,",
  heroTitle2: "complete todo automáticamente",
  heroDesc: "Tome una foto de su pasaporte, documento de identidad o licencia de conducir. Nuestro escáner lee los datos y completa el formulario de reserva por usted.",
  scanDocument: "Escanear Documento",
  fillManually: "Completar Manualmente",
  howItWorks: "Cómo Funciona",
  simpleAs123: "Simple como 1, 2, 3",
  step1Title: "Escanee",
  step1Desc: "Tome una foto o suba una imagen de su documento de identidad",
  step2Title: "Lectura Automática",
  step2Desc: "Nuestro escáner inteligente lee y extrae todos los datos del documento",
  step3Title: "Confirme y Listo",
  step3Desc: "Revise los datos, corrija si es necesario, y el formulario se completa",
  featuresEyebrow: "Características",
  featuresTitle: "Hecho para Todos",
  featuresDesc: "Interfaz intuitiva pensada para todas las edades y niveles de experiencia con tecnología.",
  feat1Title: "Documentos de Cualquier País",
  feat1Desc: "Pasaportes, documentos de identidad y licencias de conducir de todo el mundo. Soporte MRZ internacional.",
  feat2Title: "Procesamiento Local",
  feat2Desc: "Sus datos se procesan en su dispositivo. Ninguna imagen se envía a servidores externos.",
  feat3Title: "Accesible para Todos",
  feat3Desc: "Textos grandes, botones amplios, instrucciones claras. Pensado para personas mayores y todas las edades.",
  feat4Title: "Rápido y Preciso",
  feat4Desc: "Lectura en segundos con múltiples intentos automáticos para máxima precisión.",
  feat5Title: "Revisión Editable",
  feat5Desc: "Todos los campos pueden corregirse antes de confirmar. Usted tiene control total.",
  feat6Title: "Autocompletado",
  feat6Desc: "Los datos confirmados se insertan automáticamente en el formulario de reserva.",
  ctaTitle: "¿Listo para comenzar?",
  ctaDesc: "Escanee su documento ahora y complete su reserva en segundos.",
  ctaButton: "Escanear Ahora",
  footerNote: "Escáner de Documentos — Procesamiento 100% local y seguro",

  scannerEyebrow: "Escáner de Documentos",
  scannerTitle: "Escanee su documento",
  scannerDesc: "Tome una foto o suba una imagen de su pasaporte, documento de identidad o licencia de conducir. Los datos se completarán automáticamente.",
  takePhoto: "Tomar Foto",
  takePhotoDesc: "Use la cámara del celular",
  uploadImage: "Subir Imagen",
  uploadImageDesc: "Seleccione del dispositivo",
  tipsTitle: "Consejos para una buena lectura",
  tipLight: "Buena iluminación, sin sombras",
  tipFocus: "Imagen nítida y enfocada",
  tipFull: "Documento completo visible",
  tipFlat: "Superficie plana, sin pliegues",
  acceptedDocs: "Documentos aceptados de cualquier país",
  passport: "Pasaporte",
  nationalId: "Documento de Identidad",
  driversLicense: "Licencia de Conducir",
  visa: "Visa",
  travelDocument: "Documento de Viaje",
  securityLocal: "Sus datos se procesan localmente y nunca se almacenan",

  processingTitle: "Procesando documento",
  preparingImage: "Preparando imagen...",
  holdSteady: "Mantenga firme mientras procesamos",
  enhancingQuality: "Mejorando calidad...",
  applyingFilters: "Aplicando filtros de contraste",
  readingMrz: "Leyendo zona MRZ...",
  expandedAttempt: "Intento ampliado...",
  fullRead: "Lectura completa...",
  readingGeneral: "Leyendo texto general...",
  readingFull: "Leyendo documento completo...",
  tryingRotation: "Intentando rotación...",
  finalizing: "Finalizando análisis...",
  completed: "completado",

  reviewSuccess: "Documento leído con éxito",
  reviewDesc: "Verifique los datos a continuación y corrija si es necesario",
  confidenceLabel: "Confianza",
  confidenceHigh: "Alta",
  confidenceMedium: "Media",
  confidenceLow: "Baja",
  attention: "Atención",
  firstName: "Nombre",
  lastName: "Apellido",
  documentNumber: "Número de Documento",
  expiryDate: "Fecha de Vencimiento",
  birthDate: "Fecha de Nacimiento",
  gender: "Sexo",
  genderSelect: "Seleccione",
  genderMale: "Masculino",
  genderFemale: "Femenino",
  nationality: "Nacionalidad",
  issuingCountry: "País Emisor",
  tryAgain: "Intentar de Nuevo",
  confirmData: "Confirmar Datos",

  errorTitle: "No se pudo leer el documento",
  errorPartial: "Logramos leer parcialmente, pero los datos están incompletos. Intente de nuevo con mejor iluminación.",
  errorNoData: "No se pudieron identificar datos en el documento. Verifique que la imagen sea clara y esté bien iluminada.",
  errorGeneric: "Ocurrió un error durante el procesamiento. Intente de nuevo.",
  retryTipsTitle: "Consejos para intentar de nuevo",
  retryTipLight: "Use buena iluminación, sin reflejos",
  retryTipFocus: "Mantenga el documento enfocado",
  retryTipFull: "Encuadre el documento completo",
  retryTipMrz: "Para pasaportes, muestre la página con MRZ (códigos en la parte inferior)",
  cancel: "Cancelar",

  bookingEyebrow: "Formulario de Reserva",
  bookingTitle: "Datos del Pasajero",
  bookingDescScan: "Los campos fueron completados automáticamente por el escáner. Complete los datos restantes.",
  bookingDescManual: "Complete los datos del pasajero para la reserva.",
  scanAppliedBanner: "Datos completados por el escáner",
  rescan: "Escanear de Nuevo",
  scanFasterBanner: "¿Quiere completar más rápido? Use el escáner de documentos.",
  personalInfo: "Información Personal",
  title: "Título",
  titleMr: "Sr.",
  titleMrs: "Sra.",
  titleMs: "Srta.",
  titleDr: "Dr.",
  documentInfo: "Documento de Identidad",
  documentType: "Tipo de Documento",
  passportType: "Pasaporte",
  nationalIdType: "Documento de Identidad",
  driversLicenseType: "Licencia de Conducir",
  travelDocType: "Documento de Viaje",
  otherType: "Otro",
  contact: "Contacto",
  email: "Correo Electrónico",
  phone: "Teléfono",
  encryptionNote: "Sus datos están protegidos con cifrado de extremo a extremo",
  submitBooking: "Enviar Reserva",
  bookingSent: "¡Reserva Enviada!",
  bookingSentDesc: "Sus datos fueron enviados con éxito. Recibirá una confirmación por correo electrónico en breve.",
  passengerSummary: "Resumen del Pasajero",
  nameLabel: "Nombre",
  docLabel: "Documento",
  natLabel: "Nacionalidad",
  newBooking: "Nueva Reserva",

  warnDocNumber: "Verificación del número de documento falló",
  warnBirthDate: "Verificación de la fecha de nacimiento falló",
  warnExpiryDate: "Verificación de la fecha de vencimiento falló",
  warnDocType: "Tipo de documento inesperado",
  warnLowConf: "Confianza baja — verifique los datos manualmente",

  scannerSessionTitle: "Escáner para Reserva",
  scannerSessionDesc: "Escanee su documento aquí. Los datos se enviarán de vuelta al formulario de reserva en su computadora.",
  sendToSite: "Enviar al Formulario",
  dataSent: "¡Datos Enviados!",
  dataSentDesc: "Los datos fueron enviados al formulario de reserva. Puede cerrar esta ventana.",
  closeWindow: "Cerrar Ventana",
  waitingReturn: "Esperando retorno de datos...",
};

const translations: Record<Locale, Translations> = { pt, en, es };

export function detectLocale(): Locale {
  // 1. Check URL param ?lang=
  const params = new URLSearchParams(window.location.search);
  const langParam = params.get("lang");
  if (langParam && (langParam === "pt" || langParam === "en" || langParam === "es")) {
    return langParam;
  }

  // 2. Check localStorage
  const stored = localStorage.getItem("scanner-locale");
  if (stored && (stored === "pt" || stored === "en" || stored === "es")) {
    return stored as Locale;
  }

  // 3. Check browser language
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith("pt")) return "pt";
  if (browserLang.startsWith("es")) return "es";
  return "en";
}

export function getTranslations(locale: Locale): Translations {
  return translations[locale];
}

export function getWarningLabel(key: string, t: Translations): string {
  const map: Record<string, string> = {
    doc_number_check_failed: t.warnDocNumber,
    birth_date_check_failed: t.warnBirthDate,
    expiry_date_check_failed: t.warnExpiryDate,
    unexpected_doc_type: t.warnDocType,
    low_confidence: t.warnLowConf,
  };
  return map[key] || key;
}
