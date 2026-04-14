import { db } from "../db";
import { featuredDeals } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { searchFlights } from "./duffel";
import { addDays, format } from "date-fns";

const POPULAR_ROUTES = [
  { origin: "EWR", originCity: "Newark", destination: "GIG", destinationCity: "Rio de Janeiro", image: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&q=80&w=1000" },
  { origin: "MIA", originCity: "Miami", destination: "LIS", destinationCity: "Lisboa", image: "https://images.unsplash.com/photo-1580237541049-2d715a09486e?auto=format&fit=crop&q=80&w=1000" },
  { origin: "EWR", originCity: "Newark", destination: "GRU", destinationCity: "São Paulo", image: "https://images.unsplash.com/photo-1543059152-44344d29a1d1?auto=format&fit=crop&q=80&w=1000" },
  { origin: "EWR", originCity: "Newark", destination: "MCO", destinationCity: "Orlando", image: "https://images.unsplash.com/photo-1597466599360-3b9775841aec?auto=format&fit=crop&q=80&w=1000" },
  { origin: "JFK", originCity: "New York", destination: "CDG", destinationCity: "Paris", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=1000" },
];

export async function runDealsAutomation() {
  console.log("[DEALS AUTOMATION] Starting periodic refresh...");

  try {
    // 1. Get current active manual deals
    const currentManualDeals = await db.select()
      .from(featuredDeals)
      .where(and(eq(featuredDeals.isActive, true), eq(featuredDeals.isAutomatic, false)));
    
    const manualCount = currentManualDeals.length;
    const neededCount = Math.max(0, 4 - manualCount);

    console.log(`[DEALS AUTOMATION] Found ${manualCount} manual deals. Need ${neededCount} automatic ones.`);

    // 2. Clear old automatic deals to avoid duplicates or stale prices
    await db.delete(featuredDeals).where(eq(featuredDeals.isAutomatic, true));

    if (neededCount === 0) {
      console.log("[DEALS AUTOMATION] Manual deals fully cover the 4 slots. Skipping automation.");
      return;
    }

    // 3. Fill the remaining slots with popular routes
    let added = 0;
    // We shuffle or just pick the first ones not in manual deals
    const availableRoutes = POPULAR_ROUTES.filter(r => 
      !currentManualDeals.some(m => m.origin === r.origin && m.destination === r.destination)
    );

    for (const route of availableRoutes) {
      if (added >= neededCount) break;

      try {
        console.log(`[DEALS AUTOMATION] Fetching fresh price for ${route.origin} -> ${route.destination}...`);
        
        // Search for a flight ~30 days from now
        const searchDate = format(addDays(new Date(), 30), "yyyy-MM-dd");
        const offers = await searchFlights({
          origin: route.origin,
          destination: route.destination,
          date: searchDate,
          adults: "1",
          cabinClass: "economy",
          tripType: "one-way"
        });

        if (offers && offers.length > 0) {
          const cheapest = offers.reduce((min, o) => o.price < min.price ? o : min, offers[0]);
          
          await db.insert(featuredDeals).values({
            origin: route.origin,
            originCity: route.originCity,
            destination: route.destination,
            destinationCity: route.destinationCity,
            departureDate: searchDate,
            price: cheapest.price.toString() as any,
            currency: cheapest.currency,
            airline: cheapest.airline,
            imageUrl: route.image,
            isAutomatic: true,
            isActive: true,
            headline: `Oferta Incrível para ${route.destinationCity}`,
            description: `Voe de ${route.originCity} para ${route.destinationCity} com o melhor preço garantido pela Michels Travel.`
          });

          console.log(`[DEALS AUTOMATION] Created automatic deal for ${route.destinationCity} at ${cheapest.price} ${cheapest.currency}`);
          added++;
        }
      } catch (err) {
        console.error(`[DEALS AUTOMATION] Failed to create deal for ${route.destination}:`, err);
      }
    }

    console.log(`[DEALS AUTOMATION] Automation complete. Added ${added} deals.`);
  } catch (error) {
    console.error("[DEALS AUTOMATION] Critical failure:", error);
  }
}

// Helper to ensure exactly 4 deals are returned to frontend
export async function getBalancedDeals() {
  const allDeals = await db.select()
    .from(featuredDeals)
    .where(eq(featuredDeals.isActive, true))
    .orderBy(desc(featuredDeals.isAutomatic), desc(featuredDeals.createdAt));

  // Sort: Manual first, then Automatic
  const sorted = [...allDeals].sort((a, b) => {
    if (a.isAutomatic === b.isAutomatic) return 0;
    return a.isAutomatic ? 1 : -1;
  });

  return sorted.slice(0, 4);
}
