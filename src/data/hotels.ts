import { assetUrl } from "../lib/assets";
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
  /** Booking.com photo gallery. Opens as-is, without rewriting dates. */
  photosUrl?: string;
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
      "https://cf.bstatic.com/xdata/images/hotel/max2048x1536/812255697.jpg?k=f6f843a566becd9e7f8b24f2f597abafb82c72ffa1ef735991e0a03f3fd065c9&o=",
      "https://cf.bstatic.com/xdata/images/hotel/max1024x768/335963708.jpg?k=68345c723920529eec276e1bbb8e93bc3a3c192452260d80ab6b2ac2a50dfa5f&o=",
      "https://cf.bstatic.com/xdata/images/hotel/max1024x768/908346424.jpg?k=8c4962d0d09f4647aaf061aa35a7c5b1df1cb8dd1f8a2569ec518232c0dddb54&o=",
      "https://cf.bstatic.com/xdata/images/hotel/max1024x768/908342374.jpg?k=e9af5e83b714970203cedd67284fa4b3afbaf6b42fed6d0d62c8485c875104a8&o=",
      "https://cf.bstatic.com/xdata/images/hotel/max1024x768/248220678.jpg?k=1335d12b3b7308f1f324c158e9a2ce173ad12b031bb25a8974ae01731d07a743&o=",
    ],
    imageFallback: assetUrl("/images/gallery/bohemiaentrada.jpg"),
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
    bookingUrl:
      "https://www.booking.com/hotel/co/bohemia-beach.es.html?label=postbooking_confemail&sid=756fa281495f8d69b4a63461ce1c5753&aid=2311236&ucfs=1&arphpl=1&dest_id=3311104&dest_type=hotel&group_children=0&req_adults=1&req_children=0&hpos=1&hapos=1&sr_order=popularity&srpvid=925d702fc2e20038&srepoch=1790783840&soh=1&from=searchresults",
    photosUrl:
      "https://www.booking.com/hotel/co/bohemia-beach.es.html?aid=2311236&label=postbooking_confemail&sid=236cff1f496e0d5703ccd7f3d23e1a12&checkin=2027-03-19&checkout=2027-03-21&dest_id=3311104&dest_type=hotel&dist=0&group_adults=1&group_children=0&hpos=1&no_rooms=1&req_adults=1&req_children=0&room1=A&sb_price_type=total&soh=1&sr_order=popularity&srepoch=1790783840&srpvid=925d702fc2e20038&type=total&ucfs=1&activeTab=photosGallery#no_availability_msg",
    featured: true,
  },
  {
    id: "gaelia",
    name: "Gaelia",
    images: [
      "https://cf.bstatic.com/xdata/images/hotel/max1024x768/495615966.jpg?k=b135ead9650bf4ac8a965dca4aa96a39aeadd7df05990cbe79f2b29967dbb063&o=",
      "https://cf.bstatic.com/xdata/images/hotel/max1024x768/575192450.jpg?k=cbe9a5190466a1c38fc3389823954b1db261b7aacde8427d5177b29b2471dbd4&o=",
      "https://cf.bstatic.com/xdata/images/hotel/max1024x768/575191148.jpg?k=d006201c1c1e5aca526ecc148f52020b2de8cdf63df8880b707bdf29e2d95376&o=",
      "https://cf.bstatic.com/xdata/images/hotel/max1024x768/575193109.jpg?k=af95e0feeb731fee73d4727bde677a033bbe8f41cfff90f5ca9465b72c569282&o=",
      "https://cf.bstatic.com/xdata/images/hotel/max1024x768/575193779.jpg?k=48abacc0ce2d7af3f8b11af134e95b55cf0d674b7ba93357627081dafdf46180&o=",
    ],
    imageFallback: assetUrl("/images/gallery/camping.jpg"),
    lat: 11.2708,
    lng: -73.8405,
    distanceEs: "Al lado de Bohemia · Mendihuaca",
    distanceEn: "Next to Bohemia · Mendihuaca",
    blurbEs: "Hotel frente al mar en Mendihuaca, a pasos de la playa y muy cerca del venue.",
    blurbEn: "Beachfront hotel in Mendihuaca, steps from the sand and very close to the venue.",
    websiteUrl: "https://engine.lobbypms.com/gaelia-beach",
    bookingUrl:
      "https://www.booking.com/hotel/co/gaelia.es.html?label=postbooking_confemail&sid=756fa281495f8d69b4a63461ce1c5753&aid=2311236&ucfs=1&arphpl=1&dest_id=-585440&dest_type=city&group_children=0&req_adults=1&req_children=0&hpos=6&hapos=31&sr_order=popularity&srpvid=992a6e92d4d6109d&srepoch=1790783469&all_sr_blocks=990111701_372874578_2_2_0&highlighted_blocks=990111701_372874578_2_2_0&matching_block_id=990111701_372874578_2_2_0&sr_pri_blocks=990111701_372874578_2_2_0__96000000&from=searchresults",
  },
  {
    id: "blue-mango",
    name: "Blue Mango Beach Hotel",
    images: [
      "https://cf.bstatic.com/xdata/images/hotel/max1024x768/867955838.jpg?k=869fe5901a36a5caff4617e851e28915112a7e77451aaa336370528d783636e4&o=",
      "https://cf.bstatic.com/xdata/images/hotel/max1024x768/889169065.jpg?k=d3ad8a8149472e8ce5f3125905509f5c5a2342b099c542665c9481164a2f4e2a&o=",
      "https://cf.bstatic.com/xdata/images/hotel/max1024x768/890014529.jpg?k=df6e428460ab43b600dd9132bb0c86a82cc5ab400206f7a6872a6a15a4c309c8&o=",
      "https://cf.bstatic.com/xdata/images/hotel/max1024x768/867955962.jpg?k=5bfd49eccc86fa49c0e171811999614ddaaa90d6d1d078f5b3b70726f387bb3f&o=",
      "https://cf.bstatic.com/xdata/images/hotel/max1024x768/867957280.jpg?k=56b7fc76177a00494aa98f05b59a85e749b1a8ccde1f839cbc6e85afb06e816a&o=",
    ],
    imageFallback: assetUrl("/images/gallery/piscinab.jpg"),
    lat: 11.2712,
    lng: -73.8378,
    distanceEs: "Zona Costeño Beach · Guachaca",
    distanceEn: "Costeño Beach area · Guachaca",
    blurbEs: "Hotel de playa con piscina frente al Caribe, en la misma zona de Guachaca.",
    blurbEn: "Beach hotel with a pool facing the Caribbean, in the Guachaca area.",
    websiteUrl: "https://engine.lobbypms.com/agua-sal-restaurante-alojamiento",
    bookingUrl:
      "https://www.booking.com/hotel/co/blue-mango-beach.es.html?aid=2311236&label=postbooking_confemail&sid=236cff1f496e0d5703ccd7f3d23e1a12&all_sr_blocks=432507516_129943673_2_1_0_1449025&dest_id=-585440&dest_type=city&dist=0&group_children=0&hapos=1&highlighted_blocks=432507516_129943673_2_1_0_1449025&hpos=1&matching_block_id=432507516_129943673_2_1_0_1449025&req_adults=1&req_children=0&room1=A&sb_price_type=total&sr_order=popularity&sr_pri_blocks=432507516_129943673_2_1_0_1449025_35640000&srepoch=1790783566&srpvid=992a6e92d4d6109d&type=total&ucfs=1",
  },
  {
    id: "iwana",
    name: "Iwana",
    images: [
      "https://casaiwana.com/wp-content/uploads/2025/08/DSC0953-scaled.jpg",
      assetUrl("/images/gallery/abrazo.jpg"),
      assetUrl("/images/gallery/playa.JPG"),
      assetUrl("/images/gallery/panoramica.jpg"),
    ],
    imageFallback: assetUrl("/images/gallery/abrazo.jpg"),
    lat: 11.2684,
    lng: -73.8412,
    distanceEs: "Primera línea de playa · zona Guachaca",
    distanceEn: "Beachfront · Guachaca area",
    blurbEs: "Refugio boutique frente al mar, con suites íntimas y ambiente tranquilo.",
    blurbEn: "Boutique beachfront retreat with intimate suites and a quiet atmosphere.",
    websiteUrl: "https://reservas.casaiwana.com/casa-iwana",
    bookingUrl:
      "https://www.booking.com/hotel/co/casa-iwana-suites-delux-playa-y-ac.es.html?aid=2311236&label=postbooking_confemail&sid=236cff1f496e0d5703ccd7f3d23e1a12&all_sr_blocks=1475824502_419006319_2_1_0&dest_id=-585440&dest_type=city&dist=0&group_children=0&hapos=2&highlighted_blocks=1475824502_419006319_2_1_0&hpos=2&matching_block_id=1475824502_419006319_2_1_0&req_adults=1&req_children=0&room1=A&sb_price_type=total&sr_order=popularity&sr_pri_blocks=1475824502_419006319_2_1_0__184786648&srepoch=1790783395&srpvid=992a6e92d4d6109d&type=total&ucfs=1",
  },
  {
    id: "cayena",
    name: "Cayena by Masaya Collection",
    images: [
      "https://www.masaya-experience.com/wp-content/uploads/2025/02/Drone_Cayena.jpg",
      "https://cf.bstatic.com/xdata/images/hotel/max1024x768/632617901.jpg?k=1f4c21217a7b4760c6b6664e1909e80669cca9765dd92809319cc51c71ddf30c&o=",
      "https://cf.bstatic.com/xdata/images/hotel/max1024x768/608363396.jpg?k=9a882b28ccd2276070aaacdcc38106068a30526ddf675b85f80bd87c25c75c4a&o=",
      assetUrl("/images/gallery/desierto.jpg"),
    ],
    imageFallback: assetUrl("/images/gallery/desierto.jpg"),
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
