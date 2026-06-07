import { useCallback, useEffect, useState } from "react";
import {
  isPushSupported,
  isSubscribed as checkSubscribed,
  getPermissionState,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/utils/webPush";

interface UsePushNotifications {
  supported: boolean;
  permission: NotificationPermission | "unsupported";
  subscribed: boolean;
  loading: boolean;
  /** Returns true on success. False if denied/blocked/unsupported. */
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
}

export function usePushNotifications(): UsePushNotifications {
  const supported = isPushSupported();
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    getPermissionState()
  );
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(supported);

  useEffect(() => {
    let active = true;
    if (!supported) {
      setLoading(false);
      return;
    }
    checkSubscribed().then((s) => {
      if (!active) return;
      setSubscribed(s);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [supported]);

  const subscribe = useCallback(async () => {
    setLoading(true);
    const ok = await subscribeToPush();
    setSubscribed(ok);
    setPermission(getPermissionState());
    setLoading(false);
    return ok;
  }, []);

  const unsubscribe = useCallback(async () => {
    setLoading(true);
    const ok = await unsubscribeFromPush();
    if (ok) setSubscribed(false);
    setLoading(false);
    return ok;
  }, []);

  return { supported, permission, subscribed, loading, subscribe, unsubscribe };
}
