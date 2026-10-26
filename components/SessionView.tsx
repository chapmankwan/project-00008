"use client";

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
	db,
	addExerciseToSession,
	finishSession,
	patch,
	put,
	remove,
	removeExerciseFromSession,
	removeSession,
	replaceSessionExercise,
	type SessionSet,
} from "@/lib/db";
import { SET_TYPE_SHORT_LABELS } from "@/lib/set-types";
import { acceptanceBtn, btn, baseBtn, Num, refusalBtn } from "./ui";
import { SwipeToDelete } from "./swipe-to-delete";
import clsx from "clsx";
import { EllipsisVerticalIcon } from "@/app/icons";
import { AddExercisesSheet, SettingSetTypeSheet } from "@/components";

export default function SessionView({ id, onBack }: { id: string; onBack: () => void }) {
	const [setOptionsTarget, setSetOptionsTarget] = useState<SessionSet | null>(null);
	const [exerciseAction, setExerciseAction] = useState<{ position: number; exerciseId: string; mode: "menu" | "replace" } | null>(null);
	const [isAddingExercise, setIsAddingExercise] = useState(false);
	const [now, setNow] = useState(() => Date.now());
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

	useEffect(() => {
		if (!session || session.status === "completed") return;
		const timer = window.setInterval(() => setNow(Date.now()), 1000);
		return () => window.clearInterval(timer);
	}, [session?.id, session?.status]);

	const elapsedSeconds = session
		? session.durationSeconds ?? Math.max(0, Math.floor(((session.finishedAt ?? now) - session.startedAt) / 1000))
		: 0;
	const durationHours = Math.floor(elapsedSeconds / 3600);
	const durationMinutes = Math.floor((elapsedSeconds % 3600) / 60);
	const durationRemainderSeconds = elapsedSeconds % 60;
	const durationLabel = `${durationHours}h${durationMinutes}m${durationRemainderSeconds}s`;
	const volume = sets.reduce((total, set) => total + (set.done ? set.weight * set.reps : 0), 0);
	const volumeLabel = `${Math.round(volume).toLocaleString()} lbs`;

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
	}

	function closeExerciseActions() {
		setExerciseAction(null);
	}

	async function removeExercise(position: number) {
		if (!window.confirm("Remove this exercise and its sets from this workout?")) return;
		await removeExerciseFromSession(id, position);
		closeExerciseActions();
	}

	async function replaceExerciseWithSelection(exerciseIds: string[], updateRoutine: boolean) {
		if (!exerciseAction || !exerciseIds[0]) return;
		await replaceSessionExercise(
			id,
			exerciseAction.position,
			exerciseAction.exerciseId,
			exerciseIds[0],
			updateRoutine,
		);
	}

	async function addExercisesToSession(exerciseIds: string[], addToRoutine: boolean) {
		for (const exerciseId of exerciseIds) {
			await addExerciseToSession(id, exerciseId, addToRoutine);
		}
	}

	return (
		<section className="flex h-full min-h-0 flex-col gap-4">
			<div className="flex shrink-0 items-center justify-between gap-2">
				<button
					type="button"
					aria-label="Go back"
					title="Back"
					className={clsx(btn, "grid size-11 place-items-center p-0")}
					onClick={onBack}
				>
					<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5">
						<path d="M19 12H5" />
						<path d="m12 19-7-7 7-7" />
					</svg>
				</button>
				<div className="min-w-0 flex-1 text-center">
					<h2 className="truncate text-lg font-semibold">{session?.name}</h2>
					{session && <p className="text-xs text-slate-400">{new Date(session.startedAt).toLocaleDateString()}</p>}
				</div>
				<div className="flex gap-2">
					<button className={clsx(acceptanceBtn, "text-base")} onClick={completeSession}>Finish</button>
					<button
						type="button"
						aria-label="Delete workout"
						title="Delete workout"
						className={clsx(refusalBtn, "grid size-11 place-items-center p-0 text-mono-100")}
						onClick={deleteSession}
					>
						<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5">
							<path d="M3 6h18" />
							<path d="M8 6V4h8v2" />
							<path d="m19 6-1 14H6L5 6" />
							<path d="M10 11v5m4-5v5" />
						</svg>
					</button>
				</div>
			</div>
			
			<div className="shrink-0">
				<div className="mt-1 grid grid-cols-3 gap-1 text-center text-[10px] leading-tight text-mono-400">
					<span>Duration</span>
					<span>Volume</span>
					<span>Records</span>
				</div>
				<div className="mt-1 grid grid-cols-3 gap-1 text-center text-xs leading-tight text-blush-400">
					<span className="whitespace-nowrap tabular-nums">{durationLabel}</span>
					<span className="whitespace-nowrap tabular-nums">{volumeLabel}</span>
					<span className="whitespace-nowrap">—</span>
				</div>
			</div>

			<div className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-mono-700">
				{groups.size === 0 && <p className="text-mono-400">This template had no exercises. Add some to the template, then start again.</p>}
				<div className="space-y-2">
				{[...groups.values()].map((group) => (
					<div key={`group-${group[0].position}`}>
				<div key={group[0].position} className="p-3">
					<div className="flex items-center justify-between gap-2">
						<p className="min-w-0 flex-1 truncate font-medium">{names.get(group[0].exerciseId) ?? "Unknown exercise"}</p>
						{session?.status !== "completed" && (
							<button
								type="button"
								aria-label={`Exercise actions for ${names.get(group[0].exerciseId) ?? "exercise"}`}
								title="Exercise actions"
								className="cursor-pointer grid size-9 shrink-0 place-items-center rounded-full text-mono-300 hover:bg-mono-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender-300"
								onClick={() => setExerciseAction({ position: group[0].position, exerciseId: group[0].exerciseId, mode: "menu" })}
							>
								<EllipsisVerticalIcon />
							</button>
						)}
					</div>
					<div className="mt-1 grid grid-cols-[2rem_repeat(3,minmax(0,1fr))_2rem] gap-2 px-0.5 text-[10px] leading-tight text-mono-400">
						<span className="text-center">Set</span>
						<span className="pl-3">Prev</span>
						<span className="pl-3">Weight</span>
						<span className="pl-3">Reps</span>
						<span aria-hidden="true" />
					</div>
					<ul className="mt-1 space-y-1">
						{group.map((s) => (
							<li key={s.id}>
								<SwipeToDelete
									label={`set ${s.setNumber} of ${names.get(s.exerciseId) ?? "exercise"}`}
									onDelete={() => void deleteSet(group, s)}
								>
									<div className="grid grid-cols-[2rem_repeat(3,minmax(0,1fr))_2rem] items-end gap-2 p-0.5">
										<button
											type="button"
											aria-label={`Set ${s.setNumber} type${s.setType ? `: ${s.setType}` : ""}`}
											onClick={() => setSetOptionsTarget(s)}
											className="cursor-pointer mb-1 flex size-7 flex-col items-center justify-center rounded-md bg-mono-600 text-[10px] font-medium text-mono-100 hover:bg-mono-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender-300"
										>
											{s.setType && s.setType === "normal" && s.setNumber}
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
											type="checkbox" className="mb-2 size-5 justify-self-center accent-lavender-500" aria-label={`Set ${s.setNumber} done`}
											checked={s.done} onChange={(e) => patch("sessionSets", s.id, { done: e.target.checked })}
										/>
									</div>
								</SwipeToDelete>
							</li>
						))}
					</ul>
					<div className="mt-2 flex gap-2">
						<button className={clsx(btn, "w-full text-base")} onClick={() => addSet(group)}>Add set</button>
					</div>
				</div>
					</div>
				))}
        {
          session?.status !== "completed" &&
          <button
            type="button"
            className={clsx(acceptanceBtn, "w-full")}
            onClick={() => setIsAddingExercise(true)}
          >
            Add exercise
          </button>
        }
				</div>
			</div>
			{/* This is temporary, we can use a generic sheet for content after */}
			{setOptionsTarget && (
				<SettingSetTypeSheet
					title={`Set ${setOptionsTarget.setNumber} type`}
					onClose={() => setSetOptionsTarget(null)}
					onSelect={(setType) => changeSetType(setOptionsTarget, setType)}
				/>
			)}
			{exerciseAction?.mode === "menu" && (
				<div className="fixed inset-0 z-40 flex items-end bg-black/50" onClick={closeExerciseActions}>
					<section
						role="dialog"
						aria-modal="true"
						aria-labelledby="exercise-actions-title"
						className="w-full space-y-3 rounded-t-2xl border-t border-mono-600 bg-mono-800 p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]"
						onClick={(event) => event.stopPropagation()}
					>
						<div className="flex items-center justify-between">
							<h3 id="exercise-actions-title" className="font-semibold">{names.get(exerciseAction.exerciseId) ?? "Exercise"}</h3>
							<button type="button" className="text-base text-mono-300 underline" onClick={closeExerciseActions}>Cancel</button>
						</div>
						<button
							type="button"
							className="cursor-pointer min-h-11 w-full rounded-lg bg-mono-800 px-4 text-left hover:bg-mono-600"
							onClick={() => setExerciseAction({ ...exerciseAction, mode: "replace" })}
						>
							Replace exercise
						</button>
						<button
							type="button"
							className="cursor-pointer min-h-11 w-full rounded-lg bg-blush-900/60 px-4 text-left text-blush-200 hover:bg-blush-900"
							onClick={() => void removeExercise(exerciseAction.position)}
						>
							Remove from this workout
						</button>
					</section>
				</div>
			)}
			{exerciseAction?.mode === "replace" && (
				<AddExercisesSheet
					title="Replace exercise"
					submitLabel="Replace"
					singleSelect
					excludeIds={[exerciseAction.exerciseId]}
					routineOption={Boolean(session?.templateId)}
					routineOptionLabel="Also use this exercise in future workouts from this routine"
					onClose={closeExerciseActions}
					onSubmit={replaceExerciseWithSelection}
					data={exercises}
				/>
			)}
			{isAddingExercise && (
				<AddExercisesSheet
					onClose={() => setIsAddingExercise(false)}
					onSubmit={addExercisesToSession}
					data={exercises}
					routineOption={Boolean(session?.templateId)}
				/>
			)}
		</section>
	);
}
