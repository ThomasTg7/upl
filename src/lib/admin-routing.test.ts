import { describe, expect, it } from "vitest";
import { requestHost, routeByHost } from "./admin-routing";

const HOSTS = { adminHost: "admin.uplseries.cl", adminOrigin: "https://admin.uplseries.cl" };

function route(host: string, pathname: string, hasSession = false, search = "") {
  return routeByHost({ host, pathname, search, hasSession }, HOSTS);
}

describe("routeByHost", () => {
  it("serves the admin folder at the root of the admin subdomain", () => {
    expect(route("admin.uplseries.cl", "/", true)).toEqual({ kind: "rewrite", pathname: "/admin" });
    expect(route("admin.uplseries.cl", "/peleadores/123", true)).toEqual({ kind: "rewrite", pathname: "/admin/peleadores/123" });
  });

  it("sends visitors without a session cookie to the login page, except on the auth pages", () => {
    expect(route("admin.uplseries.cl", "/peleadores")).toEqual({ kind: "redirect", url: "https://admin.uplseries.cl/login" });
    expect(route("admin.uplseries.cl", "/login")).toEqual({ kind: "rewrite", pathname: "/admin/login" });
    expect(route("admin.uplseries.cl", "/recuperar")).toEqual({ kind: "rewrite", pathname: "/admin/recuperar" });
    expect(route("admin.uplseries.cl", "/restablecer")).toEqual({ kind: "rewrite", pathname: "/admin/restablecer" });
  });

  it("lets a server action without a session through, so requireAdmin can answer with a redirect the client follows", () => {
    expect(routeByHost({ host: "admin.uplseries.cl", pathname: "/usuarios", search: "", hasSession: false, isServerAction: true }, HOSTS)).toEqual({
      kind: "rewrite",
      pathname: "/admin/usuarios",
    });
  });

  it("drops a leftover /admin prefix on the admin subdomain (old bookmarks), keeping the query", () => {
    expect(route("admin.uplseries.cl", "/admin/peleadores", true, "?q=vera")).toEqual({
      kind: "redirect",
      url: "https://admin.uplseries.cl/peleadores?q=vera",
    });
    expect(route("admin.uplseries.cl", "/admin", true)).toEqual({ kind: "redirect", url: "https://admin.uplseries.cl/" });
  });

  it("moves /admin on the public site to the admin subdomain", () => {
    expect(route("uplseries.cl", "/admin/login", false, "?error=x")).toEqual({
      kind: "redirect",
      url: "https://admin.uplseries.cl/login?error=x",
    });
    expect(route("uplseries.cl", "/administrador")).toEqual({ kind: "next" });
  });

  it("leaves public pages alone", () => {
    expect(route("uplseries.cl", "/peleadores/matias-perez")).toEqual({ kind: "next" });
    expect(route("uplseries.cl", "/")).toEqual({ kind: "next" });
  });

  it("compares the host with its port (development)", () => {
    const dev = { adminHost: "admin.localhost:3000", adminOrigin: "http://admin.localhost:3000" };
    expect(routeByHost({ host: "admin.localhost:3000", pathname: "/", search: "", hasSession: true }, dev)).toEqual({
      kind: "rewrite",
      pathname: "/admin",
    });
    expect(routeByHost({ host: "localhost:3000", pathname: "/", search: "", hasSession: true }, dev)).toEqual({ kind: "next" });
  });
});

describe("requestHost", () => {
  const headers = (values: Record<string, string>) => ({ get: (name: string) => values[name.toLowerCase()] ?? null });

  it("prefers the host the browser asked for when a proxy sits in front", () => {
    expect(requestHost(headers({ "x-forwarded-host": "admin.uplseries.cl", host: "internal:3000" }))).toBe("admin.uplseries.cl");
  });

  it("falls back to the Host header, then to the given default", () => {
    expect(requestHost(headers({ host: "uplseries.cl" }))).toBe("uplseries.cl");
    expect(requestHost(headers({}), "localhost:3000")).toBe("localhost:3000");
  });
});
