import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";

export const ActiveSession = ({
    setView
}: {setView: () => void}) => {

    const activeSession = useLiveQuery(
        async () => (await db.sessions.toArray())
            .filter((session) => session.status === "active")
            .sort((a, b) => b.startedAt - a.startedAt)[0] ?? null,
        [],
        null,
    );

    if (!activeSession) return null;

    return (
        <button
            type="button"
            onClick={setView}
            className="flex min-h-11 max-w-[55%] shrink-0 items-center gap-2 cursor-pointer
                rounded-xl border border-lavender-300/30 bg-mono-700/80 px-3 
                text-left text-xs shadow-md transition-colors hover:bg-mono-600 
                focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender-300"
        >
            <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-lavender-300" />
            <span className="min-w-0 truncate">{activeSession.name}</span>
            <span className="shrink-0 text-lavender-300">Resume</span>
        </button>
    );
};