import { afterEach, describe, expect, it, vi } from "vitest"
import { loadQrListing } from "./commerce"

const snapshot = {
  v: 1,
  qrToken: "demo-dessert-plate",
  storeId: "store-1",
  requestId: "request-1",
  returnUrl: "https://project-curit.github.io/curit-qr-web/",
  saleStatus: "active",
  store: { name: "아늑한 서울", phone: "", address: "서울", hours: "10–20" },
  product: {
    artworkId: "0-2",
    name: "디저트 플레이트",
    artist: "김서연",
    price: 55000,
    stock: 8,
    image: "https://example.com/plate.jpg",
    description: "작품 설명",
    composition: "접시 1개",
    care: "충격 주의",
    pickupMode: "immediate",
    exhibitionEnd: "",
  },
}

describe("QR visit analytics", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("reuses one anonymous browser id without sending personal data", async () => {
    const values = new Map<string, string>()
    vi.stubGlobal("window", { location: { origin: "https://example.com" } })
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) || null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    })
    vi.stubGlobal("sessionStorage", {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    })
    const request = vi.fn(async (_url: string, init?: RequestInit) => {
      const headers = new Headers(init?.headers)
      expect(headers.get("x-curit-visitor-id")).toMatch(
        /^[A-Za-z0-9_-]{16,128}$/,
      )
      expect(headers.has("x-forwarded-for")).toBe(false)
      return new Response(JSON.stringify(snapshot), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    })
    vi.stubGlobal("fetch", request)

    await loadQrListing("demo-dessert-plate")
    const firstId = values.get("curit.qr.visitor-id.v1")
    await loadQrListing("demo-dessert-plate")

    expect(firstId).toBeTruthy()
    expect(values.get("curit.qr.visitor-id.v1")).toBe(firstId)
    expect(request).toHaveBeenCalledTimes(2)
  })
})
