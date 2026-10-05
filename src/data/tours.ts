import { assetUrl } from "../lib/assets";
import { tourPaymentUrls, type TourPaymentKey } from "./tourPayments";

export type TourSection = {
  title: string;
  body?: string;
  items?: string[];
};

export type Tour = {
  id: string;
  paymentKey: TourPaymentKey;
  title: string;
  subtitle: string;
  date: string;
  time: string;
  pricePerPerson: number;
  priceUsd: number;
  meetingPoint: string;
  description: string;
  sections?: TourSection[];
  note?: string;
  image: string;
};

export const tours: Tour[] = [
  {
    id: "buritaca",
    paymentKey: "buritaca_payment_url",
    title: "Buritaca & Río Guachaca",
    subtitle:
      "Celebremos la despedida de la boda... Río, naturaleza y playa caribe para cerrar juntos el fin de semana de celebración (y resaca).",
    date: "Domingo 21 de marzo",
    time: "11:00 a 17:30 hrs",
    pricePerPerson: 150000,
    priceUsd: 45,
    meetingPoint: "Bohemia Beach",
    description:
      "Se inicia con la visita a las Cascadas del Río Guachaca y luego se continúa hacia la Playa Buritaca.",
    sections: [
      {
        title: "Detalles:",
        body: "Se inicia con la visita a las Cascadas del Río Guachaca, donde podrás nadar en aguas rodeadas de selva tropical y disfrutar de un entorno natural ideal para relajarte y conectar con la naturaleza. Luego visitarás la Playa Buritaca, un lugar donde el río se encuentra con el mar Caribe, creando un paisaje único.",
      },
      {
        title: "Incluye:",
        items: [
          "Transporte ida y regreso con recogida en tu hotel y guía profesional durante toda la experiencia",
          "Ingreso al rio guachaca y Playa de Buritacá",
          "Almuerzo típico caribeño con opciones de pescado, pollo o carne.",
          "En Buritaca existe la opción de hacer tubing (por cuenta propia).",
        ],
      },
      {
        title: "Recomendaciones:",
        items: [
          "Usar ropa cómoda y ligera, vestido de baño, toalla y calzado adecuado para caminar por senderos naturales.",
          "Llevar bloqueador solar biodegradable, repelente de insectos, gorra o sombrero y gafas de sol.",
          "Apto para embarazadas y bebés",
        ],
      },
    ],
    image: assetUrl("/images/gallery/buritaca.jpg"),
  },
  {
    id: "katamaran",
    paymentKey: "katamaran_payment_url",
    title: "Fiesta en Katamarán",
    subtitle:
      "Porque aún nos quedamos con ganas de más fiesta... Música, mar y fiesta para seguir celebrando juntos pero ahora en Santa Marta.",
    date: "Lunes 22 de marzo",
    time: "18:00 a 22:00 hrs",
    pricePerPerson: 180000,
    priceUsd: 55,
    meetingPoint: "Sector El Rodadero",
    description:
      "La experiencia comienza a bordo de un catamarán con un recorrido nocturno por las bahías de Santa Marta, acompañado de música y ambiente de fiesta.",
    sections: [
      {
        title: "Detalles:",
        body: "La experiencia comienza a bordo de un catamarán con un recorrido nocturno por las bahías de Santa Marta, acompañado de música y ambiente de fiesta. Durante el recorrido se disfruta de distintas vistas de la costa y posteriormente se llega a Playa Inca Inca, donde la celebración continúa junto al mar con música, fogata y un ambiente caribeño.",
      },
      {
        title: "Incluye:",
        items: [
          "Recorrido panorámico marítimo por las playas de Santa Marta y seguro marítimo.",
          "Música y ambiente de fiesta durante la experiencia.",
          "Barra libre de 2 tipos de cócteles a bordo.",
          "Visita a Playa Inca Inca con show folclórico en vivo.",
        ],
      },
      {
        title: "Recomendaciones:",
        items: [
          "Llevar ropa blanca cómoda y fresca.",
          "Calzado cómodo para desplazarse entre el catamarán y la playa.",
          "Llevar ID y dinero para consumos adicionales.",
          "Los niños desde 5 años pagan tarifa.",
        ],
      },
    ],
    image: assetUrl("/images/gallery/catamaran.png"),
  },
  {
    id: "cinto",
    paymentKey: "cinto_payment_url",
    title: "Cinto & Playa Cristal",
    subtitle:
      "Un día de mar, paisajes increíbles y aguas cristalinas para descubrir juntos algunas de las playas más lindas de Tayrona.",
    date: "Martes 23 de marzo",
    time: "9:00 a 17:30 hrs",
    pricePerPerson: 210000,
    priceUsd: 65,
    meetingPoint: "Sector El Rodadero",
    description:
      "El recorrido se realiza en lancha por la costa del Parque Tayrona, pasando por distintas playas y bahías antes de llegar a Playa Cinto.",
    sections: [
      {
        title: "Detalles:",
        body: "El recorrido se realiza en lancha por la costa del Parque Tayrona, pasando por distintas playas y bahías antes de llegar a Playa Cinto, una playa tranquila y rodeada de naturaleza. Luego se continúa hacia Playa Cristal, conocida por sus aguas claras y su entorno natural, donde tendrás tiempo para disfrutar de la playa y descansar antes del regreso.",
      },
      {
        title: "Incluye:",
        items: [
          "Transporte en lancha hasta Cinto y Playa Cristal (ida y regreso)",
          "Ingreso al Parque Nacional Natural Tayrona.",
          "Seguro de asistencia durante la experiencia.",
        ],
      },
      {
        title: "Recomendaciones:",
        items: [
          "Usar bloqueador solar biodegradable, gorra o sombrero.",
          "Llevar hidratación y dinero en efectivo para consumos adicionales.",
          "No es recomendado para embarazadas y bebés.",
        ],
      },
    ],
    image: assetUrl("/images/gallery/playacinto.webp"),
  },
];

export function tourPaymentUrl(tour: Tour) {
  return tourPaymentUrls[tour.paymentKey];
}

export function formatCop(amount: number) {
  return `$${new Intl.NumberFormat("es-CO").format(amount)} COP`;
}

export function formatTourPrice(tour: Tour) {
  return `${formatCop(tour.pricePerPerson)} pp (${tour.priceUsd} USD)`;
}
