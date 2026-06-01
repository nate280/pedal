import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Bike, SlidersHorizontal, PlusCircle } from "lucide-react";
import { Page, PageHeader } from "@/components/PageHeader";
import { BikeCard } from "@/components/BikeCard";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useData } from "@/context/DataContext";
import { BIKE_STATUS } from "@/lib/constants";
import { cn, formatPosition } from "@/lib/utils";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "good", label: "Good" },
  { value: "needs_attention", label: "Needs Attention" },
  { value: "out_of_service", label: "Out of Service" },
];

export default function Fleet() {
  const { bikes, loading } = useData();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const counts = useMemo(() => {
    const c = { all: bikes.length, good: 0, needs_attention: 0, out_of_service: 0 };
    bikes.forEach((b) => {
      c[b.derivedStatus] = (c[b.derivedStatus] || 0) + 1;
    });
    return c;
  }, [bikes]);

  const filtered = useMemo(() => {
    return bikes.filter((b) => {
      const matchesFilter = filter === "all" || b.derivedStatus === filter;
      const q = query.toLowerCase();
      const matchesQuery =
        !query ||
        b.name.toLowerCase().includes(q) ||
        formatPosition(b.floor_position, "").toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [bikes, filter, query]);

  return (
    <Page>
      <PageHeader
        title="Fleet"
        description="Every bike on the floor, at a glance."
      >
        <Button asChild>
          <Link to="/log">
            <PlusCircle className="h-4 w-4" />
            Log Issue
          </Link>
        </Button>
      </PageHeader>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search bikes or floor position…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
          <SlidersHorizontal className="mr-1 h-4 w-4 shrink-0 text-muted-foreground" />
          {FILTERS.map((f) => {
            const active = filter === f.value;
            const cfg = BIKE_STATUS[f.value];
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "border-foreground/20 bg-secondary text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {cfg && (
                  <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
                )}
                {f.label}
                <span className="tabular opacity-60">{counts[f.value] ?? 0}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[180px] rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Bike}
            title={bikes.length === 0 ? "No bikes yet" : "No matches"}
            description={
              bikes.length === 0
                ? "Add bikes to your studio in the database, then they'll show up here."
                : "Try a different search or filter."
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((bike, i) => (
              <BikeCard key={bike.id} bike={bike} index={i} />
            ))}
          </div>
        )}
      </div>
    </Page>
  );
}
