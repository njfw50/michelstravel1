import fs from 'fs';

const langs = ['pt', 'en', 'es'];

const extraData = {
  pt: {
    admin: {
      field_placeholder_airport: "Cidade ou Aeroporto (Ex: GRU)",
      login_password_placeholder: "Digite sua senha secreta",
      security_auth: "Autenticação de Segurança",
      live_chat: {
        voice_message: "Mensagem de Voz",
        reply_placeholder: "Digite sua resposta...",
        subtitle: "Atendimento em tempo real com viajantes",
        title: "Chat ao Vivo"
      }
    },
    blog: {
      loading_chronicle: "Carregando crônica..."
    },
    confirm: {
      agency_location: "Ironbound, Newark, NJ"
    },
    results: {
      loading: "Buscando voos..."
    },
    booking: {
      audio: {
        contact: "Instruções de contato por voz",
        payment: "Instruções de pagamento por voz"
      }
    }
  },
  en: {
    admin: {
      field_placeholder_airport: "City or Airport (Ex: JFK)",
      login_password_placeholder: "Enter your secret password",
      security_auth: "Security Authentication",
      live_chat: {
        voice_message: "Voice Message",
        reply_placeholder: "Type your reply...",
        subtitle: "Real-time support with travelers",
        title: "Live Chat"
      }
    },
    blog: {
      loading_chronicle: "Loading chronicle..."
    },
    confirm: {
      agency_location: "Ironbound, Newark, NJ"
    },
    results: {
      loading: "Searching flights..."
    },
    booking: {
      audio: {
        contact: "Voice contact instructions",
        payment: "Voice payment instructions"
      }
    }
  },
  es: {
    admin: {
      field_placeholder_airport: "Ciudad o Aeropuerto (Ej: MAD)",
      login_password_placeholder: "Ingrese su contraseña secreta",
      security_auth: "Autenticación de Seguridad",
      live_chat: {
        voice_message: "Mensaje de Voz",
        reply_placeholder: "Escriba su respuesta...",
        subtitle: "Atención en tiempo real con viajeros",
        title: "Chat en Vivo"
      }
    },
    blog: {
      loading_chronicle: "Cargando crónica..."
    },
    confirm: {
      agency_location: "Ironbound, Newark, NJ"
    },
    results: {
      loading: "Buscando vuelos..."
    },
    booking: {
      audio: {
        contact: "Instrucciones de contacto por voz",
        payment: "Instrucciones de pago por voz"
      }
    }
  }
};

function deepMerge(target, source) {
  for (const key in source) {
    if (source[key] instanceof Object && key in target) {
      Object.assign(source[key], deepMerge(target[key], source[key]));
    }
  }
  Object.assign(target, source);
  return target;
}

for (const lang of langs) {
  const path = `c:/Users/njfw2/michelstravel1/client/src/locales/${lang}.json`;
  const data = JSON.parse(fs.readFileSync(path, 'utf8'));

  deepMerge(data, extraData[lang]);

  fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
  console.log(`${lang}.json polished successfully.`);
}
