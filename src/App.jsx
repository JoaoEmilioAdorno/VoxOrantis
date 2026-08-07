import "./styles/globals.css";

import WorldGlobe from "./components/globe/WorldGlobe";
import PrayerForm from "./components/prayer/PrayerForm";

import useStats from "./hooks/useStats";
import usePrayerMap from "./hooks/usePrayerMap";

function App() {
  const { stats, loading } = useStats();
  const { points } = usePrayerMap();

  return (
    <main>
      <h1>Vox Orantis</h1>

      <WorldGlobe points={points} />

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