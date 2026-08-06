import "./styles/globals.css";

import PrayerForm from "./components/prayer/PrayerForm";
import useStats from "./hooks/useStats";

function App() {
  const { stats, loading } = useStats();

  return (
    <main>
      <h1>Vox Orantis</h1>

      <PrayerForm />

      <hr />

      {loading ? (
        <p>Carregando estatísticas...</p>
      ) : (
        <>
          <p>Total: {stats?.total_prayers}</p>
          <p>Hoje: {stats?.today_prayers}</p>
        </>
      )}
    </main>
  );
}

export default App;