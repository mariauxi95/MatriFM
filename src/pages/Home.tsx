import { assetUrl } from "../lib/assets";
import { useEffect, useState } from "react";
import { BookingBar } from "../components/BookingBar";
import { Countdown } from "../components/Countdown";
import { useLang } from "../context/Language";

const HERO_PHOTOS = [{ src: assetUrl("/images/gallery/Marruecos2.png"), position: "center 52%" }] as const;

const INTERVAL_MS = 10_000;

export function Home() {
  const { lang, t } = useLang();
  const [index, setIndex] = useState(0);
  const [thread, setThread] = useState(() => sessionStorage.getItem("fm-thread-enter") === "1");

  useEffect(() => {
    if (!thread) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      sessionStorage.removeItem("fm-thread-enter");
      setThread(false);
      return;
    }
    const id = window.setTimeout(() => {
      sessionStorage.removeItem("fm-thread-enter");
      setThread(false);
    }, 1700);
    return () => window.clearTimeout(id);
  }, [thread]);

  useEffect(() => {
    if (HERO_PHOTOS.length < 2) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % HERO_PHOTOS.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [index]);

  function goTo(next: number) {
    setIndex((next + HERO_PHOTOS.length) % HERO_PHOTOS.length);
  }

  return (
    <main className="home">
      <section className="hero-stage">
        <div className="hero-frame">
          {HERO_PHOTOS.map((photo, i) => (
            <img
              key={photo.src}
              className={`hero-slide${i === index ? " is-active" : ""}`}
              src={photo.src}
              alt={i === index ? t("destPlace") : ""}
              style={{ objectPosition: photo.position }}
              aria-hidden={i !== index}
            />
          ))}
          {thread ? (
            <svg className="hero-thread" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden>
              <path
                d="M -30 460 C 90 448 170 410 250 428 C 310 442 360 420 410 432"
                fill="none"
                stroke="#D92D3A"
                strokeWidth="3.2"
                strokeLinecap="round"
                pathLength={1}
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          ) : null}
          <div className="hero-copy">
            <h1 className="hero-title">
              <span className="hero-title-line">{t("heroStart")}</span>
              <span className="hero-title-line">
                {t("heroRest")} <mark className="highlight">{t("heroMark")}</mark>
              </span>
            </h1>
          </div>
          <div className="hero-countdown">
            <Countdown />
          </div>
          {HERO_PHOTOS.length > 1 ? (
          <div className="hero-slides-nav" role="group" aria-label="Fotos">
            <button
              type="button"
              className="hero-slides-arrow"
              aria-label={lang === "es" ? "Foto anterior" : "Previous photo"}
              onClick={() => goTo(index - 1)}
            >
              ‹
            </button>
            {HERO_PHOTOS.map((photo, i) => (
              <button
                key={photo.src}
                type="button"
                className={`hero-slides-dot${i === index ? " is-active" : ""}`}
                aria-label={lang === "es" ? `Foto ${i + 1}` : `Photo ${i + 1}`}
                aria-current={i === index}
                onClick={() => goTo(i)}
              />
            ))}
            <button
              type="button"
              className="hero-slides-arrow"
              aria-label={lang === "es" ? "Foto siguiente" : "Next photo"}
              onClick={() => goTo(index + 1)}
            >
              ›
            </button>
          </div>
          ) : null}
        </div>
        <div className="hero-front">
          <BookingBar />
        </div>
      </section>
    </main>
  );
}
