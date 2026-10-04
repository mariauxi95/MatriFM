import { useEffect, useRef, useState, type ReactNode, type SVGProps } from "react";
import {
  afterStay,
  afterWhatsAppHref,
  type AfterFactIcon,
  type AfterGalleryItem,
} from "../../data/afterStay";
import { assetUrl } from "../../lib/assets";

function Icon({ children, ...props }: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      {children}
    </svg>
  );
}

function PriceIcon() {
  return (
    <Icon className="after-ico is-price">
      <path d="M3.8 12.2 12 4h7.2v7.2l-8.2 8.2a1.6 1.6 0 0 1-2.3 0L3.8 14.5a1.6 1.6 0 0 1 0-2.3Z" />
      <circle cx="16.2" cy="7.8" r="1" fill="currentColor" stroke="none" />
    </Icon>
  );
}

function BreakfastIcon() {
  return (
    <Icon className="after-ico is-breakfast">
      <path d="M6.2 9h9.2v4.6A3.8 3.8 0 0 1 11.6 17.4H9.4A3.8 3.8 0 0 1 5.6 13.6V9h.6Z" />
      <path d="M15.4 10.2h1.3a2.2 2.2 0 0 1 0 4.4h-1.3" />
      <path d="M8.4 5.4c.45.65.45 1.2 0 1.85M11.3 5.4c.45.65.45 1.2 0 1.85" />
    </Icon>
  );
}

function WhatsAppIcon() {
  return (
    <Icon className="after-cta-icon">
      <path d="M20 11.4a8.4 8.4 0 0 1-12.5 7.3L4 19.6l.9-3.4A8.4 8.4 0 1 1 20 11.4Z" />
      <path d="M9.1 9.4c.15-.35.35-.35.6-.35h.45c.15 0 .35 0 .45.4.15.45.55 1.5.55 1.6 0 .15 0 .3-.15.45l-.25.3c-.1.1-.2.25 0 .5.2.3.75 1.2 1.6 1.7.65.35.9.35 1.1.25l.35-.35c.15-.15.3-.1.45-.05l1 .45c.2.1.35.2.35.4 0 .55-.55 1.1-1.1 1.2-.45.1-1 .1-2.2-.35-1.4-.55-2.4-1.95-2.5-2.05-.1-.1-1-1.3-1-2.5 0-1.1.65-1.65.9-1.95Z" />
    </Icon>
  );
}

function BookingIcon() {
  return (
    <Icon className="after-cta-icon">
      <rect x="4.2" y="5.2" width="15.6" height="14.2" rx="2" />
      <path d="M8 3.8v3M16 3.8v3M4.2 9.4h15.6" />
      <path d="m8.6 14.2 2.1 2.1 4.7-4.8" />
    </Icon>
  );
}

function WebIcon() {
  return (
    <Icon className="after-cta-icon">
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12h16M12 4c2.2 2.3 3.3 5 3.3 8s-1.1 5.7-3.3 8c-2.2-2.3-3.3-5-3.3-8s1.1-5.7 3.3-8Z" />
    </Icon>
  );
}

function FactIcon({ name }: { name: AfterFactIcon }) {
  if (name === "price") return <PriceIcon />;
  if (name === "breakfast") return <BreakfastIcon />;
  if (name === "pool") {
    return (
      <Icon className="after-ico is-pool">
        <path d="M3.5 15c1.5 1.15 2.7 1.15 4.2 0s2.7-1.15 4.2 0 2.7 1.15 4.2 0 2.7-1.15 4.2 0" />
        <path d="M3.5 18.4c1.5 1.15 2.7 1.15 4.2 0s2.7-1.15 4.2 0 2.7 1.15 4.2 0 2.7-1.15 4.2 0" />
      </Icon>
    );
  }
  return (
    <Icon className="after-ico is-in">
      <circle cx="12" cy="12" r="7.2" />
      <path d="M12 8.2V12l2.6 1.7" />
    </Icon>
  );
}

function GalleryShot({ item, onOpen }: { item: AfterGalleryItem; onOpen: (item: AfterGalleryItem) => void }) {
  if (!item.src) return null;

  return (
    <figure className={`after-shot${item.feature ? " is-feature" : ""}`}>
      <button type="button" className="after-shot-btn" onClick={() => onOpen(item)} aria-label={`Ampliar foto: ${item.label}`}>
        <img src={assetUrl(item.src)} alt={item.alt} loading="lazy" />
      </button>
      <figcaption>{item.label}</figcaption>
    </figure>
  );
}

