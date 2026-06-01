import { formatDistanceToNow } from "date-fns";
import { ImageIcon, MessageSquare, ChevronRight } from "lucide-react";
import { SeverityBadge, IssueStatusBadge } from "@/components/StatusBadge";
import { useData } from "@/context/DataContext";
import { cn } from "@/lib/utils";

export function IssueRow({ issue, onClick, showBike = false }) {
  const { getNotesForIssue, getPhotosForIssue, getBike } = useData();
  const noteCount = getNotesForIssue(issue.id).length;
  const photoCount = getPhotosForIssue(issue.id).length;
  const bike = showBike ? getBike(issue.bike_id) : null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-4 rounded-lg border border-border bg-card px-4 py-3.5 text-left transition-colors hover:border-foreground/20 hover:bg-card/70",
        issue.status === "resolved" && "opacity-70 hover:opacity-100"
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <IssueStatusBadge status={issue.status} />
          <SeverityBadge severity={issue.severity} />
          {showBike && bike && (
            <span className="text-xs font-medium text-muted-foreground">
              {bike.name}
            </span>
          )}
        </div>
        <p
          className={cn(
            "mt-2 truncate text-sm text-foreground",
            issue.status === "resolved" && "line-through decoration-muted-foreground/40"
          )}
        >
          {issue.description}
        </p>
        <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground tabular">
          <span>{issue.reported_by || "Unknown"}</span>
          <span>·</span>
          <span>
            {formatDistanceToNow(new Date(issue.created_at), {
              addSuffix: true,
            })}
          </span>
          {photoCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <ImageIcon className="h-3 w-3" />
              {photoCount}
            </span>
          )}
          {noteCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {noteCount}
            </span>
          )}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}
