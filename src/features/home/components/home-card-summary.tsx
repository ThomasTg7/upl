import Link from "next/link";
import { Button } from "@/components/ui-gc/button";
import { SectionHeading } from "@/components/ui-gc/section-heading";
import { BoutAccordion } from "@/features/events/components/bout-accordion";
import { BoutRow } from "@/features/events/components/bout-row";
import { EventSchedule } from "@/features/events/components/event-schedule";
import { EventActionContent, eventActionClass } from "@/features/events/components/event-action-content";
import { FightCardTabs } from "@/features/events/components/fight-card-tabs";
import { WatchEventButton } from "@/features/events/components/watch-event-button";
import type { HomeEvent } from "../dto";

type HomeCardSummaryProps = HomeEvent & { kind: "next-event" | "last-event" };

/**
 * La cartelera del evento de la portada, resumida (maqueta): pestañas por bloque con cada pelea, horarios y recinto. Es la
 * misma cartelera de la página del evento (las peleas se abren con su frente a frente); el «Ver evento» lleva a ella. Un
 * evento sin peleas todavía dice que se anunciará.
 */
export function HomeCardSummary({ event, rankLabels, kind }: HomeCardSummaryProps) {
  const segments = event.segments.filter((segment) => segment.bouts.length > 0);
  const isLast = kind === "last-event";

  return (
    <section id="cartelera" aria-labelledby="home-card-title" className="bg-white py-[clamp(72px,10vw,140px)] text-black">
      <div className="mx-auto w-full max-w-[1320px] px-[clamp(16px,4vw,64px)]">
        <div data-reveal>
          <SectionHeading
            kicker={isLast ? "Último evento" : "Próximo evento"}
            title={
              <span id="home-card-title">
                {isLast ? "Resultados" : "Cartelera"}
                <br />
                {event.name}
              </span>
            }
            tone="light"
            action={
              <div data-slot="home-card-actions" className={`grid w-full max-w-[640px] grid-cols-2 gap-2 ${isLast ? "md:max-w-[440px]" : "md:grid-cols-3"}`}>
                <Button variant="outline-light" className={eventActionClass} asChild>
                  <Link href={`/eventos/${event.slug}`}><EventActionContent kind="event">Ver evento</EventActionContent></Link>
                </Button>
                {!isLast ? <Button variant="outline-light" className={eventActionClass} asChild>
                  <a href={event.ticketUrl ?? "/entradas"} {...(event.ticketUrl ? { target: "_blank", rel: "noopener noreferrer" } : {})}><EventActionContent kind="tickets">Entradas</EventActionContent></a>
                </Button> : null}
                <WatchEventButton eventName={event.name} platforms={event.watchPlatforms} variant="outline-light" ariaLabel="Dónde ver" className={`${eventActionClass} ${isLast ? "" : "col-span-full md:col-span-1"}`}>
                  <EventActionContent kind="watch">Dónde ver</EventActionContent>
                </WatchEventButton>
              </div>
            }
            className="flex-col items-start"
          />
        </div>
        {segments.length > 0 ? (
          <BoutAccordion>
            <FightCardTabs
              segments={segments.map((segment) => ({
                id: segment.id,
                name: segment.name,
                content: segment.bouts.map((bout) => <BoutRow key={bout.id} bout={bout} eventSlug={event.slug} rankLabels={rankLabels} />),
              }))}
            />
          </BoutAccordion>
        ) : (
          <p className="border border-dashed border-neutral-300 px-6 py-12 text-center font-cond text-lg font-semibold uppercase tracking-[.06em] text-neutral-600">Pronto anunciaremos la cartelera de {event.name}.</p>
        )}
        <EventSchedule event={event} />
      </div>
    </section>
  );
}
