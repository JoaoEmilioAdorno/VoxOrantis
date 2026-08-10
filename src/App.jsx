import { useState } from "react";

import "./styles/globals.css";

import WorldGlobe from "./components/globe/WorldGlobe";
import PrayerForm from "./components/prayer/PrayerForm";

import {
  AboutIcon,
  PrayerIcon,
  MiracleIcon,
  OtherPrayersIcon,
} from "./components/common/MenuIcons";

import useStats from "./hooks/useStats";
import usePrayerMap from "./hooks/usePrayerMap";

function App() {
  const { stats, loading: statsLoading } = useStats();
  const { points } = usePrayerMap();

  const [activePanel, setActivePanel] = useState(null);

  const menuItems = [
    {
      id: "about",
      icon: AboutIcon,
      label: "Quem somos",
      available: true,
    },
    {
      id: "prayer-chapel",
      icon: PrayerIcon,
      label: "Capela de Orações",
      available: false,
    },
    {
      id: "miracles",
      icon: MiracleIcon,
      label: "Capela de Milagres",
      available: false,
    },
    {
      id: "other-prayers",
      icon: OtherPrayersIcon,
      label: "Outras Orações",
      available: false,
    },
  ];

  function handleMenuClick(item) {
    setActivePanel(item.id);
  }

  function closePanel() {
    setActivePanel(null);
  }

  function renderPanelContent() {
    switch (activePanel) {
      case "about":
        return (
          <>
            <h2>Quem somos</h2>

            <p>
              O Vox Orantis nasceu com uma proposta simples:
              unir pessoas do mundo inteiro em oração.
            </p>

            <p>
              Cada luz que surge no globo representa uma oração
              oferecida em algum lugar do mundo.
            </p>

            <p>
              Aqui não existem fronteiras, diferenças ou
              classificações entre as pessoas. Existe apenas
              a oração que nos une.
            </p>

            <p>
              O Vox Orantis começa com a Ave Maria e continuará
              crescendo com novas capelas, testemunhos e outras
              formas de oração.
            </p>

            <p className="panel-highlight">
              Unindo o mundo em oração.
            </p>
          </>
        );

      case "prayer-chapel":
        return (
          <>
            <h2>Capela de Orações</h2>

            <p>
              Em breve você poderá deixar aqui suas intenções
              de oração para que outras pessoas se unam a elas
              em oração.
            </p>

            <p className="coming-soon">
              Em breve
            </p>
          </>
        );

      case "miracles":
        return (
          <>
            <h2>Capela de Milagres</h2>

            <p>
              Um espaço para compartilhar graças alcançadas
              e testemunhos de fé.
            </p>

            <p className="coming-soon">
              Em breve
            </p>
          </>
        );

      case "other-prayers":
        return (
          <>
            <h2>Outras Orações</h2>

            <p>
              O Vox Orantis continuará crescendo com novas
              orações e páginas dedicadas a diferentes devoções.
            </p>

            <p>
              Todas elas continuarão fazendo parte do mesmo
              propósito: unir o mundo através da oração.
            </p>

            <p className="coming-soon">
              Em breve
            </p>
          </>
        );

      default:
        return null;
    }
  }

  return (
    <div className="app">

      <aside className="side-menu">
        <div className="side-menu-logo">
          VO
        </div>

        <nav
          className="side-menu-nav"
          aria-label="Navegação principal"
        >
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                className={`side-menu-item ${
                  activePanel === item.id ? "active" : ""
                }`}
                onClick={() => handleMenuClick(item)}
                title={item.label}
                aria-label={item.label}
              >
                <span className="side-menu-icon">
                  <Icon />
                </span>

                <span className="side-menu-label">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </aside>


      <div className="app-content">

        <header className="app-header">
          <h1>Vox Orantis</h1>

          <p className="app-slogan">
            Unindo o mundo em oração
          </p>
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
                  <p>
                    <strong>
                      {stats?.total_prayers ?? 0}
                    </strong>{" "}
                    orações unindo o mundo
                  </p>

                  <p>
                    <strong>
                      {stats?.today_prayers ?? 0}
                    </strong>{" "}
                    oferecidas hoje
                  </p>
                </>
              )}
            </div>

          </section>

        </main>

      </div>


      {activePanel && (
        <div className="info-panel">

          <button
            type="button"
            className="info-panel-close"
            onClick={closePanel}
            aria-label="Fechar"
          >
            ×
          </button>

          <div className="info-panel-content">
            {renderPanelContent()}
          </div>

        </div>
      )}

    </div>
  );
}

export default App;