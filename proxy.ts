import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/register", "/forgot-password", "/reset-password", "/precios", "/demo"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic =
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/webhooks/");
  if (!req.auth && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }

  // No page may be served from the browser's back/forward cache. Every page
  // here renders session-dependent UI — authenticated pages show the app, and
  // the public pages (landing, /demo, /precios) show either "Iniciar sesión"
  // or "Ir a mi cuenta" depending on the session. If bfcache serves a stale
  // copy when the user presses "back", they see the wrong session state (e.g.
  // a demo user landing on a logged-out-looking home page) — a real mess.
  // no-store makes a page ineligible for bfcache, forcing a fresh server
  // render that reflects the real current session.
  const res = NextResponse.next();
  res.headers.set("Cache-Control", "no-store, must-revalidate");
  return res;
});

export const config = {
  // Anything under /public (images, icons, etc.) is a static file, not a page —
  // it must never get redirected to /login for logged-out visitors.
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|txt|xml)$).*)"],
};
