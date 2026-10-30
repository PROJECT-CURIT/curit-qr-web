import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import FieldSale from "./FieldSale"
import {
  fieldProductId,
  fieldProducts,
  readFieldSaleConfig,
  transferAmount,
} from "./fieldSaleConfig"

const config = {
  storeName: "테스트 매장",
  bank: { name: "테스트은행", holder: "테스트 예금주", account: "000-000000" },
  products: {
    kendama: { price: 5000, quantity: 2 },
    "dango-keyring": { price: 2000, quantity: 3 },
  },
}

describe("field-sale transfer guidance", () => {
  it("keeps field-sale links in the original product layout without enabling unconfigured payment", () => {
    try {
      for (const id of ["kendama", "dango-keyring"] as const) {
        vi.stubGlobal("location", { search: `?buy=${id}` })
        const html = renderToStaticMarkup(createElement(FieldSale))
        expect(html).toContain(`>${fieldProducts[id].name}</h1>`)
        expect(html).toContain('class="detail-grid"')
        expect(html).toContain('class="hero-copy"')
        expect(html).toContain('class="purchase-bar"')
        expect(html).toMatch(
          /<button(?=[^>]*class="primary")(?=[^>]*disabled="")[^>]*>/,
        )
        expect(html).not.toContain("김서연")
        expect(html).not.toContain('class="artist-line"')
        expect(html).toContain('href="tel:01029277547"')
        expect(html).toContain("010-2927-7547")
        expect(html.includes("youtube-nocookie.com/embed/WSEgTBeAry0")).toBe(
          id === "kendama",
        )
        expect(html).not.toContain("계좌번호 복사")
        expect(html).not.toContain("주문 완료")
      }
    } finally {
      vi.unstubAllGlobals()
    }
  })
  it("accepts only the two known products, without inheriting object properties", () => {
    expect(fieldProductId("kendama")).toBe("kendama")
    expect(fieldProductId("dango-keyring")).toBe("dango-keyring")
    for (const input of [null, "", "constructor", "__proto__", "other"])
      expect(fieldProductId(input)).toBeNull()
  })
  it("requires configured prices and whole available quantities", () => {
    expect(readFieldSaleConfig(config)).toEqual(config)
    expect(transferAmount(5000, 2, 2)).toBe(10000)
    for (const quantity of [0, -1, 1.5, 3, NaN])
      expect(transferAmount(5000, quantity, 2)).toBeNull()
    expect(transferAmount(null, 1, 2)).toBeNull()
    expect(transferAmount(5000, 1, null)).toBeNull()
    expect(transferAmount(5000, 1, 0)).toBeNull()
    expect(transferAmount(Number.MAX_SAFE_INTEGER, 2, 2)).toBeNull()
  })
  it("allows unconfigured preparation, but rejects invalid bank and money data", () => {
    expect(readFieldSaleConfig({ ...config, bank: null }).bank).toBeNull()
    expect(() =>
      readFieldSaleConfig({
        ...config,
        bank: { ...config.bank, account: "not-an-account" },
      }),
    ).toThrow()
    expect(() =>
      readFieldSaleConfig({
        ...config,
        products: { ...config.products, kendama: { price: -1, quantity: 2 } },
      }),
    ).toThrow()
    expect(() =>
      readFieldSaleConfig({
        ...config,
        products: {
          ...config.products,
          kendama: { price: 5000, quantity: 1.5 },
        },
      }),
    ).toThrow()
  })
})
