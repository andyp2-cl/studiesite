import { randomInt } from "node:crypto";

// Readable for a 12-year-old: no look-alike characters (0/O, 1/l/I).
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

/** Random password like "k7mq-x3ta-9pwe" (~60 bits of entropy). */
export function generatePassword(): string {
  const pick = (n: number) => Array.from({ length: n }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  return `${pick(4)}-${pick(4)}-${pick(4)}`;
}
