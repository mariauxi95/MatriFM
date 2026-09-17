import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Guest } from "../types";

const STORAGE = "fm-guest";

type GuestContextValue = {
  guest: Guest | null;
  opened: boolean;
  setGuest: (guest: Guest | null) => void;
  openInvite: () => void;
};

const GuestContext = createContext<GuestContextValue | null>(null);

function loadGuest(): Guest | null {
  try {
    const raw = sessionStorage.getItem(STORAGE);
    return raw ? (JSON.parse(raw) as Guest) : null;
  } catch {
    return null;
  }
}

export function GuestProvider({ children }: { children: ReactNode }) {
  const [guest, setGuestState] = useState<Guest | null>(loadGuest);
  const [opened, setOpened] = useState(() => sessionStorage.getItem("fm-opened") === "1");

  const value = useMemo<GuestContextValue>(
    () => ({
      guest,
      opened,
      setGuest: (next) => {
        setGuestState(next);
        if (next) sessionStorage.setItem(STORAGE, JSON.stringify(next));
        else sessionStorage.removeItem(STORAGE);
      },
      openInvite: () => {
        sessionStorage.setItem("fm-opened", "1");
        setOpened(true);
      },
    }),
    [guest, opened],
  );

  return <GuestContext.Provider value={value}>{children}</GuestContext.Provider>;
}

export function useGuest() {
  const ctx = useContext(GuestContext);
  if (!ctx) throw new Error("useGuest must be used within GuestProvider");
  return ctx;
}
