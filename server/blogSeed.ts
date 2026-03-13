import { sql } from "drizzle-orm";
import { blogPosts } from "@shared/schema";
import { db } from "./db";

const BLOG_COVER_BRAZIL = "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=1200&q=80";
const BLOG_COVER_BUDGET = "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80";
const BLOG_COVER_DOCS = "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=1200&q=80";

const defaultBlogPosts: Array<typeof blogPosts.$inferInsert> = [
  {
    title: "Como viajar ao Brasil pagando menos saindo dos Estados Unidos",
    slug: "como-viajar-ao-brasil-pagando-menos",
    excerpt: "Estratégias simples para encontrar boas tarifas, escolher datas melhores e evitar custos desnecessários em voos para o Brasil.",
    content: `
      <h2>Comece pela flexibilidade</h2>
      <p>As melhores tarifas aparecem quando voce pode comparar alguns dias antes e depois da data ideal. Em rotas entre Estados Unidos e Brasil, pequenas mudancas no calendario costumam gerar diferencas grandes no preco final.</p>
      <h2>Considere aeroportos alternativos</h2>
      <p>Nem sempre o voo mais barato sai do aeroporto mais proximo da sua casa. Vale comparar partidas de Newark, JFK, Miami e Orlando, dependendo da sua regiao e da epoca da viagem.</p>
      <h2>Reserve com antecedencia inteligente</h2>
      <p>Para alta temporada, feriados e dezembro, deixe a compra para a ultima hora apenas se voce aceitar pagar mais. Em periodos normais, acompanhar os precos por algumas semanas ajuda a identificar boas oportunidades.</p>
      <h2>Olhe o custo total</h2>
      <p>Uma tarifa aparentemente barata pode ficar cara depois de bagagem, marcacao de assento e conexoes ruins. Compare sempre o valor final e o tempo total de viagem.</p>
    `,
    coverImage: BLOG_COVER_BRAZIL,
    language: "pt",
    isPublished: true,
  },
  {
    title: "How to fly to Brazil for less from the United States",
    slug: "how-to-fly-to-brazil-for-less",
    excerpt: "Practical ways to find better fares, choose smarter travel dates, and avoid unnecessary costs on trips to Brazil.",
    content: `
      <h2>Start with flexibility</h2>
      <p>The best fares usually appear when you can compare a few days before and after your ideal departure date. On routes between the United States and Brazil, even small calendar shifts can make a major difference in the final price.</p>
      <h2>Compare alternate airports</h2>
      <p>The cheapest option is not always the airport closest to home. It is worth checking departures from Newark, JFK, Miami, and Orlando depending on your region and season.</p>
      <h2>Book with smart timing</h2>
      <p>For peak travel dates, holidays, and December trips, waiting until the last minute usually means paying more. During regular periods, tracking fares over a few weeks helps you spot strong opportunities.</p>
      <h2>Look at total trip cost</h2>
      <p>A low headline fare can become expensive after baggage, seat selection, and poor connections. Always compare the final price and the overall travel time.</p>
    `,
    coverImage: BLOG_COVER_BRAZIL,
    language: "en",
    isPublished: true,
  },
  {
    title: "Como viajar a Brasil pagando menos desde Estados Unidos",
    slug: "como-viajar-a-brasil-pagando-menos",
    excerpt: "Formas practicas de encontrar mejores tarifas, elegir fechas convenientes y reducir costos innecesarios en vuelos a Brasil.",
    content: `
      <h2>Empiece por la flexibilidad</h2>
      <p>Las mejores tarifas suelen aparecer cuando puede comparar algunos dias antes y despues de su fecha ideal. En rutas entre Estados Unidos y Brasil, pequenos cambios en el calendario pueden alterar mucho el precio final.</p>
      <h2>Compare aeropuertos alternativos</h2>
      <p>La opcion mas barata no siempre sale del aeropuerto mas cercano. Conviene revisar salidas desde Newark, JFK, Miami y Orlando segun su region y temporada.</p>
      <h2>Reserve con buen tiempo</h2>
      <p>En temporadas altas, festivos y viajes de diciembre, esperar hasta el ultimo momento normalmente significa pagar mas. En periodos normales, seguir tarifas por unas semanas ayuda a detectar buenas oportunidades.</p>
      <h2>Mire el costo total</h2>
      <p>Una tarifa base baja puede subir bastante con equipaje, asiento y conexiones poco convenientes. Compare siempre el precio final y el tiempo total del viaje.</p>
    `,
    coverImage: BLOG_COVER_BRAZIL,
    language: "es",
    isPublished: true,
  },
  {
    title: "5 maneiras de encontrar voos internacionais baratos sem cair em armadilhas",
    slug: "5-maneiras-de-encontrar-voos-internacionais-baratos",
    excerpt: "Nem toda promocao vale a pena. Veja como analisar tarifas com criterio e evitar surpresas depois da compra.",
    content: `
      <h2>Compare em horarios diferentes</h2>
      <p>Os valores mudam varias vezes ao longo do dia. Refazer a busca em periodos diferentes pode mostrar variacoes relevantes na mesma rota.</p>
      <h2>Evite decidir so pelo menor preco</h2>
      <p>Conexoes muito longas, troca de aeroporto ou bagagem nao incluida podem transformar uma aparente promocao em uma escolha ruim.</p>
      <h2>Cheque politica de remarcacao</h2>
      <p>Quando sua viagem depende de visto, agenda de trabalho ou eventos familiares, vale entender se a tarifa permite alteracoes antes de finalizar.</p>
      <h2>Observe o horario da chegada</h2>
      <p>Um voo barato que chega de madrugada pode gerar custo maior com hotel, transporte ou perda de tempo.</p>
      <h2>Use apoio humano quando a viagem for complexa</h2>
      <p>Roteiros com stopover, multiplas cidades ou passageiros com necessidades especiais merecem revisao manual para evitar erro de emissao.</p>
    `,
    coverImage: BLOG_COVER_BUDGET,
    language: "pt",
    isPublished: true,
  },
  {
    title: "5 ways to find cheap international flights without costly mistakes",
    slug: "5-ways-to-find-cheap-international-flights",
    excerpt: "Not every deal is worth booking. Learn how to evaluate fares carefully and avoid expensive surprises later.",
    content: `
      <h2>Compare at different times of day</h2>
      <p>Prices can shift several times throughout the day. Running the same search again later may reveal meaningful fare differences on the exact same route.</p>
      <h2>Do not choose based only on the lowest fare</h2>
      <p>Long layovers, airport changes, and missing baggage can turn an apparent deal into a poor choice.</p>
      <h2>Review change rules</h2>
      <p>If your trip depends on a visa, work schedule, or family event, it is worth checking whether the fare allows changes before you pay.</p>
      <h2>Pay attention to arrival time</h2>
      <p>A cheap fare that lands in the middle of the night can increase hotel, transportation, and time costs.</p>
      <h2>Use human support for complex trips</h2>
      <p>Multi-city itineraries, stopovers, or passengers with special needs deserve a manual review to avoid ticketing mistakes.</p>
    `,
    coverImage: BLOG_COVER_BUDGET,
    language: "en",
    isPublished: true,
  },
  {
    title: "5 formas de encontrar vuelos internacionales baratos sin cometer errores",
    slug: "5-formas-de-encontrar-vuelos-internacionales-baratos",
    excerpt: "No toda oferta conviene. Aprenda a revisar tarifas con criterio y evitar sorpresas despues de la compra.",
    content: `
      <h2>Compare en distintos momentos del dia</h2>
      <p>Los precios cambian varias veces durante el dia. Repetir la busqueda mas tarde puede mostrar diferencias importantes en la misma ruta.</p>
      <h2>No elija solo por el precio mas bajo</h2>
      <p>Escalas largas, cambio de aeropuerto o equipaje no incluido pueden convertir una aparente oferta en una mala decision.</p>
      <h2>Revise las reglas de cambios</h2>
      <p>Si su viaje depende de una visa, trabajo o evento familiar, conviene entender si la tarifa permite modificaciones antes de pagar.</p>
      <h2>Observe la hora de llegada</h2>
      <p>Un vuelo barato que llega de madrugada puede elevar el costo total con hotel, transporte o tiempo perdido.</p>
      <h2>Use apoyo humano para viajes complejos</h2>
      <p>Itinerarios con varias ciudades, stopovers o pasajeros con necesidades especiales merecen revision manual para evitar errores de emision.</p>
    `,
    coverImage: BLOG_COVER_BUDGET,
    language: "es",
    isPublished: true,
  },
  {
    title: "Documentos essenciais para viajar entre EUA, Brasil e Europa",
    slug: "documentos-essenciais-para-viajar-eua-brasil-europa",
    excerpt: "Um resumo pratico do que revisar antes de embarcar para evitar problemas com check-in, imigracao e conexoes internacionais.",
    content: `
      <h2>Passaporte valido</h2>
      <p>Verifique sempre a validade minima exigida pelo destino e pelas companhias aereas. Muitos paises pedem meses adicionais alem da data de retorno.</p>
      <h2>Vistos e autorizacoes</h2>
      <p>Dependendo da rota e da nacionalidade do passageiro, pode ser necessario visto, autorizacao eletronica ou comprovacao extra de entrada.</p>
      <h2>Nome exatamente igual ao documento</h2>
      <p>O nome da reserva deve bater com o passaporte ou documento de viagem. Pequenas divergencias podem travar check-in e embarque.</p>
      <h2>Documentos dos menores</h2>
      <p>Viagens com criancas e adolescentes podem exigir autorizacoes adicionais, especialmente em roteiros internacionais ou em viagens sem ambos os pais.</p>
    `,
    coverImage: BLOG_COVER_DOCS,
    language: "pt",
    isPublished: true,
  },
  {
    title: "Essential documents for travel between the US, Brazil, and Europe",
    slug: "essential-documents-for-travel-between-us-brazil-and-europe",
    excerpt: "A practical checklist to review before departure so you can avoid issues with check-in, immigration, and international connections.",
    content: `
      <h2>Valid passport</h2>
      <p>Always confirm the minimum passport validity required by both the destination country and the airline. Many trips require several months of validity beyond your return date.</p>
      <h2>Visas and travel authorizations</h2>
      <p>Depending on the route and passenger nationality, you may need a visa, electronic authorization, or additional entry documentation.</p>
      <h2>Exact name match</h2>
      <p>The booking name must match the passport or travel document exactly. Even small differences can block check-in or boarding.</p>
      <h2>Documents for minors</h2>
      <p>Trips involving children or teenagers may require extra authorization, especially on international itineraries or when not traveling with both parents.</p>
    `,
    coverImage: BLOG_COVER_DOCS,
    language: "en",
    isPublished: true,
  },
  {
    title: "Documentos esenciales para viajar entre Estados Unidos, Brasil y Europa",
    slug: "documentos-esenciales-para-viajar-entre-estados-unidos-brasil-y-europa",
    excerpt: "Una guia practica para revisar antes del embarque y evitar problemas con check-in, migracion y conexiones internacionales.",
    content: `
      <h2>Pasaporte vigente</h2>
      <p>Revise siempre la vigencia minima exigida por el destino y por la aerolinea. Muchos paises piden varios meses adicionales mas alla de la fecha de regreso.</p>
      <h2>Visas y autorizaciones</h2>
      <p>Segun la ruta y la nacionalidad del pasajero, puede ser necesaria una visa, una autorizacion electronica o documentos extra de entrada.</p>
      <h2>Nombre igual al documento</h2>
      <p>El nombre de la reserva debe coincidir exactamente con el pasaporte o documento de viaje. Incluso pequenas diferencias pueden impedir el check-in o el embarque.</p>
      <h2>Documentos para menores</h2>
      <p>Los viajes con ninos y adolescentes pueden requerir autorizaciones adicionales, especialmente en rutas internacionales o cuando no viajan con ambos padres.</p>
    `,
    coverImage: BLOG_COVER_DOCS,
    language: "es",
    isPublished: true,
  },
];

export async function ensureDefaultBlogPosts() {
  const [result] = await db.select({ count: sql<number>`count(*)` }).from(blogPosts);
  const totalPosts = Number(result?.count ?? 0);

  if (totalPosts > 0) {
    return;
  }

  await db.insert(blogPosts).values(defaultBlogPosts);
  console.log(`[blog-seed] inserted ${defaultBlogPosts.length} default blog posts`);
}
