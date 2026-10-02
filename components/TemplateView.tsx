"use client";

import { useState, type FormEvent } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, patch, put, remove } from "@/lib/db";
import { Num, field, ghost, primary } from "./ui";

export default function TemplateView({ id, onBack }: { id: string; onBack: () => void }) {
  const template = useLiveQuery(() => db.templates.get(id), [id]);
  const entries = useLiveQuery(() => db.templateExercises.where("templateId").equals(id).sortBy("position"), [id], []);
  const exercises = useLiveQuery(() => db.exercises.orderBy("name").toArray(), [], []);
  const [pick, setPick] = useState("");
  const [custom, setCustom] = useState("");
  const names = new Map(exercises.map((e) => [e.id, e.name]));

  async function addEntry() {
    if (!pick) return;
    const position = Math.max(-1, ...entries.map((e) => e.position)) + 1;
    await put("templateExercises", { id: crypto.randomUUID(), templateId: id, exerciseId: pick, position, sets: 3, reps: 10 });
    setPick("");
  }

  async function addCustom(e: FormEvent) {
    e.preventDefault();
    const n = custom.trim();
    if (!n) return;
    await put("exercises", { id: crypto.randomUUID(), name: n, muscle: "Custom" });
    setCustom("");
  }

  async function deleteTemplate() {
    if (!window.confirm("Delete this template? Logged workouts are kept.")) return;
    for (const en of entries) await remove("templateExercises", en.id);
    await remove("templates", id);
    onBack();
  }

  return (
    <section className="mt-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <button className={ghost} onClick={onBack}>Back</button>
        <h2 className="flex-1 truncate text-lg font-semibold">{template?.name}</h2>
        <button className={ghost} onClick={deleteTemplate}>Delete</button>
      </div>
      <p className="text-sm text-slate-400">Targets only. Weights are recorded when you start a workout from this template.</p>

      {entries.length === 0 && <p className="text-slate-400">No exercises yet. Pick one below.</p>}
      <ul className="space-y-3">
        {entries.map((en) => (
          <li key={en.id} className="rounded-lg border border-slate-800 bg-slate-900 p-3">
            <div className="flex items-center justify-between">
              <p className="font-medium">{names.get(en.exerciseId) ?? "Unknown exercise"}</p>
              <button className="min-h-11 px-2 text-sm text-slate-400 underline" onClick={() => remove("templateExercises", en.id)}>Remove</button>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Num label="Target sets" value={en.sets} onCommit={(v) => patch("templateExercises", en.id, { sets: Math.round(v) })} />
              <Num label="Target reps" value={en.reps} onCommit={(v) => patch("templateExercises", en.id, { reps: Math.round(v) })} />
            </div>
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <label className="flex-1">
          <span className="sr-only">Exercise</span>
          <select className={field} value={pick} onChange={(e) => setPick(e.target.value)}>
            <option value="">Choose an exercise</option>
            {exercises.map((x) => <option key={x.id} value={x.id}>{x.name} ({x.muscle})</option>)}
          </select>
        </label>
        <button className={primary} onClick={addEntry}>Add</button>
      </div>

      <form onSubmit={addCustom} className="flex gap-2">
        <label className="flex-1">
          <span className="sr-only">Custom exercise name</span>
          <input className={field} value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Not in the list? Create one" />
        </label>
        <button className={ghost}>Create</button>
      </form>
    </section>
  );
}
