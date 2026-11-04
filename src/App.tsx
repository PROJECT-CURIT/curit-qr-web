import { useCallback, useEffect, useRef, useState } from "react"
import { projects, productDetails } from "./catalog"
import {
  artistStories,
  checkoutDestination,
  commerceRequest,
  loadQrPurchaseIntentCount,
  loadQrListing,
  paymentFailureFromSearch,
  pickupForArtwork,
  readOrderReceipt,
  requestTossPayment,
  recordQrPurchaseIntent,
  CommerceError,
  PaymentWindowCancelledError,
  isPresentation,
  type OrderReceipt,
} from "./commerce"
import GuestAccess from "./GuestAccess"
import GuestOrders from "./GuestOrders"
import Modal from "./Modal"
import {
  MAX_ORDER_QUANTITY,
  purchaseIssue,
  type QrSnapshot,
} from "./qrSnapshot"
import { hasQrAddress, qrPath, readQrToken } from "./qrToken"

const money = (value: number) => value.toLocaleString("ko-KR") + "원"
const catalog = projects.flatMap((project) =>
  project.goods.map((item, index) => ({
    ...item,
    id: `${project.id}-${index}`,
    project,
  })),
)
type IconProps = {
  name: string
  size?: number
}

type CheckoutAttempt = {
  id: string
  details: string
}

export function Icon({ name, size = 20 }: IconProps) {
  const paths: Record<string, string> = {
    back: "M15 5l-7 7 7 7",
    receipt: "M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 4h6M9 11h6M9 15h3",
    gallery: "M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7Z",
    arrow: "M5 12h14m-6-6 6 6-6 6",
    share: "M12 16V3m-4 4 4-4 4 4M5 12v8h14v-8",
    check: "M5 12l4 4L19 6",
    phone:
      "M5 3h4l2 5-3 2a15 15 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2C9 21 3 15 3 5a2 2 0 0 1 2-2Z",
    box: "m3 7 9-4 9 4v10l-9 4-9-4V7l9 4 9-4M12 11v10M7 5l9 4",
    shield: "M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Zm-4 9 3 3 5-6",
    close: "M6 6l12 12M18 6 6 18",
    down: "m6 9 6 6 6-6",
    leaf: "M20 4C9 2 3 9 7 16s15 0 13-12ZM5 21l10-11",
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.arrow} />
    </svg>
  )
}

