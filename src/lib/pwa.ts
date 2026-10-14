"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    listeners.forEach((listener) => listener());
  });
}

/** 홈 화면에 설치할 수 있으면 설치 함수를, 아니면 null */
export function useInstallPrompt(): (() => Promise<void>) | null {
  const [, setTick] = useState(0);
  useEffect(() => {
    const listener = () => setTick((tick) => tick + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  if (!deferred) return null;
  return async () => {
    await deferred?.prompt();
    deferred = null;
    listeners.forEach((listener) => listener());
  };
}

/** 이미 앱으로 설치되어 실행 중인지 */
export const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true);

/**
 * 주요 페이지와 데이터를 서비스 워커에 미리 저장시키고 진행률을 알려 줍니다.
 */
export async function precacheForOffline(
  urls: string[],
  onProgress: (done: number, total: number) => void,
): Promise<boolean> {
  if (!("serviceWorker" in navigator)) return false;
  const registration = await navigator.serviceWorker.ready;
  const worker = registration.active;
  if (!worker) return false;
  return new Promise((resolve) => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type !== "precache-progress") return;
      onProgress(event.data.done, event.data.total);
      if (event.data.done >= event.data.total) {
        navigator.serviceWorker.removeEventListener("message", handler);
        resolve(true);
      }
    };
    navigator.serviceWorker.addEventListener("message", handler);
    worker.postMessage({ type: "precache", urls });
  });
}
