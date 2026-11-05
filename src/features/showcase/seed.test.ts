import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "@/db";
import { bouts, events } from "@/db/schema/events";
import { fighters } from "@/db/schema/fighters";
import { media } from "@/db/schema/media";
import { posts } from "@/db/schema/posts";
import { seedEvents } from "@/features/events/seed";
import { seedPosts } from "@/features/posts/seed";
import { LocalDriver } from "@/lib/storage/local";
import { createTestDb } from "@/test/db";
import { seedUplShowcase } from "./seed";

let db: Db;
let close: () => Promise<void>;
let rootDir: string;
let storage: LocalDriver;

beforeEach(async () => {
  ({ db, close } = await createTestDb());
  rootDir = await mkdtemp(path.join(tmpdir(), "upl-showcase-"));
  storage = new LocalDriver({ rootDir, secret: "test-secret" });
  await seedEvents(db);
  await seedPosts(db);
});

afterEach(async () => {
  await close();
  await rm(rootDir, { recursive: true, force: true });
});

describe("seedUplShowcase", () => {
  it("turns the demo into UPL 11–15 with the real UPL 15 poster, title fight and featured news", { timeout: 60_000 }, async () => {
    await seedUplShowcase(db, storage);

    const rows = await db.select({ slug: events.slug, number: events.number }).from(events).orderBy(events.number);
    expect(rows.map((row) => row.slug)).toEqual(["upl-11", "upl-12", "upl-13", "upl-14", "upl-15"]);

    const [event] = await db.select().from(events).where(eq(events.slug, "upl-15"));
    expect(event).toMatchObject({ name: "UPL 15", venueName: "CEDEC" });
    expect(event!.startsAt.toISOString()).toBe("2026-11-21T18:00:00.000Z");
    const [poster] = await db.select().from(media).where(eq(media.id, event!.posterMediaId!));
    expect(poster).toMatchObject({ kind: "event_poster", status: "ready", width: 1440, height: 1800 });
    expect(poster!.variants.length).toBeGreaterThan(0);

    const [mateo] = await db.select().from(fighters).where(eq(fighters.slug, "mateo-hernandez"));
    const [main] = await db.select().from(bouts).where(eq(bouts.redFighterId, mateo!.id));
    expect(main).toMatchObject({ isTitleFight: true, level: "amateur", sortOrder: 0 });
    expect(mateo!.bodyMediaId).not.toBeNull();

    const [news] = await db.select().from(posts).where(eq(posts.slug, "upl-15-mateo-hernandez-defiende-el-titulo-amateur-ante-juan-rodriguez"));
    expect(news).toMatchObject({ featured: true, status: "published" });
    expect(news!.coverMediaId).not.toBeNull();
    const titles = (await db.select({ title: posts.title }).from(posts)).map((row) => row.title);
    expect(titles).toContain("UPL 15: Mateo Hernández defiende el título amateur ante Juan Rodriguez");
    expect(titles.some((title) => /UPL [1-5]\b/.test(title))).toBe(false);
  });

  it("is idempotent", { timeout: 60_000 }, async () => {
    await seedUplShowcase(db, storage);
    await seedUplShowcase(db, storage);
    expect(await db.select({ id: fighters.id }).from(fighters).where(eq(fighters.slug, "juan-rodriguez"))).toHaveLength(1);
    expect(await db.select({ id: bouts.id }).from(bouts).where(eq(bouts.isTitleFight, true))).toHaveLength(1);
  });
});
