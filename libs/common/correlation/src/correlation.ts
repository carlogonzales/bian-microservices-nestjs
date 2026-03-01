import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';

const INTERNAL_NAMESPACE_UUID: string = '8194cb10-9e06-495d-ad45-b617a263bbf0';
const DEFAULT_NAMESPACE: string = 'bian-microservice'; // predefined namespace
const DEFAULT_NAMESPACE_UUID: string = uuidv5(DEFAULT_NAMESPACE, INTERNAL_NAMESPACE_UUID);

// NOTE: Reserve GenericUUID type for future use if we want to support other UUID versions or formats.
type GenericUUID = `${string}-${string}-${string}-${string}-${string}`;
// NOTE: The correlation ID can be either a UUIDv4 or a UUIDv5, but for deterministic generation,
// we will use UUIDv5 with a predefined namespace. The function will generate a new UUIDv4
// if no context is provided, or a deterministic UUIDv5 based on the context and optional namespace.
type UUIDv4or5 =
  `${string}-${string}-4${string}-${string}-${string}` |
  `${string}-${string}-5${string}-${string}-${string}`;

type DeterministicCorrelation = {
  namespace: string;
  context: string;
};

type DefaultNamepsaceContextCorrelation = {
  namespace?: undefined;
  context: string;
}

type NoCorrelationInput = {
  namespace?: undefined;
  context?: undefined;
}

type CorrelationsOpts = {
  correlationId?: UUIDv4or5;
} & (DeterministicCorrelation | DefaultNamepsaceContextCorrelation | NoCorrelationInput);

export function getOrCreateCorrelationId({
                                           correlationId,
                                           context,
                                           namespace,
                                         }: CorrelationsOpts = {}): UUIDv4or5 {
  if (correlationId && correlationId.trim().length > 0) {
    return correlationId;
  }

  if (!context) {
    return uuidv4() as UUIDv4or5;
  } else {
    if (!namespace) {
      return uuidv5(context, DEFAULT_NAMESPACE_UUID) as UUIDv4or5;
    } else {
      return uuidv5(context, getNamespaceUUID(namespace)) as UUIDv4or5;
    }
  }
}

export function getNamespaceUUID(namespace: string): UUIDv4or5 {
  return uuidv5(namespace, INTERNAL_NAMESPACE_UUID) as UUIDv4or5;
}