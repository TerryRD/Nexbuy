import React from "react";

const CONTENT: Record<string, React.ReactNode> = {
  balanced: <ellipse cx="60" cy="74" rx="40" ry="40" />,
  oval: <ellipse cx="60" cy="72" rx="36" ry="46" />,
  long: <ellipse cx="60" cy="72" rx="30" ry="50" />,
  round_jaw: <ellipse cx="60" cy="72" rx="36" ry="46" />,
  pointy_jaw: <path d="M60 26 Q96 26 96 66 Q94 90 60 118 Q26 90 24 66 Q24 26 60 26 Z" />,
  square_jaw: <path d="M24 52 Q24 26 60 26 Q96 26 96 52 L96 100 Q96 114 84 116 L36 116 Q24 114 24 100 Z" />,
  wide_top: <path d="M22 42 Q22 26 38 26 L82 26 Q98 26 98 42 L88 100 Q84 114 70 116 L50 116 Q36 114 32 100 Z" />,
  balanced_width: <ellipse cx="60" cy="72" rx="36" ry="46" />,
  wide_bottom: <path d="M32 42 Q34 26 44 26 L76 26 Q86 26 88 42 L98 100 Q100 114 82 116 L38 116 Q20 114 22 100 Z" />,
  cheeks: (
    <g>
      <ellipse cx="60" cy="72" rx="36" ry="46" />
      <line x1="18" y1="72" x2="102" y2="72" strokeDasharray="3 3" opacity="0.45" />
      <circle cx="22" cy="72" r="3" fill="currentColor" stroke="none" />
      <circle cx="98" cy="72" r="3" fill="currentColor" stroke="none" />
    </g>
  ),
  jaw_wide: (
    <g>
      <path d="M30 32 Q30 26 40 26 L80 26 Q90 26 90 32 L98 96 Q102 114 86 116 L34 116 Q18 114 22 96 Z" />
      <line x1="18" y1="102" x2="102" y2="102" strokeDasharray="3 3" opacity="0.45" />
      <circle cx="22" cy="102" r="3" fill="currentColor" stroke="none" />
      <circle cx="98" cy="102" r="3" fill="currentColor" stroke="none" />
    </g>
  ),
  narrow: <ellipse cx="60" cy="72" rx="26" ry="50" />,
};

export function FaceOptionIcon({ svg, className }: { svg: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 120 140"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {CONTENT[svg]}
    </svg>
  );
}
