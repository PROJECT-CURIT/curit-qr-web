import { describe, expect, it } from "vitest"
import { qrPath, readQrToken } from "./qrToken"

describe("product QR paths", () => {
  it("reads one opaque token from a product QR path", () => {
    expect(readQrToken("/q/demo-mug-white-gray")).toBe("demo-mug-white-gray")
    expect(readQrToken("/curit-qr-web/q/demo-mug-white-gray")).toBe(
      "demo-mug-white-gray",
    )
    expect(readQrToken("/curit-qr-web/", "?qr=demo-dessert-plate")).toBe(
      "demo-dessert-plate",
    )
  })

  it("does not accept traversal or short identifiers", () => {
    expect(readQrToken("/q/..%2Fadmin")).toBe("")
    expect(readQrToken("/q/short")).toBe("")
    expect(readQrToken("/curit-qr-web/", "?qr=short")).toBe("")
  })

  it("builds a GitHub Pages-safe QR URL without embedding price or stock", () => {
    expect(qrPath("demo-dessert-plate")).toBe("/?qr=demo-dessert-plate")
  })
})
