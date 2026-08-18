import {
  useEffect,
  useRef,
  useState,
} from "react";

import PrayerChapel from "./components/chapel/PrayerChapel";
import PrayerCrawl from "./components/prayer/PrayerCrawl";

import "./styles/globals.css";

import WorldGlobe from "./components/globe/WorldGlobe";
import PrayerForm from "./components/prayer/PrayerForm";
import AudioControls from "./components/common/AudioControls";

import ModeratorLogin from "./components/moderation/ModeratorLogin";
import ModerationPanel from "./components/moderation/ModerationPanel";

import { supabase } from "./lib/supabase";

import {
  AboutIcon,
  PrayerIcon,
  MiracleIcon,
  OtherPrayersIcon,
} from "./components/common/MenuIcons";

import useStats from "./hooks/useStats";
import usePrayerMap from "./hooks/usePrayerMap";


/* =========================================================
   APLICAÇÃO DE MODERAÇÃO
========================================================= */

function ModerationApp() {
  const [moderatorSession, setModeratorSession] =
    useState(null);

  const [authLoading, setAuthLoading] =
    useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (mounted) {
        setModeratorSession(session);
        setAuthLoading(false);
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (mounted) {
          setModeratorSession(session);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  function handleModeratorLogin(session) {
    setModeratorSession(session);
  }

  async function handleModeratorLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error(
        "Erro ao sair da moderação:",
        error
      );

      return;
    }

    setModeratorSession(null);
  }

  if (authLoading) {
    return (
      <div className="moderation-page">
        <p>Verificando sessão...</p>
      </div>
    );
  }

  return (
    <div className="moderation-page">

      <header className="moderation-header">

        <div>
          <h1>Vox Orantis</h1>

          <p>
            Moderação da Capela de Orações
          </p>
        </div>

        {moderatorSession && (
          <button
            type="button"
            onClick={handleModeratorLogout}
          >
            Sair
          </button>
        )}

      </header>

      <main className="moderation-main">

        {!moderatorSession ? (
          <ModeratorLogin
            onLogin={handleModeratorLogin}
          />
        ) : (
          <ModerationPanel />
        )}

      </main>

    </div>
  );
}


/* =========================================================
   APLICAÇÃO PÚBLICA
========================================================= */

function PublicApp() {
  const { stats, loading: statsLoading } =
    useStats();

  const { points } =
    usePrayerMap();

  const audioControlsRef =
    useRef(null);

  const [
    prayerCrawlActive,
    setPrayerCrawlActive,
  ] = useState(false);

  const [
    prayerCrawlRunId,
    setPrayerCrawlRunId,
  ] = useState(0);

  const [
    activePanel,
    setActivePanel,
  ] = useState(null);

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

  function handlePrayerStart() {
    setPrayerCrawlRunId(
      (current) => current + 1
    );

    setPrayerCrawlActive(true);

    audioControlsRef.current?.startPrayer();
  }

  function handlePrayerAudioEnd() {
    setPrayerCrawlActive(false);
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
              O Vox Orantis nasceu de um momento simples de
              inspiração e de um desejo: manter o mundo unido
              em oração.
            </p>

            <p>
              Enquanto eu assistia ao podcast Annima, com
              Bertaldo e Kenia, ouvi Bertaldo contar que a
              oração diária do Rosário fazia parte de sua
              rotina. Naquele instante, também senti no
              coração a necessidade de tornar a oração uma
              presença constante em minha vida.
            </p>

            <p>
              Então surgiu uma ideia: e se conseguíssemos
              formar uma corrente de oração durante as
              24 horas do dia, com uma pessoa oferecendo
              o Rosário a cada hora?
            </p>

            <p>
              Logo percebi a dificuldade de reunir e organizar
              essas pessoas. Mas também percebi algo maior:
              não precisávamos estar no mesmo lugar.
              Poderíamos estar espalhados pelo mundo e,
              ainda assim, unidos pela oração.
            </p>

            <p>
              Foi desse pensamento que nasceu o Vox Orantis.
            </p>

            <p>
              Começamos pela Ave Maria. Por ser uma oração
              breve, conhecida e profundamente ligada à
              devoção mariana, qualquer pessoa pode dedicar
              alguns instantes do seu dia e fazer parte
              dessa corrente.
            </p>

            <p>
              Cada luz que aparece no globo representa uma
              dessas orações sendo oferecida em algum lugar
              do mundo. Uma pequena luz individual que,
              junto de tantas outras, pode manter uma
              corrente de oração atravessando países,
              continentes e horas do dia.
            </p>

            <p>
              Este é apenas o primeiro passo. No futuro,
              queremos também criar uma corrente dedicada
              ao Rosário e abrir novos espaços para
              intenções, testemunhos de graças alcançadas
              e outras orações.
            </p>

            <p>
              Nossa esperança é simples: que, enquanto
              houver alguém disposto a rezar em algum lugar
              do mundo, a oração continue acesa.
            </p>

            <div className="donation-message">
              <p>
                Caso sinta no seu coração e possa ajudar
                com os custos de implantação e manutenção
                do Vox Orantis, você pode fazer uma doação
                de qualquer valor pelo Pix:
              </p>

              <p className="panel-highlight">
                xomanoje@gmail.com
              </p>
            </div>

            <p className="panel-highlight">
              Vox Orantis — Unindo o mundo em oração.
            </p>
          </>
        );

      case "prayer-chapel":
        return <PrayerChapel />;

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
              orações e páginas dedicadas a diferentes
              devoções.
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
                  activePanel === item.id
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleMenuClick(item)
                }
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

        <div className="side-menu-audio">
          <AudioControls
            ref={audioControlsRef}
            onPrayerEnd={handlePrayerAudioEnd}
          />
        </div>

      </aside>

      <div
        className="app-content"
        onClick={
          activePanel
            ? closePanel
            : undefined
        }
      >

        <PrayerCrawl
          active={prayerCrawlActive}
          runId={prayerCrawlRunId}
        />

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
              <PrayerForm
                onPrayerStart={handlePrayerStart}
              />
            </div>

            <div className="stats-layer">

              {statsLoading ? (
                <p>
                  Carregando estatísticas...
                </p>
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


/* =========================================================
   SELETOR PRINCIPAL
========================================================= */

function App() {
  const moderationMode =
    window.location.pathname === "/moderation";

  if (moderationMode) {
    return <ModerationApp />;
  }

  return <PublicApp />;
}

export default App;