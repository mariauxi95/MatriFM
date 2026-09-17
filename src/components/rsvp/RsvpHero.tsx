type Props = {
  title: string;
  body: string;
  cta: string;
  badge: string;
  onCta: () => void;
  photoSrc: string;
};

export function RsvpHero({ title, body, cta, badge, onCta, photoSrc }: Props) {
  return (
    <section className="rsvp-hero">
      <div className="rsvp-hero-copy">
        <h1 className="rsvp-hero-title">{title}</h1>
        <p>{body}</p>
        <button className="btn rsvp-hero-cta" type="button" onClick={onCta}>
          {cta}
        </button>
      </div>
      <div className="rsvp-hero-visual">
        <div className="rsvp-hero-photo">
          <img src={photoSrc} alt="" />
        </div>
        <div className="rsvp-hero-badge" aria-hidden>
          {badge.split("\n").map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
