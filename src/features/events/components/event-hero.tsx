import { BRAND } from "@/domain/brand";
import { SmoothAnchor } from "@/components/motion/smooth-anchor";
import { Button } from "@/components/ui-gc/button";
import { Tag } from "@/components/ui-gc/tag";
import { formatShortDate, formatTime } from "@/lib/format-date";
import type { EventPageDTO } from "../dto";
import { pickMainBout } from "../main-bout";
import { eventStatusTag } from "../public-format";
import { Countdown } from "./countdown";
import { EventActionContent, eventActionClass } from "./event-action-content";
import { EventHeroArt } from "./event-hero-art";
import { WatchEventButton } from "./watch-event-button";

export const EVENT_HERO_ID = "event-hero";
type EventHeroProps = { event: EventPageDTO; ticketHref?: string; ticketExternal?: boolean; showCountdown: boolean };

/** Full-width photography with centered event billing and actions. */
export function EventHero({ event, ticketHref, ticketExternal = false, showCountdown }: EventHeroProps) {
  const main = pickMainBout(event.segments.flatMap((segment) => segment.bouts), (bout) => bout.status === "cancelled");
  const start = new Date(event.startsAt);
  const status = eventStatusTag(event.eventStatus);
  return (
    <section id={EVENT_HERO_ID} data-site-hero aria-labelledby="event-title" className="upl-hero relative isolate flex min-h-[max(760px,100svh)] items-end overflow-hidden pt-24 text-center lg:min-h-[max(850px,100svh)]">
      <EventHeroArt event={event} main={main} />
      <div className="relative z-[4] mx-auto w-full max-w-[1320px] px-[clamp(16px,4vw,64px)] pb-12 pt-56 lg:pb-12 lg:pt-40">
        <div className="mx-auto max-w-[960px]">
          <p className="upl-rise mb-5 hidden font-wide text-sm tracking-[.32em] text-white uppercase lg:block">{BRAND.name}</p>
          <div className="upl-rise mb-5 flex flex-wrap items-center justify-center gap-2" data-delay="1">
            <Tag tone="brand">{event.name}</Tag><Tag tone={status.tone}>{status.label}</Tag>
          </div>
          <h1 id="event-title" className="font-display text-[clamp(44px,8vw,100px)] uppercase leading-[.98] tracking-[-.025em] text-white [overflow-wrap:anywhere] lg:flex lg:flex-wrap lg:items-center lg:justify-center lg:gap-x-6">
            {main ? <><span data-slot="hero-red" className="block">{main.red.lastName}</span><span className="my-2 block font-wide text-[.3em] tracking-[.12em] upl-gradient-text">VS</span><span data-slot="hero-blue" className="block">{main.blue.lastName}</span></> : event.name}
          </h1>
          <div aria-hidden className="upl-hero-rule mx-auto mt-7" />
          <p className="upl-rise mt-5 font-cond text-base font-bold italic tracking-[.28em] text-white uppercase sm:text-lg" data-delay="2">{formatShortDate(start)} · {formatTime(start)} hrs</p>
          <p className="mt-1 text-sm text-white/70">{event.venue.name}{event.venue.city ? `, ${event.venue.city}` : ""}</p>
          {showCountdown ? <Countdown target={event.startsAt} className="my-6 justify-center" /> : <div className="h-6" />}
          <div data-slot="event-hero-actions" className={`mx-auto grid max-w-[640px] gap-2 ${ticketHref ? "grid-cols-2 md:grid-cols-3" : "md:max-w-[440px] md:grid-cols-2"}`}>
            <Button variant="ghost" className={eventActionClass} asChild><SmoothAnchor aria-label={event.eventStatus === "completed" ? "Ver cartelera y resultados" : "Ver cartelera completa"} href="#cartelera"><EventActionContent kind="event">{event.eventStatus === "completed" ? "Ver resultados" : "Ver cartelera"}</EventActionContent></SmoothAnchor></Button>
            {ticketHref ? <Button variant="ghost" className={eventActionClass} asChild><a href={ticketHref} aria-label="Comprar entradas" {...(ticketExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}><EventActionContent kind="tickets">Entradas</EventActionContent></a></Button> : null}
            <WatchEventButton eventName={event.name} platforms={event.watchPlatforms ?? (event.streamUrl ? [{ name: "Transmisión oficial", url: event.streamUrl, media: null }] : [])} variant="ghost" ariaLabel="Dónde ver" className={`${eventActionClass} col-span-full md:col-span-1`}><EventActionContent kind="watch">Dónde ver</EventActionContent></WatchEventButton>
          </div>
        </div>
      </div>
    </section>
  );
}
