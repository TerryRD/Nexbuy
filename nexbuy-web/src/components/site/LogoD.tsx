import type { SVGProps } from "react";

/**
 * Option D — Horn-rim / browline.
 * Thick brow bar across the top spans both lenses + bridge; thin
 * U-shape under each lens. 1950s Wayfarer-adjacent silhouette.
 */
export function LogoD(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 48 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      {/* Thick brow bar — spans both lenses + bridge */}
      <path
        d="M2 5h44"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Left lens — U-shape under the brow */}
      <path
        d="M2 5v5a5 5 0 0 0 5 5h6a5 5 0 0 0 5-5V5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Right lens — same U-shape */}
      <path
        d="M30 5v5a5 5 0 0 0 5 5h6a5 5 0 0 0 5-5V5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
