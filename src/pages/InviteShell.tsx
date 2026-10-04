import { Navigate, Outlet } from "react-router-dom";
import { WelcomeFilm } from "../components/WelcomeFilm";
import { useGuest } from "../context/GuestSession";

export function InviteShell() {
  const { guest, ready } = useGuest();
  if (!ready) return null;
  if (!guest) return <Navigate to="/" replace />;
  return (
    <>
      <Outlet />
      <WelcomeFilm />
    </>
  );
}
