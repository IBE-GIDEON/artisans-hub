import type { Category, StaffRole } from "./types";

export const CATEGORIES: Category[] = ["Rice & meals", "Quick bites", "Small chops", "Drinks", "Combos"];

export const CATEGORY_EMOJI: Record<Category, string> = {
  "Rice & meals": "🍛",
  "Quick bites": "🍜",
  "Small chops": "🥟",
  Drinks: "🧃",
  Combos: "🍱",
};

export const TIME_SLOTS = ["As soon as possible", "12:00 – 13:00", "13:00 – 14:00", "17:00 – 18:00", "18:00 – 19:00", "19:00 – 20:00"];

export const ROLE_LABEL: Record<StaffRole, string> = {
  owner: "Owner",
  orders: "Order manager",
  kitchen: "Kitchen",
  finance: "Finance",
  catering: "Catering coordinator",
};

export const PHONE_RE = /^0[789][01]\d{8}$/;
