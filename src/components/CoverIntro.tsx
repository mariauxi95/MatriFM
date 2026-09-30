import { useEffect, useRef, useState } from "react";
import { useLang } from "../context/Language";
import { assetUrl } from "../lib/assets";

const INTRO_KEY = "fm-intro";

export function introAlreadySeen(): boolean {
  try {
    if (sessionStorage.getItem(INTRO_KEY) === "1") return true;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export function markIntroSeen() {
  try {
    sessionStorage.setItem(INTRO_KEY, "1");
  } catch {
    /* private mode */
  }
}

/** Full-screen opening film. The access cover appears when it ends. */
export function CoverIntro({ onDone }: { onDone: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { t } = useLang();
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let alive = true;
    const start = () => {
      const attempt = video.play();
      if (attempt) attempt.catch(() => { if (alive) setBlocked(true); });
    };
    const hidePlay = () => { if (alive) setBlocked(false); };
    start();
    video.addEventListener("playing", hidePlay);
    const timer = window.setTimeout(() => {
      if (alive && video.paused && video.currentTime < 0.2) setBlocked(true);
    }, 700);
    return () => {
      alive = false;
      window.clearTimeout(timer);
      video.removeEventListener("playing", hidePlay);
    };
  }, []);

  return (
    <div className="cover-intro">
      <video
        ref={videoRef}
        src={assetUrl("/videos/intro.mp4")}
        autoPlay
        playsInline
        onEnded={onDone}
        onError={onDone}
      />
      {blocked ? (
        <button
          className="btn cover-intro-play"
          type="button"
          onClick={() => {
            const video = videoRef.current;
            if (!video) return;
            video.play().then(() => setBlocked(false)).catch(() => setBlocked(true));
          }}
        >
          {t("introPlay")}
        </button>
      ) : null}
      <button className="cover-intro-skip" type="button" onClick={onDone}>
        {t("introSkip")}
      </button>
    </div>
  );
}
