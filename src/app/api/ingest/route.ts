import { gunzipSync } from "node:zlib";
import { insertEvents, KEPT_KINDS, type TelemetryEvent } from "@/lib/telemetry";

// Ingest for the herdr-telemetry plugin: bearer-authed ndjson batches
// (optionally gzipped), filtered to the kinds the now panel uses.

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const token = process.env.TELEMETRY_INGEST_TOKEN;
  if (!token || auth !== `Bearer ${token}`) {
    return new Response("unauthorized", { status: 401 });
  }

  let body: Buffer;
  try {
    body = Buffer.from(await req.arrayBuffer());
    if (req.headers.get("content-encoding") === "gzip") {
      body = gunzipSync(body);
    }
  } catch {
    return new Response("bad payload", { status: 400 });
  }
  if (body.length > 2 * 1024 * 1024) {
    return new Response("too large", { status: 413 });
  }

  const events: TelemetryEvent[] = [];
  for (const line of body.toString("utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      const e = JSON.parse(line);
      if (e && e.v === 1 && typeof e.kind === "string" && KEPT_KINDS.has(e.kind)) {
        events.push(e);
      }
    } catch {
      // one bad line never rejects the batch
    }
  }

  try {
    const stored = await insertEvents(events);
    return Response.json({ ok: true, stored });
  } catch (err) {
    console.error("ingest:", err);
    return new Response("storage error", { status: 500 });
  }
}
