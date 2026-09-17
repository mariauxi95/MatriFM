import { Navigate, Outlet, useParams } from "react-router-dom";
import { useGuest } from "../context/GuestSession";

export function RequireOpened() {
  const { opened } = useGuest();
  const { code } = useParams();
  if (!opened) return <Navigate to={`/invite/${code}`} replace />;
  return <Outlet />;
}
