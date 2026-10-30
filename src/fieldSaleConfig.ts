export const fieldProducts = {
  kendama: {
    name: "켄다마",
    image: "kendama.png",
    description:
      "공을 컵에 올리며 즐기는 장난감이에요. 매장에서 색상과 실물을 확인해 주세요.",
  },
  "dango-keyring": {
    name: "당고 키링",
    image: "dango-keyring.png",
    description:
      "가방이나 열쇠에 달아 함께하는 고양이 당고 키링이에요. 매장에서 디자인을 골라 주세요.",
  },
} as const

export type FieldProductId = keyof typeof fieldProducts
export type FieldSaleConfig = {
  storeName: string
  bank: {
    name: string
    account: string
    holder: string
  } | null
  products: Record<FieldProductId, {
    price: number | null
    quantity: number | null
  }>
}

export function fieldProductId(value: string | null): FieldProductId | null {
  return value && Object.prototype.hasOwnProperty.call(fieldProducts, value)
    ? value as FieldProductId
    : null
}

export function readFieldSaleConfig(value: unknown): FieldSaleConfig {
  if (!value || typeof value !== "object")
    throw new Error("판매 안내를 확인하지 못했어요. 매장에 문의해 주세요.")
  const config = value as FieldSaleConfig
  const text = (input: unknown) =>
    typeof input === "string" && input.trim().length > 0 && input.length <= 100
  if (!text(config.storeName) || !config.products)
    throw new Error("매장 정보를 확인하지 못했어요.")
  if (
    config.bank &&
    (!text(config.bank.name) ||
      !text(config.bank.holder) ||
      typeof config.bank.account !== "string" ||
      !/^[\d -]{6,40}$/.test(config.bank.account) ||
      config.bank.account.replace(/\D/g, "").length < 6)
  ) {
    throw new Error("입금 계좌를 확인하지 못했어요. 매장에 문의해 주세요.")
  }
  for (const id of Object.keys(fieldProducts) as FieldProductId[]) {
    const product = config.products[id]
    if (
      !product ||
      (product.price !== null &&
        (!Number.isSafeInteger(product.price) || product.price <= 0)) ||
      (product.quantity !== null &&
        (!Number.isSafeInteger(product.quantity) || product.quantity < 0))
    ) {
      throw new Error("상품의 가격과 판매 수량을 확인하지 못했어요.")
    }
  }
  return config
}

export function transferAmount(
  price: number | null,
  quantity: number,
  limit: number | null,
) {
  if (
    price === null ||
    limit === null ||
    !Number.isSafeInteger(price) ||
    price <= 0 ||
    !Number.isSafeInteger(quantity) ||
    quantity < 1 ||
    quantity > limit ||
    !Number.isSafeInteger(limit) ||
    !Number.isSafeInteger(price * quantity)
  )
    return null
  return price * quantity
}
