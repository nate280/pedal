import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase, isSupabaseConfigured, PHOTO_BUCKET } from "@/lib/supabase";
import { bikeStatusFromIssues } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { user } = useAuth();
  const [studio, setStudio] = useState(null);
  const [bikes, setBikes] = useState([]);
  const [issues, setIssues] = useState([]);
  const [notes, setNotes] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [studioRes, bikesRes, issuesRes, notesRes, photosRes] =
        await Promise.all([
          supabase.from("studios").select("*").order("created_at").limit(1),
          supabase.from("bikes").select("*").order("name"),
          supabase.from("issues").select("*").order("created_at", { ascending: false }),
          supabase.from("issue_notes").select("*").order("created_at"),
          supabase.from("issue_photos").select("*").order("created_at"),
        ]);

      const firstError =
        studioRes.error ||
        bikesRes.error ||
        issuesRes.error ||
        notesRes.error ||
        photosRes.error;
      if (firstError) throw firstError;

      setStudio(studioRes.data?.[0] ?? null);
      setBikes(bikesRes.data ?? []);
      setIssues(issuesRes.data ?? []);
      setNotes(notesRes.data ?? []);
      setPhotos(photosRes.data ?? []);
    } catch (err) {
      setError(err.message ?? "Failed to load fleet data");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  /** Bikes enriched with derived status, open-issue counts, last maintenance. */
  const enrichedBikes = useMemo(() => {
    return bikes.map((bike) => {
      const bikeIssues = issues.filter((i) => i.bike_id === bike.id);
      const open = bikeIssues.filter((i) => i.status !== "resolved");
      const resolved = bikeIssues.filter((i) => i.status === "resolved");
      const lastResolvedAt = resolved
        .map((i) => i.resolved_at)
        .filter(Boolean)
        .sort()
        .at(-1);
      return {
        ...bike,
        // Stored status is authoritative, but fall back to a derivation
        // so the grid still reflects reality if a write was missed.
        derivedStatus: bike.status || bikeStatusFromIssues(open),
        openIssueCount: open.length,
        totalIssueCount: bikeIssues.length,
        lastMaintenance: lastResolvedAt || null,
        issues: bikeIssues,
      };
    });
  }, [bikes, issues]);

  const getBike = useCallback(
    (id) => enrichedBikes.find((b) => b.id === id) ?? null,
    [enrichedBikes]
  );

  const getIssuesForBike = useCallback(
    (bikeId) => issues.filter((i) => i.bike_id === bikeId),
    [issues]
  );

  const getNotesForIssue = useCallback(
    (issueId) => notes.filter((n) => n.issue_id === issueId),
    [notes]
  );

  const getPhotosForIssue = useCallback(
    (issueId) => photos.filter((p) => p.issue_id === issueId),
    [photos]
  );

  /** Recompute and persist a bike's rolled-up status from its open issues. */
  const syncBikeStatus = useCallback(async (bikeId, currentIssues) => {
    const open = currentIssues.filter(
      (i) => i.bike_id === bikeId && i.status !== "resolved"
    );
    const status = bikeStatusFromIssues(open);
    await supabase.from("bikes").update({ status }).eq("id", bikeId);
    setBikes((prev) =>
      prev.map((b) => (b.id === bikeId ? { ...b, status } : b))
    );
  }, []);

  const createIssue = useCallback(
    async ({ bikeId, description, severity, reportedBy, files }) => {
      const { data: issue, error: insertErr } = await supabase
        .from("issues")
        .insert({
          bike_id: bikeId,
          description,
          severity,
          status: "open",
          reported_by: reportedBy,
        })
        .select()
        .single();
      if (insertErr) throw insertErr;

      const uploadedPhotos = [];
      for (const file of files || []) {
        const path = `${bikeId}/${issue.id}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage
          .from(PHOTO_BUCKET)
          .upload(path, file, { upsert: false });
        if (upErr) continue; // skip a failed photo rather than fail the issue
        const { data: pub } = supabase.storage
          .from(PHOTO_BUCKET)
          .getPublicUrl(path);
        const { data: photoRow } = await supabase
          .from("issue_photos")
          .insert({ issue_id: issue.id, storage_url: pub.publicUrl })
          .select()
          .single();
        if (photoRow) uploadedPhotos.push(photoRow);
      }

      const nextIssues = [issue, ...issues];
      setIssues(nextIssues);
      if (uploadedPhotos.length)
        setPhotos((prev) => [...prev, ...uploadedPhotos]);
      await syncBikeStatus(bikeId, nextIssues);
      return issue;
    },
    [issues, syncBikeStatus]
  );

  const updateIssueStatus = useCallback(
    async (issueId, status) => {
      const prev = issues.find((i) => i.id === issueId);
      if (!prev) return null;
      const resolved_at =
        status === "resolved" ? new Date().toISOString() : null;

      // Optimistic: reflect the change in local state immediately so the open
      // dialog re-renders on selection, then reconcile with the server.
      const optimistic = { ...prev, status, resolved_at };
      const optimisticIssues = issues.map((i) =>
        i.id === issueId ? optimistic : i
      );
      setIssues(optimisticIssues);

      const { data: updated, error: updErr } = await supabase
        .from("issues")
        .update({ status, resolved_at })
        .eq("id", issueId)
        .select()
        .single();

      if (updErr) {
        setIssues(issues); // roll back
        throw updErr;
      }

      const nextIssues = issues.map((i) => (i.id === issueId ? updated : i));
      setIssues(nextIssues);
      await syncBikeStatus(updated.bike_id, nextIssues);
      return updated;
    },
    [issues, syncBikeStatus]
  );

  const addNote = useCallback(async (issueId, note, createdBy) => {
    const { data, error: noteErr } = await supabase
      .from("issue_notes")
      .insert({ issue_id: issueId, note, created_by: createdBy })
      .select()
      .single();
    if (noteErr) throw noteErr;
    setNotes((prev) => [...prev, data]);
    return data;
  }, []);

  const updateBikeFloorPosition = useCallback(async (bikeId, floorPosition) => {
    // Stored as text; null clears the assignment.
    const value =
      floorPosition === "" || floorPosition == null
        ? null
        : String(floorPosition);
    const { data, error: updErr } = await supabase
      .from("bikes")
      .update({ floor_position: value })
      .eq("id", bikeId)
      .select()
      .single();
    if (updErr) throw updErr;
    setBikes((prev) =>
      prev.map((b) =>
        b.id === bikeId ? { ...b, floor_position: data.floor_position } : b
      )
    );
    return data;
  }, []);

  const value = useMemo(
    () => ({
      studio,
      bikes: enrichedBikes,
      issues,
      notes,
      photos,
      loading,
      error,
      configured: isSupabaseConfigured,
      reload: load,
      getBike,
      getIssuesForBike,
      getNotesForIssue,
      getPhotosForIssue,
      createIssue,
      updateIssueStatus,
      addNote,
      updateBikeFloorPosition,
    }),
    [
      studio,
      enrichedBikes,
      issues,
      notes,
      photos,
      loading,
      error,
      load,
      getBike,
      getIssuesForBike,
      getNotesForIssue,
      getPhotosForIssue,
      createIssue,
      updateIssueStatus,
      addNote,
      updateBikeFloorPosition,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
