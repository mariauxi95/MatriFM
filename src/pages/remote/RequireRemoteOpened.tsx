import { Navigate, Outlet } from "react-router-dom";
import { isRemoteOpened } from "./opened";

export function RequireRemoteOpened() {
  if (!isRemoteOpened()) return <Navigate to="/lejos" replace />;
  return <Outlet />;
}
