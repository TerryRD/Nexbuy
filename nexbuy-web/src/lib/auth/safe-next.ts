// Validate a "next" / "return to" path coming from a user-controlled
// query string. We only ever redirect to same-origin paths — reject
// anything that could be an open-redirect (//evil.com, javascript:,
// backslashes, etc.).

export function safeNext(input: string | null | undefined): string {
  if (typeof input !== "string" || input.length === 0) return "/";
  // Must start with a single forward slash
  if (!input.startsWith("/")) return "/";
  // Reject protocol-relative URLs //evil.com/...
  if (input.startsWith("//")) return "/";
  // Reject backslashes (browsers normalize \ to / — could escape origin)
  if (input.includes("\\")) return "/";
  // Reject anything that looks like a protocol (http:, javascript:, data:)
  if (/^\/[^/]*:[^/]/.test(input)) return "/";
  return input;
}
