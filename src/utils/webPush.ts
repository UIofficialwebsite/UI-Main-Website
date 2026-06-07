// Web Push helpers — browser subscription lifecycle + Supabase persistence.
//
// The VAPID *public* key is not a secret (it ships to every browser), so it is
// safe to hardcode with an env override. The matching private key lives only as
// a Supabase edge-function secret (VAPID_PRIVATE_KEY) and signs each push.

import { supabase } from "@/integrations/supabase/client";

export const VAPID_PUBLIC_KEY =
  (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined) ||
  "BHuMovIYXDCzRpdK17ZyvVPHA9PD0DSmEVgS5mKgN_VXgxAppSU3Q510_FnOp7p8sYGTS2ssDwDssv1jNwZO4uQ";

/** True when the browser can do Service Worker + Push + Notifications. */
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function getPermissionState(): NotificationPermission | "unsupported" {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return "";
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return window.btoa(binary);
}

/** Ensure the service worker is registered and return its registration. */
async function getRegistration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return existing;
  await navigator.serviceWorker.register("/sw.js");
  return navigator.serviceWorker.ready;
}

/** True if this browser already has an active push subscription. */
export async function isSubscribed(): Promise<boolean> {
  if (!isPushSupported()) return false;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return false;
    const sub = await reg.pushManager.getSubscription();
    return !!sub;
  } catch {
    return false;
  }
}

/**
 * Request permission (if needed), subscribe via the Push API, and persist the
 * subscription to Supabase. Returns true on success.
 */
export async function subscribeToPush(): Promise<boolean> {
  if (!isPushSupported()) return false;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  const reg = await getRegistration();

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const json = sub.toJSON();
  const p256dh = json.keys?.p256dh ?? arrayBufferToBase64(sub.getKey("p256dh"));
  const auth = json.keys?.auth ?? arrayBufferToBase64(sub.getKey("auth"));

  const { error } = await supabase.rpc("save_push_subscription", {
    p_endpoint: sub.endpoint,
    p_p256dh: p256dh,
    p_auth: auth,
    p_user_agent: navigator.userAgent,
  });

  if (error) {
    console.error("Failed to save push subscription:", error);
    return false;
  }
  return true;
}

/** Unsubscribe from the Push API and remove the row from Supabase. */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) return false;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return true;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return true;

    const endpoint = sub.endpoint;
    await sub.unsubscribe();
    await supabase.rpc("delete_push_subscription", { p_endpoint: endpoint });
    return true;
  } catch (err) {
    console.error("Failed to unsubscribe from push:", err);
    return false;
  }
}
