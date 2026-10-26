"use client";

import { useEffect, useState, type FormEvent } from "react";
import { db, put, type Exercise } from "@/lib/db";
import { baseBtn, simpleInput } from "@/components/ui";
import { Sheet } from "./index";

export interface AddExercisesSheetProps {
  onClose: () => void;
  onSubmit: (exerciseIds: string[], updateRoutine: boolean) => Promise<void>;
  data?: Exercise[];
  routineOption?: boolean;
  routineOptionLabel?: string;
  title?: string;
  submitLabel?: string;
  singleSelect?: boolean;
  excludeIds?: string[];
}

export function AddExercisesSheet({
  onClose,
  onSubmit,
  data,
  routineOption = false,
  routineOptionLabel = "Also add to this routine for future workouts",
  title = "Add exercises",
  submitLabel = "Add",
  singleSelect = false,
  excludeIds = [],
}: AddExercisesSheetProps) {
  const [exercises, setExercises] = useState<Exercise[]>(data ?? []);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [customName, setCustomName] = useState("");
  const [primaryMuscles, setPrimaryMuscles] = useState("");
  const [secondaryMuscles, setSecondaryMuscles] = useState("");
  const [updateRoutine, setUpdateRoutine] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setExercises(data ?? []);
  }, [data]);

  const normalizedSearch = search.trim().toLocaleLowerCase();
  const excluded = new Set(excludeIds);
  const filteredExercises = exercises.filter((exercise) => !excluded.has(exercise.id)).filter((exercise) =>
    `${exercise.name} ${exercise.muscle}`.toLocaleLowerCase().includes(normalizedSearch),
  );

  function toggleExercise(exerciseId: string, checked: boolean) {
    setSelectedExercises((current) => {
      if (!checked) return current.filter((id) => id !== exerciseId);
      if (singleSelect) return [exerciseId];
      return current.includes(exerciseId) ? current : [...current, exerciseId];
    });
  }

  async function createExercise(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = customName.trim();
    if (!name) return;

    const muscles = [primaryMuscles.trim(), secondaryMuscles.trim()].filter(Boolean).join(", ") || "Custom";
    const exercise: Exercise = {
      id: crypto.randomUUID(),
      name,
      muscle: muscles,
      updatedAt: Date.now(),
    };
    await put("exercises", exercise);
    setExercises((current) => current.some((item) => item.id === exercise.id)
      ? current
      : [...current, exercise].sort((a, b) => a.name.localeCompare(b.name)));
    setSelectedExercises((current) => singleSelect ? [exercise.id] : [...current, exercise.id]);
    setCustomName("");
    setPrimaryMuscles("");
    setSecondaryMuscles("");
    setCreating(false);
  }

  async function submit(closeSheet: () => void) {
    if (selectedExercises.length === 0 || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(selectedExercises, updateRoutine);
      closeSheet();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet
      title={title}
      onClose={onClose}
      action={(closeSheet) => (
        <button
          type="button"
          disabled={selectedExercises.length === 0 || submitting}
          onClick={() => void submit(closeSheet)}
          className="cursor-pointer whitespace-nowrap text-base text-mint-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitLabel}{!singleSelect && selectedExercises.length > 0 ? ` (${selectedExercises.length})` : ""}
        </button>
      )}
    >
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search exercises"
            className={`${simpleInput} min-w-0 flex-1`}
          />
          {!creating && (
            <button type="button" className={`${baseBtn} shrink-0`} onClick={() => setCreating(true)}>
              Create
            </button>
          )}
        </div>

        {creating && (
          <form onSubmit={createExercise} className="flex flex-col gap-2 rounded-lg bg-mono-700/60 p-3">
            <input
              required
              value={customName}
              onChange={(event) => setCustomName(event.target.value)}
              placeholder="Exercise name"
              className={simpleInput}
            />
            <input
              value={primaryMuscles}
              onChange={(event) => setPrimaryMuscles(event.target.value)}
              placeholder="Primary muscle(s)"
              className={simpleInput}
            />
            <input
              value={secondaryMuscles}
              onChange={(event) => setSecondaryMuscles(event.target.value)}
              placeholder="Secondary muscle(s)"
              className={simpleInput}
            />
            <div className="flex gap-2">
              <button type="submit" className={`${baseBtn} flex-1`}>Create exercise</button>
              <button type="button" className={`${baseBtn} flex-1`} onClick={() => setCreating(false)}>Cancel</button>
            </div>
          </form>
        )}

        {routineOption && (
          <label className="flex items-start gap-3 rounded-lg bg-mono-700 p-3 text-base">
            <input
              type="checkbox"
              checked={updateRoutine}
              onChange={(event) => setUpdateRoutine(event.target.checked)}
              className="mt-1 size-4 accent-lavender-400"
            />
            <span>{routineOptionLabel}</span>
          </label>
        )}

        <ul className="flex flex-col">
          {filteredExercises.map((exercise) => (
            <li key={exercise.id} className="touch-manipulation border-b border-mono-500/30 last:border-b-0 bg-mono-700/60 p-3">
              <label className="flex min-h-8 cursor-pointer touch-manipulation items-center gap-3">
                <input
                  type="checkbox"
                  name="exercise"
                  value={exercise.id}
                  checked={selectedExercises.includes(exercise.id)}
                  onChange={(event) => toggleExercise(exercise.id, event.target.checked)}
                  className="size-5 shrink-0 cursor-pointer rounded border-mono-500/30 bg-mono-700/60 text-lavender-400 focus:ring-lavender-300"
                />
                <span className="text-base text-mono-200">{exercise.name}</span>
                <span className="ml-auto text-xs text-mono-400">{exercise.muscle}</span>
              </label>
            </li>
          ))}
        </ul>
        {filteredExercises.length === 0 && (
          <p className="py-4 text-center text-base text-mono-400">No exercises match “{search}”.</p>
        )}
      </div>
    </Sheet>
  );
}
