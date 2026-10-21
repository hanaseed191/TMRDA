/** Short unique id for choices, pairs and criteria (works without secure-context crypto). */
export function uid(): string {
  const c = typeof crypto !== 'undefined' ? (crypto as Crypto & { randomUUID?: () => string }) : undefined;
  if (c?.randomUUID) return c.randomUUID().replace(/-/g, '').slice(0, 10);
  return Math.random().toString(36).slice(2, 12);
}

/** Unique numeric id for practical criteria nodes. */
export function numericId(): number {
  return Date.now() * 1000 + Math.floor(Math.random() * 1000);
}
