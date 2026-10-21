import { assetUrl } from "../../lib/assets";
import { liveCelebration as copy } from "./liveContent";
import { LIVE_STREAM_URL, reminderHref } from "./stream";

function Icon({ name }: { name: "date" | "time" | "play" | "arrow" | "chat" | "toast" | "heart" | "check" }) {
  const common = { viewBox: "0 0 24 24", width: 22, height: 22, "aria-hidden": true as const, fill: "none" };
  if (name === "date") {
    return (
      <svg {...common}>
        <rect x="3.5" y="5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 3.5v3M16 3.5v3M3.5 10h17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "time") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 8v4.5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "play") {
    return (
      <svg {...common}>
        <path d="M8 6.2v11.6l10-5.8L8 6.2Z" fill="currentColor" />
      </svg>
    );
  }
  if (name === "arrow") {
    return (
      <svg {...common}>
        <path d="M5 12h12M13 7.5 17.5 12 13 16.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "chat") {
    return (
      <svg {...common}>
        <path
          d="M6 16.5 4.5 19.5c-.2.4.2.8.6.6L8.4 18.6A8 8 0 1 0 6 16.5Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (name === "toast") {
    return (
      <svg {...common}>
        <path d="M8 4h8l-.8 7.2a3.2 3.2 0 0 1-6.4 0L8 4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M12 14.4V19M9.2 19.5h5.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "heart") {
    return (
      <svg {...common}>
        <path
          d="M12 19s-6.2-3.7-6.2-8.1A3.4 3.4 0 0 1 12 8.6a3.4 3.4 0 0 1 6.2 2.3C18.2 15.3 12 19 12 19Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8.5 12.2 11 14.6 15.6 9.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function RemoteLive() {
  const stream = LIVE_STREAM_URL.trim();
  const reminder = reminderHref();

  return (
    <main className="remote-live-page">
      <section className="page-banner" aria-hidden>
        <video src={assetUrl("/videos/playa_2.mp4")} autoPlay muted loop playsInline />
      </section>
      <div className="page">
        <section className="venue-split live-hero" aria-labelledby="live-title">
          <div className="venue-photo live-photo">
            <img src={assetUrl("/images/gallery/live-juntos.jpg")} alt={copy.photoAlt} />
          </div>
          <div className="live-copy">
            <p className="eyebrow">{copy.eyebrow}</p>
            <h1 id="live-title">
              {copy.titleStart} <mark className="highlight">{copy.titleMark}</mark>
            </h1>
            <ul className="live-badges">
              {copy.badges.map((badge) => (
                <li key={badge.id}>
                  <Icon name={badge.id === "date" ? "date" : "time"} />
                  <span>{copy[badge.valueKey]}</span>
                </li>
              ))}
            </ul>
            {copy.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <div className="live-actions">
              {stream ? (
                <a className="btn live-watch" href={stream} target="_blank" rel="noreferrer">
                  <Icon name="play" />
                  {copy.watchCta}
                  <Icon name="arrow" />
                </a>
              ) : (
                <button className="btn live-watch" type="button" disabled>
                  <Icon name="play" />
                  {copy.watchCta}
                  <Icon name="arrow" />
                </button>
              )}
              <a className="btn live-remind" href={reminder} target="_blank" rel="noreferrer">
                <Icon name="date" />
                {copy.reminderCta}
              </a>
              {stream ? null : (
                <p className="live-pending" role="status">
                  {copy.pending}
                </p>
              )}
            </div>
          </div>
        </section>

        <ul className="live-cards">
          {copy.cards.map((card) => (
            <li key={card.id} className="live-card">
              <span className="live-card-icon">
                <Icon name={card.icon} />
              </span>
              <div>
                <h2>{card.title}</h2>
                <p>{card.text}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="live-split">
          <section className="live-kit" aria-labelledby="live-kit-title">
            <h2 id="live-kit-title">{copy.kitTitle}</h2>
            <ul>
              {copy.kit.map((item) => (
                <li key={item}>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="live-notes" aria-labelledby="live-notes-title">
            <h2 id="live-notes-title">{copy.notesTitle}</h2>
            <ul>
              {copy.notes.map((item) => (
                <li key={item}>
                  <Icon name="check" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
