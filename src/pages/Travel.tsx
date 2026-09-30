import { assetUrl } from "../lib/assets";
import { useEffect, useState, type ComponentType, type SVGProps } from "react";
import { Link, useLocation } from "react-router-dom";
import { ClubWhatsAppPanel } from "../components/club/ClubWhatsAppPanel";
import { StaySection } from "../components/stay/StaySection";
import { DocsSection } from "../components/travel/DocsSection";
import { TransportSection } from "../components/travel/TransportSection";
import { ToursSection } from "../components/travel/ToursSection";
import {
  IconAccessibility,
  IconBed,
  IconBus,
  IconCompass,
  IconPassport,
  IconWhatsApp,
} from "../components/travel/TravelIcons";
import { useLang } from "../context/Language";
import type { MessageKey } from "../i18n";

type SectionId = "docs" | "transport" | "stay" | "needs" | "tours" | "club";

const SECTION_IDS: SectionId[] = ["docs", "transport", "stay", "needs", "tours", "club"];

const travelSections: {
  id: SectionId;
  titleKey: MessageKey;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}[] = [
  { id: "docs", titleKey: "pillDocs", Icon: IconPassport },
  { id: "transport", titleKey: "pillTransport", Icon: IconBus },
  { id: "stay", titleKey: "pillStay", Icon: IconBed },
  { id: "needs", titleKey: "pillNeeds", Icon: IconAccessibility },
  { id: "tours", titleKey: "pillTours", Icon: IconCompass },
  { id: "club", titleKey: "pillClub", Icon: IconWhatsApp },
];

function sectionFromHash(hash: string): SectionId | null {
  const id = hash.replace(/^#travel-/, "") as SectionId;
  return SECTION_IDS.includes(id) ? id : null;
}

export function Travel() {
  const { t } = useLang();
  const location = useLocation();
  const [active, setActive] = useState<SectionId | null>(() => sectionFromHash(window.location.hash));

  useEffect(() => {
    const fromHash = sectionFromHash(location.hash);
    if (fromHash) setActive(fromHash);
  }, [location.hash]);

  useEffect(() => {
    if (!active) return;
    const el = document.getElementById(`travel-${active}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [active]);

  function openSection(id: SectionId) {
    setActive(id);
    window.history.replaceState(null, "", `#travel-${id}`);
  }

  function closeSection() {
    setActive(null);
    window.history.replaceState(null, "", location.pathname + location.search);
    document.getElementById("travel-menu")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="travel-page">
      <section className="page-banner travel-banner" aria-hidden>
        <img src={assetUrl("/images/gallery/kayak.jpg")} alt="" />
      </section>

      <div className="page travel-body">
        <nav className="travel-crumb" aria-label="Breadcrumb">
          <Link to="../home" aria-label={t("navHome")}>
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
              />
            </svg>
          </Link>
          <span aria-hidden>›</span>
          <span>{t("travelKicker")}</span>
        </nav>

        <header className="travel-head" id="travel-menu">
          <h1>{t("travelTitle")}</h1>
          <p>{t("travelLead")}</p>
        </header>

        <nav className="travel-cat-grid" aria-label={t("travelKicker")}>
          {travelSections.map(({ id, titleKey, Icon }) => (
            <button
              key={id}
              type="button"
              className={`travel-cat-card${active === id ? " is-active" : ""}`}
              aria-pressed={active === id}
              onClick={() => openSection(id)}
            >
              <Icon />
              <span>{t(titleKey)}</span>
            </button>
          ))}
        </nav>

        {active === "docs" ? (
          <section className="travel-section" id="travel-docs">
            <DocsSection />
            <button className="travel-back" type="button" onClick={closeSection}>
              ↑ {t("travelBackMenu")}
            </button>
          </section>
        ) : null}

        {active === "transport" ? (
          <section className="travel-section" id="travel-transport">
            <TransportSection />
            <button className="travel-back" type="button" onClick={closeSection}>
              ↑ {t("travelBackMenu")}
            </button>
          </section>
        ) : null}

        {active === "stay" ? (
          <section className="travel-section" id="travel-stay">
            <StaySection />
            <button className="travel-back" type="button" onClick={closeSection}>
              ↑ {t("travelBackMenu")}
            </button>
          </section>
        ) : null}

        {active === "needs" ? (
          <section className="travel-section" id="travel-needs">
            <h2>{t("needsTitle")}</h2>
            <h3>{t("needsMinorTitle")}</h3>
            <p>{t("needsMinorP1")}</p>
            <p>{t("needsMinorP2")}</p>
            <p>{t("needsMinorP3")}</p>
            <h3>{t("needsBabyTitle")}</h3>
            <p>{t("needsBabyP1")}</p>
            <button className="travel-back" type="button" onClick={closeSection}>
              ↑ {t("travelBackMenu")}
            </button>
          </section>
        ) : null}

        {active === "tours" ? <ToursSection onBack={closeSection} /> : null}

        {active === "club" ? (
          <section className="travel-section" id="travel-club">
            <h2>{t("clubKicker")}</h2>
            <ClubWhatsAppPanel />
            <button className="travel-back" type="button" onClick={closeSection}>
              ↑ {t("travelBackMenu")}
            </button>
          </section>
        ) : null}
      </div>
    </main>
  );
}
