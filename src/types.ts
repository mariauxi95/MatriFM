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
    mainPreference: FoodMain;
    sidePreference: FoodSide;
    dietaryRequirements: DietaryNeed[];
    dietaryOther: string;
  };
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
  titleEs: string;
  titleEn: string;
  descEs: string;
  descEn: string;
  targetUsd: number | null;
  thanksEs: string;
  thanksEn: string;
  sortOrder: number;
};

export type PaymentMethod = "clp" | "cad" | "zelle" | "wise";
export type Currency = "USD" | "CLP" | "CAD";
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
  wiseLink: string;
  wiseEmail: string;
  wiseQr: string;
  usdToClp: number;
  usdToCad: number;
};

export type ClubMessage = {
  id: string;
  guestId: string;
  displayName: string;
  email?: string;
  message: string;
  createdAt: string;
};
