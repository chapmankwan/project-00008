export const metadata = { title: "Offline" };

export default function Offline() {
  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-xl font-semibold">You're offline</h1>
      <p className="mt-2 text-slate-300">
        This page isn't available without a connection. Your workouts are stored on this device and will sync when you're back online.
      </p>
      <a className="mt-4 inline-block rounded-lg bg-teal-500 px-4 py-3 font-medium text-slate-950" href="/">
        Back to workouts
      </a>
    </main>
  );
}
