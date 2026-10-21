export type SetType = "normal" | "warm-up" | "drop" | "back-down" | "superset";

export const SET_TYPE_OPTIONS: { value: SetType; label: string }[] = [
  { value: "normal", label: "Regular set" },
  { value: "warm-up", label: "Warm-up set" },
  { value: "drop", label: "Drop set" },
  { value: "back-down", label: "Back-down set" },
  { value: "superset", label: "Superset" },
];

export const SET_TYPE_SHORT_LABELS: Partial<Record<SetType, string>> = {
  "warm-up": "W",
  "back-down": "B",
  drop: "D",
  superset: "S",
};
