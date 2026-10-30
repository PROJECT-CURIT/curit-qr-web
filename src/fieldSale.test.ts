import { describe, expect, it } from "vitest"
import {
  fieldProductId,
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
