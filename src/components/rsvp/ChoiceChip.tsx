import type { ReactNode } from "react";

type Props = {
  selected?: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
  /** Square checkbox affordance for multi-select options */
  multi?: boolean;
  disabled?: boolean;
};

export function ChoiceChip({
  selected,
  onClick,
  children,
  className = "",
  multi = false,
  disabled = false,
}: Props) {
  return (
    <button
      type="button"
      className={`rsvp-choice${multi ? " is-multi" : ""}${selected ? " is-selected" : ""}${disabled ? " is-disabled" : ""}${className ? ` ${className}` : ""}`}
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="rsvp-choice-check" aria-hidden>
        {selected ? "✓" : ""}
      </span>
      <span>{children}</span>
    </button>
  );
}
