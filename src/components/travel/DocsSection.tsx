import type { ComponentType, SVGProps } from "react";
import { useLang } from "../../context/Language";
import type { MessageKey } from "../../i18n";
import { IconPassport, IconPolice, IconStroller } from "./TravelIcons";

const STEPS: {
  title: MessageKey;
  body: MessageKey;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}[] = [
  { title: "docsBeforeTitle", body: "docsBeforeBody", Icon: IconPassport },
  { title: "docsMinorTitle", body: "docsMinorBody", Icon: IconStroller },
  { title: "docsArrivalTitle", body: "docsArrivalBody", Icon: IconPolice },
];

export function DocsSection() {
  const { t } = useLang();

  return (
    <>
      <h2>{t("docsTitle")}</h2>
      <p className="docs-lead">{t("docsLead")}</p>
      <ol className="docs-list">
        {STEPS.map((step, index) => (
          <li className="docs-card" key={step.title}>
            <step.Icon />
            <p className="docs-step">{String(index + 1).padStart(2, "0")}</p>
            <h3>{t(step.title)}</h3>
            <p>{t(step.body)}</p>
          </li>
        ))}
      </ol>
    </>
  );
}
