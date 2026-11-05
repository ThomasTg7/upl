import { useId } from "react";
import { cn } from "@/lib/cn";

/** Decorative diagonal cut taken from the UPL logo: a gold blade and its white outline, both slanted like the lettering. */
export function BrandMark({ className }: { className?: string }) {
  const gradientId = `upl-mark-${useId().replace(/:/g, "")}`;
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 190 380" fill="none" className={cn("pointer-events-none", className)}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE7A3" />
          <stop offset=".45" stopColor="#D9A82E" />
          <stop offset="1" stopColor="#8A6318" stopOpacity=".2" />
        </linearGradient>
      </defs>
      <path d="M150 8h34L58 372H24Z" fill={`url(#${gradientId})`} />
      <path d="M104 8h22L4 372h-0" stroke="#ffffff" strokeOpacity=".75" strokeWidth="3" />
    </svg>
  );
}
