"use client";

import { type SubmitEvent, useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, put, seedExercises, type TableName } from "@/lib/db";

import { startSync } from "@/lib/sync";
import { useOnline } from "@/app/utilities";

import { field, ghost, primary } from "@/components/ui";

import { SelectorTab, WorkoutTiles } from "@/components";

type View = { kind: "home" | "workouts" | "sessions" } | { kind: "template"; id: string } | { kind: "session"; id: string };
interface HomeProps {
    onOpenTemplate: (id: string) => void;
    onOpenSession: (id: string) => void;
};

export default function App() {
    const online = useOnline();
    const [view, setView] = useState<View>({ kind: "home" });
    const pending = useLiveQuery(() => db.outbox.count(), [], 0);
    const home = () => setView({ kind: "home" });

    useEffect(() => {
        void seedExercises();
        return startSync();
    }, []);

    const renderView = () => {
        switch (view.kind) {
            case "template":
                return null
            case "session":
                return null;
            default:
                return <Home onOpenTemplate={(id) => setView({ kind: "template", id })} onOpenSession={(id) => setView({ kind: "session", id })} />;
        }
    };

    return (
        <main className="relative mx-auto flex h-dvh w-full flex-col overflow-hidden p-4">
            <header className="shrink-0 pb-4">
                <h1 className="text-2xl font-semibold">minifridge</h1>
                <p role="status" className="text-xs tracking-tighter text-slate-400">
                    <span className={online ? "text-green-400" : "text-red-400"}>{online ? "online" : "offline"}</span>, {pending} unsynced
                </p>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[calc(7rem+env(safe-area-inset-bottom))]">
                {renderView()}
            </div>
            <footer className="absolute inset-x-0 bottom-0 z-10 items-center px-4 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-1">
                <SelectorTab 
                    selectedTab={view.kind}
                    setSelectedTab={(tab) => setView({ kind: tab })}
                />
                
            </footer>
        </main>
    )

    function Home({ onOpenTemplate,onOpenSession }: HomeProps) {
        const templates = useLiveQuery(() => db.templates.toArray(), [], []);
        const sessions = useLiveQuery(() => db.sessions.orderBy("startedAt").reverse().toArray(), [], []);
        const [name, setName] = useState("");

        async function add(e: SubmitEvent) {
            e.preventDefault();
            const n = name.trim();
            if (!n) return;
            await put("templates", { id: crypto.randomUUID(), name: n });
            setName("");
        }

        return (
            <div className="flex w-full flex-col gap-4 px-5">
                <ul className="flex flex-col gap-4 overflow-y-visible">
                    <li>
                        <WorkoutTiles label="DAY 1 - Heavy Legs" />
                    </li>
                    <li>
                        <WorkoutTiles label="DAY 2 - Chest & Back" />
                    </li>
                    <li>
                        <WorkoutTiles label="DAY 3 - Legs & Shoulders" />
                    </li>
                    <li>
                        <WorkoutTiles label="DAY 4 - Upper" />
                    </li>
                    <li>
                        <WorkoutTiles label="DAY 1 - Heavy Legs" />
                    </li>
                    <li>
                        <WorkoutTiles label="DAY 2 - Chest & Back" />
                    </li>
                    <li>
                        <WorkoutTiles label="DAY 3 - Legs & Shoulders" />
                    </li>
                    <li>
                        <WorkoutTiles label="DAY 4 - Upper" />
                    </li>
                    <li>
                        <WorkoutTiles label="DAY 1 - Heavy Legs" />
                    </li>
                    <li>
                        <WorkoutTiles label="DAY 2 - Chest & Back" />
                    </li>
                    <li>
                        <WorkoutTiles label="DAY 3 - Legs & Shoulders" />
                    </li>
                    <li>
                        <WorkoutTiles label="DAY 4 - Upper" />
                    </li>
                </ul>
            </div>
        )
    }
}   