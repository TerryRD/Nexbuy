import { Check } from "lucide-react";

interface StepperProps {
  steps: string[];
  current: number; // 0-based index of the active step
  label?: string; // accessible nav label (shared across checkout/booking flows)
}

/**
 * Horizontal step indicator. Server-safe (no hooks).
 * States:
 *   completed  (index < current)  — filled primary circle + check icon
 *   active     (index === current) — primary ring
 *   future     (index > current)  — muted border
 */
export function Stepper({ steps, current, label = "步驟" }: StepperProps) {
  return (
    <nav aria-label={label}>
      <ol className="flex items-center w-full">
        {steps.map((label, index) => {
          const isCompleted = index < current;
          const isActive = index === current;
          const isFuture = index > current;
          const isLast = index === steps.length - 1;

          return (
            <li
              key={label}
              className={`flex items-center ${isLast ? "" : "flex-1"}`}
              {...(isActive ? { "aria-current": "step" as const } : {})}
            >
              {/* Step node */}
              <div className="flex flex-col items-center gap-1.5">
                {/* Circle */}
                <div
                  className={[
                    "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium shrink-0 transition-colors",
                    isCompleted
                      ? "bg-primary text-primary-foreground"
                      : isActive
                        ? "border-2 border-primary bg-primary text-primary-foreground"
                        : "border-2 border-border bg-background text-muted-foreground",
                  ].join(" ")}
                  aria-hidden="true"
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" strokeWidth={2.5} />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                {/* Label — hidden on very small screens */}
                <span
                  className={[
                    "hidden sm:block text-xs text-center leading-tight",
                    isActive
                      ? "font-semibold text-foreground"
                      : isCompleted
                        ? "text-foreground"
                        : "text-muted-foreground",
                    isFuture ? "opacity-60" : "",
                  ].join(" ")}
                >
                  {label}
                </span>
              </div>

              {/* Connector line (not after last step) */}
              {!isLast && (
                <div
                  className={[
                    "flex-1 h-0.5 mx-2 mb-5 rounded-full transition-colors",
                    isCompleted ? "bg-primary" : "bg-border",
                  ].join(" ")}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
