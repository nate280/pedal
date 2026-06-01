import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  MapPin,
  Upload,
  X,
  Loader2,
  CheckCircle2,
  CalendarDays,
  ImagePlus,
} from "lucide-react";
import { format } from "date-fns";
import { Page, PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/EmptyState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { SEVERITY } from "@/lib/constants";
import { cn, formatPosition } from "@/lib/utils";

export default function LogIssue() {
  const { bikes, createIssue } = useData();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const fileInputRef = useRef(null);

  const [bikeId, setBikeId] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [reportedBy, setReportedBy] = useState("");
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [dragging, setDragging] = useState(false);

  // Prefill bike from ?bike= and reporter from the signed-in user.
  useEffect(() => {
    const fromQuery = params.get("bike");
    if (fromQuery && bikes.some((b) => b.id === fromQuery)) {
      setBikeId(fromQuery);
    }
  }, [params, bikes]);

  useEffect(() => {
    if (!reportedBy && user?.email) {
      setReportedBy(user.email.split("@")[0]);
    }
  }, [user, reportedBy]);

  const selectedBike = useMemo(
    () => bikes.find((b) => b.id === bikeId),
    [bikes, bikeId]
  );

  const addFiles = (incoming) => {
    const images = Array.from(incoming).filter((f) =>
      f.type.startsWith("image/")
    );
    if (!images.length) return;
    setFiles((prev) => [...prev, ...images]);
    setPreviews((prev) => [
      ...prev,
      ...images.map((f) => ({ name: f.name, url: URL.createObjectURL(f) })),
    ]);
  };

  const removeFile = (index) => {
    URL.revokeObjectURL(previews[index]?.url);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    return () => previews.forEach((p) => URL.revokeObjectURL(p.url));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bikeId || !description.trim()) {
      toast({
        variant: "destructive",
        title: "Missing details",
        description: "Pick a bike and describe the issue.",
      });
      return;
    }
    setSubmitting(true);
    try {
      await createIssue({
        bikeId,
        description: description.trim(),
        severity,
        reportedBy: reportedBy.trim() || "Staff",
        files,
      });
      toast({
        variant: "success",
        title: "Issue logged",
        description: `Reported on ${selectedBike?.name}.`,
      });
      navigate(`/fleet/${bikeId}`);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Couldn't log issue",
        description: err.message,
      });
      setSubmitting(false);
    }
  };

  if (bikes.length === 0) {
    return (
      <Page>
        <PageHeader title="Log Issue" />
        <div className="mt-7">
          <EmptyState
            icon={ImagePlus}
            title="No bikes to report on"
            description="Add bikes to your studio first, then come back to log maintenance issues."
          />
        </div>
      </Page>
    );
  }

  return (
    <Page className="max-w-2xl">
      <PageHeader
        title="Log Issue"
        description="Report a maintenance problem and route it to the repair queue."
      />

      <form onSubmit={handleSubmit} className="mt-7 space-y-6">
        {/* Bike + position */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="bike">Bike</Label>
            <Select value={bikeId} onValueChange={setBikeId}>
              <SelectTrigger id="bike">
                <SelectValue placeholder="Select a bike" />
              </SelectTrigger>
              <SelectContent>
                {bikes.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Floor position</Label>
            <div
              className={cn(
                "flex h-10 items-center gap-2 rounded-lg border border-input bg-secondary/40 px-3 text-sm",
                selectedBike ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <MapPin className="h-4 w-4 text-muted-foreground" />
              {selectedBike
                ? formatPosition(selectedBike.floor_position)
                : "Auto-fills from bike"}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">What's wrong?</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Resistance knob slips under load, flywheel makes a grinding noise…"
            className="min-h-[110px]"
          />
        </div>

        {/* Severity */}
        <div className="space-y-2">
          <Label>Severity</Label>
          <div className="grid grid-cols-3 gap-2">
            {Object.values(SEVERITY).map((s) => {
              const active = severity === s.value;
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSeverity(s.value)}
                  className={cn(
                    "rounded-lg border px-3 py-2.5 text-sm font-medium transition-all",
                    active
                      ? cn(s.bg, s.text, s.border, "ring-1 ring-inset", s.border)
                      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
                  )}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Reporter + date */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="reportedBy">Reported by</Label>
            <Input
              id="reportedBy"
              value={reportedBy}
              onChange={(e) => setReportedBy(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <div className="flex h-10 items-center gap-2 rounded-lg border border-input bg-secondary/40 px-3 text-sm text-foreground">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              {format(new Date(), "MMM d, yyyy")}
            </div>
          </div>
        </div>

        {/* Photo upload */}
        <div className="space-y-2">
          <Label>Photos</Label>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              addFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-4 py-8 text-center transition-colors",
              dragging
                ? "border-brand bg-brand/5"
                : "border-border hover:border-foreground/30 hover:bg-secondary/30"
            )}
          >
            <Upload className="mb-2 h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-foreground">
              Drop photos or{" "}
              <span className="text-brand">browse</span>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Attach as many as you need — PNG or JPG
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
          </div>

          {previews.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {previews.map((p, i) => (
                <div
                  key={i}
                  className="group relative aspect-square overflow-hidden rounded-lg border border-border"
                >
                  <img
                    src={p.url}
                    alt={p.name}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(i);
                    }}
                    className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border pt-5">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate(-1)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Logging…
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Log Issue
              </>
            )}
          </Button>
        </div>
      </form>
    </Page>
  );
}
