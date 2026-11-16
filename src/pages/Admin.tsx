import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useGuest } from "../context/GuestSession";
import { defaultSettings } from "../lib/money";
import {
  adminList,
  adminListActivitySignups,
  adminListHouseholds,
  adminListRsvps,
  adminTourList,
  fetchSettings,
  plannerListHouseholds,
  plannerTourList,
  type ActivitySignup,
  type AdminHousehold,
  type AdminRsvp,
  type AdminTourReservation,
} from "../lib/sheets";
import type { Contribution, PaymentSettings } from "../types";
import { AdminDesk } from "./admin/AdminDesk";
import "../styles/admin.css";

export function Admin() {
  const { ready, isAdmin, isPlanner, guest, signOut } = useGuest();
  const staff = isAdmin || isPlanner;
  const [error, setError] = useState("");
  const [households, setHouseholds] = useState<AdminHousehold[]>([]);
  const [rsvps, setRsvps] = useState<AdminRsvp[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [reservations, setReservations] = useState<AdminTourReservation[]>([]);
  const [signups, setSignups] = useState<ActivitySignup[]>([]);
  const [settings, setSettings] = useState<PaymentSettings>(defaultSettings);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    if (isPlanner) {
      // The planner never loads gifts or payment settings, and gets no emails.
      const [nextHouseholds, nextRsvps, nextTours, nextSignups] = await Promise.all([
        plannerListHouseholds(),
        adminListRsvps(),
        plannerTourList(),
        adminListActivitySignups(),
      ]);
      setHouseholds(nextHouseholds);
      setRsvps(nextRsvps);
      setContributions([]);
      setReservations(nextTours.reservations);
      setSignups(nextSignups);
      return;
    }
    const [nextHouseholds, nextRsvps, nextPayments, nextTours, nextSignups, nextSettings] = await Promise.all([
      adminListHouseholds(),
      adminListRsvps(),
      adminList(),
      adminTourList(),
      adminListActivitySignups(),
      fetchSettings(),
    ]);
    setHouseholds(nextHouseholds);
    setRsvps(nextRsvps);
    setContributions(nextPayments.contributions);
    setReservations(nextTours.reservations);
    setSignups(nextSignups);
    setSettings(nextSettings);
  }, [isPlanner]);

  useEffect(() => {
    if (!ready || !staff) return;
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
  }, [ready, staff, reload]);

  if (!ready) return <main className="admin-desk" />;
  if (!staff) return <Navigate to={guest ? "/invite" : "/"} replace />;
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
      signups={signups}
      settings={settings}
      readOnly={!isAdmin}
      onSettings={setSettings}
      onReload={reload}
      onSignOut={() => void signOut()}
    />
  );
}
