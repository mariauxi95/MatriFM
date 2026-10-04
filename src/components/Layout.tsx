import { assetUrl } from "../lib/assets";
import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useGuest } from "../context/GuestSession";
import { useLang } from "../context/Language";
import { LangToggle } from "./LangToggle";
import { openWelcomeFilm } from "./WelcomeFilm";

const links = [
  { to: "home", key: "navHome" as const },
  { to: "lugar", key: "navVenue" as const },
  { to: "itinerario", key: "navItinerary" as const },
  { to: "regalos", key: "navGifts" as const },
  { to: "viaje", key: "navTravel" as const },
];

export function Layout() {
  const { t } = useLang();
  const { isAdmin, signOut, hasReply } = useGuest();
  const navigate = useNavigate();
  const location = useLocation();
  const mainRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  function close() {
    setOpen(false);
  }

  useEffect(() => {
    setOpen(false);
    mainRef.current?.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <div className="layout">
      <header className="topbar">
        <NavLink to="home" className="brand" onClick={close}>
          <img className="brand-mark" src={assetUrl("/images/monograma.png")} alt="MATRI FM" />
          <span className="brand-text">
            <b>{t("brand")}</b>
            <small>{t("clubLine")}</small>
          </span>
        </NavLink>
        <nav className="desktop-nav" aria-label="Main">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to}>
              {t(link.key)}
            </NavLink>
          ))}
        </nav>
        <div className="topbar-end">
          <button className="story-pill" type="button" onClick={() => openWelcomeFilm()}>
            <span className="story-pill-play" aria-hidden>
              ▶
            </span>
            <span className="story-pill-label">{t("welcomeFilm")}</span>
          </button>
          <LangToggle />
          {isAdmin ? (
            <NavLink className="btn ghost nav-cta" to="/admin" onClick={close}>
              {t("adminLink")}
            </NavLink>
          ) : null}
          <NavLink id="nav-my-rsvp" className="btn ghost nav-cta" to="rsvp" onClick={close}>
            {t(hasReply ? "myRsvp" : "confirm")}
          </NavLink>
          <button
            className={`nav-burger${open ? " is-open" : ""}`}
            type="button"
            aria-expanded={open}
            aria-label={t("navMenu")}
            onClick={() => setOpen((value) => !value)}
          >
            <span />
            <span />
            <span />
          </button>
          <button
            className="nav-signout"
            type="button"
            aria-label={t("signOut")}
            title={t("signOut")}
            onClick={() => {
              close();
              void signOut().then(() => navigate("/"));
            }}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path
                d="M10 7V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M15 12H4M7 9l-3 3 3 3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </header>
      {open ? (
        <nav className="mobile-menu" aria-label={t("navMenu")}>
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} onClick={close}>
              {t(link.key)}
            </NavLink>
          ))}
          <NavLink className="btn ghost nav-cta" to="rsvp" onClick={close}>
            {t(hasReply ? "myRsvp" : "confirm")}
          </NavLink>
          {isAdmin ? (
            <NavLink className="btn ghost nav-cta" to="/admin" onClick={close}>
              {t("adminLink")}
            </NavLink>
          ) : null}
        </nav>
      ) : null}
      <div className="layout-main" ref={mainRef}>
        <Outlet />
      </div>
    </div>
  );
}
