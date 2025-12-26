"use client";

import { useEffect, useState } from "react";

export function usePWAInstall() {
  const [canInstall, setCanInstall] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // already installed (PWA or iOS standalone)
    const checkInstalled = () => {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        // @ts-ignore
        window.navigator.standalone === true;

      setIsInstalled(isStandalone);
    };

    checkInstalled();

    function handleBeforeInstallPrompt(e: any) {
      e.preventDefault();
      setInstallPrompt(e);
      setCanInstall(true);
    }

    function handleAppInstalled() {
      setIsInstalled(true);
      setCanInstall(false);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function install() {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
    setCanInstall(false);
  }

  return {
    canInstall,
    isInstalled,
    install,
  };
}
