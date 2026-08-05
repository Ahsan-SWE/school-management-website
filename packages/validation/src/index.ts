import { z } from "zod";

export const OpaqueIdSchema = z.uuid();
export const NonEmptyTextSchema = z.string().trim().min(1).max(500);
export const CurrencyCodeSchema = z.string().regex(/^[A-Z]{3}$/);

export function parseOpaqueId(value: unknown): string {
  return OpaqueIdSchema.parse(value);
}
