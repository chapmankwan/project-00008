const btn = "min-h-11 rounded-lg px-4 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender-400";
export const primary = `${btn} bg-lavender-500 text-mono-950`;
export const ghost = `${btn} bg-mono-800 text-mono-100`;
export const simpleBtn = `cursor-pointer rounded-lg px-3 py-1 border border-solid border-lavender-400/50 hover:border-lavender-200`;
export const field = "min-h-11 w-full rounded-lg border border-mono-700 bg-mono-900 px-3 text-mono-100";

// Commits on blur so we don't queue a sync item per keystroke.
export function Num({ label, value, step = 1, hideLabel = false, onCommit }: {
  label: string; value: number; step?: number; hideLabel?: boolean; onCommit: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-slate-400">
      <span className={hideLabel ? "sr-only" : ""}>{label}</span>
      <input
        type="number" inputMode="decimal" min={0} step={step} defaultValue={value} className={field}
        onBlur={(e) => {
          const v = Number(e.target.value);
          if (e.target.value !== "" && Number.isFinite(v) && v >= 0 && v !== value) onCommit(v);
        }}
      />
    </label>
  );
}
