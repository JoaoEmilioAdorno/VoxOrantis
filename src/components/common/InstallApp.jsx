import { useEffect, useState } from "react";

const DISMISSED_KEY = "vox-orantis-install-dismissed";

function isInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

export default function InstallApp() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isInstalled() || sessionStorage.getItem(DISMISSED_KEY)) {
      return undefined;
    }

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const handleInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
      setVisible(true);
    };

    const handleInstalled = () => setVisible(false);

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    if (ios) {
      setVisible(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!installPrompt) {
      setShowIosHelp(true);
      return;
    }

    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;

    if (outcome === "accepted") {
      setVisible(false);
    }

    setInstallPrompt(null);
  }

  function dismiss() {
    sessionStorage.setItem(DISMISSED_KEY, "true");
    setVisible(false);
  }

  if (!visible) {
    return null;
  }

  return (
    <aside className="install-app" aria-label="Instalar Vox Orantis">
      <button
        type="button"
        className="install-app-close"
        onClick={dismiss}
        aria-label="Fechar aviso de instalação"
      >
        ×
      </button>

      <div className="install-app-icon" aria-hidden="true">VO</div>
      <div className="install-app-copy">
        <strong>Leve o Vox Orantis com você</strong>
        {showIosHelp ? (
          <p>Toque em Compartilhar e depois em “Adicionar à Tela de Início”.</p>
        ) : (
          <p>Instale o app no celular para abrir direto da tela inicial.</p>
        )}
      </div>

      {!showIosHelp && (
        <button type="button" className="install-app-button" onClick={handleInstall}>
          Instalar
        </button>
      )}
    </aside>
  );
}
