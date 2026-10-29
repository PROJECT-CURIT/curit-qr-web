import { describe, expect, it } from "vitest"
import { qrPath, readQrToken } from "./qrToken"

describe("product QR paths", () => {
  it("reads one opaque token from a product QR path", () => {
    expect(readQrToken("/q/demo-mug-white-gray")).toBe("demo-mug-white-gray")
  })

  it("does not accept traversal or short identifiers", () => {
    expect(readQrToken("/q/..%2Fadmin")).toBe("")
    expect(readQrToken("/q/short")).toBe("")
  })

  it("builds a QR path without embedding price or stock", () => {
    expect(qrPath("demo-dessert-plate")).toBe("/q/demo-dessert-plate")
  })
})
