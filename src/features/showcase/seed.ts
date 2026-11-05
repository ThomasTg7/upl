import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import type { Db } from "@/db";
import { divisions } from "@/db/schema/divisions";
import { bouts, cardSegments, events, type TicketTier } from "@/db/schema/events";
import { fighters } from "@/db/schema/fighters";
import { media } from "@/db/schema/media";
import { postCategories, postEvents, postFighters, posts } from "@/db/schema/posts";
import type { MediaKind } from "@/domain/media-specs";
import type { PostBody, PostNode } from "@/domain/post-body";
import { normalizeSearchText } from "@/domain/search";
import { slugify } from "@/domain/slug";
import { DEFAULT_EDIT } from "@/features/media/schema";
import { setChampion } from "@/features/rankings/service";
import { finalizeUpload, saveMediaEdit } from "@/features/media/service";
import { fromSantiagoInputs } from "@/lib/santiago-time";
import { getStorage, type StorageDriver } from "@/lib/storage";

/**
 * Vitrina de UPL Series para la instalación de demostración (no la usan las pruebas): numera los eventos de ejemplo
 * como UPL 11–15 y deja UPL 15 como el próximo evento real del afiche (Mateo Hernández vs Juan Rodriguez, defensa del
 * título UPL amateur, 21 de noviembre a las 15:00 en el CEDEC), con sus fotos y una noticia destacada. Idempotente.
 */

const ASSETS = path.join(process.cwd(), "scripts", "seed-assets");
const EVENT_SLUG = "upl-15";
const EVENT_DATE = "2026-11-21";
const NUMBER_OFFSET = 10;

type ShowcaseFighter = {
  slug: string;
  firstName: string;
  lastName: string;
  hometown: string;
  bio: string;
  am: [wins: number, losses: number, draws: number];
  body: string;
  headshot: string;
};

const MATEO: ShowcaseFighter = {
  slug: "mateo-hernandez",
  firstName: "Mateo",
  lastName: "Hernández",
  hometown: "Montevideo",
  bio: "Campeón UPL amateur. Llega a UPL 15 a defender el cinturón por primera vez.",
  am: [6, 1, 0],
  body: "mateo-hernandez-body.webp",
  headshot: "mateo-hernandez-headshot.webp",
};

const JUAN: ShowcaseFighter = {
  slug: "juan-rodriguez",
  firstName: "Juan",
  lastName: "Rodriguez",
  hometown: "Montevideo",
  bio: "Retador al título UPL amateur. Presión constante y mentón de hierro.",
  am: [5, 1, 0],
  body: "juan-rodriguez-body.webp",
  headshot: "juan-rodriguez-headshot.webp",
};

const TIERS: TicketTier[] = [
  { name: "General", description: "Tribuna · Acceso 14:00", priceClp: 600, soldOut: false },
  { name: "Preferencial", description: "Platea cerca de la jaula", priceClp: 1200, soldOut: false },
  { name: "Ringside", description: "Primera fila · Meet & greet", priceClp: 2500, soldOut: false },
];

/** Sube un archivo de `scripts/seed-assets` por el mismo camino que el panel: original, variantes WebP y `ready`. */
async function seedImage(db: Db, storage: StorageDriver, kind: MediaKind, file: string, alt: string, focal = { x: 0.5, y: 0.5 }): Promise<string> {
  const id = randomUUID();
  const originalKey = `originals/${kind}/${id}.webp`;
  await storage.put(originalKey, await readFile(path.join(ASSETS, file)), "image/webp");
  await db.insert(media).values({ id, kind, originalKey, mime: "image/webp" });
  await finalizeUpload(db, storage, id);
  await saveMediaEdit(db, storage, id, { ...DEFAULT_EDIT, focal, alt });
  return id;
}

function instant(time: string, date = EVENT_DATE): Date {
  const value = fromSantiagoInputs(date, time);
  if (!value) throw new Error(`Fecha inválida en la vitrina: ${date} ${time}`);
  return value;
}

async function seedShowcaseFighter(db: Db, storage: StorageDriver, fighter: ShowcaseFighter, divisionId: string, limitKg: number | null): Promise<string> {
  const [existing] = await db.select({ id: fighters.id }).from(fighters).where(eq(fighters.slug, fighter.slug)).limit(1);
  if (existing) return existing.id;
  const name = `${fighter.firstName} ${fighter.lastName}`;
  const bodyMediaId = await seedImage(db, storage, "fighter_body", fighter.body, name);
  const headshotMediaId = await seedImage(db, storage, "fighter_headshot", fighter.headshot, name, { x: 0.5, y: 0.4 });
  const [wins, losses, draws] = fighter.am;
  const [created] = await db
    .insert(fighters)
    .values({
      slug: fighter.slug,
      firstName: fighter.firstName,
      lastName: fighter.lastName,
      gender: "male",
      nationality: "UY",
      hometown: fighter.hometown,
      divisionId,
      weightKg: limitKg,
      bio: fighter.bio,
      bodyMediaId,
      headshotMediaId,
      amWins: wins,
      amLosses: losses,
      amDraws: draws,
      searchText: normalizeSearchText(name),
      status: "published",
    })
    .returning({ id: fighters.id });
  return created!.id;
}

