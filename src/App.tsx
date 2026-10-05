import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { GuestProvider } from "./context/GuestSession";
import { LanguageProvider } from "./context/Language";
import { Layout } from "./components/Layout";
import { Admin } from "./pages/Admin";
import { Cover } from "./pages/Cover";
import { Gate } from "./pages/Gate";
import { Gifts } from "./pages/Gifts";
import { Home } from "./pages/Home";
import { InviteShell } from "./pages/InviteShell";
import { Itinerary } from "./pages/Itinerary";
import { RequireOpened } from "./pages/RequireOpened";
import { Rsvp, RsvpEntry } from "./pages/Rsvp";
import { Story } from "./pages/Story";
import { Travel } from "./pages/Travel";
import { Venue } from "./pages/Venue";

function LegacyInviteRedirect() {
  const params = useParams();
  const location = useLocation();
  const rest = params["*"] ?? "";
  const pathname = rest ? `/invite/${rest}` : "/invite";
  return <Navigate to={{ pathname, search: location.search, hash: location.hash }} replace />;
}

function KeepFieldVisible() {
  useEffect(() => {
    function onFocus(event: globalThis.FocusEvent) {
      const target = event.target;
      if (
        !(target instanceof HTMLInputElement) &&
        !(target instanceof HTMLTextAreaElement) &&
        !(target instanceof HTMLSelectElement)
      ) {
        return;
      }
      if (target.disabled) return;
      if (target instanceof HTMLInputElement && (target.type === "checkbox" || target.type === "radio")) return;
      window.setTimeout(() => {
        target.scrollIntoView({ block: "center", inline: "nearest" });
      }, 320);
    }
    document.addEventListener("focusin", onFocus);
    return () => document.removeEventListener("focusin", onFocus);
  }, []);
  return null;
}

function ClubRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("../viaje#travel-club", { replace: true });
  }, [navigate]);
  return null;
}

export function App() {
  return (
    <LanguageProvider>
      <GuestProvider>
        <KeepFieldVisible />
        <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "") || undefined}>
          <Routes>
            <Route path="/" element={<Gate />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/invite" element={<InviteShell />}>
              <Route index element={<Cover />} />
              <Route element={<RequireOpened />}>
                <Route element={<Layout />}>
                  <Route path="home" element={<Home />} />
                  <Route path="rsvp" element={<RsvpEntry />} />
                  <Route path="rsvp/editar" element={<Rsvp />} />
                  <Route path="boda" element={<Story />} />
                  <Route path="lugar" element={<Venue />} />
                  <Route path="itinerario" element={<Itinerary />} />
                  <Route path="regalos" element={<Gifts />} />
                  <Route path="club" element={<ClubRedirect />} />
                  <Route path="viaje" element={<Travel />} />
                </Route>
              </Route>
            </Route>
            <Route path="/invite/:legacyCode/*" element={<LegacyInviteRedirect />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </GuestProvider>
    </LanguageProvider>
  );
}
