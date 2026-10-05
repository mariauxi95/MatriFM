import { useLang } from "../../context/Language";

type Props = {
  labels: string[];
  activeIndex: number;
};

export function RsvpProgress({ labels, activeIndex }: Props) {
  const { t } = useLang();
  const pct = labels.length <= 1 ? 100 : (activeIndex / (labels.length - 1)) * 100;
  const current = labels[activeIndex] ?? "";
  return (
    <div className="rsvp-progress" aria-label="Progress">
      <p className="rsvp-progress-now">
        <span>{t("rsvpStepNow", { n: activeIndex + 1, total: labels.length })}</span>
        <b>{current}</b>
      </p>
      <div className="rsvp-progress-bar" aria-hidden>
        <span style={{ width: `${pct}%` }} />
      </div>
      <ol className="rsvp-progress-steps">
        {labels.map((label, index) => (
          <li key={label} className={index === activeIndex ? "is-active" : index < activeIndex ? "is-done" : ""}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <b>{label}</b>
          </li>
        ))}
      </ol>
    </div>
  );
}
