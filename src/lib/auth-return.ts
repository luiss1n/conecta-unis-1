const RETURN_PATH_KEY = "conecta-unis:auth-return";

function safeReturnPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  if (/^\/(vagas|eventos)\/[a-zA-Z0-9_-]+$/.test(value)) return value;
  if (["/vagas", "/eventos", "/candidaturas"].includes(value)) return value;
  return null;
}

export function storeAuthReturn(path: string): void {
  const safe = safeReturnPath(path);
  if (safe) window.sessionStorage.setItem(RETURN_PATH_KEY, safe);
}

export function getAuthCallbackUrl(): string {
  const url = new URL("/auth", window.location.origin);
  const path = window.sessionStorage.getItem(RETURN_PATH_KEY);
  const safe = safeReturnPath(path);
  if (safe) url.searchParams.set("returnTo", safe);
  return url.toString();
}

export function consumeAuthReturn(): string | null {
  const stored = window.sessionStorage.getItem(RETURN_PATH_KEY);
  window.sessionStorage.removeItem(RETURN_PATH_KEY);
  const fromUrl = new URLSearchParams(window.location.search).get("returnTo");
  return safeReturnPath(stored) ?? safeReturnPath(fromUrl);
}
