"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, patch, putMany, remove, startSession, type TemplateExercise, type TemplateTargetSet } from "@/lib/db";
import { SET_TYPE_OPTIONS, SET_TYPE_SHORT_LABELS, type SetType } from "@/lib/set-types";
import { Num, buttonClass } from "./ui";
import { Sheet } from "./sheet";

import clsx from "clsx";
import { EllipsisVerticalIcon } from "@/app/icons";

function getTargetSets(entry: TemplateExercise): TemplateTargetSet[] {
  if (entry.targetSets?.length) return entry.targetSets;
  return Array.from({ length: Math.max(1, entry.sets ?? 3) }, () => ({
    weight: 0,
    reps: entry.reps ?? 10,
  }));
}

export default function TemplateView({ id, onBack, onStartSession }: {
  id: string;
  onBack: () => void;
  onStartSession: (sessionId: string) => void;
}) {
  const template = useLiveQuery(() => db.templates.get(id), [id]);
  const entries = useLiveQuery(() => db.templateExercises.where("templateId").equals(id).sortBy("position"), [id], []);
  const exercises = useLiveQuery(() => db.exercises.orderBy("name").toArray(), [], []);
  // const [pick, setPick] = useState("");
  // const [custom, setCustom] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [setTypeTarget, setSetTypeTarget] = useState<{ entryId: string; setIndex: number } | null>(null);
  const names = new Map(exercises.map((e) => [e.id, e.name]));

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
		targetSets: [{ weight: 0, reps: 10 }],
    })));
  };

  async function updateTargetSets(entry: TemplateExercise, targetSets: TemplateTargetSet[]) {
    await patch("templateExercises", entry.id, { targetSets });
  };

  async function updateSetType(setType: SetType) {
    if (!setTypeTarget) return;
    const entry = entries.find((item) => item.id === setTypeTarget.entryId);
    if (!entry) return;

    const targetSets = getTargetSets(entry).map((target, index) =>
      index === setTypeTarget.setIndex ? { ...target, setType } : target,
    );
    await updateTargetSets(entry, targetSets);
    setSetTypeTarget(null);
  }

  async function deleteTemplate() {
    if (!window.confirm("Delete this template? Logged workouts are kept.")) return;
    for (const en of entries) await remove("templateExercises", en.id);
    await remove("templates", id);
    onBack();
  };

  async function startWorkout() {
    const sessionId = await startSession(id);
    onStartSession(sessionId);
  }

  return (
    <section className="mt-4 space-y-4 px-1 overflow-hidden">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex-1 truncate text-lg font-semibold">{template?.name}</h2>
        <button className={buttonClass} onClick={onBack}>
          Back
        </button>
        <button className={clsx(buttonClass, "text-blush-500")} onClick={deleteTemplate}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </button>
      </div>

      <button
        type="button"
        className={clsx(buttonClass, "w-full disabled:border-0 disabled:text-mono-700 disabled:bg-mono-700/50 cursor-not-allowed")}
        disabled={entries.length === 0}
        onClick={() => void startWorkout()}
      >
        Start workout
      </button>

      <button className={clsx(buttonClass, "w-full")} onClick={() => setIsSheetOpen(true)}>
        Add Exercises
      </button>

      {entries.length === 0 && <p className="text-mono-400">No exercises yet</p>}
      <div className="min-h-0 flex-1 flex-col overflow-y-auto">

        <ul className="space-y-3">
          {entries.map((en) => {
            const targetSets = getTargetSets(en);
            return (
              <li key={en.id} className="rounded-lg border border-mono-600 bg-mono-700 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{names.get(en.exerciseId) ?? "Unknown exercise"}</p>
                  <button
                    type="button"
                    aria-label={`Remove ${names.get(en.exerciseId) ?? "exercise"} from routine`}
                    className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full text-mono-300 hover:bg-mono-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender-300"
                    onClick={() => console.log("+++ open new sheet")}
                  >
                    <EllipsisVerticalIcon />
                  </button>
                </div>
                <div className="grid grid-cols-[2.5rem_1fr_1fr] items-end gap-2">
					<span className="text-xs font-semibold text-mono-300">Set</span>
					<span className="text-xs font-semibold text-mono-300">Weight</span>
					<span className="text-xs font-semibold text-mono-300">Reps</span>
				</div>
                <ul className="my-2 space-y-2">
                  {targetSets.map((target, index) => (
                    <li key={`${en.id}-target-${index}`} className="grid grid-cols-[2.5rem_1fr_1fr] items-end gap-2">
                      <button
                        type="button"
                        aria-label={`Set ${index + 1} type${target.setType ? `: ${target.setType}` : ""}`}
                        onClick={() => setSetTypeTarget({ entryId: en.id, setIndex: index })}
                        className="mb-1 flex min-h-10 flex-col items-center justify-center rounded-lg bg-mono-600 text-sm font-medium text-mono-100 hover:bg-mono-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender-300"
                      >
                        {index + 1}
                        {target.setType && target.setType !== "normal" && (
                          <span className="text-[8px] leading-none text-lavender-200">
                            {SET_TYPE_SHORT_LABELS[target.setType]}
                          </span>
                        )}
                      </button>
                      <Num
                        label="Weight (lbs)"
						hideLabel
                        value={target.weight}
                        onCommit={(weight) => {
                          const next = [...targetSets];
                          next[index] = { ...target, weight };
                          void updateTargetSets(en, next);
                        }}
                      />
                      <Num
                        label="Target reps"
						hideLabel
                        value={target.reps}
                        onCommit={(reps) => {
                          const next = [...targetSets];
                          next[index] = { ...target, reps: Math.round(reps) };
                          void updateTargetSets(en, next);
                        }}
                      />
                      {/* <button
                        type="button"
                        className="mb-1 min-h-11 px-2 text-sm text-mono-400 underline disabled:opacity-40"
                        aria-label={`Remove set ${index + 1}`}
                        disabled={targetSets.length === 1}
                        onClick={() => void updateTargetSets(en, targetSets.filter((_, targetIndex) => targetIndex !== index))}
                      >
                        Remove
                      </button> */}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className={clsx(buttonClass, "w-full")}
                  onClick={() => void updateTargetSets(en, [...targetSets, { ...targetSets[targetSets.length - 1] }])}
                >
                  Add set
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {isSheetOpen && (
        <Sheet
          onClose={() => setIsSheetOpen(false)}
          onSubmit={addSelectedExercises}
          data={exercises}
        />
      )}

      {setTypeTarget && (
        <div className="fixed inset-0 z-40 flex items-end bg-black/50" onClick={() => setSetTypeTarget(null)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="template-set-type-title"
            className="w-full space-y-2 rounded-t-2xl border-t border-mono-600 bg-mono-800 p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 id="template-set-type-title" className="font-semibold">
                Set {setTypeTarget.setIndex + 1} type
              </h3>
              <button type="button" className="text-sm text-mono-300 underline" onClick={() => setSetTypeTarget(null)}>Cancel</button>
            </div>
            {SET_TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className="min-h-11 w-full rounded-lg bg-mono-700 px-4 text-left hover:bg-mono-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender-300"
                onClick={() => void updateSetType(option.value)}
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
