// Cryptographically secure randomness helpers, backed by the Web Crypto API.
//
// Math.random() is NOT a CSPRNG (Sonar javascript:S2245) — its output is
// predictable, so it must never seed anything security-sensitive such as a
// password or token. These helpers use crypto.getRandomValues instead and are
// used everywhere the app needs randomness, so no Math.random() remains.

/** Uniform float in [0, 1), drawn from the CSPRNG. Drop-in for Math.random(). */
export function random01() {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] / 2 ** 32;
}

/** Unique id for UI elements / messages (replaces Date.now() + Math.random()). */
export function uid() {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${random01().toString(36).slice(2)}`;
}

/**
 * A strong temporary password: `length` chars from an unambiguous alphabet,
 * guaranteed to contain an upper-case letter, a lower-case letter, a digit and
 * a symbol. Every character is drawn from the CSPRNG.
 */
export function generatePassword(length = 14) {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const digit = '23456789';
  const sym = '!@#$%&*?';
  const all = upper + lower + digit + sym;
  const pick = (set) => set.charAt(Math.floor(random01() * set.length));

  const chars = [pick(upper), pick(lower), pick(digit), pick(sym)];
  while (chars.length < length) chars.push(pick(all));

  // Fisher–Yates shuffle so the guaranteed characters are not in fixed slots.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(random01() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}
