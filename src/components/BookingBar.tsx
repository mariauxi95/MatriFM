import { Link } from "react-router-dom";
import { useGuest } from "../context/GuestSession";
import { useLang } from "../context/Language";

export function BookingBar() {
  const { t } = useLang();
  const { guest } = useGuest();
  return (
    <section className="booking">
      <div className="booking-grid">
        <div className="booking-cell">
          <span>{t("from")}</span>
          <b>{guest?.displayName ?? "—"}</b>
        </div>
        <div className="booking-cell">
          <span>{t("to")}</span>
          <b>{t("destination")}</b>
        </div>
        <div className="booking-cell">
          <span>{t("dates")}</span>
          <b>{t("dateRange")}</b>
        </div>
        <div className="booking-cell">
          <span>{t("passengers")}</span>
          <b>{guest?.guestLimit ?? 1}</b>
        </div>
        <Link className="btn booking-go" to="../rsvp">
          {t("confirm")}
        </Link>
      </div>
    </section>
  );
}
