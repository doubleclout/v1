const RETURNING_COOKIE = "dc_returning";
const MAX_AGE_DAYS = 365;

export function setReturningCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${RETURNING_COOKIE}=1; path=/; max-age=${MAX_AGE_DAYS * 24 * 60 * 60}; SameSite=Lax`;
}

export function hasReturningCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.includes(`${RETURNING_COOKIE}=1`);
}
