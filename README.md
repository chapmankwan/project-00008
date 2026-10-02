# Workout PWA boilerplate

Next.js (App Router) + Tailwind v4 + Dexie (IndexedDB) + Serwist (service worker).

    npm install
    npm run build && npm start    # test PWA behavior on the production build
    npm run dev                   # service worker is disabled in dev

Offline test: open the app once online, then DevTools > Network > Offline, reload, add a workout.
Installability: DevTools > Application > Manifest.

## Not done yet
- Pull sync (server to device), auth, conflict handling beyond "last write wins"
- Weight units (kg vs lb), exercise rename/delete, charts of progress
- Real icons (current ones are generated placeholders)
- In-app install prompt, update-available toast

## Data model
templates + templateExercises (plan: target sets/reps) -> startSession() copies them into sessions + sessionSets (log: per-set weight, reps, done).
Every write also lands in `outbox`, which `lib/sync.ts` flushes to `/api/sync`.
