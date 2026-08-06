import { fetchStats } from "../repositories/statsRepository";

export async function getStats() {
  return await fetchStats();
}