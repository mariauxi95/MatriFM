import type { DietaryNeed, FoodMain, FoodSide, RsvpChild, RsvpPerson } from "../../types";

export function emptyPerson(attendeeType: RsvpPerson["attendeeType"] = "guest"): RsvpPerson {
  return {
    name: "",
    attendeeType,
    events: { welcomeDinner: true, weddingDay: true },
    transportation: { outbound: false, return: false },
    food: {
      mainPreference: "both",
      sidePreference: "both",
      dietaryRequirements: ["none"],
      dietaryOther: "",
    },
  };
}

export function emptyChild(): RsvpChild {
  return { name: "", age: null, allergiesOrSpecialMeal: "" };
}

export type EventChoice = "both" | "welcome" | "wedding";

export function eventsFromChoice(choice: EventChoice): RsvpPerson["events"] {
  return {
    welcomeDinner: choice === "both" || choice === "welcome",
    weddingDay: choice === "both" || choice === "wedding",
  };
}

export function choiceFromEvents(events: RsvpPerson["events"]): EventChoice | null {
  if (events.welcomeDinner && events.weddingDay) return "both";
  if (events.welcomeDinner) return "welcome";
  if (events.weddingDay) return "wedding";
  return null;
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
