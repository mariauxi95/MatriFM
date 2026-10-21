import { assetUrl } from "../../lib/assets";
import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useLang } from "../../context/Language";
import { LangToggle } from "../../components/LangToggle";
import { openRemoteWelcomeFilm } from "./RemoteWelcomeFilm";

const links = [
  { to: "home", key: "navHome" as const },
  { to: "en-vivo", key: "remoteLiveNav" as const },
];

export function RemoteLayout() {
  const { t } = useLang();
  const location = useLocation();
  const mainRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [menuTop, setMenuTop] = useState(76);

  function close() {
    setOpen(false);
  }

  useEffect(() => {
    setOpen(false);
    mainRef.current?.scrollTo({ top: 0 });
  }, [location.pathname]);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const sync = () => setMenuTop(el.offsetHeight);
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="layout">
      <header className="topbar" ref={headerRef}>
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
          <button className="story-pill" type="button" onClick={() => openRemoteWelcomeFilm()}>
            <span className="story-pill-play" aria-hidden>
              ▶
            </span>
            <span className="story-pill-label">{t("welcomeFilm")}</span>
          </button>
          <LangToggle />
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
        <>
          <button className="mobile-menu-backdrop" type="button" aria-label={t("close")} onClick={close} />
          <nav
            className="mobile-menu"
            style={{ top: menuTop, maxHeight: `calc(100dvh - ${menuTop}px)` }}
            aria-label={t("navMenu")}
          >
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} onClick={close}>
                {t(link.key)}
              </NavLink>
            ))}
            <button
              className="mobile-menu-story"
              type="button"
              onClick={() => {
                close();
                openRemoteWelcomeFilm();
              }}
            >
              {t("welcomeFilm")}
            </button>
          </nav>
        </>
      ) : null}
      <div className="layout-main" ref={mainRef}>
        <Outlet />
      </div>
    </div>
  );
}
