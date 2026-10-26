interface WorkoutTilesProps {
    label: string;
    startedAt: number;
    durationSeconds?: number;
    totalVolume?: number;
    recordsBroken?: number;
    onClick: () => void;
}

function formatDuration(durationSeconds?: number) {
    if (durationSeconds === undefined) return "—";
    const minutes = Math.floor(durationSeconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${minutes}m`;
}

export const WorkoutTiles = ({ label, startedAt, durationSeconds, totalVolume, recordsBroken, onClick }: WorkoutTilesProps) => {
    return (
        <button onClick={onClick} className="flex flex-col cursor-pointer w-full gap-2 
            rounded-lg border border-mono-500/30 bg-mono-700/80 p-4 
            hover:bg-mono-700/60
            text-left shadow-lg shadow-mono-950/20"
        >
            <h3 aria-label="workout-1" className="text-base font-semibold">{label}</h3>
            <p className="text-xs text-mono-400">
                {new Date(startedAt).toLocaleDateString()}
            </p>
            
            <div className="grid grid-cols-3 gap-2 text-xs text-lavender-300/50">
                <span>Time </span>
                <span>Volume </span>
                <span>Records</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-base text-mono-200">
                <span>{formatDuration(durationSeconds)}</span>
                <span>{totalVolume === undefined ? "—" : `${totalVolume.toLocaleString()} lbs`}</span>
                <span className="inline-flex items-center gap-1">
                    {recordsBroken ?? "—"}
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