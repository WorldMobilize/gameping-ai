/**
 * Short, shareable creator codes. The alphabet drops easily-confused characters
 * (0/O, 1/I/L) so a code read aloud or typed by a follower isn't ambiguous. The
 * RNG is injectable so the generator is deterministic in tests.
 */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateCreatorCode(
  length = 6,
  rnd: () => number = Math.random
): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[Math.floor(rnd() * CODE_ALPHABET.length)];
  }
  return out;
}
