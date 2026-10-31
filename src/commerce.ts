import { presentationRequest } from "./presentation"
import { validateSnapshot, type QrSnapshot } from "./qrSnapshot"

const environment = (import.meta as ImportMeta & {
  env: Record<string, string | undefined>
}).env

const apiBaseUrl = (environment.VITE_API_BASE_URL || "").replace(/\/$/, "")
const apiFunctionRegion =
  environment.VITE_SUPABASE_FUNCTION_REGION || "ap-northeast-2"
const gatewayToken = environment.VITE_SUPABASE_ANON_KEY || ""
const ACCESS_TOKEN_KEY = "curit.qr.access-token.v1"
const VISITOR_ID_KEY = "curit.qr.visitor-id.v1"

function qrVisitorId() {
  const existing = localStorage.getItem(VISITOR_ID_KEY)
  if (existing && /^[A-Za-z0-9_-]{16,128}$/.test(existing)) return existing
  const created =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `visitor-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  localStorage.setItem(VISITOR_ID_KEY, created)
  return created
}

function accessToken() {
  return (
    sessionStorage.getItem(ACCESS_TOKEN_KEY) ||
    localStorage.getItem(ACCESS_TOKEN_KEY) ||
    ""
  )
}

export function clearCommerceSession() {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(ACCESS_TOKEN_KEY)
}

export const isPresentation = environment.VITE_PRESENTATION_MODE === "true"

function commerceUrl(path: string) {
  const target = apiBaseUrl + path
  if (!apiBaseUrl.includes(".supabase.co") || !apiFunctionRegion) return target
  const url = new URL(target)
  url.searchParams.set("forceFunctionRegion", apiFunctionRegion)
  return url.toString()
}

export type PaidOrder = {
  v?: 1
  id: string
  status: "paid"
  artworkId: string
  quantity: number
  amount: number
  paymentMethod: string
  simulated?: boolean
  pickupMode?: "immediate" | "exhibition"
  pickupDate?: string
  cafeName?: string
  cafePhone?: string
  snapshot?: QrSnapshot
  storeId?: string
  requestId?: string
  customerLabel?: string
}

export class CommerceError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
  }
}

export class PaymentWindowCancelledError extends Error {
  constructor(public readonly orderId: string) {
    super("결제를 취소했어요. 다시 시도해 주세요.")
    this.name = "PaymentWindowCancelledError"
  }
}

export type TossCheckout = {
  provider: "toss"
  clientKey: string
  customerKey: string
  orderId: string
  amount: number
  orderName: string
  customerName: string
  successUrl: string
  failUrl: string
}

function readTossCheckout(value: unknown): TossCheckout {
  if (!value || typeof value !== "object")
    throw new Error("결제 정보를 확인하지 못했어요.")
  const payment = value as Record<string, unknown>
  const textFields = [
    "clientKey",
    "orderId",
    "orderName",
    "successUrl",
    "failUrl",
  ] as const
  if (
    payment.provider !== "toss" ||
    !textFields.every(
      (key) => typeof payment[key] === "string" && Boolean(payment[key]),
    ) ||
    !Number.isSafeInteger(payment.amount) ||
    Number(payment.amount) < 1
  )
    throw new Error("결제 정보를 확인하지 못했어요.")
  return {
    provider: "toss",
    clientKey: String(payment.clientKey),
    customerKey:
      typeof payment.customerKey === "string"
        ? payment.customerKey
        : "ANONYMOUS",
    orderId: String(payment.orderId),
    amount: Number(payment.amount),
    orderName: String(payment.orderName),
    customerName:
      typeof payment.customerName === "string" ? payment.customerName : "",
    successUrl: String(payment.successUrl),
    failUrl: String(payment.failUrl),
  }
}

export async function requestTossPayment(
  value: unknown,
  method: "card" | "kakaopay" | "tosspay",
  phone: string,
) {
  const checkout = readTossCheckout(value)
  const { ANONYMOUS, loadTossPayments } = await import(
    "@tosspayments/tosspayments-sdk"
  )
  const tossPayments = await loadTossPayments(checkout.clientKey)
  const customerKey =
    checkout.customerKey === "ANONYMOUS" ? ANONYMOUS : checkout.customerKey

  // Toss Payments' public documentation key is a Payment Widget key
  // (`test_gck_*`). Widget keys must use the widgets API while merchant
  // payment-window keys (`test_ck_*`) use payment(). Keep both paths so the
  // demo can run with the official widget sandbox today and switch to the
  // merchant's own API key without another UI change later.
  if (checkout.clientKey.startsWith("test_gck_")) {
    const widgets = tossPayments.widgets({ customerKey })
    const amount = { currency: "KRW" as const, value: checkout.amount }
    await widgets.setAmount(amount)
    const paymentWindow = await widgets.renderPaymentWindow({
      orderName: checkout.orderName,
      variantKey: {
        paymentMethod: "DEFAULT",
        agreement: "AGREEMENT",
      },
    })
    await new Promise<void>((resolve, reject) => {
      let finished = false
      paymentWindow.on("paymentRequest", async () => {
        if (finished) return
        finished = true
        try {
          await widgets.requestPayment({
            orderId: checkout.orderId,
            orderName: checkout.orderName,
            customerName: checkout.customerName,
            customerMobilePhone: phone,
            successUrl: checkout.successUrl,
            failUrl: checkout.failUrl,
            windowTarget: "self",
          })
          resolve()
        } catch (error) {
          await paymentWindow.destroy().catch(() => undefined)
          reject(error)
        }
      })
      paymentWindow.on("cancel", async () => {
        if (finished) return
        finished = true
        reject(new PaymentWindowCancelledError(checkout.orderId))
      })
    })
    return
  }

  const payment = tossPayments.payment({
    customerKey,
  })
  const easyPay =
    method === "kakaopay"
      ? "카카오페이"
      : method === "tosspay"
        ? "토스페이"
        : null
  await payment.requestPayment({
    method: "CARD",
    amount: { currency: "KRW", value: checkout.amount },
    orderId: checkout.orderId,
    orderName: checkout.orderName,
    customerName: checkout.customerName,
    customerMobilePhone: phone,
    successUrl: checkout.successUrl,
    failUrl: checkout.failUrl,
    windowTarget: "self",
    card: easyPay ? { flowMode: "DIRECT", easyPay } : { flowMode: "DEFAULT" },
  })
}

export function readPaidOrder(value: unknown): PaidOrder {
  if (!value || typeof value !== "object")
    throw new Error("주문 내역을 확인하지 못했어요.")
  const order = value as Record<string, unknown>
  if (
    order.status !== "paid" ||
    typeof order.id !== "string" ||
    !order.id ||
    typeof order.artworkId !== "string" ||
    !Number.isInteger(order.quantity) ||
    Number(order.quantity) < 1 ||
    typeof order.amount !== "number" ||
    !Number.isFinite(order.amount) ||
    order.amount <= 0 ||
    typeof order.paymentMethod !== "string"
  ) {
    throw new Error(
      "결제 완료를 확인하지 못했어요. 주문 내역에서 상태를 확인하거나 매장에 문의해 주세요.",
    )
  }
  const snapshot =
    order.snapshot === undefined ? undefined : validateSnapshot(order.snapshot)
  if (
    snapshot &&
    (order.storeId !== snapshot.storeId ||
      order.requestId !== snapshot.requestId ||
      order.artworkId !== snapshot.product.artworkId ||
      order.amount !== snapshot.product.price * Number(order.quantity) ||
      Number(order.quantity) > snapshot.product.stock)
  )
    throw new Error("저장된 주문 정보가 일치하지 않아요.")
  return {
    v: order.v === 1 ? 1 : undefined,
    id: order.id,
    status: "paid",
    artworkId: order.artworkId,
    quantity: Number(order.quantity),
    amount: order.amount,
    paymentMethod: order.paymentMethod,
    snapshot,
    storeId: snapshot?.storeId,
    requestId: snapshot?.requestId,
    customerLabel:
      typeof order.customerLabel === "string" ? order.customerLabel : undefined,
    simulated: order.simulated === true,
    pickupMode:
      order.pickupMode === "exhibition"
        ? "exhibition"
        : order.pickupMode === "immediate"
          ? "immediate"
          : undefined,
    pickupDate:
      typeof order.pickupDate === "string" ? order.pickupDate : undefined,
    cafeName: typeof order.cafeName === "string" ? order.cafeName : undefined,
    cafePhone:
      typeof order.cafePhone === "string" ? order.cafePhone : undefined,
  }
}

export async function commerceRequest(
  path: string,
  body?: Record<string, unknown>,
) {
  if (isPresentation) return presentationRequest(path, body)
  const sessionToken = accessToken()
  let response: Response
  try {
    response = await fetch(commerceUrl(path), {
      method: body ? "POST" : "GET",
      credentials: "include",
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(gatewayToken
          ? {
              apikey: gatewayToken,
              Authorization: `Bearer ${gatewayToken}`,
            }
          : sessionToken
            ? { Authorization: `Bearer ${sessionToken}` }
            : {}),
        ...(sessionToken ? { "x-curit-session": sessionToken } : {}),
        ...(path.startsWith("/api/v1/qr/")
          ? { "x-curit-visitor-id": qrVisitorId() }
          : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(20000),
      cache: "no-store",
    })
  } catch {
    throw new Error("연결이 원활하지 않아요. 잠시 후 다시 시도해 주세요.")
  }
  if (!response.headers.get("content-type")?.includes("application/json")) {
    throw new Error(
      "현재 주문 서비스를 연결 중입니다. 매장 직원에게 문의해 주세요.",
    )
  }
  const result = await response.json()
  if (!response.ok) {
    if (response.status === 401) clearCommerceSession()
    throw new CommerceError(
      typeof result?.message === "string"
        ? result.message
        : "요청을 처리하지 못했어요. 다시 시도해 주세요.",
      response.status,
    )
  }
  if (
    path === "/api/auth/identity/start" &&
    typeof result?.accessToken === "string"
  ) {
    clearCommerceSession()
    const target = body?.remember === true ? localStorage : sessionStorage
    target.setItem(ACCESS_TOKEN_KEY, result.accessToken)
  }
  return result
}

export async function loadQrListing(token: string) {
  const result = await commerceRequest(
    "/api/v1/qr/" + encodeURIComponent(token),
  )
  return validateSnapshot(result)
}

export function checkoutDestination(value: unknown) {
  if (typeof value !== "string")
    throw new Error("결제창을 열지 못했어요. 다시 시도해 주세요.")
  const destination = new URL(value, window.location.origin)
  const allowed = ["tosspayments.com", "toss.im", "kakaopay.com", "kakao.com"]
  if (
    destination.origin !== window.location.origin &&
    (destination.protocol !== "https:" ||
      !allowed.some(
        (host) =>
          destination.hostname === host ||
          destination.hostname.endsWith("." + host),
      ))
  ) {
    throw new Error(
      "결제 주소를 확인하지 못했어요. 매장 직원에게 문의해 주세요.",
    )
  }
  return destination.href
}

export const pickup = {
  cafe: environment.VITE_CAFE_NAME || "큐리티 카페",
  phone: environment.VITE_CAFE_PHONE || "",
  exhibitionEnd: environment.VITE_EXHIBITION_END || "",
}

export function pickupForArtwork(artworkId: string) {
  const prefix = "VITE_ARTWORK_" + artworkId.replace(/-/g, "_") + "_"
  const configuredMode = environment[prefix + "PICKUP_MODE"]
  return {
    cafe: environment[prefix + "CAFE_NAME"] || pickup.cafe,
    phone: environment[prefix + "CAFE_PHONE"] || pickup.phone,
    exhibitionEnd:
      environment[prefix + "EXHIBITION_END"] || pickup.exhibitionEnd,
    mode:
      configuredMode === "exhibition" ||
      (!configuredMode && artworkId.startsWith("1-"))
        ? "exhibition" as const
        : "immediate" as const,
  }
}

export const artistStories: Record<number, {
  beginning: string
  concept: string
}> = {
  0: {
    beginning:
      "제주에 내려와 처음 흙을 만지던 날, 손바닥에 남은 감촉이 오래 마음에 머물렀습니다. 돌과 바람, 계절의 색을 그릇에 담고 싶었어요. 그렇게 매일 흙을 빚는 일이 제 일상이 되었습니다.",
    concept:
      "손으로 빚은 그릇에는 저마다 다른 결이 남습니다. 조금씩 다른 모양과 유약의 흐름도 이 작업의 일부예요. 카페에서 마시던 따뜻한 한 잔처럼, 당신의 식탁에서도 오래 곁에 머무는 그릇이 되기를 바랍니다.",
  },
  1: {
    beginning:
      "아직 가게 문이 열리기 전, 새벽의 을지로를 걷는 일이 좋았습니다. 낮에는 지나쳤던 벽의 질감과 골목의 빛이 그 시간에는 선명하게 보였어요. 그 짧은 순간을 붙잡기 위해 판화를 시작했습니다.",
    concept:
      "빛이 닿는 자리와 그림자가 머무는 자리를 흑백의 선으로 새깁니다. 같은 판에서도 찍어내는 순간마다 미세한 차이가 생겨요. 바쁜 하루 사이, 잠시 시선을 쉬게 하는 풍경으로 남았으면 합니다.",
  },
  2: {
    beginning:
      "산책길에서 만난 이끼와 작은 잎들을 천 위에 옮기고 싶었습니다. 자세히 보아야 발견하는 초록을 한 땀씩 수놓으며, 공간 한켠에 작은 숲이 생기기를 바랐어요.",
    concept:
      "린넨의 자연스러운 결 위에 식물의 모양과 색을 더합니다. 손끝에 닿는 부드러움, 의자 위에 놓였을 때의 편안함을 함께 생각하며 만들어요. 익숙한 공간에 조용한 생기를 더하는 작업입니다.",
  },
  3: {
    beginning:
      "흙을 빚을 때 남는 손자국이 좋았습니다. 반듯하게 다듬기보다 그 흔적을 남겨 두면, 그릇이 조금 더 편안하게 느껴졌어요. 완벽하지 않아도 오래 곁에 두고 싶은 물건을 만들고 있습니다.",
    concept:
      "테라코타의 따뜻한 색과 손으로 빚은 단순한 형태를 좋아합니다. 매일 쓰는 작은 그릇일수록 손에 잡히는 느낌을 오래 살펴요. 손자국과 작은 굴곡이 당신의 일상에서도 자연스러운 온기가 되었으면 합니다.",
  },
}
