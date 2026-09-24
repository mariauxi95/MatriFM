import { assetUrl } from "../lib/assets";
import { storyChapters } from "../data/story";
import { useLang } from "../context/Language";

export function Story() {
  const { lang, t } = useLang();
  return (
    <main className="story-page">
      <section className="page-banner story-banner" aria-hidden>
        <img src={assetUrl("/images/gallery/Compromiso.jpg")} alt="" />
      </section>
      <div className="page">
        <header className="section-head story-head">
          <p className="eyebrow">{t("storyKicker")}</p>
          <h1>
            {t("storyStart")} <mark className="highlight">{t("storyMark")}</mark>
          </h1>
          <p className="lede">{t("storyLede")}</p>
        </header>

        <div className="story-chapters">
          {storyChapters.map((chapter, index) => {
            const reverse = index % 2 === 1;
            return (
              <article
                className={`story-chapter${reverse ? " story-chapter--reverse" : ""}`}
                key={chapter.id}
                style={{ animationDelay: `${0.06 + index * 0.05}s` }}
              >
                <div className="story-photo">
                  <img
                    src={chapter.image}
                    alt=""
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                </div>
                <div className="story-copy">
                  <p className="eyebrow">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h2>{lang === "es" ? chapter.titleEs : chapter.titleEn}</h2>
                  <p>{lang === "es" ? chapter.textEs : chapter.textEn}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