/** Los eventos de ejemplo UPL 1–5 pasan a ser UPL 11–15 (nombre, número y slug) y las noticias se actualizan igual. */
async function renumberDemoEvents(db: Db): Promise<void> {
  const [done] = await db.select({ id: events.id }).from(events).where(eq(events.slug, EVENT_SLUG)).limit(1);
  if (done) return;
  await db.execute(sql`
    UPDATE events SET number = number + ${NUMBER_OFFSET}, name = 'UPL ' || (number + ${NUMBER_OFFSET}), slug = 'upl-' || (number + ${NUMBER_OFFSET}),
      ticket_url = regexp_replace(ticket_url, 'upl-([0-9]+)$', 'upl-1\\1'), updated_at = now()
    WHERE slug ~ '^upl-[1-5]$'`);
  await db.execute(sql`UPDATE events SET venue_name = 'Arena UPL', venue_address = 'Montevideo', venue_city = 'Montevideo', lat = NULL, lng = NULL WHERE slug ~ '^upl-1[1-4]$'`);
  // La estelar de UPL 15 pasa a ser la defensa amateur: la noticia de ejemplo de «Pérez defiende el cinturón» deja de aplicar.
  await db.execute(sql`DELETE FROM posts WHERE slug = 'perez-defiende-el-cinturon-ante-soto'`);
  await db.execute(sql`
    UPDATE posts SET body = replace(body::text, 'La cartelera estelar la encabeza la defensa de Pérez.', 'La cartelera estelar la encabeza la defensa del título amateur de Mateo Hernández ante Juan Rodriguez.')::jsonb,
      excerpt = 'Seis peleas, cuatro divisiones y la defensa del título UPL amateur en la estelar.'
    WHERE slug = 'cartelera-completa-de-upl-5-confirmada'`);
  await db.execute(sql`
    UPDATE posts SET title = regexp_replace(title, 'UPL ([1-5])\\M', 'UPL 1\\1', 'g'), slug = regexp_replace(slug, 'upl-([1-5])\\M', 'upl-1\\1', 'g'),
      excerpt = regexp_replace(excerpt, 'UPL ([1-5])\\M', 'UPL 1\\1', 'g'), body = regexp_replace(body::text, 'UPL ([1-5])\\M', 'UPL 1\\1', 'g')::jsonb
    WHERE title ~ 'UPL [1-5]\\M' OR excerpt ~ 'UPL [1-5]\\M' OR body::text ~ 'UPL [1-5]\\M'`);
}

/** UPL 15 con la fecha, el recinto y el afiche reales, y la defensa del título amateur como pelea estelar. */
async function dressUpcomingEvent(db: Db, storage: StorageDriver, mateoId: string, juanId: string, divisionId: string): Promise<string> {
  const [event] = await db.select({ id: events.id, posterMediaId: events.posterMediaId }).from(events).where(eq(events.slug, EVENT_SLUG)).limit(1);
  if (!event) throw new Error("Falta el evento UPL 15: corre primero el seed de eventos");
  if (event.posterMediaId) return event.id;

  const posterMediaId = await seedImage(db, storage, "event_poster", "upl-15-poster.webp", "Afiche de UPL 15: Mateo Hernández vs Juan Rodriguez, defensa del título UPL amateur");
  await db
    .update(events)
    .set({
      startsAt: instant("15:00"),
      doorsAt: instant("14:00"),
      endsEstimatedAt: instant("20:00"),
      venueName: "CEDEC",
      venueAddress: "",
      venueCity: "Uruguay",
      lat: null,
      lng: null,
      posterMediaId,
      ticketTiers: TIERS,
      ticketProvider: "Ticketera oficial",
      ticketPoints: "Boletería del CEDEC el día del evento y puntos de venta oficiales de UPL Series.",
      eventStatus: "scheduled",
      updatedAt: new Date(),
    })
    .where(eq(events.id, event.id));

  const segments = await db.select({ id: cardSegments.id, sortOrder: cardSegments.sortOrder }).from(cardSegments).where(eq(cardSegments.eventId, event.id)).orderBy(cardSegments.sortOrder);
  const [main, ...rest] = segments;
  if (!main) throw new Error("UPL 15 no tiene cartelera");
  await db.update(cardSegments).set({ startsAt: instant("17:30") }).where(eq(cardSegments.id, main.id));
  if (rest.length) await db.update(cardSegments).set({ startsAt: instant("15:00") }).where(inArray(cardSegments.id, rest.map((segment) => segment.id)));

  // La defensa del título amateur abre la cartelera estelar: las demás peleas bajan un lugar y dejan de ser por título.
  await db.update(bouts).set({ sortOrder: sql`${bouts.sortOrder} + 1`, isTitleFight: false }).where(and(eq(bouts.segmentId, main.id), gte(bouts.sortOrder, 0)));
  await db.insert(bouts).values({
    eventId: event.id,
    segmentId: main.id,
    sortOrder: 0,
    redFighterId: mateoId,
    blueFighterId: juanId,
    divisionId,
    level: "amateur",
    scheduledRounds: 3,
    isTitleFight: true,
    notes: "Defensa del título UPL amateur",
  });
  return event.id;
}

