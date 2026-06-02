import { Database, Terminal } from "lucide-react";
import { Logo } from "@/components/Logo";

/** Shown when .env.local still holds placeholder Supabase values. */
export function ConfigNotice() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background bg-glow px-6">
      <div className="w-full max-w-md">
        <Logo className="mb-8 justify-center" markSize={32} />
        <div className="rounded-xl border border-border bg-card p-7 shadow-2xl">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-brand/15 text-brand">
            <Database className="h-5 w-5" />
          </div>
          <h1 className="font-display text-[32px] leading-[1.1em] font-medium text-foreground">
            Connect Supabase
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Pedal is ready to run. Add your Supabase credentials to{" "}
            <code className="rounded bg-secondary px-1.5 py-0.5 text-xs text-foreground">
              .env.local
            </code>{" "}
            and restart the dev server.
          </p>

          <div className="mt-5 space-y-2 rounded-lg border border-border bg-background/60 p-4 font-mono text-xs text-muted-foreground">
            <div className="flex items-center gap-2 text-foreground/80">
              <Terminal className="h-3.5 w-3.5" />
              .env.local
            </div>
            <div>
              <span className="text-brand">VITE_SUPABASE_URL</span>=
              https://xxxx.supabase.co
            </div>
            <div>
              <span className="text-brand">VITE_SUPABASE_ANON_KEY</span>=eyJhb…
            </div>
          </div>

          <ol className="mt-5 space-y-2.5 text-sm text-muted-foreground">
            <li className="flex gap-2.5">
              <span className="text-brand">1.</span> Run the migration in{" "}
              <code className="text-foreground/80">
                supabase/migrations
              </code>{" "}
              via the SQL editor.
            </li>
            <li className="flex gap-2.5">
              <span className="text-brand">2.</span> Create a public Storage
              bucket named{" "}
              <code className="text-foreground/80">issue-photos</code>.
            </li>
            <li className="flex gap-2.5">
              <span className="text-brand">3.</span> Paste your API keys above,
              then restart{" "}
              <code className="text-foreground/80">npm run dev</code>.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
