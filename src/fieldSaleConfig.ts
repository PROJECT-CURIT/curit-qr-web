export const fieldProducts = {
  kendama: {
    name: "켄다마",
    image: "kendama.png",
    subtitle: "한 번 놓치면.. 한 번 더!",
    category: "놀이 · 라이프스타일",
    tags: ["켄다마", "손끝 놀이", "현장 수령"],
    composition: "켄다마 1개",
    description: "‘해와 달’을 닮은 놀이, 켄다마.",
    story: [
      "1919년에 등장한 오늘날 켄다마의 원형은 ‘일월볼(日月ボール)’이라고 불렸어요. 둥근 공을 해에, 오목한 컵을 초승달에 빗댄 이름이랍니다.",
      "100년 넘게 이어진 놀이. 공을 컵에 받는 간단한 동작부터, 아래 영상 속 멋진 기술까지! 켄다마의 고수가 되어 보시지 않으렵니까..?!",
    ],
  },
  "dango-keyring": {
    name: "고양이 당고 키링",
    image: "dango-keyring.png",
    subtitle: "효과는.. 귀엽습니다..!!",
    category: "키링 · 라이프스타일",
    tags: ["당고 키링", "가방 소품", "현장 수령"],
    composition: "키링 1개",
    description: "하얀 고양이 세 마리를 당고 모양으로 이은 키링.",
    story: [
      "행운도 좋지만, 행복하셨으면 좋겠네요. 맛있는 당고와 귀여운 키링이면, 그게 행복이죠!!",
      "가방이나 열쇠에 달아 두고, 문득 눈이 마주칠 때 한 번 웃어 주세요. 고양이는 셋이지만, 데려가는 건 키링 한 개랍니다..!!",
    ],
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
