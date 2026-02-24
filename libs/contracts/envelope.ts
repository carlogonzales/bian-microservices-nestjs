export interface MessageEnvelope<TPayload> {
  messageId: string;
  correlationId: string;
  type: string;
  version: string;
  timestamp: string;
  producer: string;
  payload: TPayload;
}