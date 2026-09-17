import { storyChapters } from "../data/story";
import { useLang } from "../context/Language";

export function Story() {
  const { lang, t } = useLang();
  return (
    <main className="page">
      <header className="section-head">
        <p className="eyebrow">{t("storyKicker")}</p>
        <h1>
          {t("storyStart")} <mark className="highlight">{t("storyMark")}</mark>
        </h1>
      </header>
      <div className="story-grid">
        {storyChapters.map((chapter) => (
          <article className="card" key={chapter.id}>
            <img src={chapter.image} alt="" />
            <div className="card-body">
              <h2>{lang === "es" ? chapter.titleEs : chapter.titleEn}</h2>
              <p>{lang === "es" ? chapter.textEs : chapter.textEn}</p>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
