export type Lang = "es" | "en";

export type Guest = {
  id: string;
  displayName: string;
  fullName: string;
  email: string;
  guestLimit: number;
  hasChildren?: boolean;
  childrenLimit?: number;
};

export type MenuChoice = "fish" | "meat" | "none";

export type FoodMain = "meat" | "fish" | "both" | "none" | "kids";
export type FoodSide = "pasta" | "rice" | "both" | "none";
export type DietaryNeed = "none" | "vegetarian" | "vegan" | "glutenFree" | "dairyFree" | "other";

export type RsvpPerson = {
  name: string;
  attendeeType: "primary" | "guest";
  events: {
    welcomeDinner: boolean;
    weddingDay: boolean;
  };
  transportation: {
    outbound: boolean;
    return: boolean;
  };
  food: {
    mainPreference: FoodMain | null;
    sidePreference: FoodSide | null;
    dietaryRequirements: DietaryNeed[];
    dietaryOther: string;
  };
  /** Song or note for this guest. */
  note?: string;
  /** @deprecated kept for older local records */
  menu?: MenuChoice;
};

export type RsvpChild = {
  name: string;
  age: number | null;
  allergiesOrSpecialMeal: string;
};

export type RsvpRecord = {
  id: string;
  guestId: string;
  displayName: string;
  attending: boolean;
  people: RsvpPerson[];
  children: RsvpChild[];
  danceSong: string;
  message: string;
  createdAt: string;
};

export type GiftId = string;

export type Gift = {
  id: GiftId;
  emoji: string;
  image?: string;
  /** CSS object-position for the gift card photo */
  imagePosition?: string;
  titleEs: string;
  titleEn: string;
  descEs: string;
  descEn: string;
  targetUsd: number | null;
  thanksEs: string;
  thanksEn: string;
  sortOrder: number;
};

export type PaymentMethod = "clp" | "cad" | "zelle" | "wise" | "eur";
export type Currency = "USD" | "CLP" | "CAD" | "EUR";
export type ContributionStatus = "pending" | "confirmed" | "cancelled";

export type Contribution = {
  id: string;
  giftId: GiftId;
  guestId?: string;
  name: string;
  email: string;
  amountOriginal: number;
  currencyOriginal: Currency;
  fxRateUsed: number;
  amountUsdNormalized: number;
  method: PaymentMethod;
  dedication: string;
  anonymous: boolean;
  status: ContributionStatus;
  createdAt: string;
  confirmedAt?: string;
};

export type GiftPublic = Gift & {
  confirmedUsd: number;
  status: "active" | "funded" | "hidden";
};

export type PaymentSettings = {
  clpName: string;
  clpRut: string;
  clpBank: string;
  clpAccountType: string;
  clpAccountNumber: string;
  clpEmail: string;
  interacName: string;
  interacEmail: string;
  interacAutodeposit: boolean;
  zelleName: string;
  zelleContact: string;
  wiseEmail: string;
  wiseQr: string;
  usdToClp: number;
  usdToCad: number;
  usdToEur: number;
};

export type TourPaymentStatus = "Pendiente" | "Pagado";

export type TourReservation = {
  id: string;
  guestName: string;
  email: string;
  tourId: string;
  tourName: string;
  tourDate: string;
  quantity: number;
  childrenCount: number;
  pricePerPerson: number;
  totalAmount: number;
  registrationDate: string;
  paymentStatus: TourPaymentStatus;
  paymentLink: string;
};

export type FlightLeg = {
  booked: boolean | null;
  date: string;
  time: string;
  from: string;
  to: string;
  /** Airline flight number. Used for the leg into Santa Marta. */
  number: string;
};

export type StayPlan = {
  reserved: boolean | null;
  place: string;
  other: string;
  checkIn: string;
  checkInTime: string;
  checkOut: string;
  checkOutTime: string;
};

export type ExtraDay = {
  yes: boolean | null;
  date: string;
};

export type GuestPlans = {
  arrival: FlightLeg;
  departure: FlightLeg;
  stay: StayPlan;
  before: ExtraDay;
  after: ExtraDay;
};

export type ClubMessage = {
  id: string;
  guestId: string;
  displayName: string;
  email?: string;
  message: string;
  createdAt: string;
};
