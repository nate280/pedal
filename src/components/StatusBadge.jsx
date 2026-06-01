import { BIKE_STATUS, SEVERITY, ISSUE_STATUS } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Bike fleet status pill with a colored status dot. */
export function StatusBadge({ status, className }) {
  const cfg = BIKE_STATUS[status] ?? BIKE_STATUS.good;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        cfg.bg,
        cfg.text,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

export function SeverityBadge({ severity, className }) {
  const cfg = SEVERITY[severity] ?? SEVERITY.low;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        cfg.bg,
        cfg.text,
        cfg.border,
        className
      )}
    >
      {cfg.label}
    </span>
  );
}

export function IssueStatusBadge({ status, className }) {
  const cfg = ISSUE_STATUS[status] ?? ISSUE_STATUS.open;
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        cfg.bg,
        cfg.text,
        className
      )}
    >
      <Icon
        className={cn("h-3 w-3", status === "in_progress" && "animate-spin")}
      />
      {cfg.label}
    </span>
  );
}
