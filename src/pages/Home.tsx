import { useEffect, useState } from "react";
import { BookingBar } from "../components/BookingBar";
import { Countdown } from "../components/Countdown";
import { useLang } from "../context/Language";

const HERO_PHOTOS = [
  { src: "/images/gallery/Marruecos2.png", position: "center 52%" },
  { src: "/images/gallery/panoramica.jpg", position: "center 88%" },
] as const;

const INTERVAL_MS = 10_000;

export function Home() {
  const { lang, t } = useLang();
  const [index, setIndex] = useState(0);

  useEffect(() => {
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
        </div>
        <div className="hero-front">
          <BookingBar />
        </div>
      </section>
    </main>
  );
}
