import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  MapPin,
  Wrench,
  PlusCircle,
  ClipboardList,
  ImageOff,
  Pencil,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { Page } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { IssueRow } from "@/components/IssueRow";
import { IssueDialog } from "@/components/IssueDialog";
import { BikeActivity } from "@/components/BikeActivity";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useData } from "@/context/DataContext";
import { useToast } from "@/hooks/use-toast";
import { BIKE_STATUS } from "@/lib/constants";
import { cn, formatPosition, MAX_FLOOR_POSITION } from "@/lib/utils";

export default function BikeDetail() {
  const { bikeId } = useParams();
  const navigate = useNavigate();
  const {
    getBike,
    getIssuesForBike,
    getPhotosForIssue,
    updateBikeFloorPosition,
    loading,
  } = useData();
  const { toast } = useToast();
  const [selected, setSelected] = useState(null);

  const bike = getBike(bikeId);
  const issues = getIssuesForBike(bikeId);

  const openIssues = issues.filter((i) => i.status !== "resolved");
  const resolvedIssues = issues.filter((i) => i.status === "resolved");

  const allPhotos = useMemo(
    () => issues.flatMap((i) => getPhotosForIssue(i.id)),
    [issues, getPhotosForIssue]
  );

  // Inline floor-position editing
  const [editingPos, setEditingPos] = useState(false);
  const [posValue, setPosValue] = useState("");
  const [savingPos, setSavingPos] = useState(false);

  const startEditPos = () => {
    setPosValue(bike?.floor_position ?? "");
    setEditingPos(true);
  };

  const savePosition = async () => {
    setSavingPos(true);
    try {
      await updateBikeFloorPosition(bike.id, posValue);
      setEditingPos(false);
      toast({ variant: "success", title: "Floor position updated" });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Couldn't update position",
        description: err.message,
      });
    } finally {
      setSavingPos(false);
    }
  };

  if (loading) {
    return (
      <Page>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-6 h-40 w-full rounded-xl" />
        <Skeleton className="mt-4 h-64 w-full rounded-xl" />
      </Page>
    );
  }

  if (!bike) {
    return (
      <Page>
        <EmptyState
          icon={ClipboardList}
          title="Bike not found"
          description="This bike may have been removed from the fleet."
          action={
            <Button variant="outline" onClick={() => navigate("/fleet")}>
              Back to fleet
            </Button>
          }
        />
      </Page>
    );
  }

  const cfg = BIKE_STATUS[bike.derivedStatus] ?? BIKE_STATUS.good;

  return (
    <Page>
      <Link
        to="/fleet"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Fleet
      </Link>

      {/* Hero header */}
      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
        <div className={cn("h-1 w-full", cfg.dot)} />
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-display text-[32px] leading-[1.1em] font-medium tracking-tight text-foreground">
              {bike.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
              {editingPos ? (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  <Input
                    type="number"
                    min={1}
                    max={MAX_FLOOR_POSITION}
                    autoFocus
                    value={posValue}
                    onChange={(e) => setPosValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") savePosition();
                      if (e.key === "Escape") setEditingPos(false);
                    }}
                    placeholder={`1–${MAX_FLOOR_POSITION}`}
                    className="h-8 w-24"
                  />
                  <Button
                    size="icon"
                    className="h-8 w-8"
                    onClick={savePosition}
                    disabled={savingPos}
                  >
                    {savingPos ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => setEditingPos(false)}
                    disabled={savingPos}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </span>
              ) : (
                <button
                  onClick={startEditPos}
                  className="group inline-flex items-center gap-1.5 rounded-md py-0.5 transition-colors hover:text-foreground"
                  title="Edit floor position"
                >
                  <MapPin className="h-4 w-4" />
                  {formatPosition(bike.floor_position, "Unassigned position")}
                  <Pencil className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Wrench className="h-4 w-4" />
                {bike.lastMaintenance
                  ? `Last serviced ${formatDistanceToNow(new Date(bike.lastMaintenance), { addSuffix: true })}`
                  : "No service logged"}
              </span>
            </div>
            <div className="mt-4">
              <StatusBadge status={bike.derivedStatus} />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <Stat label="Open" value={openIssues.length} accent={openIssues.length > 0} />
            <div className="h-10 w-px bg-border" />
            <Stat label="Total logged" value={issues.length} />
            <Button asChild className="ml-2 hidden sm:inline-flex">
              <Link to={`/log?bike=${bike.id}`}>
                <PlusCircle className="h-4 w-4" />
                Log Issue
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Button asChild className="mt-4 w-full sm:hidden">
        <Link to={`/log?bike=${bike.id}`}>
          <PlusCircle className="h-4 w-4" />
          Log Issue
        </Link>
      </Button>

      {/* Issues · activity · photos */}
      <Tabs defaultValue="issues" className="mt-7">
        <TabsList>
          <TabsTrigger value="issues">
            Issues
            {issues.length > 0 && (
              <span className="ml-1.5 tabular opacity-60">{issues.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="photos">
            Photos
            {allPhotos.length > 0 && (
              <span className="ml-1.5 tabular opacity-60">
                {allPhotos.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="issues" className="space-y-6">
          {issues.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No issues logged"
              description="This bike has a clean record. Log an issue if something needs attention."
              action={
                <Button asChild>
                  <Link to={`/log?bike=${bike.id}`}>Log the first issue</Link>
                </Button>
              }
            />
          ) : (
            <>
              {openIssues.length > 0 && (
                <section>
                  <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Active ({openIssues.length})
                  </h2>
                  <div className="space-y-2">
                    {openIssues.map((issue) => (
                      <IssueRow
                        key={issue.id}
                        issue={issue}
                        onClick={() => setSelected(issue)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {resolvedIssues.length > 0 && (
                <section>
                  <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Resolved ({resolvedIssues.length})
                  </h2>
                  <div className="space-y-2">
                    {resolvedIssues.map((issue) => (
                      <IssueRow
                        key={issue.id}
                        issue={issue}
                        onClick={() => setSelected(issue)}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="activity">
          <BikeActivity bikeId={bike.id} onSelectIssue={setSelected} />
        </TabsContent>

        <TabsContent value="photos">
          {allPhotos.length === 0 ? (
            <EmptyState
              icon={ImageOff}
              title="No photos"
              description="Photos attached to issues for this bike will appear here."
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {allPhotos.map((p) => (
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
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <span className="text-[10px] text-white/80">
                      {format(new Date(p.created_at), "MMM d")}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <IssueDialog
        issue={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
      />
    </Page>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="text-center">
      <p
        className={cn(
          "font-display text-2xl font-bold tabular",
          accent ? "text-warn" : "text-foreground"
        )}
      >
        {value}
      </p>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
