import "./styles/globals.css";

import WorldGlobe from "./components/globe/WorldGlobe";
import PrayerForm from "./components/prayer/PrayerForm";

import useStats from "./hooks/useStats";
import usePrayerMap from "./hooks/usePrayerMap";

function App() {
  const { stats, loading: statsLoading } = useStats();
  const { points } = usePrayerMap();

  return (
    <div className="app">
      <header className="app-header">
        <h1>Vox Orantis</h1>

        {/*
          Espaço reservado para o menu futuro.
          Não implementaremos a navegação neste commit.
        */}
      </header>

      <main className="app-main">
        <section className="globe-section">
          <div className="globe-layer">
            <WorldGlobe points={points} />
          </div>

          <div className="prayer-layer">
            <PrayerForm />
          </div>

          <div className="stats-layer">
            {statsLoading ? (
              <p>Carregando estatísticas...</p>
            ) : (
              <>
                <p>Total: {stats?.total_prayers ?? 0}</p>
                <p>Hoje: {stats?.today_prayers ?? 0}</p>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;