import { create } from "zustand";

export type MobileAppEnvironment = "test" | "production" | null;

type AppRuntimeState = {
  environment: MobileAppEnvironment;
  appEnabled: boolean;
  currentVersion: string | null;
  latestVersion: string | null;
  updateAvailable: boolean;
  updateRequired: boolean;
  updateUrl: string | null;
  setEnvironmentState: (payload: { environment: Exclude<MobileAppEnvironment, null>; appEnabled: boolean }) => void;
  setReleaseState: (payload: {
    currentVersion: string;
    latestVersion: string | null;
    updateAvailable: boolean;
    updateRequired?: boolean;
    updateUrl: string | null;
  }) => void;
  clearEnvironmentState: () => void;
};

export const useAppRuntimeStore = create<AppRuntimeState>((set) => ({
  environment: null,
  appEnabled: true,
  currentVersion: null,
  latestVersion: null,
  updateAvailable: false,
  updateRequired: false,
  updateUrl: null,
  setEnvironmentState: ({ environment, appEnabled }) => set({ environment, appEnabled }),
  setReleaseState: ({ currentVersion, latestVersion, updateAvailable, updateRequired = false, updateUrl }) =>
    set({ currentVersion, latestVersion, updateAvailable, updateRequired, updateUrl }),
  clearEnvironmentState: () =>
    set({
      environment: null,
      appEnabled: true,
      currentVersion: null,
      latestVersion: null,
      updateAvailable: false,
      updateRequired: false,
      updateUrl: null,
    }),
}));
