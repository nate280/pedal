import { useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { motion } from "framer-motion";
import {
  MessageSquarePlus,
  Loader2,
  User,
  Clock,
  ArrowRight,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SeverityBadge, IssueStatusBadge } from "@/components/StatusBadge";
import { ISSUE_STATUS, ISSUE_STATUS_FLOW } from "@/lib/constants";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function IssueDialog({ issue: issueProp, open, onOpenChange }) {
  const {
    issues,
    getNotesForIssue,
    getPhotosForIssue,
    updateIssueStatus,
    addNote,
  } = useData();
  const { user } = useAuth();
  const { toast } = useToast();
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  if (!issueProp) return null;

  // Read the live record from context so status/severity changes render
  // instantly while the dialog stays open. Fall back to the prop in case the
  // issue isn't in the current list yet.
  const issue = issues.find((i) => i.id === issueProp.id) ?? issueProp;

  const notes = getNotesForIssue(issue.id);
  const photos = getPhotosForIssue(issue.id);
  const currentIndex = ISSUE_STATUS_FLOW.indexOf(issue.status);

  const handleStatus = async (status) => {
    setUpdatingStatus(true);
    try {
      await updateIssueStatus(issue.id, status);
      toast({
        variant: "success",
        title: "Status updated",
        description: `Marked as ${ISSUE_STATUS[status].label}.`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: err.message,
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddNote = async () => {
    if (!note.trim()) return;
    setSavingNote(true);
    try {
      await addNote(issue.id, note.trim(), user?.email || "Staff");
      setNote("");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Couldn't save note",
        description: err.message,
      });
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <IssueStatusBadge status={issue.status} />
            <SeverityBadge severity={issue.severity} />
          </div>
          <DialogTitle className="pt-1 text-base font-medium leading-snug">
            {issue.description}
          </DialogTitle>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              {issue.reported_by || "Unknown"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {format(new Date(issue.created_at), "MMM d, yyyy 'at' h:mm a")}
            </span>
          </div>
        </DialogHeader>

        {/* Status flow control */}
        <div className="rounded-lg border border-border bg-background/40 p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Repair progress
          </p>
          <div className="flex items-center gap-2">
            {ISSUE_STATUS_FLOW.map((s, i) => {
              const cfg = ISSUE_STATUS[s];
              const Icon = cfg.icon;
              const done = i < currentIndex;
              const active = i === currentIndex;
              return (
                <div key={s} className="flex flex-1 items-center gap-2">
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors",
                      active
                        ? cn(cfg.bg, cfg.text, "border-transparent")
                        : done
                          ? "border-good/30 bg-good/10 text-good"
                          : "border-border text-muted-foreground"
                    )}
                  >
                    {done ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Icon
                        className={cn(
                          "h-4 w-4",
                          active && s === "in_progress" && "animate-spin"
                        )}
                      />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      active ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {cfg.label}
                  </span>
                  {i < ISSUE_STATUS_FLOW.length - 1 && (
                    <div
                      className={cn(
                        "h-px flex-1",
                        done ? "bg-good/40" : "bg-border"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {issue.status !== "resolved" && (
              <Button
                size="sm"
                disabled={updatingStatus}
                onClick={() =>
                  handleStatus(
                    issue.status === "open" ? "in_progress" : "resolved"
                  )
                }
              >
                {updatingStatus ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {issue.status === "open"
                      ? "Start repair"
                      : "Mark resolved"}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
            {issue.status === "resolved" && (
              <Button
                size="sm"
                variant="outline"
                disabled={updatingStatus}
                onClick={() => handleStatus("in_progress")}
              >
                Reopen
              </Button>
            )}
            {issue.status === "in_progress" && (
              <Button
                size="sm"
                variant="outline"
                disabled={updatingStatus}
                onClick={() => handleStatus("open")}
              >
                Back to open
              </Button>
            )}
          </div>
        </div>

        {/* Photos */}
        {photos.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Photos ({photos.length})
            </p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {photos.map((p) => (
                <a
                  key={p.id}
                  href={p.storage_url}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative aspect-square overflow-hidden rounded-lg border border-border"
                >
                  <img
                    src={p.storage_url}
                    alt="Issue attachment"
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Notes / timeline */}
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Notes ({notes.length})
          </p>
          <div className="space-y-2.5">
            {notes.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No notes yet. Log progress as you work the repair.
              </p>
            )}
            {notes.map((n) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-border bg-background/40 p-3"
              >
                <p className="text-sm text-foreground">{n.note}</p>
                <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground/70">
                    {n.created_by || "Staff"}
                  </span>
                  <span>·</span>
                  <span>
                    {formatDistanceToNow(new Date(n.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-3 flex items-end gap-2">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note about this repair…"
              className="min-h-[60px]"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleAddNote();
                }
              }}
            />
            <Button
              size="icon"
              variant="outline"
              disabled={!note.trim() || savingNote}
              onClick={handleAddNote}
              className="h-[60px] w-11 shrink-0"
            >
              {savingNote ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MessageSquarePlus className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
