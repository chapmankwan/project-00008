// Stub. Replace with real auth + persistence.
// Contract: client POSTs { items: OutboxItem[] } in order. The server must apply each item
// idempotently (upsert/delete by recordId) and resolve conflicts (currently: last write wins by updatedAt).
export async function POST(req: Request) {
  const { items } = (await req.json()) as { items?: unknown[] };
  return Response.json({ ok: true, received: Array.isArray(items) ? items.length : 0 });
}
