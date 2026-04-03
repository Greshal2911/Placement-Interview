import { getAnalyticsForUserParam } from "@/lib/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StreamEvent = "analytics" | "heartbeat" | "error";

function toSseEvent(event: StreamEvent, payload: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  const encoder = new TextEncoder();

  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      let lastSnapshot = "";

      const send = (event: StreamEvent, payload: unknown) => {
        controller.enqueue(encoder.encode(toSseEvent(event, payload)));
      };

      const pushLatestAnalytics = async () => {
        const analytics = await getAnalyticsForUserParam(userId);
        if (!analytics) {
          send("error", { message: "User not found" });
          return false;
        }

        const snapshot = JSON.stringify(analytics);
        if (snapshot !== lastSnapshot) {
          lastSnapshot = snapshot;
          send("analytics", analytics);
        }

        return true;
      };

      try {
        const ok = await pushLatestAnalytics();
        if (!ok) {
          controller.close();
          return;
        }
      } catch (error) {
        send("error", { message: "Failed to stream analytics", details: String(error) });
        controller.close();
        return;
      }

      pollTimer = setInterval(async () => {
        try {
          const ok = await pushLatestAnalytics();
          if (!ok) {
            if (pollTimer) {
              clearInterval(pollTimer);
            }
            if (heartbeatTimer) {
              clearInterval(heartbeatTimer);
            }
            controller.close();
          }
        } catch (error) {
          send("error", { message: "Failed to stream analytics", details: String(error) });
        }
      }, 5000);

      heartbeatTimer = setInterval(() => {
        send("heartbeat", { at: Date.now() });
      }, 25000);

      request.signal.addEventListener("abort", () => {
        if (pollTimer) {
          clearInterval(pollTimer);
        }
        if (heartbeatTimer) {
          clearInterval(heartbeatTimer);
        }
        controller.close();
      });
    },
    cancel() {
      if (pollTimer) {
        clearInterval(pollTimer);
      }
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}