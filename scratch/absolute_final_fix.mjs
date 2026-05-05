import fs from 'fs';

const langs = ['pt', 'en', 'es'];

const finalFixes = {
  pt: {
    home: {
      board: { col_origin: "Origem" },
      hero: {
        whatsapp_topic: "Consulta de Passagem Premium",
        whatsapp_details: "Cheguei pelo novo Hero VIP"
      }
    }
  },
  en: {
    home: {
      board: { col_origin: "Origin" },
      hero: {
        whatsapp_topic: "Premium Flight Inquiry",
        whatsapp_details: "Arrived via New Hero VIP"
      }
    }
  },
  es: {
    home: {
      board: { col_origin: "Origen" },
      hero: {
        whatsapp_topic: "Consulta de Pasaje Premium",
        whatsapp_details: "Llegué por el nuevo Hero VIP"
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

  deepMerge(data, finalFixes[lang]);

  fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
  console.log(`${lang}.json finalized.`);
}
