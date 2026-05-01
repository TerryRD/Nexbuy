"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export type RevealFrom =
  | "bottom"
  | "up"
  | "left"
  | "right"
  | "zoom"
  | "zoom-up"
  | "fade";

// Fades + transforms children into view the first time they enter the
// viewport. Direction picked via data-from + matching CSS rule. Cheap (one
// IntersectionObserver per instance, disconnected after firing) and
// neutralized under prefers-reduced-motion.
export function Reveal({
  children,
  from = "bottom",
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  from?: RevealFrom;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            obs.disconnect();
            break;
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      data-from={from}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={`reveal${visible ? " is-visible" : ""}${className ? ` ${className}` : ""}`}
    >
      {children}
    </div>
  );
}