const text = (value: string): PostNode => ({ type: "text", text: value });
const paragraph = (value: string): PostNode => ({ type: "paragraph", content: [text(value)] });
const heading = (value: string): PostNode => ({ type: "heading", attrs: { level: 2 }, content: [text(value)] });
const quote = (value: string): PostNode => ({ type: "blockquote", content: [paragraph(value)] });

const NEWS_TITLE = "UPL 15: Mateo Hernández defiende el título amateur ante Juan Rodriguez";
const NEWS_BODY: PostBody = {
  type: "doc",
  content: [
    paragraph("La Uruguay Premium League confirmó la estelar de UPL 15: el campeón Mateo Hernández pone en juego el cinturón UPL amateur ante Juan Rodriguez el sábado 21 de noviembre a las 15:00 en el CEDEC."),
    heading("El campeón contra el retador"),
    paragraph("Hernández llega con el cinturón al hombro y la confianza de su última victoria. Rodriguez, de barba roja y paso firme, ganó el derecho a la pelea por título con una racha que lo dejó como el retador natural."),
    quote("«El cinturón se queda en casa», adelantó el campeón en la presentación del evento."),
    heading("Cómo vivirlo"),
    paragraph("Las puertas abren a las 14:00. Revisa la cartelera completa, los tramos de entradas y los puntos de venta en la página del evento."),
  ],
};

async function seedShowcaseNews(db: Db, storage: StorageDriver, eventId: string, fighterIds: string[]): Promise<void> {
  const slug = slugify(NEWS_TITLE);
  const [existing] = await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, slug)).limit(1);
  if (existing) return;
  const [category] = await db.select({ id: postCategories.id }).from(postCategories).where(eq(postCategories.slug, "anuncios")).limit(1);
  if (!category) throw new Error("Falta la categoría Anuncios: corre primero el seed de noticias");
  const coverMediaId = await seedImage(db, storage, "news_cover", "upl-15-news-cover.webp", "Mateo Hernández, con el cinturón UPL amateur, junto a Juan Rodriguez", { x: 0.7, y: 0.4 });
  const [created] = await db
    .insert(posts)
    .values({
      slug,
      title: NEWS_TITLE,
      excerpt: "El campeón amateur expone el cinturón en la estelar de UPL 15: 21 de noviembre, 15:00, CEDEC.",
      body: NEWS_BODY,
      categoryId: category.id,
      coverMediaId,
      featured: true,
      status: "published",
      createdAt: new Date(),
    })
    .returning({ id: posts.id });
  await db.insert(postFighters).values(fighterIds.map((fighterId) => ({ postId: created!.id, fighterId })));
  await db.insert(postEvents).values({ postId: created!.id, eventId });
}

export async function seedUplShowcase(db: Db, storage: StorageDriver = getStorage()): Promise<void> {
  const [division] = await db.select({ id: divisions.id, limitKg: divisions.limitKg }).from(divisions).where(eq(divisions.slug, "peso-ligero")).limit(1);
  if (!division) throw new Error("Falta la división peso ligero: corre primero el seed de divisiones");
  await renumberDemoEvents(db);
  const mateoId = await seedShowcaseFighter(db, storage, MATEO, division.id, division.limitKg);
  const juanId = await seedShowcaseFighter(db, storage, JUAN, division.id, division.limitKg);
  // Hernández es el campeón amateur del peso ligero (el cinturón del afiche).
  await setChampion(db, "amateur", division.id, mateoId, "seed").catch(() => undefined);
  const eventId = await dressUpcomingEvent(db, storage, mateoId, juanId, division.id);
  await seedShowcaseNews(db, storage, eventId, [mateoId, juanId]);
}
