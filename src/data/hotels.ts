export type Hotel = {
  id: string;
  name: string;
  /** Gallery photos (Booking / official site). First is the cover. */
  images: string[];
  /** Local gallery fallback if a remote photo fails. */
  imageFallback: string;
  lat: number;
  lng: number;
  distanceEs?: string;
  distanceEn?: string;
  blurbEs: string;
  blurbEn: string;
  badgeEs?: string;
  badgeEn?: string;
  noteEs?: string;
  noteEn?: string;
  websiteUrl?: string;
  /** Booking.com hotel page (dates added via bookingSearchUrl). */
  bookingUrl?: string;
  featured?: boolean;
  capacityNoteEs?: string;
  capacityNoteEn?: string;
};

export const STAY_CHECKIN = "2027-03-19";
export const STAY_CHECKOUT = "2027-03-21";

/** Booking search always locked to wedding weekend dates. */
export function bookingSearchUrl(base: string): string {
  const url = new URL(base);
  url.searchParams.set("checkin", STAY_CHECKIN);
  url.searchParams.set("checkout", STAY_CHECKOUT);
  url.searchParams.set("group_adults", "2");
  url.searchParams.set("no_rooms", "1");
  return url.toString();
}

export function mapsEmbedUrl(lat: number, lng: number, zoom = 14, lang: "es" | "en" = "es"): string {
  const q = `${lat},${lng}`;
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=${zoom}&hl=${lang}&output=embed`;
}

export function mapsOpenUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}&z=15`;
}

