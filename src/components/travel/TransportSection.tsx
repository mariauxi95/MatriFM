import { useLang } from "../../context/Language";
import { IconBus } from "./TravelIcons";

export function TransportSection() {
  const { t } = useLang();

  return (
    <>
      <h2>{t("transportTitle")}</h2>
      <p className="docs-lead">{t("transportLead")}</p>
      <div className="transport-list">
        <article className="docs-card">
          <IconBus />
          <p className="docs-step">{t("transportOutLabel")}</p>
          <h3>{t("transportOutWhen")}</h3>
          <p className="transport-time">{t("transportOutTime")}</p>
          <p>{t("transportOutRoute")}</p>
        </article>
        <article className="docs-card">
          <IconBus />
          <p className="docs-step">{t("transportBackLabel")}</p>
          <h3>{t("transportBackWhen")}</h3>
          <p className="transport-times">
            <span className="transport-time">{t("transportBackEarly")}</span>
            <span className="transport-or">{t("transportOr")}</span>
            <span className="transport-time">{t("transportBackLate")}</span>
          </p>
          <p>{t("transportBackRoute")}</p>
        </article>
      </div>
      <p className="transport-note">{t("transportNote")}</p>
    </>
  );
}
