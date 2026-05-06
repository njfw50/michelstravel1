import fs from 'fs';

const ptPath = '../michelstravel1/client/src/locales/pt.json';
const enPath = '../michelstravel1/client/src/locales/en.json';
const esPath = '../michelstravel1/client/src/locales/es.json';

const pt = JSON.parse(fs.readFileSync(ptPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const es = JSON.parse(fs.readFileSync(esPath, 'utf8'));

// Deep merge helper
function setKey(obj, path, value) {
    const keys = path.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
}

const keysToAdd = {
    "home.board.col_origin": { pt: "Origem", en: "Origin", es: "Origen" },
    "home.board.col_destination": { pt: "Destino", en: "Destination", es: "Destino" },
    "home.board.col_price": { pt: "Preço", en: "Price", es: "Precio" },
    "home.board.per_person": { pt: "por pessoa", en: "per person", es: "por persona" },
    "home.board.book": { pt: "Reserve Agora", en: "Book Now", es: "Reservar Ahora" },
    "home.board.title": { pt: "Painel de Voos", en: "Flight Board", es: "Panel de Vuelos" },
    "home.board.subtitle": { pt: "Encontre as melhores tarifas para rotas populares", en: "Find the best fares for popular routes", es: "Encontre las mejores tarifas para rutas populares" },
    "home.board.col_flight": { pt: "Voo", en: "Flight", es: "Vuelo" },
    "home.board.col_time": { pt: "Horário", en: "Time", es: "Horario" },
    "home.board.col_route": { pt: "Rota", en: "Route", es: "Ruta" },
    "home.board.col_duration": { pt: "Duração", en: "Duration", es: "Duración" },
    "home.board.col_stops": { pt: "Paradas", en: "Stops", es: "Paradas" },
    "home.board.loading": { pt: "Buscando voos...", en: "Finding flights...", es: "Buscando vuelos..." },
    "home.board.no_flights": { pt: "Nenhum voo disponível", en: "No flights available", es: "No hay vuelos disponibles" },
    "home.board.show_less": { pt: "Mostrar menos", en: "Show less", es: "Mostrar menos" },
    "home.board.show_more": { pt: "Ver mais voos", en: "Show more flights", es: "Ver más vuelos" },
    "home.board.more_flights": { pt: "voos", en: "flights", es: "vuelos" },
    "home.board.disclaimer": { pt: "Preços sujeitos a alterações.", en: "Prices subject to change.", es: "Precios sujetos a cambios." },
    "home.deals.title": { pt: "Ofertas em Destaque", en: "Featured Deals", es: "Ofertas Destacadas" },
    "home.cta.title": { pt: "Pronto para sua próxima jornada?", en: "Ready for your next journey?", es: "¿Listo para su próximo viaje?" }
};

for (const [path, translations] of Object.entries(keysToAdd)) {
    setKey(pt, path, translations.pt);
    setKey(en, path, translations.en);
    setKey(es, path, translations.es);
}

fs.writeFileSync(ptPath, JSON.stringify(pt, null, 2), 'utf8');
fs.writeFileSync(enPath, JSON.stringify(en, null, 2), 'utf8');
fs.writeFileSync(esPath, JSON.stringify(es, null, 2), 'utf8');

console.log("Dictionaries synced successfully!");
