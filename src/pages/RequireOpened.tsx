import { Navigate, Outlet } from "react-router-dom";
import { useGuest } from "../context/GuestSession";

export function RequireOpened() {
  const { opened } = useGuest();
  if (!opened) return <Navigate to="/invite" replace />;
  return <Outlet />;
}
