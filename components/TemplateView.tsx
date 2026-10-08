"use client";

import { useState, type FormEvent } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, patch, put, putMany, remove } from "@/lib/db";
import { Num, field, ghost, primary, simpleBtn } from "./ui";
import { Sheet } from "./sheet";

import clsx from "clsx";

export default function TemplateView({ id, onBack }: { id: string; onBack: () => void }) {
  const template = useLiveQuery(() => db.templates.get(id), [id]);
  const entries = useLiveQuery(() => db.templateExercises.where("templateId").equals(id).sortBy("position"), [id], []);
  const exercises = useLiveQuery(() => db.exercises.orderBy("name").toArray(), [], []);
  const [pick, setPick] = useState("");
  const [custom, setCustom] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const names = new Map(exercises.map((e) => [e.id, e.name]));

  async function addEntry() {
    if (!pick) return;
    const position = Math.max(-1, ...entries.map((e) => e.position)) + 1;
    await put("templateExercises", { id: crypto.randomUUID(), templateId: id, exerciseId: pick, position, sets: 3, reps: 10 });
    setPick("");
  }

  async function addSelectedExercises(exerciseIds: string[]) {
    const alreadyAdded = new Set(entries.map((entry) => entry.exerciseId));
    const newExerciseIds = exerciseIds.filter((exerciseId) => !alreadyAdded.has(exerciseId));
    if (newExerciseIds.length === 0) return;

    const firstPosition = Math.max(-1, ...entries.map((entry) => entry.position)) + 1;
    await putMany("templateExercises", newExerciseIds.map((exerciseId, index) => ({
      id: crypto.randomUUID(),
      templateId: id,
      exerciseId,
      position: firstPosition + index,
      sets: 3,
      reps: 10,
    })));
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
    <section className="mt-4 space-y-4 px-1">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex-1 truncate text-lg font-semibold">{template?.name}</h2>
        <button className={simpleBtn} onClick={onBack}>
          Back
        </button>
        <button className={clsx(simpleBtn, "text-blush-500")} onClick={deleteTemplate}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </button>
      </div>
      {/* <p className="text-sm text-slate-400">Targets only. Weights are recorded when you start a workout from this template.</p> */}

      {/* <form onSubmit={addCustom} className="flex gap-2">
        <label className="flex-1">
          <span className="sr-only">Custom exercise name</span>
          <input className={field} value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Not in the list? Create one" />
        </label>
        <button className="cursor-pointer rounded-lg px-3 py-1 bg-lavender-400/50 text-mono-200 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender-400" onClick={addCustom}>
          Create
        </button>
      </form> */}

      <button className={clsx(simpleBtn, "w-full")} onClick={() => setIsSheetOpen(true)}>
        Add Exercises
      </button>

      <div className="flex gap-2">
        <label className="flex-1">
          <span className="sr-only">Exercise</span>
          <select className={field} value={pick} onChange={(e) => setPick(e.target.value)}>
            <option value="">Choose an exercise</option>
            {exercises.map((x) => <option key={x.id} value={x.id}>{x.name} ({x.muscle})</option>)}
          </select>
        </label>
        <button className="cursor-pointer rounded-lg px-3 py-1 bg-lavender-400/50 text-mono-200 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender-400" onClick={addEntry}>Add</button>
      </div>

      {entries.length === 0 && <p className="text-slate-400">No exercises yet</p>}
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

      {isSheetOpen && (
        <Sheet
          onClose={() => setIsSheetOpen(false)}
          onSubmit={addSelectedExercises}
          data={exercises}
        />
      )}

    </section>
  );
}
