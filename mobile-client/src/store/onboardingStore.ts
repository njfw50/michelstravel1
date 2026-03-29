import { create } from "zustand";
import { AppLanguage, JourneyMode } from "../types/app";

export type Language = AppLanguage;
export type Mode = JourneyMode;

type OnboardingState = {
  language: AppLanguage;
  mode: JourneyMode;
  set: (language: AppLanguage, mode: JourneyMode) => void;
  setLanguage: (language: AppLanguage) => void;
  setMode: (mode: JourneyMode) => void;
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  language: "pt",
  mode: "regular",
  set: (language, mode) => set({ language, mode }),
  setLanguage: (language) => set({ language }),
  setMode: (mode) => set({ mode }),
}));
