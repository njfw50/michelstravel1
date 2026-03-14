import { eq } from "drizzle-orm";
import { blogPosts } from "@shared/schema";
import { db } from "./db";

const BLOG_COVER_DISNEY =
  "https://images.unsplash.com/photo-1513883049090-d0b7439799bf?auto=format&fit=crop&w=1200&q=80";
const BLOG_COVER_UNIVERSAL =
  "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80";
const BLOG_COVER_ORLANDO =
  "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=1200&q=80";

const retiredManagedSlugs = new Set([
  "como-viajar-ao-brasil-pagando-menos",
  "how-to-fly-to-brazil-for-less",
  "como-viajar-a-brasil-pagando-menos",
  "5-maneiras-de-encontrar-voos-internacionais-baratos",
  "5-ways-to-find-cheap-international-flights",
  "5-formas-de-encontrar-vuelos-internacionales-baratos",
  "documentos-essenciais-para-viajar-eua-brasil-europa",
  "essential-documents-for-travel-between-us-brazil-and-europe",
  "documentos-esenciales-para-viajar-entre-estados-unidos-brasil-y-europa",
  "carnaval-no-rio-de-janeiro",
  "carnival-in-rio-de-janeiro",
  "carnaval-en-rio-de-janeiro",
  "guia-rio-de-janeiro",
  "rio-de-janeiro-travel-guide",
  "guia-rio-sao-paulo",
]);

const retiredTopicKeywords = [
  "carnaval",
  "carnival",
  "rio de janeiro",
  "rio-de-janeiro",
  "copacabana",
  "ipanema",
  "sambodromo",
  "maracana",
  "cristo redentor",
  "pao de acucar",
  "carnival-rio",
  "rio-de-janeiro-guide",
];

