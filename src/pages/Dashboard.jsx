import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bike,
  HeartPulse,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
  Flame,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  startOfWeek,
  endOfWeek,
  subWeeks,
  isWithinInterval,
  startOfMonth,
  format,
} from "date-fns";
import { motion } from "framer-motion";
import { Page, PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { useData } from "@/context/DataContext";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { bikes, issues, loading } = useData();

  const stats = useMemo(() => {
    const total = bikes.length;
    const good = bikes.filter((b) => b.derivedStatus === "good").length;
    const open = issues.filter((i) => i.status !== "resolved");

    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);

    const resolvedThisWeek = issues.filter(
      (i) => i.resolved_at && new Date(i.resolved_at) >= weekStart
    ).length;
    const resolvedThisMonth = issues.filter(
      (i) => i.resolved_at && new Date(i.resolved_at) >= monthStart
    ).length;

    return {
      total,
      good,
      goodPct: total ? Math.round((good / total) * 100) : 0,
      open: open.length,
      highOpen: open.filter((i) => i.severity === "high").length,
      resolvedThisWeek,
      resolvedThisMonth,
    };
  }, [bikes, issues]);

  // Issue trend over the last 8 weeks: opened vs resolved.
  const trend = useMemo(() => {
    const weeks = [];
    for (let i = 7; i >= 0; i--) {
      const ref = subWeeks(new Date(), i);
      const start = startOfWeek(ref, { weekStartsOn: 1 });
      const end = endOfWeek(ref, { weekStartsOn: 1 });
      const interval = { start, end };
      const opened = issues.filter((iss) =>
        isWithinInterval(new Date(iss.created_at), interval)
      ).length;
      const resolved = issues.filter(
        (iss) =>
          iss.resolved_at &&
          isWithinInterval(new Date(iss.resolved_at), interval)
      ).length;
      weeks.push({ label: format(start, "MMM d"), opened, resolved });
    }
    return weeks;
  }, [issues]);

  const problematic = useMemo(() => {
    return [...bikes]
      .map((b) => ({
        ...b,
        score: b.totalIssueCount + b.openIssueCount * 2,
      }))
      .filter((b) => b.totalIssueCount > 0)
      .sort((a, b) => b.score - a.score || b.openIssueCount - a.openIssueCount)
      .slice(0, 5);
  }, [bikes]);

  if (loading) {
    return (
      <Page>
        <PageHeader title="Dashboard" />
        <div className="mt-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="mt-4 h-80 rounded-xl" />
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader
        title="Dashboard"
        description={`Fleet health for ${format(new Date(), "EEEE, MMM d")}.`}
      >
        <Button asChild variant="secondary">
          <Link to="/fleet">
            View fleet
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </PageHeader>

      {/* Stat cards */}
      <div className="mt-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Bike}
          label="Total bikes"
          value={stats.total}
          sub={`${stats.total - stats.good} need attention`}
          index={0}
        />
        <StatCard
          icon={HeartPulse}
          label="Good condition"
          value={`${stats.goodPct}%`}
          sub={`${stats.good} of ${stats.total} bikes`}
          tone="good"
          index={1}
          progress={stats.goodPct}
        />
        <StatCard
          icon={AlertCircle}
          label="Open issues"
          value={stats.open}
          sub={
            stats.highOpen > 0
              ? `${stats.highOpen} high severity`
              : "Nothing critical"
          }
          tone={stats.open > 0 ? "warn" : "good"}
          index={2}
        />
        <StatCard
          icon={CheckCircle2}
          label="Resolved this week"
          value={stats.resolvedThisWeek}
          sub={`${stats.resolvedThisMonth} this month`}
          tone="brand"
          index={3}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        {/* Trend chart */}
        <Card className="lg:col-span-3">
          <div className="flex items-center justify-between p-5 pb-0">
            <div>
              <h2 className="font-display text-base font-semibold text-foreground">
                Issue trends
              </h2>
              <p className="text-xs text-muted-foreground">
                Opened vs. resolved · last 8 weeks
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <LegendDot className="bg-warn" label="Opened" />
              <LegendDot className="bg-good" label="Resolved" />
            </div>
          </div>
          <div className="h-64 p-3 pt-4">
            <TrendChart data={trend} />
          </div>
        </Card>

        {/* Most problematic bikes */}
        <Card className="lg:col-span-2">
          <div className="flex items-center gap-2 p-5 pb-3">
            <Flame className="h-4 w-4 text-warn" />
            <h2 className="font-display text-base font-semibold text-foreground">
              Most problematic
            </h2>
          </div>
          <div className="px-3 pb-3">
            {problematic.length === 0 ? (
              <div className="px-2 py-8 text-center text-sm text-muted-foreground">
                No issues logged yet. The whole fleet is clean.
              </div>
            ) : (
              <div className="space-y-1">
                {problematic.map((b, i) => (
                  <Link
                    key={b.id}
                    to={`/fleet/${b.id}`}
                    className="group flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-secondary/60"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-secondary text-xs font-semibold text-muted-foreground tabular">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {b.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {b.totalIssueCount} total · {b.openIssueCount} open
                      </p>
                    </div>
                    <StatusBadge status={b.derivedStatus} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {stats.total === 0 && (
        <div className="mt-4">
          <EmptyState
            icon={Bike}
            title="Your fleet is empty"
            description="Once bikes are added to the studio, their health rolls up here automatically."
          />
        </div>
      )}
    </Page>
  );
}

function StatCard({ icon: Icon, label, value, sub, tone, index, progress }) {
  const toneText =
    tone === "good"
      ? "text-good"
      : tone === "warn"
        ? "text-warn"
        : tone === "brand"
          ? "text-brand"
          : "text-foreground";
  const toneBg =
    tone === "good"
      ? "bg-good/10 text-good"
      : tone === "warn"
        ? "bg-warn/10 text-warn"
        : tone === "brand"
          ? "bg-brand/10 text-brand"
          : "bg-secondary text-muted-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="p-5">
        <div className="flex items-start justify-between">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              toneBg
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <p className={cn("mt-3 font-display text-3xl font-bold tabular", toneText)}>
          {value}
        </p>
        {typeof progress === "number" && (
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <motion.div
              className="h-full rounded-full bg-good"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, delay: 0.2 }}
            />
          </div>
        )}
        <p className="mt-2 text-xs text-muted-foreground">{sub}</p>
      </Card>
    </motion.div>
  );
}

function LegendDot({ className, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span className={cn("h-2 w-2 rounded-full", className)} />
      {label}
    </span>
  );
}

function TrendChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="openedFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--warn))" stopOpacity={0.35} />
            <stop offset="100%" stopColor="hsl(var(--warn))" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="resolvedFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--good))" stopOpacity={0.3} />
            <stop offset="100%" stopColor="hsl(var(--good))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(0 0% 100% / 0.05)"
          vertical={false}
        />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11 }}
          dy={6}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          tick={{ fontSize: 11 }}
          width={32}
        />
        <Tooltip
          cursor={{ stroke: "hsl(0 0% 100% / 0.1)" }}
          contentStyle={{
            backgroundColor: "hsl(0 0% 10%)",
            border: "1px solid hsl(0 0% 16%)",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: "hsl(0 0% 60%)" }}
        />
        <Area
          type="monotone"
          dataKey="opened"
          name="Opened"
          stroke="hsl(var(--warn))"
          strokeWidth={2}
          fill="url(#openedFill)"
        />
        <Area
          type="monotone"
          dataKey="resolved"
          name="Resolved"
          stroke="hsl(var(--good))"
          strokeWidth={2}
          fill="url(#resolvedFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
