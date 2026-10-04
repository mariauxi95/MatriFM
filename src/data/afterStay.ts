/** After del Matri — Hotel Del Mar. Edit copy, prices, dates and links here. */

export type AfterFactIcon = "in" | "price" | "breakfast" | "pool";

export type AfterFact = {
  icon: AfterFactIcon;
  label: string;
};

export type AfterGalleryItem = {
  id: string;
  label: string;
  alt: string;
  /** Public path. Leave empty until the photo is ready. */
  src?: string;
  /** Larger tile on desktop. */
  feature?: boolean;
};

export const afterStay = {
  title: "After del Matri",
  subtitle: "La celebración no termina el domingo ✨",
  intro: [
    "Nosotros nos quedaremos unos días más en Colombia después del matrimonio y estaremos hospedados en Hotel Del Mar, en El Rodadero, desde el domingo 21 hasta el jueves 25 de marzo.",
    "Si también quieres alargar el viaje, descansar unos días y seguir compartiendo con nosotros, acá te dejamos la información del hotel para que puedas sumarte.",
  ],
  hotel: {
    name: "Hotel Del Mar",
    locationLabel: "Ubicación",
    location: "El Rodadero, Santa Marta",
    datesLabel: "Fechas",
    dates: "21 al 25 de marzo de 2027",
    facts: [
      { icon: "in", label: "Check-in: 3:00 pm · Check-out: 1:00 pm" },
      { icon: "price", label: "Desde $300.000 COP / noche" },
      { icon: "breakfast", label: "Desayuno buffet incluido" },
      { icon: "pool", label: "Piscina disponible de 9:00 am a 7:30 pm" },
    ] satisfies AfterFact[],
  },
  priceNote:
    "Las tarifas informadas son referenciales y pueden cambiar según disponibilidad. Recomendamos comparar el precio vigente directamente por WhatsApp, Booking o la web del hotel antes de reservar.",
  reservation: {
    whatsapp: {
      label: "Reservar por WhatsApp",
      phone: "+57 322 5693210",
      message:
        "Hola, venimos por el matrimonio de Maru y Fer y nos gustaría consultar disponibilidad para hospedarnos en Hotel Del Mar del 21 al 25 de marzo de 2027. Somos [número de personas] y nos interesa una habitación [Queen / Twin / Family]. ¿Nos podrían indicar la tarifa disponible y cómo hacer la reserva? ¡Gracias!",
    },
    booking: {
      label: "Ver disponibilidad en Booking",
      url: "https://www.booking.com/hotel/co/del-mar.html?ssne=Santa+Marta&ssne_untouched=Santa+Marta&highlighted_hotels=1296137&ss=Santa+Marta&dest_id=5000&dest_type=district&hp_avform=1&origin=hp&do_availability_check=1&label=postbooking_confemail&sid=00209268ab14bc92f180d8532eb95522&aid=2311236&lang=es&sb=1&src_elem=sb&src=hotel&checkin=2027-03-21&checkout=2027-03-25&group_adults=2&no_rooms=1&group_children=0#availability_target",
    },
    website: {
      label: "Reservar en la web",
      url: "https://www.delmarhotel.co/",
    },
  },
  galleryPending: "Foto próximamente",
  gallery: [
    {
      id: "piscina",
      label: "Piscina",
      alt: "Piscina de Hotel Del Mar al atardecer",
      src: "/images/after/piscina.png",
      feature: true,
    },
    {
      id: "fachada",
      label: "Fachada / lobby",
      alt: "Fachada de Hotel Del Mar en El Rodadero",
      src: "/images/after/fachada.png",
    },
    {
      id: "desayuno",
      label: "Desayuno",
      alt: "Desayuno buffet de Hotel Del Mar",
      src: "/images/after/desayuno.png",
    },
    {
      id: "piscina-terraza",
      label: "Piscina",
      alt: "Terraza y piscina de Hotel Del Mar",
      src: "/images/after/piscina-terraza.jpg",
    },
    {
      id: "queen",
      label: "Habitación Queen",
      alt: "Habitación Queen de Hotel Del Mar",
    },
    {
      id: "twin",
      label: "Habitación Twin",
      alt: "Habitación Twin de Hotel Del Mar",
    },
    {
      id: "family",
      label: "Habitación Family",
      alt: "Habitación Family de Hotel Del Mar",
    },
    {
      id: "rodadero",
      label: "El Rodadero",
      alt: "El Rodadero, Santa Marta",
    },
  ] satisfies AfterGalleryItem[],
};

export function afterWhatsAppHref(): string {
  const digits = afterStay.reservation.whatsapp.phone.replace(/\D/g, "");
  const text = encodeURIComponent(afterStay.reservation.whatsapp.message);
  return `https://wa.me/${digits}?text=${text}`;
}
