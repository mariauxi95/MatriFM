import type { ClubMessage } from "../types";

/** Wedding WhatsApp group invite (Vuelo Matri FM 2003). */
export const CLUB_WHATSAPP_URL = "https://chat.whatsapp.com/H0ENfbOkpBt2Yj8kz8awL2";

export const clubHosts: ClubMessage[] = [
  {
    id: "host-maru",
    guestId: "maru",
    displayName: "Maru",
    email: "mariauxi95@gmail.com",
    message:
      "¡Bienvenidos al muro! Pregunten lo que quieran, propongan planes y cuéntenos si vienen con ganas de playa, baile o siesta. 🌴",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "host-fer",
    guestId: "fer",
    displayName: "Fer",
    message:
      "Si tienen dudas de transporte, hoteles o tours, tírenlas acá. Entre todos armamos el mejor fin de semana.",
    email: "yanezlfernando@gmail.com",
    createdAt: "2026-01-01T00:00:01.000Z",
  },
];

const gravatar: Record<string, string> = {
  "mariauxi95@gmail.com": "c051d768eef7b1a58ce6a5df9d506a7b",
  "yanezlfernando@gmail.com": "79f894eb32519723958f3c71da3aee17",
};

export function emailAvatar(email: string) {
  const normalized = email.trim().toLowerCase();
  const hash = gravatar[normalized];
  const fallback = hash
    ? `https://www.gravatar.com/avatar/${hash}?s=160&d=identicon`
    : `https://www.gravatar.com/avatar/?s=160&d=identicon`;
  return `https://unavatar.io/${encodeURIComponent(normalized)}?fallback=${encodeURIComponent(fallback)}`;
}

const LIKES_KEY = "fm-club-likes";

export function readClubLikes(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(LIKES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string[]>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function writeClubLikes(likes: Record<string, string[]>) {
  localStorage.setItem(LIKES_KEY, JSON.stringify(likes));
}

export function toggleClubLike(messageId: string, guestId: string): Record<string, string[]> {
  const likes = readClubLikes();
  const current = likes[messageId] ?? [];
  likes[messageId] = current.includes(guestId)
    ? current.filter((id) => id !== guestId)
    : [...current, guestId];
  writeClubLikes(likes);
  return likes;
}