const managedBlogPosts: Array<typeof blogPosts.$inferInsert> = [
  {
    title: "Disney em Orlando: como organizar parques, hotel e descansos sem estresse",
    slug: "disney-orlando-como-organizar-parques-hotel",
    excerpt:
      "Um guia pratico para montar dias inteligentes na Disney, escolher hospedagem e evitar cansaco desnecessario na viagem.",
    content: `
      <h2>Comece pelo perfil da viagem</h2>
      <p>Antes de comprar ingressos, defina se a prioridade e encontrar os personagens, aproveitar as atracoes mais disputadas ou fazer uma viagem mais tranquila com criancas pequenas. Essa decisao muda hotel, transporte e quantidade ideal de dias.</p>
      <h2>Distribua os parques com folga</h2>
      <p>Evite empilhar varios dias intensos em sequencia. Intercalar parques fortes com descanso, piscina ou compras ajuda a manter a energia e reduz atrasos no roteiro.</p>
      <h2>Escolha hotel pela logistica</h2>
      <p>Em Orlando, tempo perdido em deslocamento pesa muito. Vale comparar hotel dentro da Disney, opcoes proximas a Disney Springs e hospedagens com cozinha para familias que querem controlar melhor o orcamento.</p>
      <h2>Resolva reservas com antecedencia</h2>
      <p>Restaurantes concorridos, experiencias especiais e estrategias para filas pedem antecedencia. Quanto antes voce alinhar essas prioridades, menos improviso sera necessario durante a viagem.</p>
      <h2>Deixe espaco para descanso real</h2>
      <p>Uma viagem Disney funciona melhor quando existe margem para pausa. Um fim de tarde livre pode ser mais valioso do que tentar encaixar tudo no mesmo dia.</p>
    `,
    coverImage: BLOG_COVER_DISNEY,
    language: "pt",
    isPublished: true,
  },
  {
    title: "Disney in Orlando: how to plan parks, hotels, and rest days without stress",
    slug: "disney-in-orlando-how-to-plan-parks-hotels-rest-days",
    excerpt:
      "A practical guide to building smarter Disney days, choosing the right hotel, and avoiding unnecessary fatigue during your trip.",
    content: `
      <h2>Start with the trip style</h2>
      <p>Before buying tickets, decide whether the priority is meeting characters, riding headline attractions, or keeping the pace easy for younger children. That choice affects your hotel, transportation, and ideal number of park days.</p>
      <h2>Spread out your park days</h2>
      <p>Avoid stacking intense park days back to back. Mixing busy days with pool time, shopping, or slower evenings helps the whole group keep energy and reduces schedule breakdowns.</p>
      <h2>Choose your hotel for logistics</h2>
      <p>In Orlando, transportation time matters. Compare Disney resorts, nearby options around Disney Springs, and family-friendly stays with kitchens if you want tighter control of food costs.</p>
      <h2>Handle reservations early</h2>
      <p>Popular restaurants, special experiences, and queue strategies all benefit from advance planning. The earlier you define priorities, the smoother the trip becomes.</p>
      <h2>Leave room for real rest</h2>
      <p>A Disney trip works better when the plan includes recovery time. One open afternoon can be more valuable than trying to fit everything into the same day.</p>
    `,
    coverImage: BLOG_COVER_DISNEY,
    language: "en",
    isPublished: true,
  },
  {
    title: "Disney en Orlando: como organizar parques, hotel y descansos sin estres",
    slug: "disney-en-orlando-como-organizar-parques-hotel",
    excerpt:
      "Una guia practica para armar dias mas inteligentes en Disney, elegir hospedaje y evitar cansancio innecesario durante el viaje.",
    content: `
      <h2>Empiece por el estilo del viaje</h2>
      <p>Antes de comprar entradas, defina si la prioridad es conocer personajes, subir a las atracciones mas buscadas o mantener un ritmo mas ligero para ninos pequenos. Esa decision cambia hotel, transporte y cantidad ideal de dias.</p>
      <h2>Distribuya mejor los parques</h2>
      <p>Evite juntar varios dias intensos seguidos. Alternar parques fuertes con piscina, compras o una tarde mas tranquila ayuda a mantener la energia del grupo.</p>
      <h2>Elija hotel por logistica</h2>
      <p>En Orlando, perder tiempo en traslados pesa mucho. Conviene comparar hoteles dentro de Disney, opciones cerca de Disney Springs y hospedajes con cocina para familias que quieren controlar mejor el presupuesto.</p>
      <h2>Resuelva reservas con anticipacion</h2>
      <p>Restaurantes concurridos, experiencias especiales y estrategias para las filas requieren planificacion previa. Cuanto antes organice prioridades, mas simple sera el viaje.</p>
      <h2>Deje espacio para descanso real</h2>
      <p>Un viaje Disney funciona mejor cuando el plan incluye pausas. Una tarde libre puede valer mas que intentar hacerlo todo el mismo dia.</p>
    `,
    coverImage: BLOG_COVER_DISNEY,
    language: "es",
    isPublished: true,
  },
  {
    title: "Universal Orlando: roteiro pratico para aproveitar mais e gastar melhor",
    slug: "universal-orlando-roteiro-pratico-para-aproveitar-mais",
    excerpt:
      "Saiba como dividir os parques, quando faz sentido pagar por fila expressa e como montar um dia mais eficiente na Universal.",
    content: `
      <h2>Defina quais parques entram no roteiro</h2>
      <p>Universal funciona melhor quando voce escolhe os parques com base no perfil do grupo. Quem gosta de adrenalina, simuladores e franquias famosas costuma aproveitar de forma diferente de familias com criancas pequenas.</p>
      <h2>Compare ingresso e beneficio real</h2>
      <p>Nem sempre o ingresso mais completo e a melhor compra. Em viagens curtas, pagar por mais dias do que o necessario ou por beneficios pouco usados pode pesar no custo final.</p>
      <h2>Avalie fila expressa com criterio</h2>
      <p>Express Pass pode fazer sentido em periodos cheios ou para grupos que querem ritmo intenso. Em datas mais leves, talvez seja melhor investir esse valor em hotel, refeicoes ou mais um dia de parque.</p>
      <h2>Planeje refeicoes e pausas</h2>
      <p>CityWalk e os restaurantes dentro dos parques ajudam a alongar a experiencia, mas tambem precisam de tempo na agenda. Um roteiro sem pausas costuma render menos do que parece no papel.</p>
      <h2>Olhe altura minima e interesses do grupo</h2>
      <p>Antes de fechar o plano, revise restricoes de altura e as areas que realmente interessam ao seu grupo. Isso evita frustracao e melhora o aproveitamento do dia.</p>
    `,
    coverImage: BLOG_COVER_UNIVERSAL,
    language: "pt",
    isPublished: true,
  },
  {
    title: "Universal Orlando: a practical way to enjoy more and spend better",
    slug: "universal-orlando-a-practical-way-to-enjoy-more",
    excerpt:
      "Learn how to divide your park days, decide when express access is worth it, and build a more efficient Universal plan.",
    content: `
      <h2>Choose the right parks for your group</h2>
      <p>Universal works best when the itinerary matches your travelers. Guests who love thrill rides, simulators, and major film franchises will use the parks differently from families traveling with younger children.</p>
      <h2>Compare tickets by actual value</h2>
      <p>The most complete ticket is not always the smartest purchase. On shorter trips, paying for extra days or benefits you will barely use can weaken the overall budget.</p>
      <h2>Evaluate express access carefully</h2>
      <p>Express products can make sense during crowded periods or for groups that want an intense pace. On lighter dates, that same budget may be better used on the hotel, meals, or an extra day.</p>
      <h2>Plan meals and breaks</h2>
      <p>CityWalk and in-park restaurants add value to the experience, but they also require time. A schedule with no pauses usually performs worse than it looks on paper.</p>
      <h2>Review height limits and interests</h2>
      <p>Before locking the plan, check attraction height requirements and focus areas that really matter to your group. That reduces disappointment and improves the day.</p>
    `,
    coverImage: BLOG_COVER_UNIVERSAL,
    language: "en",
    isPublished: true,
  },
  {
    title: "Universal Orlando: guia practico para disfrutar mas y gastar mejor",
    slug: "universal-orlando-guia-practico-para-disfrutar-mas",
    excerpt:
      "Aprenda a dividir los parques, decidir cuando conviene el acceso express y montar un plan mas eficiente en Universal.",
    content: `
      <h2>Defina que parques entran en el viaje</h2>
      <p>Universal funciona mejor cuando el itinerario se adapta al grupo. Quienes buscan montanas rusas, simuladores y franquicias famosas aprovechan distinto que las familias con ninos pequenos.</p>
      <h2>Compare entradas por valor real</h2>
      <p>La entrada mas completa no siempre es la mejor compra. En viajes cortos, pagar por dias extra o beneficios poco usados puede afectar el presupuesto final.</p>
      <h2>Evalue el acceso express con criterio</h2>
      <p>Los pases express pueden ser utiles en fechas concurridas o para grupos que quieren ritmo intenso. En temporadas mas tranquilas, ese dinero puede rendir mas en hotel, comidas o un dia adicional.</p>
      <h2>Planifique comidas y pausas</h2>
      <p>CityWalk y los restaurantes dentro de los parques suman valor, pero tambien consumen tiempo. Un itinerario sin pausas suele rendir menos de lo esperado.</p>
      <h2>Revise altura minima e intereses del grupo</h2>
      <p>Antes de cerrar el plan, compruebe las restricciones de altura y las areas que realmente importan a su grupo. Eso reduce frustraciones y mejora la experiencia.</p>
    `,
    coverImage: BLOG_COVER_UNIVERSAL,
    language: "es",
    isPublished: true,
  },
  {
    title: "Disney + Universal na mesma viagem: como montar Orlando em 7 dias",
    slug: "disney-universal-na-mesma-viagem-orlando-em-7-dias",
    excerpt:
      "Veja como equilibrar parques, descanso, compras e deslocamentos para aproveitar Orlando sem transformar a viagem em correria.",
    content: `
      <h2>Divida a viagem por ritmo</h2>
      <p>Uma boa combinacao entre Disney e Universal depende mais do ritmo do grupo do que da quantidade maxima de parques. O ideal e alternar dias exigentes com momentos de recuperacao.</p>
      <h2>Considere transporte desde o inicio</h2>
      <p>Ficar bem localizado pode economizar horas ao longo da semana. Antes de decidir o hotel, avalie se faz mais sentido aluguel de carro, transfer, app de transporte ou uma base proxima aos parques que serao prioridade.</p>
      <h2>Reserve uma margem para compras</h2>
      <p>Outlets, farmacias, supermercado e pequenas pausas acabam fazendo parte da viagem a Orlando. Colocar isso no planejamento evita estourar o cronograma dos parques.</p>
      <h2>Use o primeiro dia para ajustar o corpo</h2>
      <p>Quem chega de voo internacional costuma render menos nas primeiras horas. Sempre que possivel, deixe a chegada para descanso leve e concentre os parques para o dia seguinte.</p>
      <h2>Feche o pacote pensando no todo</h2>
      <p>Quando voo, hotel, ingressos e bagagem sao comparados juntos, aparecem economias que nao ficam claras em compras separadas. Uma revisao completa ajuda a evitar combinacoes ruins.</p>
    `,
    coverImage: BLOG_COVER_ORLANDO,
    language: "pt",
    isPublished: true,
  },
  {
    title: "Disney and Universal in one trip: how to build a 7-day Orlando plan",
    slug: "disney-and-universal-in-one-trip-orlando-in-7-days",
    excerpt:
      "See how to balance park days, rest, shopping, and transportation so Orlando feels productive without becoming exhausting.",
    content: `
      <h2>Build the week around pace</h2>
      <p>A strong Disney and Universal combination depends more on group rhythm than on the maximum number of parks. The best plans mix demanding days with recovery time.</p>
      <h2>Think about transportation early</h2>
      <p>A well-placed hotel can save hours over the course of a week. Before choosing where to stay, compare rental cars, transfers, ride-share use, or a base closer to the parks that matter most.</p>
      <h2>Leave room for shopping and errands</h2>
      <p>Outlets, pharmacies, grocery stops, and small breaks are all part of many Orlando trips. Planning around them keeps the park schedule realistic.</p>
      <h2>Use arrival day to reset</h2>
      <p>Travelers arriving on international flights usually perform less well in the first few hours. When possible, make arrival day lighter and push the first major park day to the following morning.</p>
      <h2>Compare the whole package together</h2>
      <p>When flights, hotel, tickets, and baggage are reviewed as one package, savings often appear that are not obvious in separate bookings. A full comparison prevents weak combinations.</p>
    `,
    coverImage: BLOG_COVER_ORLANDO,
    language: "en",
    isPublished: true,
  },
  {
    title: "Disney y Universal en el mismo viaje: como armar Orlando en 7 dias",
    slug: "disney-y-universal-en-el-mismo-viaje-orlando-en-7-dias",
    excerpt:
      "Descubra como equilibrar parques, descanso, compras y traslados para disfrutar Orlando sin convertir el viaje en una carrera.",
    content: `
      <h2>Divida el viaje por ritmo</h2>
      <p>Una buena combinacion entre Disney y Universal depende mas del ritmo del grupo que del numero maximo de parques. Lo ideal es alternar dias exigentes con momentos de recuperacion.</p>
      <h2>Piense en el transporte desde el inicio</h2>
      <p>Un hotel bien ubicado puede ahorrar muchas horas durante la semana. Antes de elegir alojamiento, compare alquiler de coche, traslados, apps de transporte o una base mas cercana a los parques prioritarios.</p>
      <h2>Reserve margen para compras</h2>
      <p>Outlets, farmacias, supermercado y pausas pequenas forman parte de muchos viajes a Orlando. Incluir eso en el plan evita romper el cronograma de los parques.</p>
      <h2>Use el dia de llegada para ajustarse</h2>
      <p>Quienes llegan en vuelo internacional suelen rendir menos durante las primeras horas. Siempre que sea posible, deje la llegada para descanso ligero y empiece los parques fuertes al dia siguiente.</p>
      <h2>Compare el paquete completo</h2>
      <p>Cuando vuelo, hotel, entradas y equipaje se comparan juntos, aparecen ahorros que no siempre son claros en compras separadas. Una revision integral evita malas combinaciones.</p>
    `,
    coverImage: BLOG_COVER_ORLANDO,
    language: "es",
    isPublished: true,
  },
];