export default function App() {
  const [qrToken, setQrToken] = useState(readQrToken)
  const [snapshot, setSnapshot] = useState<QrSnapshot | null>(null)
  const [listingStatus, setListingStatus] =
    useState<"idle" | "loading" | "ready" | "error">(
      qrToken ? "loading" : "idle",
    )
  const [listingError, setListingError] = useState("")
  const [listingAttempt, setListingAttempt] = useState(0)
  const initialId =
    new URLSearchParams(window.location.search).get("artwork") || "0-0"
  const [productId, setProductId] = useState(initialId)
  const product = snapshot
    ? {
        id: snapshot.product.artworkId,
        name: snapshot.product.name,
        price: snapshot.product.price,
        stock: snapshot.product.stock,
        img: snapshot.product.image,
        project: {
          ...projects[0],
          id: snapshot.product.projectId,
          title: snapshot.project?.title || "",
          artist: snapshot.product.artist,
          handle: snapshot.creator?.handle || "",
          location: snapshot.creator?.regions.join(" · ") || "",
          desc: snapshot.product.description,
          tags: snapshot.creator?.categories || [],
          dna: { ...projects[0].dna, materials: [] },
          installNote: snapshot.product.care,
        },
      }
    : catalog.find((item) => item.id === productId)
  const [stage, setStage] =
    useState<"detail" | "checkout" | "complete" | "confirming">("detail")
  const [quantity, setQuantity] = useState(1)
  const [tab, setTab] = useState("작품 이야기")
  const [agreed, setAgreed] = useState(false)
  const [buyerName, setBuyerName] = useState("")
  const [busy, setBusy] = useState(false)
  const [checkoutReview, setCheckoutReview] = useState<{ name: string } | null>(
    null,
  )
  const [toast, setToast] = useState<{ message: string } | null>(null)
  const showToast = (message: string) => setToast({ message })
  const [confirmedOrder, setConfirmedOrder] = useState<OrderReceipt | null>(
    null,
  )
  const [phone, setPhone] = useState("")
  const [verifiedPhone, setVerifiedPhone] = useState("")
  const [paymentError, setPaymentError] = useState("")
  const confirmationStarted = useRef(false)
  const checkoutStarted = useRef(false)
  const checkoutAttempt = useRef<CheckoutAttempt | null>(null)
  const abandonedOrder = useRef("")
  const [confirmationAttempt, setConfirmationAttempt] = useState(0)
  const [gallery, setGallery] = useState(false)
  const [sessionStatus, setSessionStatus] =
    useState<"loading" | "guest" | "verified">("loading")
  const [sessionError, setSessionError] = useState("")
  const [ordersOpen, setOrdersOpen] = useState(false)
  const [purchaseIntentCount, setPurchaseIntentCount] = useState<number | null>(
    null,
  )
  const [accessIntent, setAccessIntent] =
    useState<"checkout" | "orders" | null>(null)
  useEffect(() => {
    if (!qrToken) {
      setListingStatus("idle")
      setListingError("")
      return
    }

    let active = true
    setListingStatus("loading")
    setListingError("")
    loadQrListing(qrToken)
      .then((loaded) => {
        if (!active) return
        setSnapshot(loaded)
        setProductId(loaded.product.artworkId)
        setListingStatus("ready")
      })
      .catch((error) => {
        if (!active) return
        setSnapshot(null)
        setListingStatus("error")
        setListingError(
          error instanceof Error
            ? error.message
            : "QR에 연결된 상품을 불러오지 못했어요.",
        )
      })
    return () => {
      active = false
    }
  }, [qrToken, listingAttempt])
  const expireSession = useCallback(
    (intent: "checkout" | "orders" = "checkout") => {
      confirmationStarted.current = false
      setSessionStatus("guest")
      setVerifiedPhone("")
      setPhone("")
      setOrdersOpen(false)
      setConfirmedOrder(null)
      setStage("detail")
      setCheckoutReview(null)
      setAgreed(false)
      setAccessIntent(intent)
      setSessionError(
        "연락처 유지 기간이 끝났어요. 휴대폰 번호를 다시 확인해 주세요.",
      )
    },
    [],
  )
  const expireOrdersSession = useCallback(
    () => expireSession("orders"),
    [expireSession],
  )
  const acceptSession = (authenticatedPhone: string) => {
    setPhone(authenticatedPhone)
    setVerifiedPhone(authenticatedPhone)
    setSessionError("")
    setSessionStatus("verified")
    window.scrollTo(0, 0)
  }
  useEffect(() => {
    if (sessionStatus !== "verified" || !accessIntent) return
    if (accessIntent === "checkout") setStage("checkout")
    if (accessIntent === "orders") setOrdersOpen(true)
    setAccessIntent(null)
  }, [sessionStatus, accessIntent])
  useEffect(() => {
    let active = true
    setSessionStatus("loading")
    setSessionError("")
    commerceRequest("/api/auth/session")
      .then((result) => {
        if (!active) return
        if (
          result?.verified === true &&
          typeof result.phone === "string" &&
          /^01[016789]\d{7,8}$/.test(result.phone)
        )
          acceptSession(result.phone)
        else setSessionStatus("guest")
      })
      .catch((error) => {
        if (!active) return
        if (!(error instanceof CommerceError && error.status === 401))
          setSessionError(
            error instanceof Error
              ? error.message
              : "연락처 정보를 확인하지 못했어요.",
          )
        setSessionStatus("guest")
      })
    return () => {
      active = false
    }
  }, [listingAttempt])
  useEffect(() => {
    const handlePop = () => {
      const nextToken = readQrToken()
      const nextArtwork =
        new URLSearchParams(window.location.search).get("artwork") || "0-0"
      if (nextToken === qrToken && (nextToken || nextArtwork === productId))
        return
      if (nextToken !== qrToken) {
        setQrToken(nextToken)
        setSnapshot(null)
      }
      setProductId(nextArtwork)
      setBuyerName("")
      setCheckoutReview(null)
      setAgreed(false)
      setPaymentError("")
      setStage("detail")
      setQuantity(1)
      setOrdersOpen(false)
    }
    window.addEventListener("popstate", handlePop)
    return () => window.removeEventListener("popstate", handlePop)
  }, [qrToken, productId])
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      if (import.meta.env.PROD)
        navigator.serviceWorker
          .register(`${import.meta.env.BASE_URL}sw.js`)
          .catch(() => {})
      else
        navigator.serviceWorker
          .getRegistrations()
          .then((registrations) =>
            Promise.all(
              registrations.map((registration) => registration.unregister()),
            ),
          )
          .catch(() => {})
    }
  }, [])
  useEffect(() => {
    if (toast) {
      const timeout = setTimeout(() => setToast(null), 4000)
      return () => clearTimeout(timeout)
    }
  }, [toast])
  useEffect(() => {
    setPurchaseIntentCount(null)
    if (stage !== "checkout" || !qrToken) return
    let active = true
    loadQrPurchaseIntentCount(qrToken)
      .then((count) => {
        if (active) setPurchaseIntentCount(count)
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [stage, qrToken])
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const paymentFailure = paymentFailureFromSearch(window.location.search)
    if (paymentFailure) {
      setStage("checkout")
      setPaymentError(paymentFailure.message)
      if (
        paymentFailure.orderId &&
        abandonedOrder.current !== paymentFailure.orderId
      ) {
        abandonedOrder.current = paymentFailure.orderId
        void commerceRequest(
          `/api/checkout/${encodeURIComponent(paymentFailure.orderId)}/abandon`,
          {},
        ).catch(() => undefined)
      }
      return
    }
    const order = params.get("order") || params.get("orderId")
    const paymentKey = params.get("paymentKey")
    const amount = Number(params.get("amount"))
    if (
      listingStatus === "error" ||
      sessionStatus !== "verified" ||
      !order ||
      confirmationStarted.current
    )
      return
    confirmationStarted.current = true
    setStage("confirming")
    setPaymentError("")
    setBusy(true)
    const confirmation =
      paymentKey && Number.isSafeInteger(amount) && amount > 0
        ? commerceRequest("/api/payments/confirm", {
            paymentKey,
            orderId: order,
            amount,
          })
        : commerceRequest(
            "/api/orders/" + encodeURIComponent(order) + "?includeCancelled=1",
          )
    confirmation
      .then((result) => {
        const confirmed = readOrderReceipt(result)
        if (
          snapshot &&
          (!confirmed.snapshot ||
            confirmed.storeId !== snapshot.storeId ||
            confirmed.requestId !== snapshot.requestId ||
            confirmed.artworkId !== snapshot.product.artworkId)
        )
          throw new Error(
            "이 구매 링크의 매장·상품과 주문 내역이 일치하지 않아요.",
          )
        if (
          !confirmed.snapshot &&
          !catalog.some((item) => item.id === confirmed.artworkId)
        )
          throw new Error("작품 정보를 찾지 못했어요. 매장에 문의해 주세요.")
        setSnapshot(confirmed.snapshot || null)
        setConfirmedOrder(confirmed)
        setBuyerName("")
        setProductId(confirmed.artworkId)
        setQuantity(confirmed.quantity)
        setStage("complete")
        if (paymentKey) {
          params.delete("paymentKey")
          params.delete("payment")
          params.delete("amount")
          params.delete("orderId")
          params.set("order", confirmed.id)
          window.history.replaceState(null, "", `?${params}`)
        }
        window.scrollTo(0, 0)
      })
      .catch((error) => {
        if (error instanceof CommerceError && error.status === 401) {
          confirmationStarted.current = false
          expireSession()
          return
        }
        setStage("confirming")
        setPaymentError(error.message)
      })
      .finally(() => setBusy(false))
  }, [
    sessionStatus,
    expireSession,
    confirmationAttempt,
    listingStatus,
    snapshot,
  ])
  const navigate = (next: typeof stage) => {
    const orderQr =
      stage === "complete" ? confirmedOrder?.snapshot?.qrToken : undefined
    if (next === "detail" && orderQr && orderQr !== qrToken) {
      window.location.assign(qrPath(orderQr))
      return
    }
    setStage(next)
    setOrdersOpen(false)
    setAgreed(false)
    setPaymentError("")
    if (next === "detail")
      window.history.replaceState(
        {},
        "",
        qrToken ? qrPath(qrToken) : "?artwork=" + encodeURIComponent(productId),
      )
    window.scrollTo({ top: 0, behavior: "instant" })
  }
  const openCheckout = () => {
    if (qrToken)
      void recordQrPurchaseIntent(qrToken)
        .then(setPurchaseIntentCount)
        .catch(() => undefined)
    if (sessionStatus === "verified") navigate("checkout")
    else {
      setAccessIntent("checkout")
      window.scrollTo(0, 0)
    }
  }
  const selectProduct = (id: string) => {
    if (snapshot) return
    if (productId !== id) setBuyerName("")
    setProductId(id)
    setQuantity(1)
    setGallery(false)
    setTab("작품 이야기")
    if (window.history.state?.curitDialog)
      window.history.replaceState(
        null,
        "",
        `?artwork=${encodeURIComponent(id)}`,
      )
    else
      window.history.pushState(null, "", `?artwork=${encodeURIComponent(id)}`)
    setStage("detail")
    setAgreed(false)
    setPaymentError("")
    window.scrollTo(0, 0)
  }
  const share = async () => {
    const base = new URL(import.meta.env.BASE_URL, window.location.origin)
    const url = qrToken
      ? window.location.origin + qrPath(qrToken)
      : new URL(`?artwork=${encodeURIComponent(productId)}`, base).href
    try {
      if (navigator.share) await navigator.share({ title: product?.name, url })
      else {
        await navigator.clipboard.writeText(url)
        showToast("작품 링크를 복사했어요. QR에 이 주소를 사용하세요.")
      }
    } catch {
      showToast("공유가 취소되었거나 사용할 수 없어요.")
    }
  }
  if (
    !qrToken &&
    hasQrAddress(window.location.pathname, window.location.search)
  )
    return (
      <main className="not-found">
        <h1>구매 링크를 확인해 주세요</h1>
        <p>매장에 비치된 QR 코드를 다시 스캔해 주세요.</p>
      </main>
    )
  if (listingStatus === "loading")
    return (
      <main className="not-found">
        <div className="session-loading" role="status">
          <span className="loading-spinner" />
          작품 정보를 불러오고 있어요.
        </div>
      </main>
    )
  if (listingStatus === "error")
    return (
      <main className="not-found">
        <h1>구매 링크를 확인해 주세요</h1>
        <p role="alert">{listingError}</p>
        <button
          className="primary"
          type="button"
          onClick={() => setListingAttempt((attempt) => attempt + 1)}
        >
          다시 시도
        </button>
      </main>
    )
  if (accessIntent)
    return (
      <GuestAccess
        loading={sessionStatus === "loading"}
        serviceError={sessionError}
        onVerified={acceptSession}
        onBack={() => setAccessIntent(null)}
      />
    )
  if (!product)
    return (
      <main className="not-found">
        <h1>작품을 찾을 수 없어요</h1>
        <p>QR 주소를 다시 확인해 주세요.</p>
        <button className="primary" onClick={() => selectProduct("0-0")}>
          작품 보기
        </button>
      </main>
    )
  const total = product.price * quantity
  const artworkPickup = snapshot
    ? {
        cafe: snapshot.store.name,
        phone: snapshot.store.phone,
        exhibitionEnd: snapshot.product.exhibitionEnd,
        mode: snapshot.product.pickupMode,
      }
    : pickupForArtwork(product.id)
  const pickup =
    stage === "complete" && confirmedOrder
      ? {
          cafe:
            (confirmedOrder.cafeName === "전시 카페"
              ? artworkPickup.cafe
              : confirmedOrder.cafeName) || artworkPickup.cafe,
          phone: confirmedOrder.cafePhone || artworkPickup.phone,
          exhibitionEnd:
            confirmedOrder.pickupDate || artworkPickup.exhibitionEnd,
          mode: confirmedOrder.pickupMode || artworkPickup.mode,
        }
      : artworkPickup
  const isExhibition = pickup.mode === "exhibition"
  const story = snapshot ? undefined : artistStories[product.project.id ?? -1]
  const detail = snapshot
    ? {
        description: snapshot.product.description,
        composition: snapshot.product.composition,
        care: snapshot.product.care,
        tags: snapshot.creator?.categories || [],
        beginning: "",
        concept: snapshot.project?.concept || "",
        quote: "",
      }
    : productDetails[product.id]
  const issue = purchaseIssue(
    snapshot,
    product.stock,
    quantity,
    artworkPickup.mode,
    artworkPickup.exhibitionEnd,
  )
  const activeTab =
    snapshot &&
    tab === "작품 이야기" &&
    !snapshot.project?.concept &&
    !snapshot.product.description
      ? "상품 정보"
      : tab
  const cancelled = confirmedOrder?.status === "cancelled"
  const pickupText = isExhibition
    ? "전시 종료 후 현장 수령"
    : "결제 후 현장 수령"
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy || !agreed) return
    if (issue) {
      setPaymentError(issue)
      return
    }
    setPaymentError("")
    if (!verifiedPhone || verifiedPhone !== phone) {
      setPaymentError("주문 안내를 위해 휴대폰 번호 확인을 완료해 주세요.")
      expireSession()
      return
    }
    if (!navigator.onLine && !isPresentation) {
      setPaymentError("인터넷 연결을 확인해 주세요.")
      return
    }
    const name = buyerName.trim()
    if (!name || name.length > 40 || /[\u0000-\u001f\u007f]/.test(name)) {
      setPaymentError("주문자 이름을 1~40자로 입력해 주세요.")
      return
    }
    if (isPresentation) {
      setCheckoutReview({ name })
      return
    }
    await beginCheckout(name)
  }
  const beginCheckout = async (name: string) => {
    if (busy || checkoutStarted.current) return
    if (issue) {
      setPaymentError(issue)
      return
    }
    checkoutStarted.current = true
    setBusy(true)
    try {
      const token = snapshot?.qrToken || qrToken || undefined
      const details = JSON.stringify([token, product.id, quantity, name, phone])
      if (checkoutAttempt.current?.details !== details)
        checkoutAttempt.current = { id: crypto.randomUUID(), details }
      const result = await commerceRequest("/api/checkout", {
        attemptId: checkoutAttempt.current.id,
        artworkId: product.id,
        qrToken: token,
        quantity,
        name,
        phone,
        fulfillment: "pickup",
        paymentMethod: "card",
        returnUrl: qrToken
          ? window.location.origin + qrPath(qrToken)
          : new URL(
              `?artwork=${encodeURIComponent(product.id)}`,
              new URL(import.meta.env.BASE_URL, window.location.origin),
            ).href,
      })
      if (result?.payment) {
        await requestTossPayment(result.payment, "card", phone)
      } else {
        window.location.assign(checkoutDestination(result.checkoutUrl))
      }
    } catch (error) {
      if (error instanceof PaymentWindowCancelledError) {
        checkoutAttempt.current = null
        await commerceRequest(
          `/api/checkout/${encodeURIComponent(error.orderId)}/abandon`,
          {},
        ).catch(() => undefined)
        setPaymentError(error.message)
      } else if (error instanceof CommerceError && error.status === 401)
        expireSession()
      else
        setPaymentError(
          error instanceof Error ? error.message : "결제를 시작하지 못했어요.",
        )
      setBusy(false)
      checkoutStarted.current = false
    }
  }

  return (
    <div className={`app app-${ordersOpen ? "orders" : stage}`}>
      <header className="header app-navigation">
        {(stage !== "detail" || ordersOpen) && (
          <button
            className="icon-button header-back"
            disabled={busy}
            aria-label={
              ordersOpen ? "이전 화면으로 돌아가기" : "작품으로 돌아가기"
            }
            onClick={() =>
              ordersOpen ? setOrdersOpen(false) : navigate("detail")
            }
          >
            <Icon name="back" />
          </button>
        )}
        <button
          className="wordmark"
          disabled={busy}
          onClick={() => navigate("detail")}
          aria-label="CURI:T 큐릿 작품 상세"
        >
          <span className="brand-logo" aria-hidden="true">
            CURI:T
          </span>
        </button>
        <button
          className="order-history-link"
          disabled={busy}
          onClick={() => {
            if (sessionStatus === "verified") setOrdersOpen(true)
            else setAccessIntent("orders")
            window.scrollTo(0, 0)
          }}
          aria-label="나의 주문 내역"
          aria-current={ordersOpen ? "page" : undefined}
        >
          <Icon name="receipt" size={18} />
          <span>주문 내역</span>
        </button>
      </header>
      {!ordersOpen && stage === "checkout" && (
        <div className="page-heading">
          <span>주문 · 결제</span>
        </div>
      )}
      {ordersOpen && (
        <GuestOrders
          phone={verifiedPhone}
          onExpired={expireOrdersSession}
          onOpen={(order) => {
            if (
              !order.snapshot &&
              !catalog.some((item) => item.id === order.artworkId)
            ) {
              showToast("작품 정보를 찾지 못했어요. 매장에 문의해 주세요.")
              return
            }
            confirmationStarted.current = true
            setConfirmedOrder(order)
            setSnapshot(order.snapshot || null)
            setProductId(order.artworkId)
            setQuantity(order.quantity)
            setOrdersOpen(false)
            setStage("complete")
            window.history.replaceState(
              {},
              "",
              `${import.meta.env.BASE_URL}?order=${encodeURIComponent(order.id)}`,
            )
            window.scrollTo(0, 0)
          }}
        />
      )}
      {!ordersOpen && stage === "detail" && (
        <main>
          {snapshot && Number.isSafeInteger(snapshot.viewCount) && (
            <div className="interest-strip" role="status">
              <span className="interest-dot" aria-hidden="true" />이 소품을
              지금까지{" "}
              <strong>{snapshot.viewCount!.toLocaleString("ko-KR")}분</strong>이
              관심 있게 살펴보셨어요!
            </div>
          )}
          <div className="detail-grid">
            <div className="visual">
              {product.img && (
                <img
                  className="hero-image"
                  src={product.img}
                  alt={`${product.name} — ${product.project.artist}의 작품`}
                />
              )}
              {!snapshot && (
                <button
                  className="hero-back icon-button"
                  aria-label="다른 작품 보기"
                  onClick={() => setGallery(true)}
                >
                  <Icon name="gallery" />
                </button>
              )}
              <div className="hero-copy">
                <span className="hero-badge">
                  {snapshot?.saleEnded
                    ? "판매 종료"
                    : snapshot?.saleStatus === "preparing"
                      ? "판매 준비 중"
                      : product.stock === 0
                        ? "품절"
                        : "전시·판매 중"}
                </span>
                <h1>{product.name}</h1>
                {(detail?.description || product.project.desc) && (
                  <p>{detail?.description || product.project.desc}</p>
                )}
              </div>
            </div>
            <div className="product-intro">
              <div className="eyebrow">
                <span>
                  {snapshot
                    ? snapshot.creator?.categories.join(" · ")
                    : product.project.id === 1
                      ? "판화"
                      : product.project.id === 2
                        ? "패브릭"
                        : "도예"}
                  {!snapshot && " · 아트 & 라이프"}
                </span>
                <button
                  className="icon-button"
                  aria-label="작품 링크 공유"
                  onClick={share}
                >
                  <Icon name="share" size={19} />
                </button>
              </div>
              <button
                className="artist-line"
                aria-label={`${product.project.artist} 작가 정보로 이동`}
                onClick={() =>
                  document
                    .getElementById("artist")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                <span className="avatar">
                  {product.project.artist.slice(0, 1)}
                </span>
                <span>
                  <strong>{product.project.artist}</strong>
                  {(product.project.handle ||
                    (!snapshot && product.project.location)) && (
                    <small>
                      {[
                        product.project.handle,
                        snapshot
                          ? snapshot.creator?.regions.join(" · ")
                          : product.project.location,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </small>
                  )}
                </span>
                <Icon name="arrow" size={17} />
              </button>
              <div className="price-row">
                <strong>{money(product.price)}</strong>
                <span className="stock-badge">
                  {snapshot?.saleEnded
                    ? "판매 종료"
                    : snapshot?.saleStatus === "preparing"
                      ? "판매 준비 중"
                      : product.stock < 1
                        ? "품절"
                        : "구매 가능"}
                </span>
              </div>
              <div className="tags">
                {(detail?.tags || product.project.tags).map((tag) => (
                  <span key={tag}>#{tag}</span>
                ))}
              </div>
              <div className="delivery-note">
                <Icon name="box" />
                <div>
                  <strong>작가의 손에서, 당신의 일상으로</strong>
                  <p>
                    {pickupText} · {pickup.cafe}
                  </p>
                </div>
              </div>
              <div className="quantity-line">
                <span>
                  구매 수량 <small>남은 수량 {product.stock}개</small>
                </span>
                <div className="stepper">
                  <button
                    aria-label="수량 줄이기"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity(quantity - 1)}
                  >
                    −
                  </button>
                  <output>{quantity}</output>
                  <button
                    aria-label="수량 늘리기"
                    disabled={
                      quantity >= Math.min(product.stock, MAX_ORDER_QUANTITY)
                    }
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="content-grid">
            <div>
              <nav className="tabs" aria-label="작품 정보">
                {[
                  ...(snapshot &&
                  !snapshot.project?.concept &&
                  !snapshot.product.description
                    ? []
                    : ["작품 이야기"]),
                  "상품 정보",
                  "수령 · 교환",
                ].map((label) => (
                  <button
                    key={label}
                    className={activeTab === label ? "active" : ""}
                    onClick={() => setTab(label)}
                  >
                    {label}
                  </button>
                ))}
              </nav>
              {activeTab === "작품 이야기" ? (
                <section className="story">
                  {snapshot ? (
                    <>
                      {snapshot.product.description && (
                        <p className="story-lead">
                          {snapshot.product.description}
                        </p>
                      )}
                      {snapshot.project?.concept && (
                        <>
                          <h2 className="story-label">작품에 담긴 이야기</h2>
                          <p>{snapshot.project.concept}</p>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <h2 className="story-label">시작한 이유</h2>
                      <p className="story-lead">
                        {detail?.beginning || story?.beginning}
                      </p>
                      <div className="story-divider" />
                      <h2 className="story-label">작품에 담긴 이야기</h2>
                      <p>{detail?.concept || story?.concept}</p>
                      <blockquote>
                        “{detail?.quote || product.project.desc}”
                        <cite>— {product.project.artist} 작가</cite>
                      </blockquote>
                      <div className="story-footer">
                        <Icon name="leaf" size={18} />
                        <span>일상에 스며드는 작은 예술.</span>
                      </div>
                    </>
                  )}
                </section>
              ) : activeTab !== "수령 · 교환" ? (
                <section className="info-section">
                  <h2>작품을 조금 더 알아보세요</h2>
                  <dl>
                    {[
                      ["작품명", product.name],
                      ["작가", product.project.artist],
                      ["시리즈", product.project.title],
                      ...(detail ? [["구성", detail.composition]] : []),
                      ...(!snapshot
                        ? [["재료", product.project.dna.materials.join(" · ")]]
                        : []),
                      [
                        "보관 안내",
                        detail?.care || product.project.installNote,
                      ],
                    ]
                      .filter(([, value]) => value?.trim())
                      .map(([label, value]) => (
                        <div key={label}>
                          <dt>{label}</dt>
                          <dd>{value}</dd>
                        </div>
                      ))}
                  </dl>
                  {!snapshot && (
                    <p>
                      수작업으로 만든 작품은 형태와 색감에 자연스러운 차이가
                      있을 수 있습니다.
                    </p>
                  )}
                </section>
              ) : (
                <section className="info-section">
                  <h2>수령 · 교환 안내</h2>
                  <details open>
                    <summary>{pickupText}</summary>
                    <p>
                      {isExhibition
                        ? "전시 종료 후 수령합니다. 이른 수령은 구매 전 카페에 문의해 주세요."
                        : "카페 직원에게 주문 내역을 보여 주고 수령하세요."}
                    </p>
                    {isExhibition && (
                      <p>
                        전시 종료일:{" "}
                        {pickup.exhibitionEnd || "카페 직원에게 확인해 주세요"}
                      </p>
                    )}
                    {pickup.phone && (
                      <a className="text-link" href={"tel:" + pickup.phone}>
                        카페 문의 · {pickup.phone}
                      </a>
                    )}
                    {snapshot?.store.address && (
                      <p>주소 · {snapshot.store.address}</p>
                    )}
                    {snapshot?.store.hours && (
                      <p>운영 시간 · {snapshot.store.hours}</p>
                    )}
                  </details>
                  <details>
                    <summary>교환 · 반품</summary>
                    <p>
                      상품에 문제가 있다면 주문 번호와 함께 카페에 문의해
                      주세요. 교환·반품은 관련 법령에 따라 처리됩니다.
                    </p>
                  </details>
                </section>
              )}
              {(!snapshot || snapshot.creator) && (
                <section className="artist-card" id="artist">
                  <span className="avatar large">
                    {product.project.artist.slice(0, 1)}
                  </span>
                  <div>
                    <span className="section-kicker">MEET THE ARTIST</span>
                    <h3>
                      {snapshot?.creator?.name || product.project.artist} 작가
                    </h3>
                    {snapshot ? (
                      <>
                        {snapshot.creator?.handle && (
                          <p>{snapshot.creator.handle}</p>
                        )}
                        {snapshot.creator?.introduction && (
                          <p>{snapshot.creator.introduction}</p>
                        )}
                        {snapshot.creator?.description && (
                          <p>{snapshot.creator.description}</p>
                        )}
                        {!!snapshot.creator?.regions.length && (
                          <p>{snapshot.creator.regions.join(" · ")}</p>
                        )}
                      </>
                    ) : (
                      <p>
                        {product.project.id === 0
                          ? "제주의 흙과 계절을 일상의 그릇에 담습니다."
                          : product.project.desc}
                      </p>
                    )}
                  </div>
                </section>
              )}
            </div>
            <aside className="related">
              {!snapshot && (
                <>
                  <div className="section-title">
                    <h3>같은 작가의 다른 작품</h3>
                    <button
                      className="text-link"
                      onClick={() => setGallery(true)}
                    >
                      함께 만나보세요 <Icon name="arrow" size={14} />
                    </button>
                  </div>
                  <div className="related-list">
                    {catalog
                      .filter(
                        (item) =>
                          item.project.id === product.project.id &&
                          item.id !== product.id,
                      )
                      .map((item) => (
                        <button
                          key={item.id}
                          className="related-item"
                          onClick={() => selectProduct(item.id)}
                        >
                          <img src={item.img} alt={item.name} loading="lazy" />
                          <span>
                            <small>{item.project.title}</small>
                            <strong>{item.name}</strong>
                            <b>{money(item.price)}</b>
                          </span>
                          <Icon name="arrow" size={18} />
                        </button>
                      ))}
                  </div>
                </>
              )}
              <div className="brand-note">
                <Icon name="leaf" />
                <strong>공간과 예술 사이, 큐릿</strong>
                <p>
                  마음에 닿은 작품을
                  <br />
                  이제 당신의 일상에서 만나세요.
                </p>
              </div>
            </aside>
          </div>
          <footer className="footer">
            <span className="footer-brand-logo" aria-label="큐릿">
              CURI:T
            </span>
            <span>예술이 일상이 되는 순간</span>
          </footer>
          <div className="purchase-bar">
            <div>
              <small>총 작품 금액</small>
              <strong>{money(product.price * quantity)}</strong>
            </div>
            <button
              className="primary"
              disabled={!!issue}
              onClick={openCheckout}
            >
              {issue
                ? snapshot?.saleEnded
                  ? "판매 종료"
                  : snapshot?.saleStatus === "preparing"
                    ? "판매 준비 중"
                    : product.stock < 1
                      ? "품절"
                      : "주문 불가"
                : "주문하기"}{" "}
              <Icon name="arrow" size={19} />
            </button>
          </div>
          {issue && (
            <p className="payment-error" role="status">
              {issue}
            </p>
          )}
        </main>
      )}
      {!ordersOpen && stage === "checkout" && (
        <main className="checkout">
          {purchaseIntentCount !== null && (
            <div className="interest-strip purchase-intent-strip" role="status">
              <span className="interest-dot" aria-hidden="true" />이 소품을
              지금까지{" "}
              <strong>{purchaseIntentCount.toLocaleString("ko-KR")}분</strong>이
              구매하시려고 하셨어요!
            </div>
          )}
          <div className="checkout-title">
            <h1>
              마음에 닿은 작품을,
              <br />
              당신의 일상으로.
            </h1>
          </div>
          <form onSubmit={submit}>
            <div className="checkout-grid">
              <div>
                <section className="form-section">
                  <h2>
                    01 <span>주문 작품</span>
                  </h2>
                  <div className="order-product">
                    <img src={product.img} alt={product.name} />
                    <div>
                      <small>{product.project.artist} 작가</small>
                      <strong>{product.name}</strong>
                      <p>
                        {quantity}개 · {money(total)}
                      </p>
                    </div>
                  </div>
                </section>
                <section className="form-section">
                  <h2>
                    02 <span>수령 · 주문자 정보</span>
                  </h2>
                  <div className="pickup-card">
                    <Icon name="box" />
                    <div>
                      <strong>{pickupText}</strong>
                      <p>
                        {isExhibition
                          ? "구매 예약 후, 전시가 끝나면 카페에서 수령하세요."
                          : "카페 직원에게 주문 내역을 보여 주고 수령하세요."}
                      </p>
                      <span className="pickup-place">
                        {pickup.cafe} · 현장 수령 무료
                      </span>
                      {snapshot?.store.address && (
                        <p>{snapshot.store.address}</p>
                      )}
                      {snapshot?.store.hours && (
                        <p>운영 시간 · {snapshot.store.hours}</p>
                      )}
                      {isExhibition && (
                        <div className="exhibition-info">
                          <p>
                            <b>전시 종료일</b>{" "}
                            {pickup.exhibitionEnd ||
                              "매장에 일정 확인 후 예약해 주세요"}
                          </p>
                          <p>이른 수령은 구매 전 카페에 문의해 주세요.</p>
                          {pickup.phone ? (
                            <a href={"tel:" + pickup.phone}>
                              <Icon name="phone" size={16} /> 카페 연락하기 ·{" "}
                              {pickup.phone}
                            </a>
                          ) : (
                            <span>
                              카페 직원에게 수령 일정을 문의해 주세요.
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <label>
                    주문자 이름
                    <input
                      name="name"
                      autoComplete="name"
                      readOnly={busy}
                      value={buyerName}
                      onChange={(event) => setBuyerName(event.target.value)}
                      required
                      placeholder="이름을 입력해 주세요"
                      maxLength={40}
                    />
                  </label>
                  <div className="verified-contact">
                    <Icon name="check" size={17} />
                    <div>
                      <strong>주문 안내 연락처</strong>
                      <span>
                        {verifiedPhone.slice(0, 3)}-{verifiedPhone.slice(3, -4)}
                        -{verifiedPhone.slice(-4)}
                      </span>
                    </div>
                    <small>입력 완료</small>
                  </div>
                </section>
                <section className="form-section payment-section">
                  <h2>
                    03 <span>토스 테스트 결제</span>
                  </h2>
                  <p className="hint">
                    토스 결제창에서 사용할 결제 수단을 선택해 주세요. 실제
                    금액은 청구되지 않아요.
                  </p>
                </section>
              </div>
              <aside className="order-summary">
                <h2>결제 금액</h2>
                <dl>
                  <div>
                    <dt>작품 금액</dt>
                    <dd>{money(total)}</dd>
                  </div>
                  <div>
                    <dt>수령 방법</dt>
                    <dd>
                      {isExhibition ? "전시 종료 후 수령" : "현장 수령"} · 무료
                    </dd>
                  </div>
                  <div className="total">
                    <dt>총 결제 금액</dt>
                    <dd>{money(total)}</dd>
                  </div>
                </dl>
                <label className="agreement">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(event) => setAgreed(event.target.checked)}
                    required
                  />
                  <span>
                    주문 내용과 수령 안내를 확인했으며, 주문 처리를 위한
                    개인정보 수집·이용에 동의합니다. <b>(필수)</b>
                  </span>
                </label>
                <details className="policy-details">
                  <summary>개인정보 수집·이용 안내</summary>
                  <p>
                    수집 항목: 이름, 휴대폰 번호
                    <br />
                    이용 목적: 주문 처리, 주문 조회, 수령 안내
                    <br />
                    보유 기간: 주문 처리 완료 후 파기. 관련 법령에 따른 거래
                    기록은 법정 기간 동안 보관합니다.
                  </p>
                </details>
                {pickup.phone && (
                  <div className="inline-support">
                    <Icon name="phone" size={18} />
                    <div>
                      <strong>수령 · 교환 · 환불 문의</strong>
                      <a href={"tel:" + pickup.phone}>
                        {pickup.cafe} · {pickup.phone}
                      </a>
                    </div>
                  </div>
                )}
                {issue && (
                  <p className="payment-error" role="alert">
                    {issue}
                  </p>
                )}
                {paymentError && (
                  <p className="payment-error" role="alert">
                    {paymentError}
                  </p>
                )}
                <button
                  className="primary"
                  disabled={
                    !!issue ||
                    busy ||
                    !agreed ||
                    !verifiedPhone ||
                    verifiedPhone !== phone
                  }
                  type="submit"
                >
                  {busy
                    ? "결제창을 연결하고 있어요…"
                    : money(total) +
                      (isExhibition ? " 구매 예약하기" : " 결제하기")}
                </button>
                {!verifiedPhone && (
                  <p className="hint summary-hint">
                    휴대폰 번호 확인을 완료하면 결제할 수 있어요.
                  </p>
                )}
              </aside>
            </div>
          </form>
        </main>
      )}
      {!ordersOpen && stage === "confirming" && (
        <main className="complete payment-confirming">
          {busy && (
            <div className="session-loading" role="status">
              <span className="loading-spinner" />
              결제 내역을 확인하고 있어요.
            </div>
          )}
          <h1>
            {busy ? "잠시만 기다려 주세요." : "결제 상태를 다시 확인해 주세요."}
          </h1>
          <p>
            {busy
              ? "확인이 끝나면 주문 내역을 보여드릴게요."
              : "이미 결제했다면 아래에서 주문 내역을 먼저 확인해 주세요."}
          </p>
          {paymentError && (
            <p className="payment-error" role="alert">
              {paymentError}
            </p>
          )}
          <button
            className="primary"
            disabled={busy}
            onClick={() => {
              confirmationStarted.current = false
              setConfirmationAttempt((value) => value + 1)
            }}
          >
            결제 상태 다시 확인
          </button>
          <button className="text-link" onClick={() => setOrdersOpen(true)}>
            나의 주문 내역 확인
          </button>
        </main>
      )}
      {!ordersOpen && stage === "complete" && confirmedOrder && (
        <main className="complete">
          <div className="success-icon">
            <Icon name={cancelled ? "close" : "check"} size={36} />
          </div>
          {cancelled ? (
            <>
              <h1>결제가 취소됐어요.</h1>
              <p>
                이 주문의 수령도 취소됐어요. 취소에 대해 궁금한 점이 있으면
                매장에 문의해 주세요.
              </p>
            </>
          ) : (
            <>
              <h1>
                카페에서 만난 예술,
                <br />
                이제 당신의 일상으로.
              </h1>
              <p>
                {product.project.artist} 작가의{" "}
                {isExhibition ? "작품 구매 예약이" : "작품 주문이"}{" "}
                완료되었습니다.
              </p>
            </>
          )}
          {(confirmedOrder.simulated || confirmedOrder.testPayment) && (
            <p>이 주문은 실제 금액이 청구되지 않았어요.</p>
          )}
          <div className="receipt">
            <small>주문 번호</small>
            <strong>{confirmedOrder.id}</strong>
            <div className="order-product">
              <img src={product.img} alt={product.name} />
              <div>
                <strong>{product.name}</strong>
                <p>
                  {product.project.artist} · {confirmedOrder.quantity}개
                </p>
              </div>
            </div>
            <dl>
              <div>
                <dt>{cancelled ? "주문 상태" : "수령 방법"}</dt>
                <dd>{cancelled ? "수령 취소" : pickupText}</dd>
              </div>
              <div>
                <dt>{cancelled ? "매장" : "수령 장소"}</dt>
                <dd>{pickup.cafe}</dd>
              </div>
              {!cancelled && isExhibition && (
                <div>
                  <dt>전시 종료일</dt>
                  <dd>{pickup.exhibitionEnd || "매장 문의"}</dd>
                </div>
              )}
              <div>
                <dt>결제 수단</dt>
                <dd>{confirmedOrder.paymentMethod}</dd>
              </div>
              <div className="total">
                <dt>{cancelled ? "취소된 주문 금액" : "주문 금액"}</dt>
                <dd>{money(confirmedOrder.amount)}</dd>
              </div>
            </dl>
          </div>
          {!cancelled && (
            <div className="completion-pickup">
              <Icon name="box" />
              <p>
                {isExhibition
                  ? (pickup.exhibitionEnd
                      ? pickup.exhibitionEnd + " 이후 "
                      : "전시가 종료된 후 ") +
                    pickup.cafe +
                    "에 방문해 결제 내역을 보여 주시면 작품을 전달해 드립니다."
                  : pickup.cafe +
                    "에 방문해 결제 내역을 보여 주시면 작품을 현장에서 전달해 드립니다."}
              </p>
            </div>
          )}
          {snapshot?.store.address && <p>{snapshot.store.address}</p>}
          {snapshot?.store.hours && <p>운영 시간 · {snapshot.store.hours}</p>}
          {pickup.phone && (
            <div className="inline-support">
              <Icon name="phone" size={18} />
              <div>
                <strong>수령 · 교환 · 환불 문의</strong>
                <a href={"tel:" + pickup.phone}>
                  {pickup.cafe} · {pickup.phone}
                </a>
              </div>
            </div>
          )}
          <div className="receipt-tools">
            <button
              className="text-link"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(confirmedOrder.id)
                  showToast("주문 번호를 복사했어요.")
                } catch {
                  showToast(
                    "주문 번호는 상단 주문 내역에서 다시 확인할 수 있어요.",
                  )
                }
              }}
            >
              주문 번호 복사
            </button>
            <button
              className="text-link"
              onClick={() => {
                setOrdersOpen(true)
                window.scrollTo(0, 0)
              }}
            >
              나의 주문 내역
            </button>
          </div>
          <button
            className="primary return-to-artwork"
            onClick={() => {
              setAgreed(false)
              navigate("detail")
            }}
          >
            작품으로 돌아가기 <Icon name="arrow" />
          </button>
        </main>
      )}
      {checkoutReview && (
        <Modal
          className="payment-review"
          labelledBy="payment-review-title"
          busy={busy}
          onClose={() => setCheckoutReview(null)}
        >
          <button
            className="modal-close icon-button"
            aria-label="닫기"
            disabled={busy}
            onClick={() => setCheckoutReview(null)}
          >
            <Icon name="close" />
          </button>
          <h2 id="payment-review-title">주문 내용을 확인해 주세요</h2>
          <div className="order-product">
            <img src={product.img} alt={product.name} />
            <div>
              <small>{product.project.artist} 작가</small>
              <strong>{product.name}</strong>
              <p>
                {quantity}개 · {money(total)}
              </p>
            </div>
          </div>
          <dl>
            <div>
              <dt>결제 수단</dt>
              <dd>토스 결제창에서 선택</dd>
            </div>
            <div>
              <dt>수령 방법</dt>
              <dd>{pickupText}</dd>
            </div>
            <div className="total">
              <dt>주문 금액</dt>
              <dd>{money(total)}</dd>
            </div>
          </dl>
          {paymentError && (
            <p className="payment-error" role="alert">
              {paymentError}
            </p>
          )}
          <button
            className="primary"
            disabled={busy}
            onClick={() => beginCheckout(checkoutReview.name)}
          >
            {busy ? "주문을 처리하고 있어요…" : "확인하고 주문하기"}
          </button>
        </Modal>
      )}
      {gallery && (
        <Modal labelledBy="gallery-title" onClose={() => setGallery(false)}>
          <button
            className="modal-close icon-button"
            aria-label="닫기"
            onClick={() => setGallery(false)}
          >
            <Icon name="close" />
          </button>
          <h2 id="gallery-title">
            {product.project.artist} 작가의 다른 작품들
          </h2>
          <div className="gallery-list">
            {catalog
              .filter((item) => item.project.id === product.project.id)
              .map((item) => (
                <button
                  className="related-item"
                  key={item.id}
                  onClick={() => selectProduct(item.id)}
                >
                  <img src={item.img} alt={item.name} />
                  <span>
                    <small>{item.project.title}</small>
                    <strong>{item.name}</strong>
                    <b>{money(item.price)}</b>
                  </span>
                  {item.id === product.id && (
                    <span className="current-product">현재 작품</span>
                  )}
                </button>
              ))}
          </div>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          {toast.message}
        </div>
      )}
    </div>
  )
}
