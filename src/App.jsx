import {
  useEffect,
  useRef,
  useState,
} from "react";

import PrayerChapel from "./components/Chapel/PrayerChapel";
import PrayerLibrary from "./components/prayers/PrayerLibrary";
import PrayerCrawl from "./components/prayer/PrayerCrawl";

import MiracleChapel from "./components/Chapel/MiracleChapel";

import "./styles/globals.css";

import WorldGlobe from "./components/globe/WorldGlobe";
import PrayerForm from "./components/prayer/PrayerForm";
import AudioControls from "./components/common/AudioControls";
import InstallApp from "./components/common/InstallApp";

import ModeratorLogin from "./components/moderation/ModeratorLogin";
import ModerationPanel from "./components/moderation/ModerationPanel";

import { supabase } from "./lib/supabase";
import { canAccessModeration } from "./services/authService";

import {
  AboutIcon,
  PrayerIcon,
  MiracleIcon,
  OtherPrayersIcon,
  ModerationIcon,
  ShopIcon,
} from "./components/common/MenuIcons";
import { config } from "./lib/config";

import useStats from "./hooks/useStats";
import usePrayerMap from "./hooks/usePrayerMap";


/* =========================================================
   APLICAÇÃO DE MODERAÇÃO
========================================================= */
function ModerationApp() {
  const [moderatorSession, setModeratorSession] =
    useState(null);

  const [moderatorAuthorized, setModeratorAuthorized] =
    useState(false);

  const [authorizationError, setAuthorizationError] =
    useState("");

  const [authLoading, setAuthLoading] =
    useState(true);

  useEffect(() => {
    let mounted = true;

    async function resolveSession(session) {
      if (!session) {
        if (mounted) {
          setModeratorSession(null);
          setModeratorAuthorized(false);
          setAuthorizationError("");
          setAuthLoading(false);
        }

        return;
      }

      try {
        const authorized = await canAccessModeration(
          session.user.id
        );

        if (mounted) {
          setModeratorSession(session);
          setModeratorAuthorized(authorized);
          setAuthorizationError(
            authorized
              ? ""
              : "Sua conta não possui permissão de moderação."
          );
        }
      } catch (error) {
        console.error(
          "Erro ao verificar permissão de moderação:",
          error
        );

        if (mounted) {
          setModeratorSession(session);
          setModeratorAuthorized(false);
          setAuthorizationError(
            "Não foi possível verificar sua permissão. Tente novamente."
          );
        }
      } finally {
        if (mounted) {
          setAuthLoading(false);
        }
      }
    }

    async function loadSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      await resolveSession(session);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setAuthLoading(true);
        void resolveSession(session);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  function handleModeratorLogin() {
    setAuthLoading(true);
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
    setModeratorAuthorized(false);
    setAuthorizationError("");
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
      <button
        type="button"
        className="moderation-back-link"
        onClick={() => {
          window.location.href = "/";
        }}
      >
        <span aria-hidden="true">←</span>
        Voltar ao Vox Orantis
      </button>

      <header className="moderation-header">
        <div>
          <h1>Vox Orantis</h1>

          <p>
            Moderação das Capelas
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
        ) : moderatorAuthorized ? (
          <ModerationPanel />
        ) : (
          <div className="moderator-login-wrapper">
            <div className="moderator-login-card">
              <div className="moderator-login-heading">
                <h2>Acesso não autorizado</h2>
                <p>{authorizationError}</p>
              </div>

              <button
                type="button"
                className="moderator-login-button"
                onClick={handleModeratorLogout}
              >
                Entrar com outra conta
              </button>
            </div>
          </div>
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
  const crawlTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (crawlTimerRef.current) {
        window.clearTimeout(crawlTimerRef.current);
      }
    };
  }, []);

  const [
    prayerCrawlActive,
    setPrayerCrawlActive,
  ] = useState(false);

  const [
    prayerCrawlRunId,
    setPrayerCrawlRunId,
  ] = useState(0);

  const [
    activePrayer,
    setActivePrayer,
  ] = useState(null);

  const [
    activePanel,
    setActivePanel,
  ] = useState(null);

  const [pixCopied, setPixCopied] =
    useState(false);

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
    ...(config.shopUrl
      ? [{
          id: "shop",
          icon: ShopIcon,
          label: "Loja",
          href: config.shopUrl,
        }]
      : []),
    {
      id: "moderation",
      icon: ModerationIcon,
      label: "Moderação",
      available: true,
    },
  ];

  function handleMenuClick(item) {
  if (item.id === "moderation") {
    window.location.href = "/moderation";
    return;
  }

  setActivePanel(item.id);
}

  function handlePrayerStart(prayer = null) {
    audioControlsRef.current?.stopPrayer();
    if (crawlTimerRef.current) {
      window.clearTimeout(crawlTimerRef.current);
      crawlTimerRef.current = null;
    }

    setPrayerCrawlRunId(
      (current) => current + 1
    );

    setActivePrayer(prayer);
    setPrayerCrawlActive(true);

    if (prayer?.audio) {
      audioControlsRef.current?.startPrayer({
        audio: prayer.audio,
        title: prayer.title,
      });

      return;
    }

    if (prayer) {
      crawlTimerRef.current = window.setTimeout(() => {
        setPrayerCrawlActive(false);
        setActivePrayer(null);
        crawlTimerRef.current = null;
      }, 40000);

      return;
    }

    audioControlsRef.current?.startPrayer();
  }

  function handleLibraryPrayerStart(prayer) {
    if (!prayer?.keepDevotionOpen) {
      closePanel();
    }
    handlePrayerStart(prayer);
  }

  function handlePrayerAudioEnd() {
    if (crawlTimerRef.current) {
      window.clearTimeout(crawlTimerRef.current);
      crawlTimerRef.current = null;
    }

    setPrayerCrawlActive(false);
    setActivePrayer(null);
  }

  function closePanel() {
    setActivePanel(null);
  }

  async function handleCopyPix() {
    try {
      await navigator.clipboard.writeText(
        "xomanoje@gmail.com"
      );
      setPixCopied(true);

      window.setTimeout(() => {
        setPixCopied(false);
      }, 2500);
    } catch {
      setPixCopied(false);
    }
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
              <span className="donation-kicker">
                Faça parte desta corrente
              </span>

              <h3>Adote esta missão</h3>

              <p>
                Sua contribuição ajuda a manter o Vox Orantis
                no ar e a levar esta corrente de oração cada
                vez mais longe. Adote esta missão com uma
                doação de qualquer valor.
              </p>

              <div className="pix-card">
                <span className="pix-label">Chave PIX</span>
                <strong className="pix-key">
                  xomanoje@gmail.com
                </strong>

                <button
                  type="button"
                  className="pix-copy-button"
                  onClick={handleCopyPix}
                >
                  {pixCopied
                    ? "PIX copiado!"
                    : "Copiar chave PIX"}
                </button>
              </div>

              <p className="donation-note">
                Cada ajuda, independentemente do valor,
                mantém uma luz acesa nesta missão.
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
        return <MiracleChapel />;

      case "other-prayers":
        return (
          <PrayerLibrary
            onOfferPrayer={handleLibraryPrayerStart}
          />
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

            const content = (
              <>
                <span className="side-menu-icon">
                  <Icon />
                </span>

                <span className="side-menu-label">
                  {item.label}
                </span>
              </>
            );

            if (item.href) {
              return (
                <a
                  key={item.id}
                  className="side-menu-item"
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={item.label}
                  aria-label={`${item.label} (abre em nova aba)`}
                >
                  {content}
                </a>
              );
            }

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
                {content}
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
          lines={activePrayer?.crawl}
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

      <InstallApp />
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
