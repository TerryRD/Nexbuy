import type { SVGProps } from "react";

/**
 * Option C — Side profile glasses.
 * One lens visible + temple receding to the ear (with a curl). Reads as
 * glasses caught mid-wear; less common than the symmetric front view.
 */
export function LogoC(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 60 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      {/* Lens (front view, slight tilt suggested by aspect) */}
      <rect
        x="1.5"
        y="3.5"
        width="22"
        height="15"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      {/* Temple — straight bar going back from the lens hinge */}
      <path
        d="M23.5 9h32"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* Ear hook — small curl at the end of the temple */}
      <path
        d="M55.5 9c1.6 0 2.7 1 2.7 2.6c0 1.1-0.6 1.9-1.5 2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
