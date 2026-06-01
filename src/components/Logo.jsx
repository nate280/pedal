import { cn } from "@/lib/utils";

/** The Pedal mark — a stylised crankset that doubles as a "P". */
export function PedalMark({ className, size = 28 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <circle
        cx="16"
        cy="16"
        r="6.5"
        stroke="currentColor"
        strokeWidth="2.4"
      />
      <circle cx="16" cy="16" r="1.8" fill="currentColor" />
      {/* crank arm */}
      <path
        d="M16 16 L26 22"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <rect
        x="24.5"
        y="20"
        width="5"
        height="5"
        rx="1.4"
        transform="rotate(31 27 22.5)"
        fill="currentColor"
      />
      {/* spokes */}
      <path
        d="M16 9.5V6M16 26v-3.5M9.5 16H6M26 16h-3.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

export function Logo({ className, markClassName, showWord = true, size = 28 }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <PedalMark size={size} className={cn("text-brand", markClassName)} />
      {showWord && (
        <span className="font-display text-xl font-bold tracking-tight text-foreground">
          Pedal
        </span>
      )}
    </div>
  );
}
