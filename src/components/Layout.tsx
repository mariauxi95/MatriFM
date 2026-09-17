import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useLang } from "../context/Language";
import { LangToggle } from "./LangToggle";

const links = [
  { to: "home", key: "navHome" as const },
  { to: "lugar", key: "navVenue" as const },
  { to: "itinerario", key: "navItinerary" as const },
  { to: "regalos", key: "navGifts" as const },
  { to: "viaje", key: "navTravel" as const },
  { to: "boda", key: "navStory" as const },
];

export function Layout() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);

  function close() {
    setOpen(false);
  }

  return (
    <div className="layout">
      <header className="topbar">
        <NavLink to="home" className="brand" onClick={close}>
          <img className="brand-mark" src="/images/monograma.png" alt="MATRI FM" />
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
          <LangToggle />
          <NavLink className="btn nav-cta" to="rsvp" onClick={close}>
            {t("confirm")}
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
        </div>
      </header>
      {open ? (
        <nav className="mobile-menu" aria-label={t("navMenu")}>
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} onClick={close}>
              {t(link.key)}
            </NavLink>
          ))}
          <NavLink className="btn nav-cta" to="rsvp" onClick={close}>
            {t("confirm")}
          </NavLink>
        </nav>
      ) : null}
      <Outlet />
    </div>
  );
}
