import { useState } from "react";
import {
  Building2,
  User,
  Database,
  LogOut,
  Check,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Page, PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

export default function Settings() {
  const { user, signOut } = useAuth();
  const { studio, bikes, issues, reload } = useData();
  const { toast } = useToast();
  const [studioName, setStudioName] = useState(studio?.name || "");
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const saveStudio = async () => {
    if (!studio) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("studios")
        .update({ name: studioName.trim() })
        .eq("id", studio.id);
      if (error) throw error;
      toast({ variant: "success", title: "Studio updated" });
      await reload();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Couldn't save",
        description: err.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
    toast({ variant: "success", title: "Data refreshed" });
  };

  return (
    <Page className="max-w-3xl">
      <PageHeader
        title="Settings"
        description="Manage your studio and account."
      />

      <div className="mt-7 space-y-4">
        {/* Studio */}
        <SectionCard
          icon={Building2}
          title="Studio"
          description="The name shown across Pedal."
        >
          <div className="space-y-2">
            <Label htmlFor="studioName">Studio name</Label>
            <div className="flex gap-2">
              <Input
                id="studioName"
                value={studioName}
                onChange={(e) => setStudioName(e.target.value)}
                placeholder={studio ? "Studio name" : "No studio found"}
                disabled={!studio}
              />
              <Button
                onClick={saveStudio}
                disabled={saving || !studio || studioName === studio?.name}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Metric label="Bikes" value={bikes.length} />
            <Metric
              label="Open issues"
              value={issues.filter((i) => i.status !== "resolved").length}
            />
            <Metric label="Total logged" value={issues.length} />
          </div>
        </SectionCard>

        {/* Account */}
        <SectionCard
          icon={User}
          title="Account"
          description="Your sign-in identity for this studio."
        >
          <div className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/15 text-sm font-semibold text-brand">
                {(user?.email?.[0] || "P").toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {user?.email}
                </p>
                <p className="text-xs text-muted-foreground">
                  Signed in via email
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await signOut();
              }}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </SectionCard>

        {/* Data / connection */}
        <SectionCard
          icon={Database}
          title="Data"
          description="Connection to your Supabase backend."
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span className="flex h-2 w-2 rounded-full bg-good">
                <span className="h-2 w-2 animate-ping rounded-full bg-good/70" />
              </span>
              <span className="text-foreground">Connected to Supabase</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw
                className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"}
              />
              Refresh
            </Button>
          </div>
        </SectionCard>
      </div>
    </Page>
  );
}

function SectionCard({ icon: Icon, title, description, children }) {
  return (
    <Card className="p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h2 className="font-display text-base font-semibold text-foreground">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </Card>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 px-4 py-3">
      <p className="font-display text-xl font-bold text-foreground tabular">
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
