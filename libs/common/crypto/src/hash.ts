import { createHash } from "crypto";

type HexString = `0x${string}`;

export function sha256(input: string): HexString {
  return createHash("sha256").update(input).digest("hex") as HexString;
}