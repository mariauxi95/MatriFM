const OPENED = "fm-remote-opened";

export function markRemoteOpened() {
  sessionStorage.setItem(OPENED, "1");
}

export function isRemoteOpened() {
  return sessionStorage.getItem(OPENED) === "1";
}
