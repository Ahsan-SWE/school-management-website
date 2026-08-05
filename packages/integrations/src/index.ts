export type VerificationResult =
  | { valid: true; providerEventId: string }
  | { valid: false; reason: string };

export interface InboundProviderAdapter<TPayload = unknown, TEvent = unknown> {
  verify(rawBody: Uint8Array, headers: Headers): Promise<VerificationResult>;
  parse(rawBody: Uint8Array): TPayload;
  normalize(payload: TPayload): TEvent;
}
