interface WarningListProps {
  items: string[];
  type?: "warning" | "blocker";
  className?: string;
}

export function WarningList({
  items,
  type = "warning",
  className = "",
}: WarningListProps) {
  if (items.length === 0) return null;

  const isBlocker = type === "blocker";
  const icon = isBlocker ? "●" : "◇";
  const borderClass = isBlocker
    ? "border-red-800 bg-red-950/30"
    : "border-amber-800 bg-amber-950/20";
  const textClass = isBlocker ? "text-red-200" : "text-amber-200";

  return (
    <ul
      className={`rounded-lg border px-3 py-2 ${borderClass} ${className}`}
      role="list"
    >
      {items.map((msg, i) => (
        <li key={i} className={`flex gap-2 text-xs ${textClass}`}>
          <span className="shrink-0" aria-hidden>
            {icon}
          </span>
          <span>{msg}</span>
        </li>
      ))}
    </ul>
  );
}
