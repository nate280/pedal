import { cn } from "@/lib/utils";

/** The real Pedal P mark from brand assets */
export function PedalMark({ className, size = 18, variant = "electric" }) {
  const fill = variant === "electric" ? "#DAE600" : "white";

  return (
    <svg
      width={size}
      viewBox="0 0 157 253"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <path d="M0 0H86C125.212 0 157 31.7878 157 71V71H0V0Z" fill={fill} />
      <path d="M86.1855 161.569V161.569C125.295 161.569 157 129.864 157 90.7541V86.1855H86.1855V161.569Z" fill={fill} />
      <path d="M0 129.588L70.8144 86.1856V208.398L0 252.942V129.588Z" fill={fill} />
    </svg>
  );
}

export function Logo({ className, markSize = 18, showWord = true, markVariant = "electric" }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <PedalMark size={markSize} variant={markVariant} />
      {showWord && (
        <span
          className="font-display text-foreground"
          style={{ fontSize: "1.35rem", letterSpacing: 0, fontWeight: 500 }}
        >
          Pedal
        </span>
      )}
    </div>
  );
}
