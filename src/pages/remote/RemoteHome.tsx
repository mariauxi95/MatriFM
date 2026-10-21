import { assetUrl } from "../../lib/assets";
import { Link } from "react-router-dom";
import { Countdown } from "../../components/Countdown";
import { useLang } from "../../context/Language";

const HERO = { src: assetUrl("/images/gallery/Marruecos2.png"), position: "center 52%" };

export function RemoteHome() {
  const { t } = useLang();

  return (
    <main className="remote-home">
      <section className="hero-stage">
        <div className="hero-frame">
          <img className="hero-slide is-active" src={HERO.src} alt={t("destPlace")} style={{ objectPosition: HERO.position }} />
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
        </div>
        <div className="hero-front">
          <section className="booking remote-live-bar">
            <div className="booking-grid">
              <div className="booking-cell">
                <span>{t("to")}</span>
                <b>{t("destination")}</b>
              </div>
              <div className="booking-cell">
                <span>{t("dates")}</span>
                <b>{t("remoteDate")}</b>
              </div>
              <Link className="btn booking-go" to="../en-vivo">
                {t("remoteLiveNav")}
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
