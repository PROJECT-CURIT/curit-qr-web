const TOKEN_PATTERN = /^[A-Za-z0-9_-]{12,128}$/
const BASE_PATH = (
  (import.meta as ImportMeta & { env: Record<string, string | undefined> }).env
    .VITE_BASE_PATH || ""
)
  .replace(/^\/?/, "/")
  .replace(/\/$/, "")

export function readQrToken(pathname?: string, search?: string) {
  const currentPath =
    pathname ?? (typeof window === "undefined" ? "" : window.location.pathname)
  const currentSearch =
    search ?? (typeof window === "undefined" ? "" : window.location.search)
  const queryToken = new URLSearchParams(currentSearch).get("qr")
  if (queryToken && TOKEN_PATTERN.test(queryToken)) return queryToken

  const match = currentPath.match(/(?:^|\/)q\/([^/]+)\/?$/)
  if (!match) return ""

  try {
    const token = decodeURIComponent(match[1])
    return TOKEN_PATTERN.test(token) ? token : ""
  } catch {
    return ""
  }
}

export function qrPath(token: string) {
  if (!TOKEN_PATTERN.test(token))
    throw new Error("QR 토큰 형식이 올바르지 않아요.")
  return `${BASE_PATH}/?qr=${encodeURIComponent(token)}`
}
