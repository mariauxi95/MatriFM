import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createContext, useContext } from "react";
import type { Session } from "@supabase/supabase-js";
import type { Guest } from "../types";
import { fetchIsAdmin, loadCurrentGuest } from "../lib/auth";
import { fetchRsvp } from "../lib/sheets";
import { supabase } from "../lib/supabase";

const OPENED = "fm-opened";

type GuestContextValue = {
  guest: Guest | null;
  ready: boolean;
  isAdmin: boolean;
  opened: boolean;
  hasReply: boolean;
  replyReady: boolean;
  markReply: () => void;
  openInvite: () => void;
  signOut: () => Promise<void>;
};

const GuestContext = createContext<GuestContextValue | null>(null);

export function GuestProvider({ children }: { children: ReactNode }) {
  const [guest, setGuest] = useState<Guest | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [ready, setReady] = useState(false);
  const [opened, setOpened] = useState(() => sessionStorage.getItem(OPENED) === "1");
  const [hasReply, setHasReply] = useState(false);
  const [replyReady, setReplyReady] = useState(false);

  useEffect(() => {
    let alive = true;
    let ticket = 0;

    async function apply(session: Session | null) {
      const mine = ++ticket;
      if (!session) {
        if (!alive || mine !== ticket) return;
        setGuest(null);
        setIsAdmin(false);
        setHasReply(false);
        setReplyReady(true);
        setReady(true);
        return;
      }
      try {
        const [nextGuest, admin] = await Promise.all([loadCurrentGuest(), fetchIsAdmin()]);
        if (!alive || mine !== ticket) return;
        setGuest(nextGuest);
        setIsAdmin(admin);
      } catch {
        if (!alive || mine !== ticket) return;
        setGuest(null);
        setIsAdmin(false);
        setHasReply(false);
        setReplyReady(true);
      } finally {
        if (alive && mine === ticket) setReady(true);
      }
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => {
        if (alive) void apply(session);
      }, 0);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!guest) return;
    let alive = true;
    setReplyReady(false);
    fetchRsvp()
      .then((record) => {
        if (alive) setHasReply(Boolean(record));
      })
      .catch(() => {
        if (alive) setHasReply(false);
      })
      .finally(() => {
        if (alive) setReplyReady(true);
      });
    return () => {
      alive = false;
    };
  }, [guest]);

  const value = useMemo<GuestContextValue>(
    () => ({
      guest,
      ready,
      isAdmin,
      opened,
      hasReply,
      replyReady,
      markReply: () => setHasReply(true),
      openInvite: () => {
        sessionStorage.setItem(OPENED, "1");
        setOpened(true);
      },
      signOut: async () => {
        sessionStorage.removeItem(OPENED);
        sessionStorage.removeItem("fm-guest");
        setOpened(false);
        await supabase.auth.signOut();
      },
    }),
    [guest, ready, isAdmin, opened, hasReply, replyReady],
  );

  return <GuestContext.Provider value={value}>{children}</GuestContext.Provider>;
}

export function useGuest() {
  const ctx = useContext(GuestContext);
  if (!ctx) throw new Error("useGuest must be used within GuestProvider");
  return ctx;
}
