export type ItineraryEvent = {
  time: string;
  titleEs: string;
  titleEn: string;
  placeEs?: string;
  placeEn?: string;
  image: string;
  optional?: boolean;
};

export type ItineraryDay = {
  id: string;
  dateLabelEs: string;
  dateLabelEn: string;
  titleEs: string;
  titleEn: string;
  photo: string;
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
    photo: "/images/gallery/last.jpg",
    dressEs: "Blanco · casual playa",
    dressEn: "White · casual beach",
    dressLink: "https://www.pinterest.com/ideas/outfit-blanco-de-playa/901733141207/",
    pinterestBoard: "https://www.pinterest.com/mendezblanch/vestidos-blancos-de-playa/",
    pinterestTitle: "Outfit Blanco Playa",
    events: [
      {
        time: "9:00 a. m.",
        titleEs: "Salida en bus desde Santa Marta hacia Bohemia Beach",
        titleEn: "Bus departure from Santa Marta to Bohemia Beach",
        placeEs: "Lugar: por definir",
        placeEn: "Meeting point: TBD",
        image: "/images/itinerary/bus.png",
      },
      {
        time: "10:15 a. m.",
        titleEs: "Llegada a Bohemia Beach y posadas",
        titleEn: "Arrival at Bohemia Beach and lodges",
        image: "/images/itinerary/preboda.png",
      },
      {
        time: "12:00 p. m.",
        titleEs: "Torneo de volleyball",
        titleEn: "Volleyball tournament",
        placeEs: "Playa frente a Bohemia",
        placeEn: "Beach in front of Bohemia",
        image: "/images/itinerary/volley.png",
        optional: true,
      },
      {
        time: "Almuerzo",
        titleEs: "Break de almuerzo",
        titleEn: "Lunch break",
        placeEs: "Opciones cerca de la desembocadura Mendihuaca",
        placeEn: "Options near the Mendihuaca river mouth",
        image: "/images/itinerary/cena.png",
      },
      {
        time: "3:00 p. m.",
        titleEs: "Check-in en hospedajes",
        titleEn: "Lodge check-in",
        image: "/images/itinerary/checkout.png",
      },
      {
        time: "4:00 p. m.",
        titleEs: "Torneo de beer pong",
        titleEn: "Beer pong tournament",
        placeEs: "Playa frente a Bohemia",
        placeEn: "Beach in front of Bohemia",
        image: "/images/itinerary/beerpong.png",
      },
      {
        time: "7:00 p. m.",
        titleEs: "Cena de bienvenida — Last Stop Before “I Do”",
        titleEn: "Welcome dinner — Last Stop Before “I Do”",
        placeEs: "Bar de playa Bohemia",
        placeEn: "Bohemia beach bar",
        image: "/images/itinerary/cena.png",
      },
    ],
  },
  {
    id: "sat",
    dateLabelEs: "Sábado 20 de marzo",
    dateLabelEn: "Saturday, March 20",
    titleEs: "Matrimonio Maru & Fer ❤️",
    titleEn: "Wedding Maru & Fer ❤️",
    photo: "/images/gallery/Compromiso.jpg",
    dressEs: "Formal playa",
    dressEn: "Beach formal",
    dressLink: "https://www.pinterest.com/ideas/vestidos-para-boda-en-la-playa/954146842393/",
    pinterestBoard: "https://www.pinterest.com/ideas/vestidos-para-boda-en-la-playa/954146842393/",
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
        image: "/images/itinerary/preboda.png",
        optional: true,
      },
      {
        time: "4:45 p. m.",
        titleEs: "Ceremonia de matrimonio",
        titleEn: "Wedding ceremony",
        placeEs: "Playa Bohemia Beach",
        placeEn: "Bohemia Beach",
        image: "/images/itinerary/ceremonia.png",
      },
      {
        time: "6:00 p. m.",
        titleEs: "Cóctel",
        titleEn: "Cocktail hour",
        image: "/images/itinerary/coctel.png",
      },
      {
        time: "7:00 p. m.",
        titleEs: "Recepción",
        titleEn: "Reception",
        image: "/images/itinerary/cena.png",
      },
      {
        time: "9:00 p. m.",
        titleEs: "Comienza la fiesta",
        titleEn: "The party starts",
        image: "/images/itinerary/fiesta.png",
      },
      {
        time: "2:00 a. m.",
        titleEs: "After party en la playa",
        titleEn: "Beach after party",
        image: "/images/itinerary/fiesta.png",
      },
    ],
  },
  {
    id: "sun",
    dateLabelEs: "Domingo 21 de marzo",
    dateLabelEn: "Sunday, March 21",
    titleEs: "No es más que un hasta luego",
    titleEn: "Just a see you later",
    photo: "/images/gallery/chao.jpg",
    dressEs: "Ropa cómoda de playa / viaje",
    dressEn: "Comfortable beach / travel clothes",
    dressLink: "https://www.pinterest.com/search/pins/?q=tropical%20sunday%20beach%20outfit",
    events: [
      {
        time: "10:00 a. m.",
        titleEs: "Checkout",
        titleEn: "Checkout",
        image: "/images/itinerary/checkout.png",
      },
      {
        time: "10:30 a. m.",
        titleEs: "Tour Playas Tayrona",
        titleEn: "Tayrona beaches tour",
        placeEs: "Opcional, a costo individual",
        placeEn: "Optional, individual cost",
        image: "/images/itinerary/tour.png",
        optional: true,
      },
      {
        time: "6:00 p. m.",
        titleEs: "Buses de regreso a Santa Marta",
        titleEn: "Buses back to Santa Marta",
        image: "/images/itinerary/bus.png",
      },
    ],
  },
];
