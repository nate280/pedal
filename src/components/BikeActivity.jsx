import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  format,
  formatDistanceToNow,
  isToday,
  isYesterday,
} from "date-fns";
import {
  ClipboardPlus,
  MessageSquare,
  CircleCheckBig,
  Activity as ActivityIcon,
} from "lucide-react";
import { useData } from "@/context/DataContext";
import { SeverityBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";

const EVENT_CONFIG = {
  logged: {
    icon: ClipboardPlus,
    ring: "border-warn/30 bg-warn/10 text-warn",
    verb: "logged an issue",
  },
  note: {
    icon: MessageSquare,
    ring: "border-brand/30 bg-brand/10 text-brand",
    verb: "added a note",
  },
  resolved: {
    icon: CircleCheckBig,
    ring: "border-good/30 bg-good/10 text-good",
    verb: "resolved an issue",
  },
};

function dayLabel(date) {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMMM d, yyyy");
}

export function BikeActivity({ bikeId, onSelectIssue }) {
  const { getIssuesForBike, getNotesForIssue } = useData();
  const issues = getIssuesForBike(bikeId);

  // Build a unified timeline from existing records: issues logged,
  // notes added, and resolutions — each with the actor who did it.
  const groups = useMemo(() => {
    const events = [];
    issues.forEach((issue) => {
      events.push({
        id: `logged-${issue.id}`,
        type: "logged",
        at: issue.created_at,
        actor: issue.reported_by || "Unknown",
        issue,
      });
      if (issue.status === "resolved" && issue.resolved_at) {
        events.push({
          id: `resolved-${issue.id}`,
          type: "resolved",
          at: issue.resolved_at,
          actor: null,
          issue,
        });
      }
      getNotesForIssue(issue.id).forEach((n) => {
        events.push({
          id: `note-${n.id}`,
          type: "note",
          at: n.created_at,
          actor: n.created_by || "Staff",
          note: n,
          issue,
        });
      });
    });

    events.sort((a, b) => new Date(b.at) - new Date(a.at));

    const byDay = [];
    let current = null;
    for (const ev of events) {
      const label = dayLabel(new Date(ev.at));
      if (!current || current.label !== label) {
        current = { label, events: [] };
        byDay.push(current);
      }
      current.events.push(ev);
    }
    return byDay;
  }, [issues, getNotesForIssue]);

  if (groups.length === 0) {
    return (
      <EmptyState
        icon={ActivityIcon}
        title="No activity yet"
        description="When issues are logged, notes are added, or repairs are resolved, they'll appear here as a timeline."
      />
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {group.label}
          </p>
          <ol className="relative space-y-1 pl-2">
            {/* timeline spine */}
            <span className="absolute left-[18px] top-1 bottom-1 w-px bg-border" />
            {group.events.map((ev, i) => {
              const cfg = EVENT_CONFIG[ev.type];
              const Icon = cfg.icon;
              return (
                <motion.li
                  key={ev.id}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(i * 0.02, 0.2) }}
                  className="relative"
                >
                  <button
                    onClick={() => onSelectIssue?.(ev.issue)}
                    className="group flex w-full items-start gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-secondary/50"
                  >
                    <span
                      className={cn(
                        "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
                        cfg.ring
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">
                          {ev.actor || "A staff member"}
                        </span>{" "}
                        <span className="text-muted-foreground">{cfg.verb}</span>
                      </p>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">
                        {ev.type === "note"
                          ? ev.note.note
                          : ev.issue.description}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground tabular">
                        <span title={format(new Date(ev.at), "PPpp")}>
                          {formatDistanceToNow(new Date(ev.at), {
                            addSuffix: true,
                          })}
                        </span>
                        {ev.type === "logged" && (
                          <SeverityBadge severity={ev.issue.severity} />
                        )}
                      </div>
                    </div>
                  </button>
                </motion.li>
              );
            })}
          </ol>
        </div>
      ))}
    </div>
  );
}
