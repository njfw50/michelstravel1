import fs from 'fs';

function fixFile(lang, translations) {
    const path = `c:/Users/njfw2/michelstravel1/client/src/locales/${lang}.json`;
    const data = JSON.parse(fs.readFileSync(path, 'utf8'));

    if (data.trips) {
        data.trips.status = translations.trips_status;
    }

    data.name_coach_dialog = translations.name_coach_dialog;

    if (data.profile) {
        Object.assign(data.profile, translations.profile);
    }

    data.scan = translations.scan;

    fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
    console.log(`${lang}.json fixed successfully`);
}

const en = {
    trips_status: {
        "pending": "Pending",
        "confirmed": "Confirmed",
        "cancelled": "Cancelled",
        "test": "Test Environment"
    },
    name_coach_dialog: {
        "badge": "Name Consultancy",
        "title_suggest": "Adjustment Suggestion",
        "title_confirm": "Confirm Name",
        "desc_suggest": "To avoid boarding issues, we suggest a small correction to your name formatting.",
        "desc_confirm": "Please confirm if the name below is exactly as in your official document.",
        "board_title": "Consultancy Board",
        "field_label": "Field",
        "wrote_label": "As you wrote",
        "suggest_label": "Michels Suggestion",
        "full_name_label": "Full Name on Ticket",
        "question_suggest": "Do you want to apply this correction?",
        "question_confirm": "Is the name correct?",
        "note": "Note: The name on the ticket must be identical to the passport or ID document.",
        "primary_suggest": "Apply Suggestion",
        "secondary_suggest": "Keep Original",
        "primary_confirm": "Yes, it is correct",
        "secondary_confirm": "No, I want to edit",
        "reason_characters": "We identified characters that may not be accepted by airline systems.",
        "reason_spacing": "We adjusted the spacing to follow the international aviation standard.",
        "reason_case": "We corrected uppercase letters to ensure correct reading at check-in."
    },
    profile: {
        "member_since": "Member since",
        "total_trips": "Total Trips",
        "unnamed": "Unnamed Traveler",
        "view_trips": "View my trips",
        "saved": "Saved",
        "saved_title": "Changes Saved",
        "saved_desc": "Your information has been updated in our secure system.",
        "error_title": "Ops, something went wrong",
        "error_desc": "We couldn't save your changes now. Try again in a moment.",
        "secure_login": "Secure Access Active",
        "secure_login_desc": "Your session is protected with end-to-end encryption.",
        "data_protected": "Data Protected",
        "data_protected_desc": "Your information follows the strictest privacy and security standards.",
        "security_title": "Account Security",
        "login_required": "Login Required",
        "login_required_desc": "You need to be logged in to access this page."
    },
    scan: {
        "title": "Scan Document",
        "subtitle": "Use your camera to capture document data automatically.",
        "back": "Back",
        "hint_hold_still": "Hold still and align the document",
        "hint_enhancing": "Improving image clarity...",
        "mobile_timeout": "Time's up. Try again or fill in manually.",
        "open_camera": "Open Camera",
        "sending_result": "Sending for analysis...",
        "step_finalizing": "Finalizing processing..."
    }
};

const es = {
    trips_status: {
        "pending": "Pendiente",
        "confirmed": "Confirmado",
        "cancelled": "Cancelado",
        "test": "Ambiente de Prueba"
    },
    name_coach_dialog: {
        "badge": "Consultoría de Nombres",
        "title_suggest": "Sugerencia de Ajuste",
        "title_confirm": "Confirmar Nombre",
        "desc_suggest": "Para evitar problemas al abordar, sugerimos una pequeña corrección en el formato de su nombre.",
        "desc_confirm": "Por favor, confirme si o nome abaixo está exatamente como no seu documento oficial.",
        "board_title": "Cuadro de Consultoría",
        "field_label": "Campo",
        "wrote_label": "Como lo escribió",
        "suggest_label": "Sugerencia Michels",
        "full_name_label": "Nombre Completo en el Billete",
        "question_suggest": "¿Desea aplicar esta corrección?",
        "question_confirm": "¿El nombre es correcto?",
        "note": "Nota: El nombre en el billete debe ser idéntico al del pasaporte o documento de identidad.",
        "primary_suggest": "Aplicar Sugerencia",
        "secondary_suggest": "Mantener Original",
        "primary_confirm": "Sí, es correcto",
        "secondary_confirm": "No, quiero editar",
        "reason_characters": "Identificamos caracteres que pueden no ser aceptados por los sistemas de las aerolíneas.",
        "reason_spacing": "Ajustamos el espaciado para seguir el estándar internacional de aviación.",
        "reason_case": "Corregimos las mayúsculas para garantizar la lectura correcta en el check-in."
    },
    profile: {
        "member_since": "Miembro desde",
        "total_trips": "Total de Viajes",
        "unnamed": "Viajero sin nombre",
        "view_trips": "Ver mis viajes",
        "saved": "Guardado",
        "saved_title": "Cambios Guardados",
        "saved_desc": "Su información ha sido actualizada en nuestro sistema blindado.",
        "error_title": "Ops, algo salió mal",
        "error_desc": "No pudimos guardar sus cambios ahora. Intente de nuevo en unos momentos.",
        "secure_login": "Acceso Seguro Activo",
        "secure_login_desc": "Su sesión está protegida con cifrado de punta a punta.",
        "data_protected": "Datos Protegidos",
        "data_protected_desc": "Su información sigue los más estrictos estándares de privacidad y seguridad.",
        "security_title": "Seguridad de la Cuenta",
        "login_required": "Inicio de Sesión Necesario",
        "login_required_desc": "Necesita estar logueado para acceder a esta página."
    },
    scan: {
        "title": "Escanear Documento",
        "subtitle": "Use su cámara para capturar los datos del documento automáticamente.",
        "back": "Volver",
        "hint_hold_still": "Sujete firme y alinee el documento",
        "hint_enhancing": "Mejorando la nitidez de la imagen...",
        "mobile_timeout": "Tiempo agotado. Intente de nuevo o complete manualmente.",
        "open_camera": "Abrir Cámara",
        "sending_result": "Enviando para análisis...",
        "step_finalizing": "Finalizando procesamiento..."
    }
};

fixFile('en', en);
fixFile('es', es);
