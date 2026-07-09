import { nowModel } from "@/lib/telemetry";

// Read model for the [now] pane: live agents + last-24h finished runs.

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const model = await nowModel();
    return Response.json(model, {
      headers: {
        "Cache-Control": "public, s-maxage=15, stale-while-revalidate=45",
      },
    });
  } catch (err) {
    console.error("now:", err);
    return Response.json(
      { live: [], runs: [], totalRuns: 0, snapshotTs: null, daemonLive: false, error: true },
      { status: 200 },
    );
  }
}
