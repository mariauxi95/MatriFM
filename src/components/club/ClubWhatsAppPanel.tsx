import { CLUB_WHATSAPP_URL } from "../../data/club";
import { useLang } from "../../context/Language";

export function ClubWhatsAppPanel() {
  const { t } = useLang();

  return (
    <div className="club-wa-panel">
      <p className="lede">{t("clubText")}</p>
      <section className="card club-wa">
        <div className="card-body">
          <p className="club-wa-kicker">{t("clubKicker")}</p>
          <h2 className="club-wa-title">{t("clubWaTitle")}</h2>
          <p className="club-wa-lead">{t("clubWaLead")}</p>
          <ul className="club-wa-list">
            <li>{t("clubWaBullet1")}</li>
            <li>{t("clubWaBullet2")}</li>
            <li>{t("clubWaBullet3")}</li>
          </ul>
          <a
            className="btn club-wa-cta"
            href={CLUB_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg className="club-wa-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden>
              <path
                fill="currentColor"
                d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.86 9.86 0 0 0 12.04 2m0 1.82c4.46 0 8.09 3.63 8.09 8.09 0 4.46-3.63 8.09-8.09 8.09-1.42 0-2.8-.37-4.01-1.08l-.29-.17-3.12.82.83-3.04-.19-.31a8.03 8.03 0 0 1-1.22-4.31c0-4.46 3.63-8.09 8.09-8.09m4.47 10.65c-.24-.12-1.44-.71-1.66-.79-.22-.08-.38-.12-.54.12-.16.24-.62.79-.76.95-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.01-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.48-.39-.41-.54-.42h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2 0 1.18.86 2.32.98 2.48.12.16 1.69 2.58 4.1 3.62.57.25 1.02.4 1.37.51.58.18 1.1.16 1.52.1.46-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28"
              />
            </svg>
            {t("clubWaCta")}
          </a>
          <p className="club-wa-note">{t("clubWaNote")}</p>
        </div>
      </section>
    </div>
  );
}
