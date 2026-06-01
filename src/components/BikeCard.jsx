import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Wrench, AlertCircle, ArrowUpRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { StatusBadge } from "@/components/StatusBadge";
import { BIKE_STATUS } from "@/lib/constants";
import { cn, formatPosition } from "@/lib/utils";

export function BikeCard({ bike, index = 0 }) {
  const status = bike.derivedStatus;
  const cfg = BIKE_STATUS[status] ?? BIKE_STATUS.good;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3) }}
    >
      <Link
        to={`/fleet/${bike.id}`}
        className={cn(
          "group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:border-foreground/20 hover:bg-card/80",
          "hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-16px_rgba(0,0,0,0.8)]"
        )}
      >
        {/* status accent strip */}
        <span
          className={cn("absolute left-0 top-0 h-full w-1", cfg.dot)}
          style={{ opacity: 0.9 }}
        />

        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <h3 className="font-display font-normal text-foreground" style={{ fontSize: "1.2rem" }}>
              {bike.name}
            </h3>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate">
                {formatPosition(bike.floor_position)}
              </span>
            </div>
          </div>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </div>

        <div className="mt-4">
          <StatusBadge status={status} />
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Wrench className="h-3.5 w-3.5" />
            <span className="tabular">
              {bike.lastMaintenance
                ? `Serviced ${formatDistanceToNow(new Date(bike.lastMaintenance), { addSuffix: true })}`
                : "No service yet"}
            </span>
          </div>
          {bike.openIssueCount > 0 ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 font-semibold tabular",
                status === "out_of_service" ? "text-danger" : "text-warn"
              )}
            >
              <AlertCircle className="h-3.5 w-3.5" />
              {bike.openIssueCount}
            </span>
          ) : (
            <span className="text-good tabular">0 open</span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
