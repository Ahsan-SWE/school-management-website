import { randomUUID } from "node:crypto";
import { z } from "zod";

export const EventEnvelopeSchema = z.object({
  specversion: z.literal("1.0"),
  id: z.string().min(1),
  source: z.string().min(1),
  type: z.string().min(1),
  subject: z.string().min(1),
  time: z.iso.datetime(),
  datacontenttype: z.literal("application/json"),
  schoolid: z.uuid(),
  correlationid: z.string().min(1),
  data: z.unknown(),
});

export type EventEnvelope = z.infer<typeof EventEnvelopeSchema>;

type CreateEventInput = {
  source: string;
  type: string;
  subject: string;
  schoolId: string;
  correlationId?: string;
  data: unknown;
};

export function createEventEnvelope(input: CreateEventInput): EventEnvelope {
  return EventEnvelopeSchema.parse({
    specversion: "1.0",
    id: randomUUID(),
    source: input.source,
    type: input.type,
    subject: input.subject,
    time: new Date().toISOString(),
    datacontenttype: "application/json",
    schoolid: input.schoolId,
    correlationid: input.correlationId ?? randomUUID(),
    data: input.data,
  });
}
