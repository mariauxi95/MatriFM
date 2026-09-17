import type { DietaryNeed, FoodMain, FoodSide, RsvpChild, RsvpPerson } from "../../types";

export function emptyPerson(attendeeType: RsvpPerson["attendeeType"] = "guest"): RsvpPerson {
  return {
    name: "",
    attendeeType,
    events: { welcomeDinner: false, weddingDay: false },
    transportation: { outbound: false, return: false },
    food: {
      mainPreference: "none",
      sidePreference: "none",
      dietaryRequirements: [],
      dietaryOther: "",
    },
  };
}

export function emptyChild(): RsvpChild {
  return { name: "", age: null, allergiesOrSpecialMeal: "" };
}

export type TransportChoice = "there" | "back" | "both" | "none";

export function transportFromChoice(choice: TransportChoice): RsvpPerson["transportation"] {
  return {
    outbound: choice === "there" || choice === "both",
    return: choice === "back" || choice === "both",
  };
}

export function choiceFromTransport(t: RsvpPerson["transportation"]): TransportChoice {
  if (t.outbound && t.return) return "both";
  if (t.outbound) return "there";
  if (t.return) return "back";
  return "none";
}

export function toggleDietary(list: DietaryNeed[], item: DietaryNeed): DietaryNeed[] {
  if (item === "none") {
    return list.includes("none") ? [] : ["none"];
  }
  const withoutNone = list.filter((x) => x !== "none");
  return withoutNone.includes(item) ? withoutNone.filter((x) => x !== item) : [...withoutNone, item];
}

export type MainPref = FoodMain;
export type SidePref = FoodSide;
