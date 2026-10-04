import { useState, type FormEvent, type SVGProps } from "react";
import { useGuest } from "../../context/GuestSession";
import { formatCop, formatTourPrice, tourPaymentUrl, tours, type Tour } from "../../data/tours";
import { submitTourReservation } from "../../lib/sheets";

type Step = "details" | "form" | "success";

function Icon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden {...props}>
      {children}
    </svg>
  );
}

function IconDate() {
  return (
    <Icon>
      <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 3.5v3M16 3.5v3M4 10h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </Icon>
  );
}

function IconTime() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 8v4.5l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </Icon>
  );
}

function IconPrice() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7.5v9M9.5 9.5c.6-.8 1.4-1.2 2.5-1.2 1.5 0 2.5.8 2.5 2s-1 1.8-2.5 1.8-2.5.8-2.5 2 1 2 2.5 2c1.1 0 1.9-.4 2.5-1.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </Icon>
  );
}

function IconPin() {
  return (
    <Icon>
      <path
        d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="11" r="1.8" fill="currentColor" />
    </Icon>
  );
}

export function ToursSection({ onBack }: { onBack: () => void }) {
  const { guest } = useGuest();
  const [tour, setTour] = useState<Tour | null>(null);
  const [step, setStep] = useState<Step>("details");

  function open(next: Tour) {
    setTour(next);
    setStep("details");
  }

  function close() {
    setTour(null);
    setStep("details");
  }

  return (
    <section className="travel-section tours-section" id="travel-tours">
      <h2>¿Seguimos celebrando?</h2>
      <div className="tours-intro">
        <p>
          Después de la boda, la celebración continúa. Vamos a sumarnos a algunos tours y nos encantaría que quienes
          quieran puedan acompañarnos. Cada actividad es opcional: elige según tus tiempos, gustos y presupuesto.
        </p>
        <ol className="tours-steps">
          <li>
            <span>1</span>
            <p>Revisa los detalles de cada experiencia.</p>
          </li>
          <li>
            <span>2</span>
            <p>Inscríbete y completa tu reserva desde la ventana.</p>
          </li>
          <li>
            <span>3</span>
            <p>Entre noviembre y diciembre te enviaremos el enlace de pago por el WhatsApp de la tripulación.</p>
          </li>
          <li>
            <span>4</span>
            <p>Paga y confirma tu reserva.</p>
          </li>
        </ol>
        <p className="tours-intro-note">
          Con la reserva anticipada podremos saber quiénes se suman y coordinarnos mejor como grupo.
        </p>
      </div>

      <div className="tour-grid">
        {tours.map((item) => (
          <article className="tour-card" key={item.id}>
            <img src={item.image} alt="" />
            <div className="tour-body">
              <h3>{item.title}</h3>
              <p className="tour-subtitle">{item.subtitle}</p>
              <ul className="tour-meta">
                <li>
                  <IconDate />
                  <span>{item.date}</span>
                </li>
                <li>
                  <IconTime />
                  <span>{item.time}</span>
                </li>
                <li>
                  <IconPrice />
                  <span>{formatTourPrice(item)}</span>
                </li>
                <li>
                  <IconPin />
                  <span>{item.meetingPoint}</span>
                </li>
              </ul>
              <button className="btn" type="button" onClick={() => open(item)}>
                Ver detalles
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="tours-footnote">
        <h3>Reserva con anticipación</h3>
        <p>
          Inscribirte con tiempo nos ayudará a coordinarnos mejor con la agencia y organizar una experiencia más cómoda
          para todos.
        </p>
      </div>

      <button className="travel-back" type="button" onClick={onBack}>
        ↑ Volver al menú
      </button>

      {tour ? (
        <div className="drawer-root" onClick={close} role="presentation">
          <div
            className="drawer"
            role="dialog"
            aria-modal
            aria-labelledby="tour-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            {step === "details" ? (
              <TourDetails tour={tour} onClose={close} onJoin={() => setStep("form")} />
            ) : null}
            {step === "form" ? (
              <TourForm
                tour={tour}
                defaultName={guest?.fullName || guest?.displayName || ""}
                defaultEmail={guest?.email || ""}
                onBack={() => setStep("details")}
                onSaved={() => setStep("success")}
              />
            ) : null}
            {step === "success" ? <TourSuccess tour={tour} onClose={close} /> : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function TourDetails({ tour, onClose, onJoin }: { tour: Tour; onClose: () => void; onJoin: () => void }) {
  return (
    <>
      <p className="eyebrow">{tour.date}</p>
      <h2 id="tour-dialog-title">{tour.title}</h2>
      <p>{tour.subtitle}</p>
      <ul className="tour-meta">
        <li>
          <IconTime />
          <span>{tour.time}</span>
        </li>
        <li>
          <IconPrice />
          <span>{formatTourPrice(tour)}</span>
        </li>
        <li>
          <IconPin />
          <span>{tour.meetingPoint}</span>
        </li>
      </ul>
      {tour.sections?.length ? (
        tour.sections.map((section) => (
          <div className="tour-block" key={section.title}>
            <h3>{section.title}</h3>
            {section.body ? <p>{section.body}</p> : null}
            {section.items?.length ? (
              <ul className="tour-points">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ))
      ) : (
        <p>{tour.description}</p>
      )}
      {tour.note ? <p className="tour-note">{tour.note}</p> : null}
      <div className="choice-grid">
        <button className="btn ghost" type="button" onClick={onClose}>
          Cerrar
        </button>
        <button className="btn" type="button" onClick={onJoin}>
          Quiero sumarme
        </button>
      </div>
    </>
  );
}

function TourForm({
  tour,
  defaultName,
  defaultEmail,
  onBack,
  onSaved,
}: {
  tour: Tour;
  defaultName: string;
  defaultEmail: string;
  onBack: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [quantity, setQuantity] = useState(1);
  const [childrenCount, setChildrenCount] = useState(0);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const total = quantity * tour.pricePerPerson;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    const guestName = name.trim();
    const mail = email.trim();
    if (guestName.length < 3) {
      setError("Escribe tu nombre y apellido.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      setError("Escribe un email válido.");
      return;
    }
    if (!Number.isFinite(quantity) || quantity < 1) {
      setError("Indica al menos una persona.");
      return;
    }
    if (!Number.isFinite(childrenCount) || childrenCount < 0) {
      setError("El número de niños no puede ser negativo.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await submitTourReservation({
        guestName,
        email: mail,
        tourId: tour.id,
        tourName: tour.title,
        tourDate: tour.date,
        quantity,
        childrenCount,
        pricePerPerson: tour.pricePerPerson,
        totalAmount: total,
        paymentLink: tourPaymentUrl(tour),
      });
      onSaved();
    } catch {
      setError("No pudimos guardar tu inscripción. Inténtalo de nuevo.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <p className="eyebrow">Inscripción</p>
      <h2 id="tour-dialog-title">Quiero sumarme</h2>
      <label className="field">
        <span>Tour</span>
        <input readOnly value={tour.title} />
      </label>
      <label className="field">
        <span>Fecha</span>
        <input readOnly value={tour.date} />
      </label>
      <label className="field">
        <span>Precio por persona</span>
        <input readOnly value={formatTourPrice(tour)} />
      </label>
      <label className="field">
        <span>Nombre y apellido *</span>
        <input required value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
      </label>
      <label className="field">
        <span>Email *</span>
        <input
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
        />
      </label>
      <label className="field">
        <span>Número de personas *</span>
        <input
          required
          type="number"
          min={1}
          step={1}
          value={quantity}
          onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
        />
      </label>
      <label className="field">
        <span>Número de niños</span>
        <input
          type="number"
          min={0}
          step={1}
          value={childrenCount}
          onChange={(event) => setChildrenCount(Math.max(0, Number(event.target.value) || 0))}
        />
      </label>
      <p className="tour-total">
        Total estimado: <b>{formatCop(total)}</b>
      </p>
      {error ? <p className="error">{error}</p> : null}
      <div className="choice-grid">
        <button className="btn ghost" type="button" onClick={onBack} disabled={submitting}>
          Volver
        </button>
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? "Guardando…" : "Inscribirme"}
        </button>
      </div>
    </form>
  );
}

function TourSuccess({ tour, onClose }: { tour: Tour; onClose: () => void }) {
  const paymentUrl = tourPaymentUrl(tour);
  return (
    <div className="success">
      <h2>¡Ya estás en la lista! 🎉</h2>
      {paymentUrl ? (
        <>
          <p>Ahora solo falta completar el pago para confirmar tu reserva.</p>
          <a className="btn" href={paymentUrl} target="_blank" rel="noreferrer">
            Pagar y confirmar
          </a>
        </>
      ) : (
        <p>
          Tu inscripción quedó guardada. Entre noviembre y diciembre te enviaremos el enlace de pago por el WhatsApp de
          la tripulación.
        </p>
      )}
      <button className="btn ghost" type="button" onClick={onClose}>
        Cerrar
      </button>
    </div>
  );
}
