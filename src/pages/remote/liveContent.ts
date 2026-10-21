/** Copy for the remote “Celebración en vivo” page. Edit the wording here. */
export const liveCelebration = {
  eyebrow: "Te queremos cerca, estés donde estés",
  titleStart: "Conéctate al",
  titleMark: "“sí, acepto”",
  date: "Sábado 20 de marzo de 2027",
  time: "3:30 p. m.",
  badges: [
    { id: "date", label: "Fecha", valueKey: "date" as const },
    { id: "time", label: "Hora", valueKey: "time" as const },
  ],
  paragraphs: [
    "Aunque no puedas acompañarnos en Santa Marta, queremos que seas parte de este momento tan especial. Tendremos una transmisión en vivo para que puedas acompañarnos desde donde estés.",
    "Prepara tu mejor pinta, algo rico para brindar y acompáñanos desde casa. Queremos que quienes se conecten también se sientan parte de este día.",
  ],
  watchCta: "Ver ceremonia en vivo",
  reminderCta: "Agregar recordatorio",
  pending: "El enlace estará disponible más cerca de la fecha.",
  photoAlt: "Maru y Fer besándose al atardecer",
  cards: [
    {
      id: "early",
      icon: "time" as const,
      title: "Conéctate unos minutos antes",
      text: "Ingresa 10 a 15 min antes.",
    },
    {
      id: "mini",
      icon: "toast" as const,
      title: "Prepara tu mini celebración",
      text: "Ten tu bebida lista para brindar.",
    },
    {
      id: "chat",
      icon: "chat" as const,
      title: "Participa en el chat",
      text: "Envía mensajes, corazones y emojis.",
    },
    {
      id: "later",
      icon: "heart" as const,
      title: "Después veremos sus mensajes",
      text: "Queremos revivir este momento con ustedes.",
    },
  ],
  kitTitle: "Tu kit oficial para verlo desde casa",
  kit: [
    "Ponte tu mejor pinta (aunque sea de la cintura para arriba).",
    "Ten lista una cerveza, copa de vino o algo rico para brindar.",
    "Busca un lugar cómodo y con buena conexión.",
    "Si puedes, activa tu cámara.",
    "Mándanos mensajes, emojis y mucho amor por el chat.",
    "Si lloras, estás oficialmente dentro del dress code emocional.",
  ],
  notesTitle: "Indicaciones importantes",
  notes: [
    "Ingresa unos minutos antes del inicio.",
    "Guarda este enlace para acceder fácilmente.",
    "Usa el chat para saludarnos y acompañarnos.",
    "Si tienes problemas técnicos, actualiza la página e intenta nuevamente.",
    "El enlace definitivo estará disponible más cerca de la fecha.",
  ],
};
