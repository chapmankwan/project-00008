import clsx from "clsx";

interface SelectorTabProps {
    selectedTab: string;
    setSelectedTab: (tab: TabId) => void;
}

const selectorList = [
    { id: "home", label: "Home", icon: "home" },
    { id: "workouts", label: "Workouts", icon: "workouts" },
    { id: "sessions", label: "Sessions", icon: "sessions" },
] as const;
type TabId = (typeof selectorList)[number]["id"];

export const SelectorTab = ({
    selectedTab,
    setSelectedTab,
}: SelectorTabProps) => {
    const activeTab = selectedTab === "session" ? "sessions" : selectedTab;

    return (
        <nav aria-label="Main navigation" className="flex justify-center py-2">
            <ul className="grid w-full max-w-xs grid-cols-3 gap-2 rounded-4xl border border-mono-500/30 bg-mono-700/80 p-2 shadow-lg shadow-mono-950/20">
                {selectorList.map(({ id, label, icon }) => {
                    const isSelected = activeTab === id;

                    return (
                        <li key={id} className="min-w-0">
                            <button
                                type="button"
                                aria-current={isSelected ? "page" : undefined}
                                onClick={() => setSelectedTab(id)}
                                className={clsx(
                                    "flex min-h-12 cursor-pointer w-full flex-col items-center justify-center gap-1 rounded-3xl px-2 py-2 text-center text-xs font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender-300",
                                    "ease-in-out duration-500",
                                    isSelected
                                        ? "bg-lavender-400/50 shadow-sm"
                                        : "text-mono-200 hover:bg-mono-600/70 hover:text-mono-50",
                                )}
                            >
                                <svg
                                    aria-hidden="true"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="size-5 shrink-0"
                                >
                                    {icon === "home" && <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></>}
                                    {icon === "workouts" && <><path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" /></>}
                                    {icon === "sessions" && <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>}
                                </svg>
                                <span className="max-sm:hidden max-w-full truncate">{label}</span>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </nav>
    )
}