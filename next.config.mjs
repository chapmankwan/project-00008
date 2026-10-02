import { spawnSync } from "node:child_process";
import withSerwistInit from "@serwist/next";

// Revision busts the precache for these pages on each deploy.
const revision = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() || crypto.randomUUID();

const withSerwist = withSerwistInit({
  // "/" is precached so the app shell opens offline right after first visit.
  additionalPrecacheEntries: [
    { url: "/", revision },
    { url: "/~offline", revision },
  ],
  cacheOnNavigation: true,
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  // Service worker off in dev; test PWA behavior with `npm run build && npm start`.
  disable: process.env.NODE_ENV === "development",
});

export default withSerwist({});
