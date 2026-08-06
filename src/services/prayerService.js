// src/services/prayerService.js
import {
  fetchActivePrayers,
  createPrayer,
} from "../repositories/prayerRepository";

export async function getActivePrayers() {
  return await fetchActivePrayers();
}

export async function savePrayer(prayer) {
  return await createPrayer(prayer);
}