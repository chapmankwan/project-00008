"use client";

import { type SubmitEvent, useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, put, seedIfEmpty, type TableName } from "@/lib/db";

import { startSync } from "@/lib/sync";
import { useOnline } from "@/app/utilities";

import { field, ghost, primary } from "@/components/ui";

import { SelectorTab } from "@/components";

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
        void seedIfEmpty();
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
        <main className="mx-auto flex min-h-dvh w-full flex-col p-4">
            <header className="py-2">
                <h1 className="text-2xl font-semibold">minifridge</h1>
                <p role="status" className="text-xs tracking-tighter text-slate-400">
                    <span className={online ? "text-green-400" : "text-red-400"}>{online ? "online" : "offline"}</span>, {pending} unsynced
                </p>
            </header>
            { renderView() }
            <footer className="mt-auto py-2 items-center">
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
            <div className="flex flex-col items-center max-w-3/4 w-full gap-4">
                <ul>
                    <li>
                        <h3 aria-label="workout-1">DAY 3 - Legs & Shoulders</h3>
                        <div className="grid grid-cols-3 gap-2 text-xs text-mono-600">
                            <span>Time </span>
                            <span>Volume </span>
                            <span>Records </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-mono-300">
                            <span>1h 55min</span>
                            <span>52,470 lbs</span>
                            <span>6</span>
                        </div>
                    </li>
                    <li>
                        <h3 aria-label="workout-1">DAY 2 - Chest & Back</h3>
                        <div className="grid grid-cols-3 gap-2 text-xs text-mono-600">
                            <span>Time </span>
                            <span>Volume </span>
                            <span>Records </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-mono-300">
                            <span>1h 30min</span>
                            <span>45,200 lbs</span>
                            <span>5</span>
                        </div>
                    </li>
                </ul>
            </div>
        )
    }
}   