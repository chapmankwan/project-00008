"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, patch, put, remove, removeSession, type SessionSet } from "@/lib/db";
import { Num, ghost } from "./ui";

export default function SessionView({ id, onBack }: { id: string; onBack: () => void }) {
  const session = useLiveQuery(() => db.sessions.get(id), [id]);
  const sets = useLiveQuery(() => db.sessionSets.where("sessionId").equals(id).toArray(), [id], []);
  const exercises = useLiveQuery(() => db.exercises.toArray(), [], []);
  const names = new Map(exercises.map((e) => [e.id, e.name]));

  const groups = new Map<number, SessionSet[]>();
  for (const s of [...sets].sort((a, b) => a.position - b.position || a.setNumber - b.setNumber)) {
    groups.set(s.position, [...(groups.get(s.position) ?? []), s]);
  }

  async function addSet(group: SessionSet[]) {
    const last = group[group.length - 1];
    await put("sessionSets", {
      id: crypto.randomUUID(), sessionId: id, exerciseId: last.exerciseId, position: last.position,
      setNumber: last.setNumber + 1, weight: last.weight, reps: last.reps, done: false,
    });
  }

  async function deleteSession() {
    if (!window.confirm("Delete this logged workout?")) return;
    await removeSession(id);
    onBack();
  }

  return (
    <section className="mt-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <button className={ghost} onClick={onBack}>Back</button>
        <div className="min-w-0 flex-1 text-center">
          <h2 className="truncate text-lg font-semibold">{session?.name}</h2>
          {session && <p className="text-xs text-slate-400">{new Date(session.startedAt).toLocaleDateString()}</p>}
        </div>
        <button className={ghost} onClick={deleteSession}>Delete</button>
      </div>

      {groups.size === 0 && <p className="text-slate-400">This template had no exercises. Add some to the template, then start again.</p>}
      {[...groups.values()].map((group) => (
        <div key={group[0].position} className="rounded-lg border border-slate-800 bg-slate-900 p-3">
          <p className="font-medium">{names.get(group[0].exerciseId) ?? "Unknown exercise"}</p>
          <ul className="mt-2 space-y-2">
            {group.map((s) => (
              <li key={s.id} className="grid grid-cols-[2rem_1fr_1fr_2.75rem] items-end gap-2">
                <span className="pb-3 text-sm text-slate-400">{s.setNumber}</span>
                <Num label={`Set ${s.setNumber} weight`} hideLabel step={0.5} value={s.weight} onCommit={(v) => patch("sessionSets", s.id, { weight: v })} />
                <Num label={`Set ${s.setNumber} reps`} hideLabel value={s.reps} onCommit={(v) => patch("sessionSets", s.id, { reps: Math.round(v) })} />
                <input
                  type="checkbox" className="mb-2.5 size-6 accent-teal-500" aria-label={`Set ${s.setNumber} done`}
                  checked={s.done} onChange={(e) => patch("sessionSets", s.id, { done: e.target.checked })}
                />
              </li>
            ))}
          </ul>
          <div className="mt-2 flex gap-2">
            <button className={ghost} onClick={() => addSet(group)}>Add set</button>
            {group.length > 1 && (
              <button className="min-h-11 px-2 text-sm text-slate-400 underline" onClick={() => remove("sessionSets", group[group.length - 1].id)}>
                Remove last set
              </button>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}
