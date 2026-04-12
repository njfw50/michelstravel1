
/**
 * Travel Intelligence Service
 * Consolidates data from Teleport (Imagery & Stats) and Wikivoyage (Travel Guides)
 */

export interface CityHighlights {
  name: string;
  fullName: string;
  image: string;
  description: string;
  scores: {
    name: string;
    score: number;
    color: string;
  }[];
  summary: string;
  sections: {
    title: string;
    content: string;
  }[];
}

const WIKIVOYAGE_API = "https://pt.wikivoyage.org/w/api.php";
const TELEPORT_API = "https://api.teleport.org/api";

export async function searchCity(query: string): Promise<any[]> {
  try {
    const res = await fetch(`${TELEPORT_API}/cities/?search=${encodeURIComponent(query)}`);
    const data = await res.json();
    return data._embedded["city:search-results"];
  } catch (error) {
    console.error("Failed to search city:", error);
    return [];
  }
}

export async function fetchCityDetails(cityName: string, lang: "pt" | "es" = "pt"): Promise<CityHighlights | null> {
  try {
    // 1. Get basic city info and urban area link from Teleport
    const searchRes = await fetch(`${TELEPORT_API}/cities/?search=${encodeURIComponent(cityName)}&limit=1`);
    const searchData = await searchRes.json();
    const firstResult = searchData._embedded["city:search-results"]?.[0];
    
    if (!firstResult) return null;
    
    const cityRes = await fetch(firstResult._links["city:item"].href);
    const cityData = await cityRes.json();
    
    const uaHref = cityData._links["city:urban_area"]?.href;
    let image = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1200"; // Fallback
    let scores: any[] = [];
    let summary = "";

    if (uaHref) {
      // Get Images
      const imgRes = await fetch(`${uaHref}images/`);
      const imgData = await imgRes.json();
      image = imgData.photos?.[0]?.image?.web || image;

      // Get Scores/Summary
      const scoreRes = await fetch(`${uaHref}scores/`);
      const scoreData = await scoreRes.json();
      summary = scoreData.summary || "";
      scores = (scoreData.categories || []).map((c: any) => ({
        name: c.name,
        score: c.score_out_of_10,
        color: c.color
      }));
    }

    // 2. Get Guide Content from Wikivoyage
    const wikiApi = lang === "es" ? "https://es.wikivoyage.org/w/api.php" : WIKIVOYAGE_API;
    const wikiParams = new URLSearchParams({
      action: "query",
      prop: "extracts|sections",
      exintro: "1",
      explaintext: "1",
      titles: cityName,
      format: "json",
      origin: "*"
    });

    const wikiRes = await fetch(`${wikiApi}?${wikiParams.toString()}`);
    const wikiData = await wikiRes.json();
    const pages = wikiData.query.pages;
    const pageId = Object.keys(pages)[0];
    const page = pages[pageId];

    let description = page.extract || "";
    
    return {
      name: cityName,
      fullName: firstResult.matching_full_name,
      image,
      description,
      scores: scores.slice(0, 5), // Top 5 relevant metrics
      summary: summary.replace(/<[^>]*>/g, ""), // Clean HTML
      sections: [] // We can expand this for full guides
    };
  } catch (error) {
    console.error("Failed to fetch city details:", error);
    return null;
  }
}

/**
 * Curated list of top Ibero-American destinations
 */
export const IBERO_PREMIUM_DESTINATIONS = [
  { name: "Lisboa", country: "Portugal", code: "LIS" },
  { name: "Rio de Janeiro", country: "Brasil", code: "GIG" },
  { name: "Cartagena", country: "Colômbia", code: "CTG" },
  { name: "Madrid", country: "Espanha", code: "MAD" },
  { name: "Buenos Aires", country: "Argentina", code: "EZE" },
  { name: "Santiago", country: "Chile", code: "SCL" },
  { name: "São Paulo", country: "Brasil", code: "GRU" },
  { name: "Barcelona", country: "Espanha", code: "BCN" },
  { name: "Cidade do México", country: "México", code: "MEX" },
  { name: "Cusco", country: "Peru", code: "CUZ" },
];
