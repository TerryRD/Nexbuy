import type { SVGProps } from "react";

/**
 * Option B — Asymmetric monocle.
 * Left lens filled, right lens outline; reads as "we look at you carefully".
 */
export function LogoB(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 44 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <rect
        x="1.5"
        y="2.5"
        width="16"
        height="13"
        rx="4.5"
        fill="currentColor"
      />
      <rect
        x="26.5"
        y="2.5"
        width="16"
        height="13"
        rx="4.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M17.5 9h9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
