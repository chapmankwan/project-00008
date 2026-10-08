"use client";

import { useState, type FormEvent } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, put } from "@/lib/db";
import TemplateView from "@/components/TemplateView";
import { field, ghost, primary } from "@/components/ui";

export const WorkoutView = ({ onBack }: { id: string; onBack: () => void }) => {
    const templates = useLiveQuery(() => db.templates.orderBy("name").toArray(), [], []);
    const templateExercises = useLiveQuery(() => db.templateExercises.toArray(), [], []);
    const exercises = useLiveQuery(() => db.exercises.toArray(), [], []);
    const [routineName, setRoutineName] = useState("");
    const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);


    const exerciseNames = new Map(exercises.map((exercise) => [exercise.id, exercise.name]));

    async function createRoutine(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const name = routineName.trim();
        if (!name) return;

        const id = crypto.randomUUID();
        await put("templates", { id, name });
        setRoutineName("");
        setEditingTemplateId(id);
    };



    if (editingTemplateId) {
        return (
            <TemplateView
                id={editingTemplateId}
                onBack={() => setEditingTemplateId(null)}
            />
        );
    };

    const onClickEmptyRoutine = () => {
        const id = crypto.randomUUID();
        void put("templates", { id, name: "New Routine" });
        setEditingTemplateId(id);
    };

    return (
        <section className="space-y-5 px-1">
            <header>
                <h2 className="text-lg font-semibold">Routines</h2>
                <p className="mt-1 text-sm text-mono-300">Create a routine and choose the exercises you want to train.</p>
            </header>

            <button className={ghost} onClick={onClickEmptyRoutine}>
                Begin empty routine
            </button>

            <form onSubmit={createRoutine} className="flex gap-2">
                <label className="min-w-0 flex-1">
                    <span className="sr-only">Routine name</span>
                    <input
                        className={field}
                        value={routineName}
                        onChange={(event) => setRoutineName(event.target.value)}
                        placeholder="New routine name"
                        required
                    />
                </label>
                <button type="submit" className={primary}>Create</button>
            </form>

            {templates.length === 0 ? (
                <div className="rounded-2xl border border-mono-500/30 bg-mono-700/60 p-5 text-center">
                    <p className="font-medium">No routines yet</p>
                    <p className="mt-1 text-sm text-mono-300">Create your first routine above, then add exercises.</p>
                </div>
            ) : (
                <ul className="space-y-3">
                    {templates.map((template) => {
                        const entries = templateExercises
                            .filter((entry) => entry.templateId === template.id)
                            .sort((a, b) => a.position - b.position);
                        const preview = entries
                            .slice(0, 3)
                            .map((entry) => exerciseNames.get(entry.exerciseId) ?? "Exercise")
                            .join(" · ");

                        return (
                            <li key={template.id}>
                                <button
                                    type="button"
                                    onClick={() => setEditingTemplateId(template.id)}
                                    className="flex w-full items-center justify-between gap-3 rounded-2xl border border-mono-500/30 bg-mono-700/70 p-4 text-left transition-colors hover:bg-mono-600/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender-300"
                                >
                                    <span className="min-w-0">
                                        <span className="block truncate font-medium">{template.name}</span>
                                        <span className="mt-1 block truncate text-xs text-mono-300">
                                            {preview || "No exercises yet"}
                                            {entries.length > 3 ? ` · +${entries.length - 3} more` : ""}
                                        </span>
                                    </span>
                                    <span className="shrink-0 text-right text-xs text-mono-300">
                                        <span className="block">{entries.length}</span>
                                        <span>{entries.length === 1 ? "exercise" : "exercises"}</span>
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}

            <button type="button" className={`${ghost} w-full`} onClick={onBack}>
                Back to home
            </button>
        </section>
    );
};
