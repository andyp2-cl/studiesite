import { strings } from "@/lib/strings";

export default function Loading() {
  return (
    <div className="bg-dots flex min-h-dvh items-center justify-center px-4">
      <p className="font-mono text-sm text-muted-foreground">{strings.practice.loading}</p>
    </div>
  );
}
