import { useState, useEffect, useCallback } from "react";
import { apiRequest } from "@/lib/queryClient";

export type PushPermission = "default" | "granted" | "denied" | "unsupported";

// Detect iOS (iPhone / iPad) running in a regular Safari browser tab
// Push is only available on iOS 16.4+ AND only when installed as a PWA
function detectIos(): { isIos: boolean; isStandalone: boolean } {
  if (typeof window === "undefined") return { isIos: false, isStandalone: false };
  const ua = navigator.userAgent;
  const isIos = /iP(hone|od|ad)/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isStandalone = ("standalone" in navigator && (navigator as any).standalone === true) ||
    window.matchMedia("(display-mode: standalone)").matches;
  return { isIos, isStandalone };
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<PushPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { isIos, isStandalone } = detectIos();

  // Push is natively supported when: serviceWorker + PushManager exist
  // On iOS it only works if the page is running as an installed PWA
  const nativeSupport =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window;

  // iOS in regular Safari tab — push would be available only after installing as PWA
  const needsPwaInstall = isIos && !isStandalone && !nativeSupport;

  const supported = nativeSupport;

  useEffect(() => {
    if (!supported) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission as PushPermission);
    checkSubscription();
  }, [supported]);

  async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
    try {
      const existing = await navigator.serviceWorker.getRegistration("/");
      if (existing) return existing;
      return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    } catch (err) {
      console.error("[Push] SW registration failed:", err);
      return null;
    }
  }

  async function checkSubscription() {
    if (!supported) return;
    try {
      const reg = await getRegistration();
      if (!reg) return;
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    } catch (_) {}
  }

  const subscribe = useCallback(async () => {
    if (!supported || isLoading) return;
    setIsLoading(true);
    try {
      const { publicKey } = await apiRequest("GET", "/api/push/vapid-public-key").then((r) =>
        r.json()
      );
      const perm = await Notification.requestPermission();
      setPermission(perm as PushPermission);
      if (perm !== "granted") return;

      const reg = await getRegistration();
      if (!reg) return;

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await apiRequest("POST", "/api/push/subscribe", {
        subscription: subscription.toJSON(),
        userAgent: navigator.userAgent,
      });

      setIsSubscribed(true);
    } catch (err) {
      console.error("[Push] Subscribe error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [supported, isLoading]);

  const unsubscribe = useCallback(async () => {
    if (!supported || isLoading) return;
    setIsLoading(true);
    try {
      const reg = await getRegistration();
      if (!reg) return;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await apiRequest("DELETE", "/api/push/unsubscribe", { endpoint: sub.endpoint });
        await sub.unsubscribe();
      }
      setIsSubscribed(false);
    } catch (err) {
      console.error("[Push] Unsubscribe error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [supported, isLoading]);

  return { supported, needsPwaInstall, isIos, isStandalone, permission, isSubscribed, isLoading, subscribe, unsubscribe };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}
