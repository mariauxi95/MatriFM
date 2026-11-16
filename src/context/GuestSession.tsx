import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createContext, useContext } from "react";
import type { Session } from "@supabase/supabase-js";
import type { Guest } from "../types";
import { fetchStaffRole, loadCurrentGuest, type StaffRole } from "../lib/auth";
import { fetchRsvp } from "../lib/sheets";
import { PREVIEW_GUEST, setPreviewActive } from "../lib/preview";
import { supabase } from "../lib/supabase";

const OPENED = "fm-opened";
const PREVIEW = "fm-preview";

type GuestContextValue = {
  guest: Guest | null;
  ready: boolean;
  isAdmin: boolean;
  isPlanner: boolean;
  /** The planner is walking through the guest site as a made-up invitation; nothing is saved. */
  preview: boolean;
  startPreview: () => void;
  opened: boolean;
  hasReply: boolean;
  replyReady: boolean;
  markReply: () => void;
  openInvite: () => void;
  signOut: () => Promise<void>;
};

const GuestContext = createContext<GuestContextValue | null>(null);

export function GuestProvider({ children }: { children: ReactNode }) {
  const [realGuest, setGuest] = useState<Guest | null>(null);
  const [staffRole, setStaffRole] = useState<StaffRole>(null);
  const [previewFlag, setPreviewFlag] = useState(() => sessionStorage.getItem(PREVIEW) === "1");
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
        setStaffRole(null);
        setHasReply(false);
        setReplyReady(true);
        setReady(true);
        return;
      }
      try {
        const [nextGuest, role] = await Promise.all([loadCurrentGuest(), fetchStaffRole()]);
        if (!alive || mine !== ticket) return;
        setGuest(nextGuest);
        setStaffRole(role);
      } catch {
        if (!alive || mine !== ticket) return;
        setGuest(null);
        setStaffRole(null);
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

  // Only the planner, and only when she asked for it, sees the sample invitation. The flag is
  // set while rendering so that the pages below read the right mode when their effects run.
  const preview = staffRole === "planner" && !realGuest && previewFlag;
  setPreviewActive(preview);
  const guest = realGuest ?? (preview ? PREVIEW_GUEST : null);

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
      isAdmin: staffRole === "admin",
      isPlanner: staffRole === "planner",
      preview,
      startPreview: () => {
        sessionStorage.setItem(PREVIEW, "1");
        setPreviewFlag(true);
      },
      opened,
      hasReply,
      replyReady,
      markReply: () => setHasReply(true),
      openInvite: () => {
        sessionStorage.setItem(OPENED, "1");
        setOpened(true);
      },
      signOut: async () => {
        sessionStorage.removeItem(PREVIEW);
        setPreviewFlag(false);
        sessionStorage.removeItem(OPENED);
        sessionStorage.removeItem("fm-guest");
        setOpened(false);
        await supabase.auth.signOut();
      },
    }),
    [guest, ready, staffRole, preview, opened, hasReply, replyReady],
  );

  return <GuestContext.Provider value={value}>{children}</GuestContext.Provider>;
}

export function useGuest() {
  const ctx = useContext(GuestContext);
  if (!ctx) throw new Error("useGuest must be used within GuestProvider");
  return ctx;
}
