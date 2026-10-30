const TOKEN_PATTERN = /^[A-Za-z0-9_-]{12,128}$/
const BASE_PATH = (
  (import.meta as ImportMeta & { env: Record<string, string | undefined> }).env
    .VITE_BASE_PATH || ""
)
  .replace(/^\/?/, "/")
  .replace(/\/$/, "")

export function readQrToken(pathname = window.location.pathname) {
  const match = pathname.match(/(?:^|\/)q\/([^/]+)\/?$/)
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
  return `${BASE_PATH}/q/${encodeURIComponent(token)}`
}