function shouldRetirePost(post: typeof blogPosts.$inferSelect) {
  if (retiredManagedSlugs.has(post.slug)) {
    return true;
  }

  const searchableText = [
    post.slug,
    post.title,
    post.excerpt ?? "",
    post.coverImage ?? "",
  ]
    .join(" ")
    .toLowerCase();

  return retiredTopicKeywords.some((keyword) => searchableText.includes(keyword));
}

export async function ensureDefaultBlogPosts() {
  const existingPosts = await db.select().from(blogPosts);
  const existingBySlug = new Map(existingPosts.map((post) => [post.slug, post]));
  const managedIds = new Set<number>();
  let insertedCount = 0;
  let updatedCount = 0;
  let retiredCount = 0;
  const now = Date.now();

  for (let index = 0; index < managedBlogPosts.length; index++) {
    const post = managedBlogPosts[index];
    const createdAt = new Date(now - index * 60_000);
    const values = { ...post, createdAt };
    const existing = existingBySlug.get(post.slug);

    if (existing) {
      await db.update(blogPosts).set(values).where(eq(blogPosts.id, existing.id));
      managedIds.add(existing.id);
      updatedCount += 1;
      continue;
    }

    const [inserted] = await db.insert(blogPosts).values(values).returning();
    existingBySlug.set(inserted.slug, inserted);
    managedIds.add(inserted.id);
    insertedCount += 1;
  }

  for (const post of existingPosts) {
    if (managedIds.has(post.id) || !shouldRetirePost(post)) {
      continue;
    }

    await db
      .update(blogPosts)
      .set({ isPublished: false })
      .where(eq(blogPosts.id, post.id));
    retiredCount += 1;
  }

  console.log(
    `[blog-seed] synced ${managedBlogPosts.length} managed posts (${insertedCount} inserted, ${updatedCount} updated, ${retiredCount} retired)`,
  );
}
