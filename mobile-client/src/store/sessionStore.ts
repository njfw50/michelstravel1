import { create } from "zustand";

export type AccessMode = "account" | "guest";

type GuestReservationAccess = {
  referenceCode: string;
  contactEmail: string;
  bookingId?: number;
};

type SessionState = {
  accessMode: AccessMode;
  guestReservation?: GuestReservationAccess;
  setAccessMode: (mode: AccessMode) => void;
  rememberGuestReservation: (reservation: GuestReservationAccess) => void;
  clearGuestReservation: () => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  accessMode: "account",
  guestReservation: undefined,
  setAccessMode: (mode) => set({ accessMode: mode }),
  rememberGuestReservation: (guestReservation) => set({ guestReservation }),
  clearGuestReservation: () => set({ guestReservation: undefined }),
}));
