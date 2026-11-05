import Image from "next/image";
import { BRAND } from "@/domain/brand";
import { cn } from "@/lib/cn";

type LogoSize = "sm" | "md" | "lg";

type LogoProps = {
  size?: LogoSize;
  priority?: boolean;
};

// The artwork is wide (≈ 2.2:1): «UPL» over «SERIES».
const sizeClasses: Record<LogoSize, string> = {
  sm: "h-10 w-24",
  md: "h-12 w-28",
  lg: "h-32 w-72",
};

/** Transparent UPL Series artwork (white lettering with the diagonal cut) contained in its reserved space. */
export function Logo({ size = "md", priority = false }: LogoProps) {
  return (
    <span
      role="img"
      aria-label={BRAND.name}
      className={cn("relative inline-block shrink-0 overflow-hidden", sizeClasses[size])}
    >
      <Image src="/upl-logo-transparent.webp" alt="" aria-hidden width={1001} height={448} priority={priority} sizes={size === "lg" ? "288px" : "112px"} className="size-full object-contain" />
    </span>
  );
}