function GalleryRail({
  photos,
  onOpen,
}: {
  photos: AfterGalleryItem[];
  onOpen: (item: AfterGalleryItem) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  function updateEdges() {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdges({ start: el.scrollLeft <= 4, end: max <= 4 || el.scrollLeft >= max - 4 });
  }

  useEffect(() => {
    updateEdges();
    const el = scrollerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(updateEdges);
    observer.observe(el);
    return () => observer.disconnect();
  }, [photos.length]);

  function move(direction: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(".after-shot");
    const gap = 12;
    const distance = (card?.offsetWidth ?? Math.round(el.clientWidth * 0.8)) + gap;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: direction * distance, behavior: reduce ? "auto" : "smooth" });
  }

  if (photos.length === 0) return null;

  return (
    <div className="after-gallery-rail">
      <button
        type="button"
        className="after-gallery-arrow is-prev"
        aria-label="Foto anterior"
        disabled={edges.start}
        onClick={() => move(-1)}
      >
        ‹
      </button>
      <div
        className="after-gallery"
        ref={scrollerRef}
        aria-label="Fotos de Hotel Del Mar"
        onScroll={updateEdges}
      >
        {photos.map((item) => (
          <GalleryShot key={item.id} item={item} onOpen={onOpen} />
        ))}
      </div>
      <button
        type="button"
        className="after-gallery-arrow is-next"
        aria-label="Foto siguiente"
        disabled={edges.end}
        onClick={() => move(1)}
      >
        ›
      </button>
    </div>
  );
}

function Lightbox({ item, onClose }: { item: AfterGalleryItem; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
  }, []);

  if (!item.src) return null;

  return (
    <dialog
      ref={ref}
      className="after-lightbox"
      aria-label={item.alt}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) ref.current?.close();
      }}
    >
      <figure className="after-lightbox-frame" onClick={(event) => event.stopPropagation()}>
        <img src={assetUrl(item.src)} alt={item.alt} />
        <button type="button" className="after-lightbox-close" onClick={() => ref.current?.close()}>
          Cerrar
        </button>
        <figcaption>{item.label}</figcaption>
      </figure>
    </dialog>
  );
}

export function AfterSection() {
  const { hotel, reservation } = afterStay;
  const [openId, setOpenId] = useState<string | null>(null);
  const photos = afterStay.gallery.filter((item) => item.src);
  const openItem = photos.find((item) => item.id === openId);

  return (
    <div className="after-stay">
      <header className="after-head">
        <h2>{afterStay.title}</h2>
        <p className="after-sub">{afterStay.subtitle}</p>
      </header>

      <div className="after-intro">
        {afterStay.intro.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      <article className="after-hotel">
        <div className="after-hotel-main">
          <h3>{hotel.name}</h3>
          <p>
            <b>{hotel.locationLabel}</b>
            <span>{hotel.location}</span>
          </p>
          <p>
            <b>{hotel.datesLabel}</b>
            <span>{hotel.dates}</span>
          </p>
        </div>
        <ul className="after-facts">
          {hotel.facts.map((fact) => (
            <li key={fact.label} className={fact.icon === "price" ? "is-price" : undefined}>
              <FactIcon name={fact.icon} />
              <span>{fact.label}</span>
            </li>
          ))}
        </ul>
      </article>

      <div className="after-ctas">
        <a className="btn" href={afterWhatsAppHref()} target="_blank" rel="noreferrer">
          <WhatsAppIcon />
          {reservation.whatsapp.label}
        </a>
        <a className="btn secondary" href={reservation.booking.url} target="_blank" rel="noreferrer">
          <BookingIcon />
          {reservation.booking.label}
        </a>
        <a className="btn tertiary" href={reservation.website.url} target="_blank" rel="noreferrer">
          <WebIcon />
          {reservation.website.label}
        </a>
      </div>

      <p className="after-price-note">{afterStay.priceNote}</p>

      <GalleryRail photos={photos} onOpen={(next) => setOpenId(next.id)} />

      {openItem ? <Lightbox item={openItem} onClose={() => setOpenId(null)} /> : null}
    </div>
  );
}
