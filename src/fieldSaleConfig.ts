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
  "octopus-keyring": {
    name: "양면 문어 키링",
    image: "octopus-keyring.jpg",
    subtitle: "오늘 기분은.. 뒤집어 보세요!",
    category: "키링 · 라이프스타일",
    tags: ["양면 문어", "가방 소품", "현장 수령"],
    composition: "문어 키링 1개",
    description: "뒤집으면 다른 표정이 나타나는 작은 문어 키링.",
    story: [
      "방긋 웃는 날도, 살짝 심술나는 날도 있잖아요. 오늘 기분에 맞는 얼굴로 뒤집어 가방에 달아 주세요.",
      "작은 문어 한 마리로 전하는 오늘의 기분! 색상과 양면 조합은 매장에 놓인 실물을 보고 골라 주세요.",
    ],
  },
  "poetry-postcards": {
    name: "나태주 시 엽서",
    image: "poetry-postcards.jpg",
    subtitle: "하고 싶던 말, 한 장에 담아서.",
    category: "엽서 · 문구",
    tags: ["나태주", "시 엽서", "현장 수령"],
    composition: "판매 단위와 구성은 매장에서 확인",
    description: "나태주 시인의 시와 그림을 담은 엽서.",
    story: [
      "마음은 있는데 무슨 말을 적어야 할지 모르겠는 날. 마음에 닿는 엽서를 골라, 전하고 싶었던 한마디를 덧붙여 보세요.",
      "누군가에게 건네도, 내 책상 곁에 두어도 좋아요. 엽서 디자인과 판매 구성은 매장에서 실물로 확인해 주세요.",
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
  const products = { ...config.products }
  for (const id of Object.keys(fieldProducts) as FieldProductId[]) {
    const product = products[id] ?? { price: null, quantity: null }
    if (
      !product ||
      (product.price !== null &&
        (!Number.isSafeInteger(product.price) || product.price <= 0)) ||
      (product.quantity !== null &&
        (!Number.isSafeInteger(product.quantity) || product.quantity < 0))
    ) {
      throw new Error("상품의 가격과 판매 수량을 확인하지 못했어요.")
    }
    products[id] = product
  }
  return { ...config, products }
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
