type PushAuthOptions = {
  authToken?: string | null;
};

function buildHeaders(options?: PushAuthOptions) {
  return options?.authToken
    ? {
        Authorization: `Bearer ${options.authToken}`,
      }
    : undefined;
}

function base64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

export async function ensureOwnerPushServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service Worker unavailable");
  }

  return navigator.serviceWorker.register("/sw.js");
}

export async function getOwnerPushSubscription() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return null;
  }

  const registration = await ensureOwnerPushServiceWorker();
  return registration.pushManager.getSubscription();
}

export async function subscribeOwnerPush(options?: PushAuthOptions & { deviceLabel?: string | null }) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    throw new Error("Push notifications are not supported on this device");
  }

  const permission = Notification.permission === "granted"
    ? "granted"
    : await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error("Notification permission denied");
  }

  const publicKeyResponse = await fetch("/api/admin/push/public-key", {
    method: "GET",
    headers: buildHeaders(options),
    credentials: "include",
  });

  const publicKeyPayload = await publicKeyResponse.json();
  if (!publicKeyResponse.ok || !publicKeyPayload.available || !publicKeyPayload.publicKey) {
    throw new Error("Push notifications are not configured");
  }

  const registration = await ensureOwnerPushServiceWorker();
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64ToUint8Array(publicKeyPayload.publicKey),
    });
  }

  const serializedSubscription = subscription.toJSON();

  const browserNavigator = navigator as Navigator & {
    userAgentData?: {
      platform?: string;
    };
  };

  await fetch("/api/admin/push/subscriptions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildHeaders(options),
    },
    credentials: "include",
    body: JSON.stringify({
      subscription: serializedSubscription,
      deviceLabel: options?.deviceLabel || navigator.platform || "owner-device",
      platform: browserNavigator.userAgentData?.platform || navigator.platform || "web",
      userAgent: navigator.userAgent,
    }),
  }).then(async (response) => {
    if (!response.ok) {
      throw new Error(await response.text());
    }
  });

  await fetch("/api/admin/push/test", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildHeaders(options),
    },
    credentials: "include",
    body: JSON.stringify({
      endpoint: serializedSubscription.endpoint,
    }),
  }).then(async (response) => {
    if (!response.ok) {
      throw new Error(await response.text());
    }
  });

  return subscription;
}

export async function unsubscribeOwnerPush(options?: PushAuthOptions) {
  const existing = await getOwnerPushSubscription();
  if (!existing) {
    return false;
  }

  const endpoint = existing.endpoint;
  await existing.unsubscribe();

  await fetch("/api/admin/push/subscriptions", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...buildHeaders(options),
    },
    credentials: "include",
    body: JSON.stringify({ endpoint }),
  });

  return true;
}
