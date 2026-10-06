export const WorkoutTiles = ({ label }: { label: string }) => {
    return (
        <button className="flex flex-col cursor-pointer w-full gap-2 rounded-lg border border-mono-500/30 bg-mono-700/80 p-4 text-left shadow-lg shadow-mono-950/20">
            <h3 aria-label="workout-1" className="text-sm font-semibold">{label}</h3>
            <p className="text-xs text-mono-400">
                Date: 5 October 2026
            </p>
            
            <div className="grid grid-cols-3 gap-2 text-xs text-lavender-300/50">
                <span>Time </span>
                <span>Volume </span>
                <span>Records</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm text-mono-200">
                <span>1h 55min</span>
                <span>52,470 lbs</span>
                <span className="inline-flex items-center gap-1">
                    6
                    <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="size-4 shrink-0 text-amber-300"
                    >
                        <circle cx="12" cy="8" r="5" />
                        <path d="m8.6 11.7-1.1 9L12 18l4.5 2.7-1.1-9" />
                        <path d="m10.5 8 1 1 2-2" />
                    </svg>
                </span>
            </div>
        </button>
    )
};