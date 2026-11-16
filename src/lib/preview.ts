import type { Contribution, Guest, GuestPlans, RsvpRecord, TourReservation } from "../types";
import { parsePlans } from "./plans";
import type { ActivitySignup, PassportMember } from "./sheets";

// Preview mode lets the planner walk through the guest site as a made-up invitation. Every
// write the guest pages make is answered here and kept in memory only, so the flows run to
// their "done" screens but nothing is sent, saved or confirmed. It also resets on reload.

let active = false;

export function isPreview() {
  return active;
}

let hideTimer: number | undefined;

/** Tells the planner that what she just tried is not saved or sent. Shown only when she tries. */
export function previewNotice() {
  if (typeof document === "undefined") return;
  let toast = document.getElementById("preview-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "preview-toast";
    toast.className = "preview-toast";
    toast.setAttribute("role", "status");
    document.body.appendChild(toast);
  }
  toast.textContent = "Vista previa: esto no se guarda ni se envía.";
  toast.hidden = false;
  window.clearTimeout(hideTimer);
  hideTimer = window.setTimeout(() => {
    toast!.hidden = true;
  }, 5000);
}

export function setPreviewActive(next: boolean) {
  if (active && !next) resetPreviewStore();
  active = next;
}

export const PREVIEW_GUEST: Guest = {
  id: "preview",
  displayName: "Invitación de ejemplo",
  fullName: "Ana Ejemplo",
  email: "",
  guestLimit: 3,
  hasChildren: true,
  childrenLimit: 1,
};

export const PREVIEW_MEMBERS: PassportMember[] = [
  { id: "preview-1", fullName: "Ana Ejemplo", email: "", ageGroup: "adult", isPrimary: true, signedIn: true },
  { id: "preview-2", fullName: "Luis Ejemplo", email: "", ageGroup: "adult", isPrimary: false, signedIn: false },
  { id: "preview-3", fullName: "Sofía Ejemplo", email: "", ageGroup: "kid", isPrimary: false, signedIn: false },
];

export const previewStore: {
  rsvp: RsvpRecord | null;
  plans: GuestPlans;
  signups: ActivitySignup[];
  tours: TourReservation[];
  contributions: Contribution[];
} = {
  rsvp: null,
  plans: parsePlans(null),
  signups: [],
  tours: [],
  contributions: [],
};

export function resetPreviewStore() {
  previewStore.rsvp = null;
  previewStore.plans = parsePlans(null);
  previewStore.signups = [];
  previewStore.tours = [];
  previewStore.contributions = [];
}
