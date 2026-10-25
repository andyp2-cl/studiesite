import { cn } from "@/lib/utils";

// Small form primitives in the terminal style, shared by admin pages.

export const inputClass =
  "h-10 w-full border border-input bg-card px-3 text-sm outline-none focus:border-primary disabled:opacity-60";
export const textareaClass =
  "w-full border border-input bg-card p-3 font-mono text-sm leading-relaxed outline-none focus:border-primary";
export const labelClass = "font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase";

export function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
      </label>
      {children}
      {hint && <p className="font-mono text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md";
};

export function Button({ variant = "outline", size = "md", className, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-mono font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50",
        size === "md" ? "h-10 px-4 text-xs" : "h-8 px-3 text-[11px]",
        variant === "primary" && "bg-primary text-primary-foreground hover:opacity-90",
        variant === "outline" && "border border-border hover:border-foreground",
        variant === "danger" && "border border-destructive/50 text-destructive hover:bg-destructive/10",
        variant === "ghost" && "text-muted-foreground hover:text-foreground",
        className,
      )}
    />
  );
}

export function Message({ kind, children }: { kind: "error" | "success"; children: React.ReactNode }) {
  return (
    <p
      role={kind === "error" ? "alert" : "status"}
      className={cn("font-mono text-xs", kind === "error" ? "text-destructive" : "text-success")}
    >
      {children}
    </p>
  );
}
