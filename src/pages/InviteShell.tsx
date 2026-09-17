import { useEffect } from "react";
import { Outlet, useParams } from "react-router-dom";
import { useGuest } from "../context/GuestSession";
import { fetchGuest, findLocalGuest } from "../lib/sheets";

export function InviteShell() {
  const { code = "" } = useParams();
  const { setGuest } = useGuest();

  useEffect(() => {
    const local = findLocalGuest(code);
    if (local) setGuest(local);

    let alive = true;
    fetchGuest(code)
      .then((result) => {
        if (!alive || !result) return;
        setGuest(result);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [code, setGuest]);

  return <Outlet />;
}
