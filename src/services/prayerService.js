// src/services/prayerService.js

import {
  getActivePrayers as repositoryGetActivePrayers,
  createPrayer,
} from "../repositories/prayerRepository";

export async function getActivePrayers() {
  return repositoryGetActivePrayers();
}

export async function savePrayer(prayer) {
  return createPrayer(prayer);
}