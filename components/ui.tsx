const btn = "min-h-11 rounded-lg px-4 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender-400";
export const primary = `${btn} bg-lavender-500 text-mono-950`;
export const ghost = `${btn} bg-mono-800 text-mono-100`;
export const simpleBtn = `cursor-pointer rounded-lg px-3 py-1 border border-solid border-lavender-400/50 hover:border-lavender-200`;
export const field = "h-8 min-h-8 w-full rounded-lg border border-mono-700 bg-mono-900 px-2 text-sm text-mono-100 focus:outline-none focus:border-blush-500";
export const simpleInput = "w-full touch-manipulation rounded-lg border border-mono-500/30 bg-mono-700/60 p-3 text-sm text-mono-200 focus:outline-none"

// Commits on blur so we don't queue a sync item per keystroke.
export function Num({ label, value, hideLabel = false, onCommit }: {
  label: string; value: number; hideLabel?: boolean; onCommit: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-mono-400">
      <span className={hideLabel ? "sr-only" : ""}>{label}</span>
      <input
        type="number" inputMode="numeric" min={0} step={1} defaultValue={value} className={`${field} number-input appearance-none border-mono-600`}
        onBlur={(e) => {
          const rawValue = e.target.value;
          if (rawValue === "") {
            e.target.value = String(value);
            return;
          }
          const parsedValue = Number(rawValue);
          if (!Number.isFinite(parsedValue) || parsedValue < 0) {
            e.target.value = String(value);
            return;
          }
          const wholeNumber = Math.round(parsedValue);
          e.target.value = String(wholeNumber);
          if (wholeNumber !== value) onCommit(wholeNumber);
        }}
      />
    </label>
  );
}
