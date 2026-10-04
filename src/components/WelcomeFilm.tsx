import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useLocation } from "react-router-dom";
import { assetUrl } from "../lib/assets";
import { useLang } from "../context/Language";

const FLAG = "fm-welcome-film";

let presentWelcome: (() => void) | null = null;

function isCoverPath(pathname: string) {
  return /\/invite\/?$/.test(pathname);
}

/** Start the film on the cover click. The window stays hidden until the invitation. */
export function requestWelcomeFilm() {
  sessionStorage.setItem(FLAG, "1");
  presentWelcome?.();
}

/** Reopen the film from the invitation. */
export function openWelcomeFilm() {
  sessionStorage.setItem(FLAG, "1");
  presentWelcome?.();
}

export function WelcomeFilm() {
  const { t } = useLang();
  const { pathname } = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(() => sessionStorage.getItem(FLAG) === "1");
  const [needsPlay, setNeedsPlay] = useState(false);
  const show = open && !isCoverPath(pathname);

  function tryPlay(video = videoRef.current) {
    if (!video) return;
    const start = () => {
      video.play().then(() => setNeedsPlay(false)).catch(() => {
        if (video.paused) setNeedsPlay(true);
      });
    };
    if (video.error) {
      video.load();
      video.addEventListener("canplay", start, { once: true });
      return;
    }
    start();
  }

  function present() {
    flushSync(() => setOpen(true));
    const video = videoRef.current;
    if (!video) return;
    if (video.readyState > 0) video.currentTime = 0;
    tryPlay(video);
  }

  useEffect(() => {
    presentWelcome = present;
    return () => {
      if (presentWelcome === present) presentWelcome = null;
    };
  });

  useEffect(() => {
    if (!show) return;
    tryPlay();
    closeRef.current?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") dismiss();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show]);

  function dismiss() {
    sessionStorage.removeItem(FLAG);
    videoRef.current?.pause();
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      className={`welcome-film${show ? "" : " is-holding"}`}
      role={show ? "dialog" : undefined}
      aria-modal={show ? true : undefined}
      aria-hidden={show ? undefined : true}
      aria-label={show ? t("welcomeFilm") : undefined}
    >
      {show ? <button className="welcome-film-backdrop" type="button" aria-label={t("close")} onClick={dismiss} /> : null}
      <div className="welcome-film-window">
        {show ? <p className="welcome-film-kicker">{t("welcomeFilm")}</p> : null}
        <div className="welcome-film-stage">
          <video
            ref={videoRef}
            src={assetUrl("/videos/welcome.mp4?v=3")}
            playsInline
            controls={show}
            preload="auto"
            onPlay={() => setNeedsPlay(false)}
            onEnded={dismiss}
          />
          {show && needsPlay ? (
            <button className="welcome-film-play" type="button" onClick={() => tryPlay()}>
              {t("welcomePlay")}
            </button>
          ) : null}
        </div>
        {show ? (
          <button ref={closeRef} className="welcome-film-close" type="button" onClick={dismiss} aria-label={t("close")}>
            ×
          </button>
        ) : null}
      </div>
    </div>
  );
}
