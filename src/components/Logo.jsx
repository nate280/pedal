import { cn } from "@/lib/utils";

/** The real Pedal P mark from brand assets */
export function PedalMark({ className, size = 28, variant = "electric" }) {
  const fill = variant === "electric" ? "#DAE600" : "white";

  return (
    <svg
      width={size}
      viewBox="0 0 64 106"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <path d="M0 0H33C50.1208 0 64 13.8792 64 31V31H0V0Z" fill={fill} />
      <path d="M33 66V66C50.1208 66 64 52.1208 64 35V33H33V66Z" fill={fill} />
      <path d="M0 52L31 33V86.5L0 106V52Z" fill={fill} />
    </svg>
  );
}

export function Logo({ className, markSize = 20, showWord = true, markVariant = "electric" }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <PedalMark size={markSize} variant={markVariant} />
      {showWord && (
        <span
          className="font-display font-medium text-foreground"
          style={{ fontSize: "1.15rem", letterSpacing: 0 }}
        >
          Pedal
        </span>
      )}
    </div>
  );
}
