const OPEN_LOGIN_DIALOG_EVENT = "michelstravel:open-login-dialog";

function updateLoginQueryParams(open: boolean, authError?: string) {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);

  if (open) {
    url.searchParams.set("login", "true");
    if (authError) {
      url.searchParams.set("authError", authError);
    } else {
      url.searchParams.delete("authError");
    }
  } else {
    url.searchParams.delete("login");
    url.searchParams.delete("authError");
  }

  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

export function getLoginDialogEventName() {
  return OPEN_LOGIN_DIALOG_EVENT;
}

export function openLoginDialog(authError?: string) {
  if (typeof window === "undefined") return;

  updateLoginQueryParams(true, authError);
  window.dispatchEvent(
    new CustomEvent(OPEN_LOGIN_DIALOG_EVENT, {
      detail: { authError: authError || null },
    })
  );
}

export function closeLoginDialog() {
  updateLoginQueryParams(false);
}

export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}

// Redirect to login with a toast notification
export function redirectToLogin(toast?: (options: { title: string; description: string; variant: string }) => void) {
  if (toast) {
    toast({
      title: "Unauthorized",
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
  }
  setTimeout(() => {
    openLoginDialog();
  }, 500);
}
