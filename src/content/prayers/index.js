const prayerModules = import.meta.glob(
  "./*.json",
  {
    eager: true,
    import: "default",
  }
);

const prayers = Object.values(prayerModules)
  .filter((prayer) => prayer.active !== false)
  .sort(
    (a, b) =>
      (a.order ?? 999) - (b.order ?? 999)
  );

export function getPrayers() {
  return prayers;
}

export function getPrayerById(prayerId) {
  return prayers.find(
    (prayer) => prayer.id === prayerId
  );
}