export default function PrayerButton({ loading, onClick }) {
  return (
    <button onClick={onClick} disabled={loading}>
      {loading ? "Enviando..." : "Oferecer Ave Maria"}
    </button>
  );
}