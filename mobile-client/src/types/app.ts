export type AppLanguage = "pt" | "en" | "es";
export type JourneyMode = "regular" | "senior";

export type SeniorPriority = "comfort" | "fastest" | "balanced" | "cheapest";
export type SeniorConnectionPreference = "none" | "one" | "any";
export type SeniorBagPreference = "checked" | "carry" | "flexible";
export type SeniorTimePreference = "day" | "any";

export type SeniorPreferences = {
  priority: SeniorPriority;
  connections: SeniorConnectionPreference;
  bags: SeniorBagPreference;
  time: SeniorTimePreference;
};
