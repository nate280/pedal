import {
  CircleCheck,
  TriangleAlert,
  CircleSlash,
  CircleDot,
  Loader,
  CircleCheckBig,
} from "lucide-react";

/** Bike fleet status — derived from open issues, but stored on the bike too. */
export const BIKE_STATUS = {
  good: {
    value: "good",
    label: "Good",
    color: "var(--good)",
    icon: CircleCheck,
    dot: "bg-good",
    text: "text-good",
    ring: "ring-good/30",
    bg: "bg-good/10",
  },
  needs_attention: {
    value: "needs_attention",
    label: "Needs Attention",
    color: "var(--warn)",
    icon: TriangleAlert,
    dot: "bg-warn",
    text: "text-warn",
    ring: "ring-warn/30",
    bg: "bg-warn/10",
  },
  out_of_service: {
    value: "out_of_service",
    label: "Out of Service",
    color: "var(--danger)",
    icon: CircleSlash,
    dot: "bg-danger",
    text: "text-danger",
    ring: "ring-danger/30",
    bg: "bg-danger/10",
  },
};

export const SEVERITY = {
  low: { value: "low", label: "Low", text: "text-good", bg: "bg-good/10", border: "border-good/20" },
  medium: {
    value: "medium",
    label: "Medium",
    text: "text-warn",
    bg: "bg-warn/10",
    border: "border-warn/20",
  },
  high: {
    value: "high",
    label: "High",
    text: "text-danger",
    bg: "bg-danger/10",
    border: "border-danger/20",
  },
};

export const ISSUE_STATUS = {
  open: { value: "open", label: "Open", icon: CircleDot, text: "text-warn", bg: "bg-warn/10" },
  in_progress: {
    value: "in_progress",
    label: "In Progress",
    icon: Loader,
    text: "text-brand",
    bg: "bg-brand/10",
  },
  resolved: {
    value: "resolved",
    label: "Resolved",
    icon: CircleCheckBig,
    text: "text-good",
    bg: "bg-good/10",
  },
};

export const ISSUE_STATUS_FLOW = ["open", "in_progress", "resolved"];

export function bikeStatusFromIssues(openIssues) {
  if (!openIssues || openIssues.length === 0) return "good";
  if (openIssues.some((i) => i.severity === "high")) return "out_of_service";
  return "needs_attention";
}
