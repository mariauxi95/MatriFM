/** Paste the ceremony stream URL here when it is ready. Leave it empty until then. */
export const LIVE_STREAM_URL = "";

/**
 * Optional calendar link for “Agregar recordatorio”.
 * Leave it empty to open a Google Calendar event for the ceremony.
 */
export const LIVE_REMINDER_URL = "";

const CEREMONY_START = "20270320T153000";
const CEREMONY_END = "20270320T170000";

export function reminderHref() {
  const custom = LIVE_REMINDER_URL.trim();
  if (custom) return custom;
  const text = encodeURIComponent("Celebración en vivo · Maru y Fer");
  const details = encodeURIComponent(
    "Ceremonia de matrimonio. El enlace de la transmisión estará en https://matrimarifer.com/lejos/en-vivo",
  );
  const location = encodeURIComponent("Santa Marta, Colombia");
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${CEREMONY_START}/${CEREMONY_END}&ctz=America/Bogota&details=${details}&location=${location}`;
}
