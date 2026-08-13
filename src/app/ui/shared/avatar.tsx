export function Avatar({
  name,
  compact = false,
}: {
  name: string;
  compact?: boolean;
}) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#dff6e7] to-[#bfe9cd] font-bold text-[#168943] ${
        compact ? "h-10 w-10 text-sm" : "h-12 w-12 text-base"
      }`}
    >
      {name.trim().charAt(0).toUpperCase() || "L"}
    </span>
  );
}
