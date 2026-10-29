export type QrSnapshot = {
  v: 1
  qrToken?: string
  storeId: string
  requestId: string
  returnUrl: string
  saleStatus: "preparing" | "active"
  store: {
    name: string
    phone: string
    address: string
    hours: string
  }
  project?: {
    title: string
    concept: string
  }
  creator?: {
    name: string
    handle: string
    introduction: string
    description: string
    categories: string[]
    regions: string[]
  }
  product: {
    artworkId: string
    projectId?: number
    goodsIndex?: number
    name: string
    artist: string
    price: number
    stock: number
    image: string
    description: string
    composition: string
    care: string
    pickupMode: "immediate" | "exhibition"
    exhibitionEnd: string
  }
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error(
      "구매 링크의 상품 정보를 확인할 수 없어요. 매장에서 QR을 다시 받아 주세요.",
    )
  return value as Record<string, unknown>
}
function strings(value: Record<string, unknown>, keys: string[]) {
  if (keys.some((key) => typeof value[key] !== "string"))
    throw new Error(
      "구매 링크에 필요한 정보가 누락되었어요. 매장에 문의해 주세요.",
    )
}
export function returnDestination(value: string) {
  const url = new URL(value)
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password
  )
    throw new Error("매장 앱의 주소가 올바르지 않아요.")
  return url
}
export function validateSnapshot(value: unknown): QrSnapshot {
  const snapshot = record(value)
  strings(snapshot, ["storeId", "requestId", "returnUrl"])
  if (
    snapshot.v !== 1 ||
    !snapshot.storeId ||
    !snapshot.requestId ||
    !["preparing", "active"].includes(String(snapshot.saleStatus))
  )
    throw new Error(
      "지원하지 않는 구매 링크예요. 매장에서 QR을 다시 받아 주세요.",
    )
  if (
    snapshot.qrToken !== undefined &&
    (typeof snapshot.qrToken !== "string" ||
      !/^[A-Za-z0-9_-]{12,128}$/.test(snapshot.qrToken))
  )
    throw new Error("QR 식별 정보를 확인할 수 없어요.")
  returnDestination(String(snapshot.returnUrl))
  const store = record(snapshot.store)
  strings(store, ["name", "phone", "address", "hours"])
  const product = record(snapshot.product)
  strings(product, [
    "artworkId",
    "name",
    "artist",
    "image",
    "description",
    "composition",
    "care",
    "exhibitionEnd",
  ])
  if (
    !product.artworkId ||
    !product.name ||
    !Number.isSafeInteger(product.price) ||
    Number(product.price) < 1 ||
    !Number.isSafeInteger(product.stock) ||
    Number(product.stock) < 0 ||
    !["immediate", "exhibition"].includes(String(product.pickupMode))
  )
    throw new Error("상품의 가격·재고·수령 정보를 확인할 수 없어요.")
  for (const key of ["projectId", "goodsIndex"])
    if (
      product[key] !== undefined &&
      (!Number.isSafeInteger(product[key]) || Number(product[key]) < 0)
    )
      throw new Error("상품 식별 정보를 확인해 주세요.")
  if (product.image) {
    const image = new URL(String(product.image), window.location.origin)
    if (
      !["http:", "https:"].includes(image.protocol) ||
      image.username ||
      image.password
    )
      throw new Error("상품 사진 주소가 올바르지 않아요.")
  }
  if (
    product.exhibitionEnd &&
    !/^\d{4}-\d{2}-\d{2}$/.test(String(product.exhibitionEnd))
  )
    throw new Error("전시 종료일 형식을 확인해 주세요.")
  if (
    product.exhibitionEnd &&
    new Date(String(product.exhibitionEnd)).toISOString().slice(0, 10) !==
      product.exhibitionEnd
  )
    throw new Error("전시 종료일이 올바르지 않아요.")
  if (snapshot.project !== undefined)
    strings(record(snapshot.project), ["title", "concept"])
  if (snapshot.creator !== undefined) {
    const creator = record(snapshot.creator)
    strings(creator, ["name", "handle", "introduction", "description"])
    for (const key of ["categories", "regions"])
      if (
        !Array.isArray(creator[key]) ||
        !(creator[key] as unknown[]).every((item) => typeof item === "string")
      )
        throw new Error("작가 정보를 확인할 수 없어요.")
  }
  return structuredClone(snapshot) as QrSnapshot
}
export function readSnapshotLink() {
  try {
    const params = new URLSearchParams(window.location.hash.slice(1))
    if (!params.has("curit")) return { snapshot: null, error: "" }
    const raw = params.get("curit")
    const snapshot = validateSnapshot(raw ? JSON.parse(raw) : null)
    const artwork = new URLSearchParams(window.location.search).get("artwork")
    if (artwork && artwork !== snapshot.product.artworkId)
      throw new Error("QR 주소와 상품 정보가 일치하지 않아요.")
    return { snapshot, error: "" }
  } catch (error) {
    return {
      snapshot: null,
      error:
        error instanceof Error ? error.message : "구매 링크를 확인해 주세요.",
    }
  }
}
export function snapshotHash(snapshot: QrSnapshot | null) {
  return snapshot
    ? "#curit=" + encodeURIComponent(JSON.stringify(snapshot))
    : ""
}
export function purchaseIssue(
  snapshot: QrSnapshot | null,
  stock: number,
  quantity: number,
  mode: string,
  end: string,
) {
  if (snapshot && snapshot.saleStatus !== "active")
    return "판매 준비 중인 작품입니다."
  if (stock < 1) return "품절된 작품입니다."
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > stock)
    return "남은 재고 내에서 수량을 선택해 주세요."
  if (mode === "exhibition" && !end)
    return "전시 종료일이 확인되면 주문할 수 있어요."
  return ""
}
export function orderReturnUrl(
  snapshot: QrSnapshot,
  order: {
    id: string
    artworkId: string
    quantity: number
    amount: number
    customerLabel?: string
    paymentMethod?: string
  },
) {
  if (
    order.artworkId !== snapshot.product.artworkId ||
    !Number.isSafeInteger(order.quantity) ||
    order.quantity < 1 ||
    order.quantity > snapshot.product.stock ||
    order.amount !== snapshot.product.price * order.quantity
  )
    throw new Error("저장된 주문과 상품 정보가 일치하지 않아요.")
  const returned = {
    v: 1,
    id: order.id,
    storeId: snapshot.storeId,
    requestId: snapshot.requestId,
    artworkId: snapshot.product.artworkId,
    quantity: order.quantity,
    amount: order.amount,
    status: "paid",
    customerLabel: order.customerLabel || "QR 구매 고객",
    paymentMethod: order.paymentMethod || "카드",
  }
  const target = returnDestination(snapshot.returnUrl)
  target.searchParams.set("curit-order", "1")
  target.hash = "curit-order=" + encodeURIComponent(JSON.stringify(returned))
  return target.href
}
