// Stroke icons used in the design (24×24 grid, currentColor).
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number; weight?: number };

function Svg({ size = 20, weight = 1.8, children, ...rest }: P) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={weight}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      {children}
    </svg>
  );
}

export const HomeIcon = (p: P) => (
  <Svg {...p}>
    <path d="M4 10.5 12 4l8 6.5V20H14.5v-6h-5v6H4z" />
  </Svg>
);
export const ListIcon = (p: P) => (
  <Svg {...p}>
    <path d="M4 6.5h16M4 12h16M4 17.5h10" />
  </Svg>
);
export const PieIcon = (p: P) => (
  <Svg {...p}>
    <path d="M11 4a8 8 0 1 0 9 9h-9z" />
    <path d="M14.5 3.6A8 8 0 0 1 20.4 9.5h-5.9z" />
  </Svg>
);
export const CardIcon = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
    <path d="M3 10h18" />
  </Svg>
);
export const PlusIcon = (p: P) => (
  <Svg weight={2.2} {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);
export const ChevronDown = (p: P) => (
  <Svg weight={2} {...p}>
    <path d="M6 9l6 6 6-6" />
  </Svg>
);
export const ChevronLeft = (p: P) => (
  <Svg weight={2} {...p}>
    <path d="M15 5l-7 7 7 7" />
  </Svg>
);
export const ChevronRight = (p: P) => (
  <Svg weight={2} {...p}>
    <path d="M9 6l6 6-6 6" />
  </Svg>
);
export const CheckIcon = (p: P) => (
  <Svg weight={2.2} {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Svg>
);
export const LogoutIcon = (p: P) => (
  <Svg {...p}>
    <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 8l-4 4 4 4M6 12h10" />
  </Svg>
);
export const BellIcon = (p: P) => (
  <Svg {...p}>
    <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z" />
    <path d="M10 21a2 2 0 0 0 4 0" />
  </Svg>
);
export const GearIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </Svg>
);
export const EyeIcon = (p: P) => (
  <Svg weight={1.9} {...p}>
    <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="2.8" />
  </Svg>
);
export const EyeOffIcon = (p: P) => (
  <Svg weight={1.9} {...p}>
    <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="2.8" />
    <path d="M4 20 20 4" />
  </Svg>
);
/** Half-filled circle: the design's appearance (light/dark) button. */
export const ThemeIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" />
  </Svg>
);
export const UploadIcon =(p: P) => (
  <Svg weight={1.9} {...p}>
    <path d="M12 16V4M7 9l5-5 5 5M5 20h14" />
  </Svg>
);
