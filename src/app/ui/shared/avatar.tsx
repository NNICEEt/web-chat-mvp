export function Avatar({
  name,
  pictureUrl,
  compact = false,
}: {
  name: string;
  pictureUrl: string | null;
  compact?: boolean;
}) {
  const sizeClass = compact ? "h-10 w-10 text-sm" : "h-12 w-12 text-base";

  if (pictureUrl) {
    return (
      <span
        role="img"
        aria-label={name}
        className={`shrink-0 rounded-2xl bg-cover bg-center ${sizeClass}`}
        style={{ backgroundImage: `url(${JSON.stringify(pictureUrl)})` }}
      />
    );
  }

  return (
    <span
      className={`grid shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#dff6e7] to-[#bfe9cd] font-bold text-[#168943] ${
        sizeClass
      }`}
    >
      {name.trim().charAt(0).toUpperCase() || "L"}
    </span>
  );
}
