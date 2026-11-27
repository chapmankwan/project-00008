"use client";

import { Sheet } from "./index";
import { SET_TYPE_OPTIONS, type SetType } from "@/lib/set-types";

export interface SettingSetTypeSheetProps {
  title: string;
  onClose: () => void;
  onSelect: (setType: SetType) => Promise<void> | void;
}

export function SettingSetTypeSheet({ title, onClose, onSelect }: SettingSetTypeSheetProps) {
  return (
    <Sheet title={title} onClose={onClose}>
      {(closeSheet) => <ul className="space-y-2">
        {SET_TYPE_OPTIONS.map((option) => (
          <li key={option.value}>
            <button
              type="button"
              className="min-h-11 w-full rounded-lg bg-mono-700 px-4 text-left hover:bg-mono-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender-300"
              onClick={async () => {
                await onSelect(option.value);
                closeSheet();
              }}
            >
              {option.label}
            </button>
          </li>
        ))}
      </ul>}
    </Sheet>
  );
}
