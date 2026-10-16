"use client"
import { useEffect, useState, type FormEvent } from "react";

import { db, put, type Exercise } from "@/lib/db";

import clsx from "clsx";
import { simpleBtn, simpleInput } from "./ui";

interface SheetModel {
    onClose: () => void;
    onSubmit: (exerciseIds: string[]) => Promise<void>;
    data?: Exercise[];
};

export const Sheet =({
    onClose,
    onSubmit,
    data,
}: SheetModel) => {
    const [isVisible, setIsVisible] = useState(false);
    const [exercises, setExercises] = useState<Exercise[]>(data || []);
    const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
    
    // Search/Filter Experience
    const [searchOrFilter, setSearchOrFilter] = useState("");

    // Custom experience
    const [isCreatingExercise, setIsCreatingExercise] = useState(false);
    const [customExercise, setCustomExercise] = useState("");
    const [primaryMuscles, setPrimaryMuscles] = useState<string[]>([]);
    const [secondaryMuscles, setSecondaryMuscles] = useState<string[]>([]);

    useEffect(() => {
        // Animate in after mount
        const timer = setTimeout(() => setIsVisible(true), 10);
        return () => clearTimeout(timer);
    }, []);


    async function addCustomExercise(e: FormEvent) {
        e.preventDefault();
        const n = customExercise.trim();
        if (!n) return;
        const newExercise: Exercise = {
            id: crypto.randomUUID(),
            name: n,
            muscle: "Custom",
            updatedAt: Date.now(),
        };
        await put("exercises", newExercise);
        setCustomExercise("");
        setExercises((current) => [...current, newExercise].sort((a, b) => a.name.localeCompare(b.name)));
    };

    useEffect(() => {
        setExercises(data ?? []);
    }, [data]);

    const normalizedSearch = searchOrFilter.trim().toLocaleLowerCase();
    const filteredExercises = exercises.filter((exercise) =>
        exercise.name.toLocaleLowerCase().includes(normalizedSearch)
        || exercise.muscle.toLocaleLowerCase().includes(normalizedSearch),
    );

    const handleClose = () => {
        // Animate out first, then unmount
        setIsVisible(false);
        setTimeout(onClose, 300); // match transition duration
    };

    const onSubmitHandler = async (event?: React.FormEvent | React.MouseEvent) => {
        event?.preventDefault();
        try {
            if (selectedExercises.length === 0) return;
            await onSubmit(selectedExercises);
            setSelectedExercises([]);
            handleClose();
        } catch (err) {
            console.error("Unable to add selected exercises", err);
        }
    };

    const toggleExercise = (exerciseId: string, checked: boolean) => {
        setSelectedExercises((current) => checked
            ? current.includes(exerciseId) ? current : [...current, exerciseId]
            : current.filter((id) => id !== exerciseId));
    };

    const onKeyDownHandler = (event: React.KeyboardEvent) => {
        if (event.key === "Escape") {
            event.preventDefault();
            handleClose();
        }
    };

    return (
        <section className="fixed inset-0 z-40" onKeyDown={onKeyDownHandler}>
        {/* Backdrop */}
            <div
                className={clsx(
                    "absolute inset-0 bg-black/50 transition-opacity duration-300 ease-in-out",
                    isVisible ? "opacity-100" : "opacity-0"
                )}
                onClick={() => handleClose()}
            />

            {/* Flyout Panel */}
            <div
                className={clsx(
                "absolute z-50 flex flex-col overflow-hidden bg-mono-800 shadow-2xl",
                // Mobile
                "bottom-0 right-0 left-0 rounded-t-2xl h-3/4",
                "transform transition-transform duration-300 ease-out",
                // Desktop
                "md:top-0 md:bottom-0 md:right-0 md:left-auto md:w-100 md:rounded-none md:h-full",
                // Translation
                !isVisible ? "translate-y-full md:translate-y-0 md:translate-x-full"
                : "translate-y-0 md:translate-y-0 md:translate-x-0"
                )}
            >
                <div className="flex shrink-0 items-center justify-between p-6">
                    <button onClick={() => handleClose()} className="cursor-pointer text-blush-500">Cancel</button>
                    <h3 className="cursor-default">Add exercises</h3>
                    <button type="button" disabled={selectedExercises.length === 0} onClick={onSubmitHandler} className="cursor-pointer text-mint-500 disabled:cursor-not-allowed disabled:opacity-50">Add {selectedExercises.length > 0 && `(${selectedExercises.length})`}</button>
                </div>

                <div className="flex gap-2">
                    <input required className="w-full ml-6 mb-6 touch-manipulation rounded-lg border border-mono-500/30 bg-mono-700/60 p-3 text-sm text-mono-200 focus:outline-none focus:ring-2 focus:ring-lavender-300" value={searchOrFilter} onChange={e => setSearchOrFilter(e.target.value)} placeholder="Search/Filter" />
                    <button
                        type="button"
                        aria-label="Search exercises"
                        className="grid mr-6 size-11 shrink-0 cursor-pointer place-items-center rounded-full text-mono-300 bg-mono-700/60 hover:bg-mono-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender-300"
                    >
                        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="size-5">
                            <circle cx="10.8" cy="10.8" r="6.8" />
                            <path d="m16 16 4.2 4.2" />
                        </svg>
                    </button>
                </div>

                {
                    !isCreatingExercise &&
                    <button className={clsx(simpleBtn, "mx-6 mb-6")} onClick={() => setIsCreatingExercise(!isCreatingExercise)}>
                        create an exercise
                    </button>
                }
                {
                    isCreatingExercise &&
                    <form onSubmit={onSubmitHandler} className="shrink-0 p-6 pt-0 flex flex-col gap-3">
                        <input required className="touch-manipulation rounded-lg border border-mono-500/30 bg-mono-700/60 p-3 text-sm text-mono-200 focus:outline-none focus:ring-2 focus:ring-lavender-300" value={customExercise} onChange={(e) => setCustomExercise(e.target.value)} placeholder="Not in the list? Create one" />
                        <div className="flex gap-2">
                            <input 
                                required 
                                className={simpleInput} 
                                value={primaryMuscles} 
                                onChange={(e) => setPrimaryMuscles([...primaryMuscles, e.target.value])} placeholder="Primary muscle(s)" />
                            <input 
                                required 
                                className={simpleInput} 
                                value={secondaryMuscles} 
                                onChange={(e) => setSecondaryMuscles([...secondaryMuscles, e.target.value])} placeholder="Secondary muscle(s)" />
                        </div>
                        <div className="flex gap-2">
                            <button type="button" className={simpleBtn} onClick={addCustomExercise}>
                                Create
                            </button>
                            <button className={simpleBtn} onClick={() => setIsCreatingExercise(false)}>Close</button>
                        </div>
                    </form>
                }

                <form onSubmit={onSubmitHandler} className="min-h-0 flex-1 overflow-y-auto m-5 p-1 pt-0 flex flex-col gap-3">
                    <ul className="flex flex-col">
                        {filteredExercises.map((exercise) => (
                            <li key={exercise.id} className="touch-manipulation first:rounded-t-lg last:rounded-b-lg border-b border-mono-500/30 last:border-b-0 bg-mono-700/60 p-3">
                                <label className="flex min-h-8 cursor-pointer touch-manipulation items-center gap-3">
                                    <input
                                        type="checkbox"
                                        name="exercise"
                                        value={exercise.id}
                                        checked={selectedExercises.includes(exercise.id)}
                                        onChange={(event) => toggleExercise(exercise.id, event.target.checked)}
                                        className="h-5 w-5 shrink-0 cursor-pointer rounded border-mono-500/30 bg-mono-700/60 text-lavender-400 focus:ring-lavender-300"
                                    />
                                    <span className="text-sm text-mono-200">{exercise.name}</span>
                                </label>
                            </li>
                        ))}
                    </ul>
                    {filteredExercises.length === 0 && (
                        <p className="py-4 text-center text-sm text-mono-400">
                            No exercises match “{searchOrFilter}”.
                        </p>
                    )}
                </form>
                
            </div>
        </section>
    );
}
