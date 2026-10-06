

export const ProfileView = () => {
    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between gap-2">
                <button className="cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="ml-1 h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                </button>
            </div>
            <div>
                Workouts completed: 0
            </div>
            <div>
                Total weight lifted: 0
            </div>

            <table className="w-full border-collapse border border-slate-400">
                <thead>
                    <tr>
                        <th className="border border-slate-300 px-4 py-2">Date</th>
                        <th className="border border-slate-300 px-4 py-2">Workout</th>
                        <th className="border border-slate-300 px-4 py-2">Time</th>
                        <th className="border border-slate-300 px-4 py-2">Volume</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="border border-slate-300 px-4 py-2">5 October 2026</td>
                        <td className="border border-slate-300 px-4 py-2">Workout 1</td>
                        <td className="border border-slate-300 px-4 py-2">1h 55min</td>
                        <td className="border border-slate-300 px-4 py-2">52,470 lbs</td>
                    </tr>
                </tbody>
            </table>

            <div>
                <button>Statistics</button>
                <button>Exercises</button>
                <button>Measurements</button>
                <button>Calendar</button>
            </div>
        </section>
    );
};