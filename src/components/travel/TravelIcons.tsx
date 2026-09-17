import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function BaseIcon({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" width="36" height="36" fill="none" aria-hidden {...props}>
      {children}
    </svg>
  );
}

export function IconPassport(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8.5 16.5h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </BaseIcon>
  );
}

export function IconBus(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="4" y="4" width="16" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 11h16M8 17v2.5M16 17v2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="14" r="1" fill="currentColor" />
      <circle cx="16" cy="14" r="1" fill="currentColor" />
    </BaseIcon>
  );
}

export function IconAccessibility(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="5" r="1.75" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 10.5h8M10 10.5l-1.5 8.5M14 10.5l1.5 8.5M9.5 15h5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </BaseIcon>
  );
}

export function IconCompass(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path d="m14.8 9.2-1.6 4.6-4.6 1.6 1.6-4.6 4.6-1.6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </BaseIcon>
  );
}

export function IconBed(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path
        d="M3 18V9.5A1.5 1.5 0 0 1 4.5 8H10a3 3 0 0 1 3 3v1h6.5A1.5 1.5 0 0 1 21 13.5V18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M3 14h18M3 18h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </BaseIcon>
  );
}

export function IconWhatsApp(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path
        fill="currentColor"
        d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.86 9.86 0 0 0 12.04 2m0 1.82c4.46 0 8.09 3.63 8.09 8.09 0 4.46-3.63 8.09-8.09 8.09-1.42 0-2.8-.37-4.01-1.08l-.29-.17-3.12.82.83-3.04-.19-.31a8.03 8.03 0 0 1-1.22-4.31c0-4.46 3.63-8.09 8.09-8.09m4.47 10.65c-.24-.12-1.44-.71-1.66-.79-.22-.08-.38-.12-.54.12-.16.24-.62.79-.76.95-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.01-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.48-.39-.41-.54-.42h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2 0 1.18.86 2.32.98 2.48.12.16 1.69 2.58 4.1 3.62.57.25 1.02.4 1.37.51.58.18 1.1.16 1.52.1.46-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28"
      />
    </BaseIcon>
  );
}
