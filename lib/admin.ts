// Simple email-allowlist gate for internal-only pages/routes (e.g. the
// analytics dashboard). There is no roles table in the schema yet — this is
// intentionally the smallest thing that works: a comma-separated env var.
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false

  const allowlist = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)

  return allowlist.includes(email.toLowerCase())
}
