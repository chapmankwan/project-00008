"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, finishSession, patch, put, remove, removeSession, type SessionSet } from "@/lib/db";
import { SET_TYPE_OPTIONS, SET_TYPE_SHORT_LABELS } from "@/lib/set-types";
import { Num, simpleBtn } from "./ui";
import { SwipeToDelete } from "./swipe-to-delete";

export default function SessionView({ id, onBack }: { id: string; onBack: () => void }) {
  const [setOptionsTarget, setSetOptionsTarget] = useState<SessionSet | null>(null);
  const session = useLiveQuery(() => db.sessions.get(id), [id]);
  const sets = useLiveQuery(() => db.sessionSets.where("sessionId").equals(id).toArray(), [id], []);
  const exercises = useLiveQuery(() => db.exercises.toArray(), [], []);
  const previousSets = useLiveQuery(async () => {
    if (!session) return new Map<string, SessionSet>();

    const previousSession = (await db.sessions
      .where("startedAt")
      .below(session.startedAt)
      .reverse()
      .toArray())
      .find((candidate) => candidate.templateId === session.templateId);

    if (!previousSession) return new Map<string, SessionSet>();

    const priorSets = await db.sessionSets.where("sessionId").equals(previousSession.id).toArray();
    return new Map(priorSets.map((set) => [`${set.exerciseId}:${set.setNumber}`, set]));
  }, [id, session?.templateId, session?.startedAt], new Map<string, SessionSet>());
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

  async function completeSession() {
    await finishSession(id);
    onBack();
  }

  async function deleteSet(group: SessionSet[], set: SessionSet) {
    await remove("sessionSets", set.id);
    const remaining = group
      .filter((item) => item.id !== set.id)
      .sort((a, b) => a.setNumber - b.setNumber);
    await Promise.all(remaining.map((item, index) =>
      patch("sessionSets", item.id, { setNumber: index + 1 }),
    ));
  }

  async function changeSetType(set: SessionSet, setType: NonNullable<SessionSet["setType"]>) {
    await patch("sessionSets", set.id, { setType });
    setSetOptionsTarget(null);
  }

  return (
    <section className="mt-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <button className={simpleBtn} onClick={onBack}>Back</button>
        <div className="min-w-0 flex-1 text-center">
          <h2 className="truncate text-lg font-semibold">{session?.name}</h2>
          {session && <p className="text-xs text-slate-400">{new Date(session.startedAt).toLocaleDateString()}</p>}
        </div>
        <div className="flex gap-2">
          <button className={simpleBtn} onClick={completeSession}>Finish</button>
          <button className={simpleBtn} onClick={deleteSession}>Delete</button>
        </div>
      </div>

      {groups.size === 0 && <p className="text-mono-400">This template had no exercises. Add some to the template, then start again.</p>}
      {[...groups.values()].map((group) => (
        <div key={group[0].position} className="rounded-lg border border-mono-600 bg-mono-700 p-3">
          <p className="font-medium">{names.get(group[0].exerciseId) ?? "Unknown exercise"}</p>
          <div className="mt-2 grid grid-cols-[2rem_2.5rem_minmax(0,1fr)_minmax(0,1fr)_2rem] gap-1 px-1 text-[10px] leading-tight text-mono-400">
            <span aria-hidden="true" />
            <span className="text-center">Prev</span>
            <span className="pl-3">Weight</span>
            <span className="pl-3">Reps</span>
            <span aria-hidden="true" />
          </div>
          <ul className="mt-2 space-y-2">
            {group.map((s) => (
              <li key={s.id}>
                <SwipeToDelete
                  label={`set ${s.setNumber} of ${names.get(s.exerciseId) ?? "exercise"}`}
                  onDelete={() => void deleteSet(group, s)}
                >
                  <div className="grid grid-cols-[2rem_2.5rem_minmax(0,1fr)_minmax(0,1fr)_2rem] items-end gap-1 p-1">
                    <button
                      type="button"
                      aria-label={`Set ${s.setNumber} type${s.setType ? `: ${s.setType}` : ""}`}
                      onClick={() => setSetOptionsTarget(s)}
                      className="mb-1 flex min-h-10 flex-col items-center justify-center rounded-lg bg-mono-600 text-sm font-medium text-mono-100 hover:bg-mono-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender-300"
                    >
                      {s.setNumber}
                      {s.setType && s.setType !== "normal" && (
                        <span className="text-[8px] leading-none text-lavender-200">
                          {SET_TYPE_SHORT_LABELS[s.setType]}
                        </span>
                      )}
                    </button>
                    <span
                      className="mb-3 text-center text-xs text-mono-400"
                      aria-label={previousSets.get(`${s.exerciseId}:${s.setNumber}`)
                        ? `Previous weight ${previousSets.get(`${s.exerciseId}:${s.setNumber}`)?.weight} pounds`
                        : "No previous set"}
                    >
                      {previousSets.get(`${s.exerciseId}:${s.setNumber}`)?.weight ?? "—"}
                    </span>
                    <Num label={`Set ${s.setNumber} weight`} hideLabel value={s.weight} onCommit={(v) => patch("sessionSets", s.id, { weight: v })} />
                    <Num label={`Set ${s.setNumber} reps`} hideLabel value={s.reps} onCommit={(v) => patch("sessionSets", s.id, { reps: Math.round(v) })} />
                    <input
                      type="checkbox" className="mb-2.5 size-6 accent-teal-500" aria-label={`Set ${s.setNumber} done`}
                      checked={s.done} onChange={(e) => patch("sessionSets", s.id, { done: e.target.checked })}
                    />
                  </div>
                </SwipeToDelete>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex gap-2">
            <button className={simpleBtn} onClick={() => addSet(group)}>Add set</button>
          </div>
        </div>
      ))}
      {/* This is temporary, we can use a generic sheet for content after */}
      {setOptionsTarget && (
        <div className="fixed inset-0 z-40 flex items-end bg-black/50" onClick={() => setSetOptionsTarget(null)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="set-type-title"
            className="w-full space-y-2 rounded-t-2xl border-t border-mono-600 bg-mono-800 p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 id="set-type-title" className="font-semibold">Set {setOptionsTarget.setNumber} type</h3>
              <button type="button" className="text-sm text-mono-300 underline" onClick={() => setSetOptionsTarget(null)}>Cancel</button>
            </div>
            {SET_TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className="min-h-11 w-full rounded-lg bg-mono-700 px-4 text-left hover:bg-mono-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender-300"
                onClick={() => void changeSetType(setOptionsTarget, option.value)}
              >
                {option.label}
              </button>
            ))}
          </section>
        </div>
      )}
    </section>
  );
}
