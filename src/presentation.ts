import { projects } from "./catalog"
import {
  validateSnapshot,
  snapshotHash,
  purchaseIssue,
  type QrSnapshot,
} from "./qrSnapshot"

const SESSION_KEY = "curit-presentation-session-v1"
const ORDERS_KEY = "curit-presentation-orders-v1"
type PresentationSession = {
  phone: string
  expiresAt: number
}
type PresentationOrder = {
  v: 1
  id: string
  status: "paid"
  simulated: true
  owner: string
  artworkId: string
  quantity: number
  amount: number
  paymentMethod: string
  pickupMode: "immediate" | "exhibition"
  cafeName: string
  cafePhone: string
  pickupDate: string
  snapshot?: QrSnapshot
  storeId?: string
  requestId?: string
  customerLabel?: string
}
function session(): PresentationSession | null {
  try {
    const stored =
      localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY)
    if (!stored) return null
    const value = JSON.parse(stored)
    if (
      typeof value.phone !== "string" ||
      !/^01[016789]\d{7,8}$/.test(value.phone) ||
      value.expiresAt <= Date.now()
    )
      return null
    return value
  } catch {
    return null
  }
}
function orders(): PresentationOrder[] {
  try {
    const value = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]")
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}
export async function presentationRequest(
  path: string,
  body?: Record<string, unknown>,
) {
  await new Promise((resolve) => setTimeout(resolve, 400))
  if (path === "/api/auth/session") {
    const current = session()
    return current
      ? { verified: true, phone: current.phone, simulated: true }
      : { verified: false }
  }
  if (path === "/api/auth/identity/start") {
    const phone = String(body?.phone || "")
    if (!/^01[016789]\d{7,8}$/.test(phone) || body?.consent !== true)
      throw new Error("휴대폰 번호와 동의 항목을 확인해 주세요.")
    const value = {
      phone,
      expiresAt: Date.now() + (body?.remember ? 30 : 1) * 86400000,
    }
    try {
      localStorage.removeItem(SESSION_KEY)
      sessionStorage.removeItem(SESSION_KEY)
      ;(body?.remember ? localStorage : sessionStorage).setItem(
        SESSION_KEY,
        JSON.stringify(value),
      )
    } catch {
      throw new Error(
        "브라우저의 저장 공간을 사용할 수 없어요. 저장 설정을 확인해 주세요.",
      )
    }
    return { verified: true, phone, simulated: true }
  }
  const current = session()
  if (!current) throw new Error("휴대폰 번호를 다시 확인해 주세요.")
  if (path === "/api/orders")
    return {
      orders: orders()
        .filter((order) => order.owner === current.phone)
        .map(({ owner, ...order }) => order)
        .reverse(),
    }
  if (path.startsWith("/api/orders/")) {
    const id = decodeURIComponent(path.slice("/api/orders/".length))
    const order = orders().find(
      (item) => item.id === id && item.owner === current.phone,
    )
    if (!order) throw new Error("주문 내역을 찾지 못했어요.")
    const { owner, ...result } = order
    return result
  }
  if (path === "/api/checkout") {
    const snapshot =
      body?.snapshot === undefined ? undefined : validateSnapshot(body.snapshot)
    const artworkId = String(body?.artworkId || "")
    const [projectId, goodsIndex] = artworkId.split("-").map(Number)
    const project = projects.find((item) => item.id === projectId)
    const item = snapshot?.product || project?.goods[goodsIndex]
    const quantity = Number(body?.quantity)
    if (
      !item ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > item.stock
    )
      throw new Error("주문 수량을 확인해 주세요.")
    const environment = (import.meta as ImportMeta & {
      env: Record<string, string | undefined>
    }).env
    const prefix = "VITE_ARTWORK_" + artworkId.replace(/-/g, "_") + "_"
    const mode = environment[prefix + "PICKUP_MODE"]
    const pickupMode =
      snapshot?.product.pickupMode ||
      (mode === "exhibition" || (!mode && projectId === 1)
        ? "exhibition"
        : "immediate")
    const pickupDate =
      snapshot?.product.exhibitionEnd ??
      (environment[prefix + "EXHIBITION_END"] ||
        environment.VITE_EXHIBITION_END ||
        "")
    const issue = purchaseIssue(
      snapshot || null,
      item.stock,
      quantity,
      pickupMode,
      pickupDate,
    )
    if (issue) throw new Error(issue)
    if (snapshot && artworkId !== snapshot.product.artworkId)
      throw new Error("주문할 상품 정보가 일치하지 않아요.")
    if (!Number.isSafeInteger(item.price * quantity))
      throw new Error("주문 금액을 확인해 주세요.")
    const order: PresentationOrder = {
      v: 1,
      id: "QR-" + crypto.randomUUID(),
      status: "paid",
      simulated: true,
      owner: current.phone,
      artworkId,
      quantity,
      amount: item.price * quantity,
      paymentMethod:
        body?.paymentMethod === "card"
          ? String(body.cardIssuer) +
            "카드 · " +
            (body.installment === "0" ? "일시불" : body.installment + "개월")
          : body?.paymentMethod === "kakaopay"
            ? "카카오페이"
            : "토스페이",
      pickupMode,
      cafeName:
        snapshot?.store.name ??
        (environment[prefix + "CAFE_NAME"] ||
          environment.VITE_CAFE_NAME ||
          "큐리티 카페"),
      cafePhone:
        snapshot?.store.phone ??
        (environment[prefix + "CAFE_PHONE"] ||
          environment.VITE_CAFE_PHONE ||
          ""),
      pickupDate,
      snapshot,
      storeId: snapshot?.storeId,
      requestId: snapshot?.requestId,
      customerLabel:
        String(body?.name || "")
          .trim()
          .slice(0, 40) || "QR 구매 고객",
    }
    try {
      localStorage.setItem(ORDERS_KEY, JSON.stringify([...orders(), order]))
    } catch {
      throw new Error(
        "주문 내역을 저장할 공간이 부족해요. 브라우저 저장 공간을 확인해 주세요.",
      )
    }
    const destination = new URL("/", window.location.origin)
    destination.searchParams.set("artwork", artworkId)
    destination.searchParams.set("order", order.id)
    destination.hash = snapshotHash(snapshot || null)
    return { checkoutUrl: destination.href, simulated: true }
  }
  throw new Error("요청을 처리하지 못했어요. 다시 시도해 주세요.")
}
