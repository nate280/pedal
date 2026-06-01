import { cn } from "@/lib/utils";

export function PageHeader({ title, description, children, className }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-[28px]">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

export function Page({ children, className }) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-6xl px-5 py-7 sm:px-8 sm:py-9 animate-fade-in",
        className
      )}
    >
      {children}
    </div>
  );
}