/** Lodging near Bohemia — Save the Date names + official Booking/web links. */
export const hotels: Hotel[] = [
  {
    id: "bohemia",
    name: "Bohemia Beach",
    images: [
      "https://cf.bstatic.com/xdata/images/hotel/max1024x768/525225604.jpg?k=cb87b800bb38d36923791fa63768442aed97c6f012baa8fd007b99294e469882&o=",
      "https://cf.bstatic.com/xdata/images/hotel/max1024x768/533069226.jpg?k=5b3a8144789564464fdc49258f9904907d2640230da684950ed3695f1a401d9c&o=",
      "https://cf.bstatic.com/xdata/images/hotel/max1024x768/248220678.jpg?k=1335d12b3b7308f1f324c158e9a2ce173ad12b031bb25a8974ae01731d07a743&o=",
      "https://cf.bstatic.com/xdata/images/hotel/max1024x768/525224608.jpg?k=0d23dcccbc841a5a60f33bc801d2ac9e8c69f295dfdc8cf4d419ad90e0617282&o=",
      "https://cf.bstatic.com/xdata/images/hotel/max1024x768/525224603.jpg?k=23242f57081ccec046517f599c56efb8870b86266de84f8a59be6243d935dfb1&o=",
    ],
    imageFallback: "/images/gallery/bohemiaentrada.jpg",
    lat: 11.2696307,
    lng: -73.8392084,
    distanceEs: "Aquí pasa todo",
    distanceEn: "Everything happens here",
    blurbEs:
      "Nuestro venue y el corazón del fin de semana. Ideal para quienes quieren quedarse literalmente a unos pasos de la playa, la bienvenida, la ceremonia y la fiesta.",
    blurbEn:
      "Our venue and the heart of the weekend. Ideal if you want to stay steps from the beach, welcome dinner, ceremony and party.",
    badgeEs: "VENUE · CUPOS LIMITADOS",
    badgeEn: "VENUE · LIMITED SPOTS",
    capacityNoteEs: "Capacidad máxima: 50 huéspedes.",
    capacityNoteEn: "Maximum capacity: 50 guests.",
    noteEs: "Las reservas en Bohemia se coordinan directamente con Maru & Fer.",
    noteEn: "Bohemia stays are coordinated directly with Maru & Fer.",
    websiteUrl: "https://www.bohemiabeach.co/es/",
    bookingUrl: "https://www.booking.com/hotel/co/bohemia-beach.html",
    featured: true,
  },
  {
    id: "gaelia",
    name: "Gaelia",
    images: [
      "/images/gallery/camping.jpg",
      "/images/gallery/playa.JPG",
      "/images/gallery/kayak.jpg",
      "/images/gallery/playacinto.webp",
    ],
    imageFallback: "/images/gallery/camping.jpg",
    lat: 11.2708,
    lng: -73.8405,
    distanceEs: "Al lado de Bohemia · Mendihuaca",
    distanceEn: "Next to Bohemia · Mendihuaca",
    blurbEs: "Hotel frente al mar en Mendihuaca, a pasos de la playa y muy cerca del venue.",
    blurbEn: "Beachfront hotel in Mendihuaca, steps from the sand and very close to the venue.",
    websiteUrl: "https://gaeliabeach.com/",
    bookingUrl: "https://www.booking.com/hotel/co/gaelia.html",
  },
  {
    id: "blue-mango",
    name: "Blue Mango Beach Hotel",
    images: [
      "https://cf.bstatic.com/xdata/images/hotel/max1024x768/626808328.jpg?k=943d34ed3e00e1695bf4ecab58c12c9d5efbcfbfadc99a564ce48cddbbb93c00&o=",
      "https://cf.bstatic.com/xdata/images/hotel/max1024x768/575518102.jpg?k=43a17a75e99f72cef83e36016eb0e477e5bdb6c87b230688551aba4a8f7a0ca1&o=",
      "https://cf.bstatic.com/xdata/images/hotel/max1024x768/573036335.jpg?k=80225e52afb8d67825aaeda2f825c01d6ac156e466f73b5fc8f2be6219121d81&o=",
      "https://cf.bstatic.com/xdata/images/hotel/max1024x768/536330325.jpg?k=4d9d55afa5248026cf85601e820ecf90ac9919c5192d8667b24bfca90b3e6724&o=",
      "https://cf.bstatic.com/xdata/images/hotel/max1024x768/626810312.jpg?k=116bc1890a810fe1442142079da1c3f9e92aee9a79f57bca7adcd5616dab38fc&o=",
    ],
    imageFallback: "/images/gallery/piscinab.jpg",
    lat: 11.2712,
    lng: -73.8378,
    distanceEs: "Zona Costeño Beach · Guachaca",
    distanceEn: "Costeño Beach area · Guachaca",
    blurbEs: "Hotel de playa con piscina frente al Caribe, en la misma zona de Guachaca.",
    blurbEn: "Beach hotel with a pool facing the Caribbean, in the Guachaca area.",
    websiteUrl: "https://bluemangocolombia.com/",
    bookingUrl: "https://www.booking.com/hotel/co/blue-mango-beach.html",
  },
  {
    id: "iwana",
    name: "Iwana",
    images: [
      "https://casaiwana.com/wp-content/uploads/2025/08/DSC0953-scaled.jpg",
      "/images/gallery/abrazo.jpg",
      "/images/gallery/playa.JPG",
      "/images/gallery/panoramica.jpg",
    ],
    imageFallback: "/images/gallery/abrazo.jpg",
    lat: 11.2684,
    lng: -73.8412,
    distanceEs: "Primera línea de playa · zona Guachaca",
    distanceEn: "Beachfront · Guachaca area",
    blurbEs: "Refugio boutique frente al mar, con suites íntimas y ambiente tranquilo.",
    blurbEn: "Boutique beachfront retreat with intimate suites and a quiet atmosphere.",
    websiteUrl: "https://casaiwana.com/",
    bookingUrl: "https://www.booking.com/hotel/co/casa-iwana-tayrona-suites-deluxe-playa-y-ac.html",
  },
  {
    id: "cayena",
    name: "Cayena by Masaya Collection",
    images: [
      "https://www.masaya-experience.com/wp-content/uploads/2025/02/Drone_Cayena.jpg",
      "https://cf.bstatic.com/xdata/images/hotel/max1024x768/632617901.jpg?k=1f4c21217a7b4760c6b6664e1909e80669cca9765dd92809319cc51c71ddf30c&o=",
      "https://cf.bstatic.com/xdata/images/hotel/max1024x768/608363396.jpg?k=9a882b28ccd2276070aaacdcc38106068a30526ddf675b85f80bd87c25c75c4a&o=",
      "/images/gallery/desierto.jpg",
    ],
    imageFallback: "/images/gallery/desierto.jpg",
    lat: 11.2741,
    lng: -73.8288,
    distanceEs: "Guachaca · cerca del Tayrona",
    distanceEn: "Guachaca · near Tayrona",
    blurbEs: "Boutique hotel de la colección Masaya, pensado para descanso y bienestar.",
    blurbEn: "Masaya Collection boutique hotel, geared toward rest and wellness.",
    websiteUrl: "https://www.masaya-experience.com/en/collection/tayrona/",
    bookingUrl: "https://www.booking.com/hotel/co/cayena-by-masaya-collection.html",
  },
];
