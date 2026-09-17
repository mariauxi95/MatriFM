type Props = {
  labels: string[];
  activeIndex: number;
};

export function RsvpProgress({ labels, activeIndex }: Props) {
  const pct = labels.length <= 1 ? 100 : (activeIndex / (labels.length - 1)) * 100;
  return (
    <div className="rsvp-progress" aria-label="Progress">
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
