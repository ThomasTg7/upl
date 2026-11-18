import { ArrowRight, ArrowUpRight, Play, Ticket } from "lucide-react";
import type { ReactNode } from "react";

export const eventActionClass = "min-h-12 w-full justify-start gap-2 px-3 py-2 text-sm tracking-[.07em] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export function EventActionContent({ kind, children }: { kind: "event" | "tickets" | "watch"; children: ReactNode }) {
  const Leading = kind === "tickets" ? Ticket : kind === "watch" ? Play : null;
  const Arrow = kind === "event" ? ArrowRight : ArrowUpRight;
  return <>
    {Leading ? <Leading aria-hidden="true" className="size-4 shrink-0" /> : null}
    <span className="text-left">{children}</span>
    <Arrow aria-hidden="true" className="ml-auto size-4 shrink-0" />
  </>;
}
