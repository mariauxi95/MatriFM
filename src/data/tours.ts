import { assetUrl } from "../lib/assets";
import { tourPaymentUrls, type TourPaymentKey } from "./tourPayments";

export type Tour = {
  id: string;
  paymentKey: TourPaymentKey;
  title: string;
  subtitle: string;
  date: string;
  time: string;
  pricePerPerson: number;
  meetingPoint: string;
  description: string;
  note?: string;
  image: string;
};

export const tours: Tour[] = [
  {
    id: "buritaca",
    paymentKey: "buritaca_payment_url",
    title: "Buritaca & Río Guachaca",
    subtitle: "Celebremos la despedida de la boda",
    date: "Domingo 21 de marzo",
    time: "11:00 a 17:30 hrs",
    pricePerPerson: 130000,
    meetingPoint: "Bohemia Beach",
    description:
      "Un plan relajado para cerrar el fin de semana entre naturaleza y agua. Recorreremos la zona de Buritaca y el río Guachaca, disfrutando de paisajes tropicales y tiempo para compartir en grupo.",
    note: "En Buritaca existe la opción de hacer tubing por cuenta propia.",
    image: assetUrl("/images/gallery/kayak.jpg"),
  },
  {
    id: "katamaran",
    paymentKey: "katamaran_payment_url",
    title: "Fiesta en Katamarán",
    subtitle: "Porque aún nos quedamos con ganas de más fiesta",
    date: "Lunes 22 de marzo",
    time: "18:00 a 22:00 hrs",
    pricePerPerson: 155000,
    meetingPoint: "Por confirmar",
    description:
      "Una noche diferente para seguir celebrando juntos en el Caribe. Música, mar y ambiente de fiesta a bordo de un catamarán para disfrutar Santa Marta desde otra perspectiva.",
    note: "Niños desde 5 años pagan tarifa.",
    image: assetUrl("/images/gallery/catamaran.png"),
  },
  {
    id: "cinto",
    paymentKey: "cinto_payment_url",
    title: "Cinto & Playa Cristal",
    subtitle: "¿Cómo no vivir esta aventura?",
    date: "Martes 23 de marzo",
    time: "9:00 a 17:30 hrs",
    pricePerPerson: 185000,
    meetingPoint: "Recepción Hotel Tamacá",
    description:
      "Un día completo para descubrir dos de las playas más especiales de Tayrona. La experiencia combina recorrido marítimo, paisajes del Parque Tayrona y tiempo para disfrutar de las aguas de Cinto y Playa Cristal.",
    image: assetUrl("/images/gallery/playacinto.webp"),
  },
];

export function tourPaymentUrl(tour: Tour) {
  return tourPaymentUrls[tour.paymentKey];
}

export function formatCop(amount: number) {
  return `$${new Intl.NumberFormat("es-CO").format(amount)} COP`;
}
