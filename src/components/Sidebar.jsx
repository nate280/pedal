import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Bike,
  PlusCircle,
  Settings,
  LogOut,
  ChevronsUpDown,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/fleet", label: "Fleet", icon: Bike },
  { to: "/log", label: "Log Issue", icon: PlusCircle },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ onNavigate }) {
  const { user, signOut } = useAuth();
  const { studio, bikes, issues } = useData();
  const navigate = useNavigate();

  const openCount = issues.filter((i) => i.status !== "resolved").length;
  const initials = (user?.email?.[0] || "P").toUpperCase();

  return (
    <div className="flex h-full flex-col bg-[#0c0c0c] border-r border-border">
      <div className="flex h-16 items-center px-5 border-b border-border">
        <Logo
          markSize={18}
          wordStyle={{
            fontFamily: "'Instrument Serif', serif",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        />
      </div>

      <div className="px-3 py-4">
        <div className="rounded-lg bg-card/60 border border-border px-3 py-2.5">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Studio
          </p>
          <p className="truncate text-sm font-semibold text-foreground">
            {studio?.name || "Your Studio"}
          </p>
          <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground tabular">
            <span>{bikes.length} bikes</span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span className={cn(openCount > 0 && "text-warn")}>
              {openCount} open
            </span>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-lg bg-secondary"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-brand" />
                  )}
                  <Icon className="relative z-10 h-[18px] w-[18px]" />
                  <span className="relative z-10">{item.label}</span>
                  {item.to === "/log" && openCount > 0 && (
                    <span className="relative z-10 ml-auto rounded-full bg-warn/15 px-1.5 py-0.5 text-[10px] font-semibold text-warn tabular">
                      {openCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg border border-border bg-card/60 px-3 py-2.5 text-left transition-colors hover:bg-secondary/60">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/15 text-sm font-semibold text-brand">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {user?.email?.split("@")[0] || "Staff"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user?.email || "Signed in"}
                </p>
              </div>
              <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56">
            <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
              {user?.email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <Settings className="h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={async () => {
                await signOut();
              }}
            >
              <LogOut className="h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
