import { Outlet } from "react-router-dom";
import { RemoteWelcomeFilm } from "./RemoteWelcomeFilm";

export function RemoteShell() {
  return (
    <>
      <Outlet />
      <RemoteWelcomeFilm />
    </>
  );
}
