import Dexie, { type EntityTable } from "dexie";

export type TableName = "exercises" | "templates" | "templateExercises" | "sessions" | "sessionSets";
type Rec = { id: string } & Record<string, unknown>;

export type Exercise = { id: string; name: string; muscle: string; updatedAt: number };
export type Template = { id: string; name: string; updatedAt: number };
// A template is a plan: which exercises, with target sets and reps. No weights; those belong to logs.
export type TemplateExercise = {
  id: string; templateId: string; exerciseId: string; position: number; sets: number; reps: number; updatedAt: number;
};
// A session is one logged workout, started from a template. Name is copied so history survives template edits or deletion.
export type Session = { id: string; templateId: string; name: string; startedAt: number; updatedAt: number };
export type SessionSet = {
  id: string; sessionId: string; exerciseId: string; position: number; setNumber: number;
  weight: number; reps: number; done: boolean; updatedAt: number;
};
export type OutboxItem = { seq?: number; table: TableName; recordId: string; op: "put" | "delete"; payload?: unknown; ts: number };

class WorkoutDB extends Dexie {
  exercises!: EntityTable<Exercise, "id">;
  templates!: EntityTable<Template, "id">;
  templateExercises!: EntityTable<TemplateExercise, "id">;
  sessions!: EntityTable<Session, "id">;
  sessionSets!: EntityTable<SessionSet, "id">;
  outbox!: EntityTable<OutboxItem, "seq">;

  constructor() {
    super("workout-pwa");
    this.version(1).stores({
      exercises: "id, name", templates: "id", templateExercises: "id, templateId", outbox: "++seq",
    });
    this.version(2).stores({
      exercises: "id, name", templates: "id", templateExercises: "id, templateId", outbox: "++seq",
      sessions: "id, startedAt", sessionSets: "id, sessionId, exerciseId",
    });
  }
}

export const db = new WorkoutDB();

// Every write also enqueues outbox items, atomically, so nothing is lost offline.
export async function putMany(table: TableName, records: Rec[]) {
  const ts = Date.now();
  const recs = records.map((r) => ({ ...r, updatedAt: ts }));
  const t = db.table(table);
  await db.transaction("rw", t, db.outbox, async () => {
    await t.bulkPut(recs);
    await db.outbox.bulkAdd(recs.map((r) => ({ table, recordId: r.id, op: "put" as const, payload: r, ts })));
  });
}

export const put = (table: TableName, record: Rec) => putMany(table, [record]);

// Read-modify-write inside one transaction, so a stale in-memory object can never overwrite newer fields.
export async function patch(table: TableName, id: string, changes: Record<string, unknown>) {
  const t = db.table(table);
  await db.transaction("rw", t, db.outbox, async () => {
    const cur = await t.get(id);
    if (!cur) return;
    const rec = { ...cur, ...changes, updatedAt: Date.now() };
    await t.put(rec);
    await db.outbox.add({ table, recordId: id, op: "put", payload: rec, ts: rec.updatedAt });
  });
}

export async function remove(table: TableName, id: string) {
  const t = db.table(table);
  await db.transaction("rw", t, db.outbox, async () => {
    await t.delete(id);
    await db.outbox.add({ table, recordId: id, op: "delete", ts: Date.now() });
  });
}

// Most recent session's completed sets for an exercise, used to prefill the next session.
async function lastSets(exerciseId: string) {
  const done = (await db.sessionSets.where("exerciseId").equals(exerciseId).toArray()).filter((s) => s.done);
  if (done.length === 0) return [];
  const sessions = await db.sessions.bulkGet([...new Set(done.map((s) => s.sessionId))]);
  const latest = sessions.filter((s): s is Session => !!s).sort((a, b) => b.startedAt - a.startedAt)[0];
  return latest ? done.filter((s) => s.sessionId === latest.id).sort((a, b) => a.setNumber - b.setNumber) : [];
}

export async function startSession(templateId: string): Promise<string> {
  const sessionId = crypto.randomUUID();
  await db.transaction("rw", [db.templates, db.templateExercises, db.sessions, db.sessionSets, db.outbox], async () => {
    const template = await db.templates.get(templateId);
    const entries = await db.templateExercises.where("templateId").equals(templateId).sortBy("position");
    const sets: Rec[] = [];
    for (const en of entries) {
      const last = await lastSets(en.exerciseId);
      for (let i = 0; i < en.sets; i++) {
        const prev = last[i] ?? last[last.length - 1];
        sets.push({
          id: crypto.randomUUID(), sessionId, exerciseId: en.exerciseId, position: en.position, setNumber: i + 1,
          weight: prev?.weight ?? 0, reps: prev?.reps ?? en.reps, done: false,
        });
      }
    }
    await putMany("sessions", [{ id: sessionId, templateId, name: template?.name ?? "Workout", startedAt: Date.now() }]);
    await putMany("sessionSets", sets);
  });
  return sessionId;
}

export async function removeSession(id: string) {
  await db.transaction("rw", [db.sessions, db.sessionSets, db.outbox], async () => {
    for (const s of await db.sessionSets.where("sessionId").equals(id).toArray()) await remove("sessionSets", s.id);
    await remove("sessions", id);
  });
}

const SEED: [string, string][] = [
  ["Squat", "Legs"], ["Leg press", "Legs"], ["Calf press", "Legs"], ["Romanian deadlift", "Legs"],
  ["Bench press", "Chest"], ["Overhead press", "Shoulders"], ["Barbell row", "Back"], ["Pull-up", "Back"],
  ["Deadlift", "Back"], ["Biceps curl", "Arms"], ["Triceps pushdown", "Arms"], ["Plank", "Core"],
];

// Deterministic ids so every device agrees on what "Squat" is. Not queued for sync: shared reference data.
export async function seedIfEmpty() {
  if ((await db.exercises.count()) > 0) return;
  await db.exercises.bulkPut(
    SEED.map(([name, muscle]) => ({ id: `seed-${name.toLowerCase().replace(/\s+/g, "-")}`, name, muscle, updatedAt: 0 })),
  );
}
