import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useGuest } from "../context/GuestSession";
import { defaultSettings } from "../lib/money";
import {
  adminList,
  adminListHouseholds,
  adminListRsvps,
  adminTourList,
  fetchSettings,
  type AdminHousehold,
  type AdminRsvp,
  type AdminTourReservation,
} from "../lib/sheets";
import type { Contribution, PaymentSettings } from "../types";
import { AdminDesk } from "./admin/AdminDesk";
import "../styles/admin.css";

export function Admin() {
  const { ready, isAdmin, guest, signOut } = useGuest();
  const [error, setError] = useState("");
  const [households, setHouseholds] = useState<AdminHousehold[]>([]);
  const [rsvps, setRsvps] = useState<AdminRsvp[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [reservations, setReservations] = useState<AdminTourReservation[]>([]);
  const [settings, setSettings] = useState<PaymentSettings>(defaultSettings);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    const [nextHouseholds, nextRsvps, nextPayments, nextTours, nextSettings] = await Promise.all([
      adminListHouseholds(),
      adminListRsvps(),
      adminList(),
      adminTourList(),
      fetchSettings(),
    ]);
    setHouseholds(nextHouseholds);
    setRsvps(nextRsvps);
    setContributions(nextPayments.contributions);
    setReservations(nextTours.reservations);
    setSettings(nextSettings);
  }, []);

  useEffect(() => {
    if (!ready || !isAdmin) return;
    let alive = true;
    reload()
      .then(() => {
        if (alive) setLoaded(true);
      })
      .catch(() => {
        if (alive) setError("No se pudo cargar la administración.");
      });
    return () => {
      alive = false;
    };
  }, [ready, isAdmin, reload]);

  if (!ready) return <main className="admin-desk" />;
  if (!isAdmin) return <Navigate to={guest ? "/invite" : "/"} replace />;
  if (!loaded && !error) return <main className="admin-desk" />;
  if (error) {
    return (
      <main className="admin-desk">
        <p className="admin-error">{error}</p>
      </main>
    );
  }

  return (
    <AdminDesk
      households={households}
      rsvps={rsvps}
      contributions={contributions}
      reservations={reservations}
      settings={settings}
      onSettings={setSettings}
      onReload={reload}
      onSignOut={() => void signOut()}
    />
  );
}
