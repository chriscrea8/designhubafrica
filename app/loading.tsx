export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-4 border-terracotta-100" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-terracotta-500 animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground font-medium">Loading…</p>
      </div>
    </div>
  );
}
