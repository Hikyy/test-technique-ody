import type { NotificationSettings, OpeningHours } from "../schema.js";

export const SEED_OPENING_HOURS: OpeningHours = {
  mon: [
    { open: "12:00", close: "14:30" },
    { open: "19:00", close: "22:30" },
  ],
  tue: [
    { open: "12:00", close: "14:30" },
    { open: "19:00", close: "22:30" },
  ],
  wed: [
    { open: "12:00", close: "14:30" },
    { open: "19:00", close: "22:30" },
  ],
  thu: [
    { open: "12:00", close: "14:30" },
    { open: "19:00", close: "23:00" },
  ],
  fri: [
    { open: "12:00", close: "14:30" },
    { open: "19:00", close: "23:00" },
  ],
  sat: [{ open: "19:00", close: "23:00" }],
  sun: [{ open: "00:00", close: "00:00", closed: true }],
};

export const SEED_OPENING_HOURS_CANONICAL = {
  monday: { openAt: "12:00", closeAt: "22:30" },
  tuesday: { openAt: "12:00", closeAt: "22:30" },
  wednesday: { openAt: "12:00", closeAt: "22:30" },
  thursday: { openAt: "12:00", closeAt: "23:00" },
  friday: { openAt: "12:00", closeAt: "23:00" },
  saturday: { openAt: "19:00", closeAt: "23:00" },
  sunday: null,
} as const;

export const SEED_NOTIFICATIONS: NotificationSettings = {
  newOrders: true,
  cancellations: true,
  dailyReport: false,
};

export const SEED_RESTAURANT = {
  id: "default",
  name: "Sève",
  address: "14 rue Cambon, 75001 Paris",
  phone: "01 42 60 18 22",
  currency: "EUR",
} as const;
