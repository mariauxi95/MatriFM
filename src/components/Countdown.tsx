import { Fragment, useEffect, useState } from "react";
import { useLang } from "../context/Language";

const TARGET = new Date("2027-03-20T16:45:00-05:00");

function parts(nowMs: number) {
  const now = new Date(nowMs);
  if (now >= TARGET) return { months: 0, days: 0, hours: 0, mins: 0 };

  let months = (TARGET.getFullYear() - now.getFullYear()) * 12 + (TARGET.getMonth() - now.getMonth());
  const afterMonths = new Date(now);
  afterMonths.setMonth(afterMonths.getMonth() + months);
  if (afterMonths > TARGET) {
    months -= 1;
    afterMonths.setTime(now.getTime());
    afterMonths.setMonth(afterMonths.getMonth() + months);
  }

  const remain = Math.max(0, TARGET.getTime() - afterMonths.getTime());
  return {
    months,
    days: Math.floor(remain / 86400000),
    hours: Math.floor((remain % 86400000) / 3600000),
    mins: Math.floor((remain % 3600000) / 60000),
  };
}

export function Countdown() {
  const { t } = useLang();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 15000);
    return () => window.clearInterval(id);
  }, []);

  const value = parts(now);
  const items = [
    [value.months, t("months")],
    [value.days, t("days")],
    [value.hours, t("hours")],
    [value.mins, t("mins")],
  ] as const;

  return (
    <section className="countdown-block">
      <p className="eyebrow">{t("countdown")}</p>
      <div className="countdown">
        {items.map(([amount, label], index) => (
          <Fragment key={label}>
            {index > 0 ? (
              <span className="countdown-heart" aria-hidden>
                ♥
              </span>
            ) : null}
            <div>
              <b>{amount}</b>
              <span>{label}</span>
            </div>
          </Fragment>
        ))}
      </div>
    </section>
  );
}
