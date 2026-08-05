import { createEventEnvelope } from "@school-platform/events";
import { createLogger } from "@school-platform/observability";

const logger = createLogger({ service: "worker" });

const event = createEventEnvelope({
  source: "school-platform/worker",
  type: "worker.started.v1",
  subject: "worker/bootstrap",
  schoolId: "00000000-0000-0000-0000-000000000000",
  data: {
    mode: process.env.NODE_ENV ?? "development",
  },
});

logger.info("worker_started", { eventId: event.id });
