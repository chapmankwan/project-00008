import { db } from "./db";

let running = false;

// Push-only sync. Pulling server changes down is not implemented yet.
export async function flushOutbox() {
  if (running || !navigator.onLine) return;
  running = true;
  try {
    const items = await db.outbox.orderBy("seq").toArray();
    if (items.length === 0) return;
    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    if (!res.ok) throw new Error(`Sync failed (${res.status})`);
    await db.outbox.bulkDelete(items.map((i) => i.seq!));
  } catch (err) {
    console.warn("Sync will retry:", err);
  } finally {
    running = false;
  }
}

// The Background Sync API is Chromium-only, so trigger on load, reconnect and tab focus instead.
export function startSync() {
  const onVisible = () => document.visibilityState === "visible" && void flushOutbox();
  const onOnline = () => void flushOutbox();
  window.addEventListener("online", onOnline);
  document.addEventListener("visibilitychange", onVisible);
  void flushOutbox();
  return () => {
    window.removeEventListener("online", onOnline);
    document.removeEventListener("visibilitychange", onVisible);
  };
}
