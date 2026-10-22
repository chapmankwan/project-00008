"use client";

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, seedExercises } from "@/lib/db";

import { startSync } from "@/lib/sync";
import { useOnline } from "@/app/utilities";

import { buttonClass } from "@/components/ui";

import { ActiveSession, SelectorTab, WorkoutTiles } from "@/components";

import { ProfileView, WorkoutView } from "@/app/views";
import TemplateView from "@/components/TemplateView";
import SessionView from "@/components/SessionView";
import clsx from "clsx";

type View = { kind: "home" | "workout" | "profile" } | { kind: "template"; id: string } | { kind: "session"; id: string };
interface HomeProps {
    onOpenTemplate: (id: string) => void;
    onOpenSession: (id: string) => void;
};

const MAX_DISPLAYED_WORKOUTS = 10;

export default function App() {
    const online = useOnline();
    const [view, setView] = useState<View>({ kind: "home" });
    const pending = useLiveQuery(() => db.outbox.count(), [], 0);
    const activeSession = useLiveQuery(
        async () => (await db.sessions.toArray())
            .filter((session) => session.status === "active")
            .sort((a, b) => b.startedAt - a.startedAt)[0] ?? null,
        [],
        null,
    );
    const home = () => setView({ kind: "home" });

    useEffect(() => {
        void seedExercises();
        return startSync();
    }, []);

    const renderView = () => {
        switch (view.kind) {
            case "workout":
                return (
                    <WorkoutView
                        id={view.kind}
                        onBack={home}
                        onStartSession={(id) => setView({ kind: "session", id })}
                    />
                );
            case "profile":
                return <ProfileView />;
            case "template":
                return (
                    <TemplateView
                        id={view.id}
                        onBack={home}
                        onStartSession={(id) => setView({ kind: "session", id })}
                    />
                );
            case "session":
                return <SessionView id={view.id} onBack={home} />;
            default:
                return <Home onOpenTemplate={(id) => setView({ kind: "template", id })} onOpenSession={(id) => setView({ kind: "session", id })} />;
        }
    };

    return (
        <main className="relative mx-auto flex h-dvh w-full flex-col overflow-hidden p-4">
            {view.kind !== "session" && (
                <header className="flex shrink-0 items-center justify-between gap-3 pb-3">
                    <div className="min-w-0">
                        <h1 className="text-md font-semibold">minifridge</h1>
                        <p role="status" className="text-xs tracking-tighter text-slate-400">
                            <span className={online ? "text-green-400" : "text-red-400"}>{online ? "online" : "offline"}</span>, {pending} unsynced
                        </p>
                    </div>
                    {activeSession && (
                        <ActiveSession setView={() => setView({ kind: "session", id: activeSession.id })} />
                    )}
                </header>
            )}
            <div className={`min-h-0 flex-1 overflow-y-auto overscroll-contain ${view.kind === "session" || view.kind === "template" ? "" : "pb-[calc(7rem+env(safe-area-inset-bottom))]"}`}>
                <div
                    key={view.kind === "session" || view.kind === "template" ? `${view.kind}-${view.id}` : view.kind}
                    className={view.kind === "session" ? "session-view-enter h-full min-h-0" : undefined}
                >
                    {renderView()}
                </div>
            </div>
            {view.kind !== "session" && (
                <footer className="absolute inset-x-0 bottom-0 z-10 items-center px-4 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-1">
                    <SelectorTab
                        selectedTab={view.kind}
                        setSelectedTab={(tab) => setView({ kind: tab })}
                    />
                </footer>
            )}
        </main>
    );

    function Home({ onOpenTemplate, onOpenSession }: HomeProps) {
        const sessions = useLiveQuery(() => db.sessions.orderBy("startedAt").reverse().toArray(), [], []);

        return (
            <div className="flex w-full flex-col gap-4">
                {
                    sessions.length > 0 ?
                    <>
                        <h2 className="font-semibold text-xs uppercase tracking-tighter">History</h2>
                        <ul className="flex flex-col gap-4 overflow-y-visible">
                            {sessions.slice(0,MAX_DISPLAYED_WORKOUTS).map((workout) => (

                                <li key={workout.id}>
                                    <WorkoutTiles
                                        label={workout.name}
                                        startedAt={workout.startedAt}
                                        durationSeconds={workout.durationSeconds}
                                        totalVolume={workout.totalVolume}
                                        recordsBroken={workout.recordsBroken}
                                        onClick={() => onOpenSession(workout.id)}
                                    />
                                </li>
                            ))}
                        </ul>
                    </>

                    :
                    
                    <div className="flex flex-col items-center gap-4">
                        <button 
                            className={clsx(buttonClass, "w-full")}
                            onClick={() => setView({ kind: "workout" })}
                        >
                            Start a workout
                        </button>
                    </div>
                }
            </div>
        )
    }
}   