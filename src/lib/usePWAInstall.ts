"use client";

import { useEffect, useState } from "react";

export function usePWAInstall() {
  const [canInstall, setCanInstall] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // ✅ Проверяем, запущено ли приложение как PWA
    const checkInstalled = () => {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        // @ts-ignore — iOS Safari
        window.navigator.standalone === true;

      setIsInstalled(isStandalone);
    };

    checkInstalled();

    // 🔔 Chrome / Android: событие установки
    function handleBeforeInstallPrompt(e: any) {
      e.preventDefault();
      setInstallPrompt(e);
      setCanInstall(true);
    }

    function handleAppInstalled() {
      setIsInstalled(true);
      setCanInstall(false);
      setInstallPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  /**
   * 🔹 Старое поведение — используется в других частях приложения
   * Просто запускает установку, если она возможна
   */
  async function install() {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
    setCanInstall(false);
  }

  /**
   * ⭐ НОВОЕ ПОВЕДЕНИЕ — для onboarding / edge cases
   *
   * Логика:
   * - если PWA уже установлена → просто переходим по URL
   *   (браузер сам откроет приложение)
   * - если не установлена, но можно → предлагаем установку
   * - если нельзя → ничего не делаем (текст уже объясняет, что делать)
   */
  async function openOrInstall(targetUrl: string) {
    if (isInstalled) {
      // 👉 браузер сам откроет PWA, если она установлена
      window.location.href = targetUrl;
      return;
    }

    if (canInstall) {
      await install();
      return;
    }

    // ❗ Ничего не делаем:
    // - iOS Safari (нет install prompt)
    // - in-app browser
    // Пользователь следует текстовой инструкции
  }

  return {
    // 🔹 используется по всему приложению
    canInstall,
    isInstalled,
    install,

    // ⭐ используется ТОЛЬКО там, где нужно
    openOrInstall,
  };
}
