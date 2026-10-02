"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, put, seedIfEmpty, startSession } from "@/lib/db";
import { startSync } from "@/lib/sync";
import TemplateView from "./TemplateView";
import SessionView from "./SessionView";
import { field, ghost, primary } from "./ui";

type View = { kind: "home" } | { kind: "template"; id: string } | { kind: "session"; id: string };

function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online;
}

export default function WorkoutApp() {
  const online = useOnline();
  const [view, setView] = useState<View>({ kind: "home" });
  const pending = useLiveQuery(() => db.outbox.count(), [], 0);
  const home = () => setView({ kind: "home" });

  useEffect(() => {
    void seedIfEmpty();
    return startSync();
  }, []);

  return (
    <main className="mx-auto max-w-md p-4 pb-24">
      <header className="flex items-center justify-between py-2">
        <h1 className="text-xl font-semibold">Workouts</h1>
        <p role="status" className="text-sm text-slate-400">
          {online ? "Online" : "Offline"}, {pending} unsynced
        </p>
      </header>
      {view.kind === "home" && (
        <Home
          onOpenTemplate={(id) => setView({ kind: "template", id })}
          onOpenSession={(id) => setView({ kind: "session", id })}
        />
      )}
      {view.kind === "template" && <TemplateView id={view.id} onBack={home} />}
      {view.kind === "session" && <SessionView id={view.id} onBack={home} />}
    </main>
  );
}

function Home({ onOpenTemplate, onOpenSession }: { onOpenTemplate: (id: string) => void; onOpenSession: (id: string) => void }) {
  const templates = useLiveQuery(() => db.templates.toArray(), [], []);
  const sessions = useLiveQuery(() => db.sessions.orderBy("startedAt").reverse().limit(20).toArray(), [], []);
  const [name, setName] = useState("");

  async function add(e: FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    await put("templates", { id: crypto.randomUUID(), name: n });
    setName("");
  }

  return (
    <div className="mt-4 space-y-8">
      <section className="space-y-3">
        <h2 className="font-semibold">Templates</h2>
        {templates.length === 0 && <p className="text-slate-300">No templates yet. Add one, like Leg day, then start a workout from it.</p>}
        <ul className="space-y-2">
          {templates.map((t) => (
            <li key={t.id} className="flex gap-2">
              <button className={`${ghost} flex-1 text-left`} onClick={() => onOpenTemplate(t.id)}>{t.name}</button>
              <button className={primary} onClick={async () => onOpenSession(await startSession(t.id))}>Start</button>
            </li>
          ))}
        </ul>
        <form onSubmit={add} className="flex gap-2">
          <label className="flex-1">
            <span className="sr-only">New template name</span>
            <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="New template, e.g. Leg day" />
          </label>
          <button className={ghost}>Add</button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">History</h2>
        {sessions.length === 0 && <p className="text-slate-300">Logged workouts show up here.</p>}
        <ul className="space-y-2">
          {sessions.map((s) => (
            <li key={s.id}>
              <button className={`${ghost} flex w-full justify-between text-left`} onClick={() => onOpenSession(s.id)}>
                <span>{s.name}</span>
                <span className="text-slate-400">
                  {new Date(s.startedAt).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
