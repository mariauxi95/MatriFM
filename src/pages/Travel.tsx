import { assetUrl } from "../lib/assets";
import { useEffect, useState, type ComponentType, type SVGProps } from "react";
import { Link, useLocation } from "react-router-dom";
import { ClubWhatsAppPanel } from "../components/club/ClubWhatsAppPanel";
import { StaySection } from "../components/stay/StaySection";
import { AfterSection } from "../components/travel/AfterSection";
import { FaqSection } from "../components/travel/FaqSection";
import { TransportSection } from "../components/travel/TransportSection";
import { ToursSection } from "../components/travel/ToursSection";
import { IconFaq, IconWhatsApp } from "../components/travel/TravelIcons";
import { useLang } from "../context/Language";
import type { MessageKey } from "../i18n";

type SectionId = "faq" | "transport" | "stay" | "after" | "tours" | "club";

const SECTION_IDS: SectionId[] = ["faq", "transport", "stay", "after", "tours", "club"];

const travelSections: {
  id: SectionId;
  titleKey: MessageKey;
  Icon?: ComponentType<SVGProps<SVGSVGElement>>;
  art?: string;
}[] = [
  { id: "faq", titleKey: "pillFaq", Icon: IconFaq },
  { id: "transport", titleKey: "pillTransport", art: "/images/icons/cat-bus.png" },
  { id: "stay", titleKey: "pillStay", art: "/images/icons/cat-bed.png" },
  { id: "after", titleKey: "pillAfter", art: "/images/icons/cat-resort.png" },
  { id: "tours", titleKey: "pillTours", art: "/images/icons/cat-playa.png" },
  { id: "club", titleKey: "pillClub", Icon: IconWhatsApp },
];

function sectionFromHash(hash: string): SectionId | null {
  const id = hash.replace(/^#travel-/, "");
  if (id === "docs" || id === "needs") return "faq";
  return SECTION_IDS.includes(id as SectionId) ? (id as SectionId) : null;
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
          {travelSections.map(({ id, titleKey, Icon, art }) => (
            <button
              key={id}
              type="button"
              className={`travel-cat-card${active === id ? " is-active" : ""}`}
              aria-pressed={active === id}
              onClick={() => openSection(id)}
            >
              {art ? <img src={assetUrl(art)} alt="" /> : Icon ? <Icon /> : null}
              <span>{t(titleKey)}</span>
            </button>
          ))}
        </nav>

        {active === "faq" ? (
          <section className="travel-section" id="travel-faq">
            <FaqSection />
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

        {active === "after" ? (
          <section className="travel-section" id="travel-after">
            <AfterSection />
            <button className="travel-back" type="button" onClick={closeSection}>
              ↑ {t("travelBackMenu")}
            </button>
          </section>
        ) : null}

        {active === "tours" ? <ToursSection onBack={closeSection} /> : null}

        {active === "club" ? (
          <section className="travel-section" id="travel-club">
            <h2>{t("pillClub")}</h2>
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
