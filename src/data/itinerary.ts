import { assetUrl } from "../lib/assets";
export type ItineraryEvent = {
  time: string;
  /** English label when `time` is a phrase, not a clock time. */
  timeEn?: string;
  /** Second departure, shown as “time o timeAlt”. */
  timeAlt?: string;
  titleEs: string;
  titleEn: string;
  placeEs?: string;
  placeEn?: string;
  image: string;
  optional?: boolean;
  /** Opens the short signup drawer on the timeline card. */
  signup?: boolean;
};

export type ItineraryDay = {
  id: string;
  dateLabelEs: string;
  dateLabelEn: string;
  titleEs: string;
  titleEn: string;
  /** Headline time shown on the day card. */
  time: string;
  photo: string;
  /** CSS object-position for the day card photo */
  photoPosition?: string;
  dressEs: string;
  dressEn: string;
  dressLink: string;
  pinterestBoard?: string;
  pinterestTitle?: string;
  reservedColors?: { hex: string; labelEs: string; labelEn: string }[];
  events: ItineraryEvent[];
};

export const itinerary: ItineraryDay[] = [
  {
    id: "fri",
    dateLabelEs: "Viernes 19 de marzo",
    dateLabelEn: "Friday, March 19",
    titleEs: "Last Stop Before “I Do”",
    titleEn: "Last Stop Before “I Do”",
    time: "7:00 p. m.",
    photo: assetUrl("/images/gallery/civil.jpeg"),
    photoPosition: "center 28%",
    dressEs: "Blanco · casual playa",
    dressEn: "White · casual beach",
    dressLink: "https://www.pinterest.com/ideas/outfit-blanco-de-playa/901733141207/",
    pinterestBoard: "https://www.pinterest.com/mendezblanch/vestidos-blancos-de-playa/",
    pinterestTitle: "Outfit Blanco Playa",
    events: [
      {
        time: "9:30 a. m.",
        titleEs: "Salida en bus desde Santa Marta hacia Bohemia Beach",
        titleEn: "Bus departure from Santa Marta to Bohemia Beach",
        placeEs: "Centro de Santa Marta",
        placeEn: "Downtown Santa Marta",
        image: assetUrl("/images/itinerary/bus.png"),
      },
      {
        time: "10:15 a. m.",
        titleEs: "Llegada a Bohemia Beach y posadas",
        titleEn: "Arrival at Bohemia Beach and lodges",
        image: assetUrl("/images/itinerary/llegada.png"),
      },
      {
        time: "12:00 p. m.",
        titleEs: "Torneo de volleyball",
        titleEn: "Volleyball tournament",
        placeEs: "Playa frente a Bohemia",
        placeEn: "Beach in front of Bohemia",
        image: assetUrl("/images/itinerary/volley.png"),
        optional: true,
        signup: true,
      },
      {
        time: "Tiempo libre",
        timeEn: "Free time",
        titleEs: "",
        titleEn: "",
        image: assetUrl("/images/itinerary/tiempolibre.png"),
      },
      {
        time: "4:00 p. m.",
        titleEs: "Torneo de beer pong",
        titleEn: "Beer pong tournament",
        placeEs: "Playa frente a Bohemia",
        placeEn: "Beach in front of Bohemia",
        image: assetUrl("/images/itinerary/beerpong.png"),
      },
      {
        time: "7:00 p. m.",
        titleEs: "Cena de bienvenida — Last Stop Before “I Do”",
        titleEn: "Welcome dinner — Last Stop Before “I Do”",
        placeEs: "Bar de playa Bohemia",
        placeEn: "Bohemia beach bar",
        image: assetUrl("/images/itinerary/preboda.png"),
      },
    ],
  },
  {
    id: "sat",
    dateLabelEs: "Sábado 20 de marzo",
    dateLabelEn: "Saturday, March 20",
    titleEs: "Matrimonio Maru & Fer ❤️",
    titleEn: "Wedding Maru & Fer ❤️",
    time: "4:30 p. m.",
    photo: assetUrl("/images/gallery/Compromiso.jpg"),
    dressEs: "Formal playa",
    dressEn: "Beach formal",
    dressLink:
      "https://cl.pinterest.com/search/pins/?q=outfit%20matrimonio%20playa&rs=ac&len=23&source_id=ac_uq6ko0E5&eq=matrimonio%20playa%20outfit&etslf=3156",
    pinterestBoard:
      "https://cl.pinterest.com/search/pins/?q=outfit%20matrimonio%20playa&rs=ac&len=23&source_id=ac_uq6ko0E5&eq=matrimonio%20playa%20outfit&etslf=3156",
    pinterestTitle: "Dress code Matrimonio Playa",
    reservedColors: [
      { hex: "#f7f4ee", labelEs: "Blanco", labelEn: "White" },
      { hex: "#f4efe2", labelEs: "Ivory", labelEn: "Ivory" },
      { hex: "#457143", labelEs: "Verde", labelEn: "Green" },
      { hex: "#98d4c0", labelEs: "Verde menta", labelEn: "Mint green" },
    ],
    events: [
      {
        time: "8:00 a. m.",
        titleEs: "Clase de yoga",
        titleEn: "Yoga class",
        image: assetUrl("/images/itinerary/yoga.png?v=2"),
        optional: true,
        signup: true,
      },
      {
        time: "4:45 p. m.",
        titleEs: "Ceremonia de matrimonio",
        titleEn: "Wedding ceremony",
        placeEs: "Playa Bohemia Beach",
        placeEn: "Bohemia Beach",
        image: assetUrl("/images/itinerary/ceremonia.png"),
      },
      {
        time: "6:00 p. m.",
        titleEs: "Cóctel",
        titleEn: "Cocktail hour",
        image: assetUrl("/images/itinerary/tragos.png"),
      },
      {
        time: "7:00 p. m.",
        titleEs: "Recepción",
        titleEn: "Reception",
        image: assetUrl("/images/itinerary/cena.png"),
      },
      {
        time: "9:00 p. m.",
        titleEs: "Comienza la fiesta",
        titleEn: "The party starts",
        image: assetUrl("/images/itinerary/fiesta.png"),
      },
      {
        time: "2:00 a. m.",
        titleEs: "After party en la playa",
        titleEn: "Beach after party",
        image: assetUrl("/images/itinerary/afterparty.png"),
      },
    ],
  },
  {
    id: "sun",
    dateLabelEs: "Domingo 21 de marzo",
    dateLabelEn: "Sunday, March 21",
    titleEs: "No es más que un hasta luego",
    titleEn: "Just a see you later",
    time: "10:30 a. m.",
    photo: assetUrl("/images/gallery/chao.jpg"),
    dressEs: "Ropa cómoda de playa / viaje",
    dressEn: "Comfortable beach / travel clothes",
    dressLink: "https://www.pinterest.com/search/pins/?q=tropical%20sunday%20beach%20outfit",
    events: [
      {
        time: "10:00 a. m.",
        titleEs: "Checkout",
        titleEn: "Checkout",
        image: assetUrl("/images/itinerary/checkout.png"),
      },
      {
        time: "10:30 a. m.",
        titleEs: "Tour Playas Tayrona",
        titleEn: "Tayrona beaches tour",
        placeEs: "Opcional, a costo individual",
        placeEn: "Optional, individual cost",
        image: assetUrl("/images/itinerary/tayrona.png"),
        optional: true,
      },
      {
        time: "11:00 a. m.",
        timeAlt: "6:00 p. m.",
        titleEs: "Bus de regreso al centro de Santa Marta",
        titleEn: "Bus back to downtown Santa Marta",
        image: assetUrl("/images/itinerary/bus.png"),
      },
    ],
  },
];
