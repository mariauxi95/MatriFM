import type { ReactNode, SVGProps } from "react";
import { useLang } from "../../context/Language";
import type { MessageKey } from "../../i18n";
import { assetUrl } from "../../lib/assets";

const TRIP: { title: MessageKey; body: MessageKey; icon: "passport" | "stamp" }[] = [
  { title: "docsBeforeTitle", body: "docsBeforeBody", icon: "passport" },
  { title: "docsArrivalTitle", body: "docsArrivalBody", icon: "stamp" },
];

const KIDS: { body: MessageKey; icon: "docs" | "care" | "clock" | "meal" | "baby"; nested?: boolean }[] = [
  { body: "docsMinorBody", icon: "docs" },
  { body: "needsMinorP1", icon: "care" },
  { body: "needsMinorP2", icon: "clock", nested: true },
  { body: "needsMinorP3", icon: "meal", nested: true },
  { body: "needsBabyP1", icon: "baby" },
];

export function FaqSection() {
  const { t } = useLang();

  return (
    <>
      <h2>{t("faqTitle")}</h2>

      <div className="faq-group">
        <p className="faq-kicker">{t("faqBeforeKicker")}</p>
        <ul className="faq-docs">
          {TRIP.map((item) => (
            <li className="faq-card" key={item.title}>
              <span className="faq-card-icon" aria-hidden>
                <TripIcon name={item.icon} />
              </span>
              <h3>{t(item.title)}</h3>
              <p>{t(item.body)}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="faq-group">
        <p className="faq-kicker">{t("faqPartyKicker")}</p>
        <ul className="faq-care">
          <li className="faq-card faq-kids">
            <span className="faq-card-icon" aria-hidden>
              <img src={assetUrl("/images/icons/faq-stroller.png")} alt="" />
            </span>
            <h3>{t("faqKidsQ")}</h3>
            <ul className="faq-points">
              {KIDS.map((item) => (
                <li key={item.body} className={item.nested ? "is-nested" : undefined}>
                  <PointIcon name={item.icon} />
                  <p>{t(item.body)}</p>
                </li>
              ))}
            </ul>
          </li>
        </ul>
      </div>
    </>
  );
}

function Glyph(props: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  const { children, ...rest } = props;
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...rest}>
      {children}
    </svg>
  );
}

const TRIP_ART = {
  passport: "/images/icons/faq-passport.png",
  stamp: "/images/icons/faq-migration.png",
} as const;

function TripIcon({ name }: { name: keyof typeof TRIP_ART }) {
  return <img src={assetUrl(TRIP_ART[name])} alt="" />;
}

function BabyIcon() {
  return (
    <Glyph>
      <path d="M10 3.8h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10.4 3.8v1.6M13.6 3.8v1.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M8.6 6.4h6.8v1.1c0 .5-.3.9-.7 1.1l-1.1.7V17a2.1 2.1 0 0 1-2.1 2.1h-.2A2.1 2.1 0 0 1 9.2 17V9.3l-1.1-.7c-.4-.2-.7-.6-.7-1.1V6.4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M8.8 12.4h6.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </Glyph>
  );
}

function PointIcon({ name }: { name: "docs" | "care" | "clock" | "meal" | "baby" }) {
  if (name === "docs") {
    return (
      <Glyph>
        <rect x="5" y="3.5" width="14" height="17" rx="1.6" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8.2 8.2h7.6M8.2 12h7.6M8.2 15.6h4.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </Glyph>
    );
  }
  if (name === "baby") return <BabyIcon />;
  if (name === "clock") {
    return (
      <Glyph>
        <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 8.2V12l2.6 1.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </Glyph>
    );
  }
  if (name === "meal") {
    return (
      <Glyph>
        <path d="M8 4.2v5.2M6.4 4.2V8M9.6 4.2V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8 9.4v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path
          d="M14.2 4.4c1.8 1.3 2.2 3.2 2.2 4.8 0 1.3-.7 2.2-2.2 2.2v8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </Glyph>
    );
  }
  return (
    <Glyph>
      <circle cx="8.2" cy="8.4" r="1.7" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="15.2" cy="8.8" r="1.4" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M4.6 17.6c.5-2.4 2-3.6 3.8-3.6s3.2 1.2 3.6 3.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M12.2 17.4c.3-1.7 1.4-2.7 2.9-2.7 1.5 0 2.5 1 2.8 2.7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Glyph>
  );
}
