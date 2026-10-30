export const fieldProducts = {
  kendama: {
    name: "켄다마",
    image: "kendama.png",
    subtitle: "한 번 더 도전하고 싶은 손끝 놀이",
    category: "놀이 · 라이프스타일",
    tags: ["켄다마", "손끝 놀이", "현장 수령"],
    composition: "켄다마 1개",
    description:
      "공을 컵으로 받아 보세요. 한 번의 성공이 또 한 번의 도전으로 이어져요. 매장에 전시된 색상과 실물을 확인한 뒤 골라 주세요.",
  },
  "dango-keyring": {
    name: "고양이 당고 키링",
    image: "dango-keyring.png",
    subtitle: "가방에 달아 두는 작은 귀여움",
    category: "키링 · 라이프스타일",
    tags: ["당고 키링", "가방 소품", "현장 수령"],
    composition: "키링 1개",
    description:
      "당고처럼 모인 하얀 고양이 세 마리. 가방이나 열쇠에 귀여운 포인트를 더해 보세요. 매장에서 디자인과 실물을 확인해 주세요.",
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
