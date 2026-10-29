const TOKEN_PATTERN = /^[A-Za-z0-9_-]{12,128}$/

export function readQrToken(pathname = window.location.pathname) {
  const match = pathname.match(/^\/q\/([^/]+)\/?$/)
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
  return `/q/${encodeURIComponent(token)}`
}
