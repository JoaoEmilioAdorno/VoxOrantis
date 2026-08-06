import "./styles/globals.css";
import useStats from "./hooks/useStats";

function App() {
  const { stats, loading, error } = useStats();

  if (loading) {
    return <h2>Carregando estatísticas...</h2>;
  }

  if (error) {
    return <h2>Erro ao carregar dados.</h2>;
  }

  return (
    <main>
      <h1>Vox Orantis</h1>

      <p>Total de Ave-Marias: {stats?.total_prayers}</p>

      <p>Hoje: {stats?.today_prayers}</p>
    </main>
  );
}

export default App;