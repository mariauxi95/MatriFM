import type { ReactNode } from "react";

type Props = {
  selected?: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
};

export function ChoiceChip({ selected, onClick, children, className = "" }: Props) {
  return (
    <button
      type="button"
      className={`rsvp-choice${selected ? " is-selected" : ""}${className ? ` ${className}` : ""}`}
      aria-pressed={selected}
      onClick={onClick}
    >
      <span className="rsvp-choice-check" aria-hidden>
        {selected ? "✓" : ""}
      </span>
      <span>{children}</span>
    </button>
  );
}
