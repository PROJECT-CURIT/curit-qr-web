import { useEffect, useRef, useState } from "react"
import { Icon } from "./App"
import {
  fieldProductId,
  fieldProducts,
  readFieldSaleConfig,
  transferAmount,
  type FieldSaleConfig,
} from "./fieldSaleConfig"
import "./fieldSale.css"

const money = (amount: number) => amount.toLocaleString("ko-KR") + "원"
const asset = (file: string) => import.meta.env.BASE_URL + "field-sale/" + file
const tabs = ["상품 소개", "상품 정보", "수령 · 교환"] as const

export default function FieldSale() {
  const id = fieldProductId(new URLSearchParams(location.search).get("buy"))
  const product = id ? fieldProducts[id] : null
  const [config, setConfig] = useState<FieldSaleConfig | null>(null)
  const [error, setError] = useState("")
  const [attempt, setAttempt] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [tab, setTab] = useState<string>(tabs[0])
  const [copied, setCopied] = useState(false)
  const [copyMessage, setCopyMessage] = useState("")
  const [shareMessage, setShareMessage] = useState("")
  const [showTransfer, setShowTransfer] = useState(false)
  const transferHeading = useRef<HTMLHeadingElement>(null)
  const offer = id ? config?.products[id] : null
  const amount = transferAmount(
    offer?.price ?? null,
    quantity,
    offer?.quantity ?? null,
  )
  const ready = Boolean(config?.bank && amount !== null)
  const saleStatus =
    offer?.quantity === 0 ? "품절" : ready ? "구매 가능" : "판매 준비 중"

  useEffect(() => {
    if (!product) return
    document.title = product.name + " 구매 안내 | CURI:T"
    const controller = new AbortController()
    setError("")
    setConfig(null)
    fetch(asset("config.json"), {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("판매 안내를 불러오지 못했어요.")
        return readFieldSaleConfig(await response.json())
      })
      .then(setConfig)
      .catch((failure) => {
        if (!controller.signal.aborted)
          setError(
            failure instanceof Error
              ? failure.message
              : "인터넷 연결을 확인해 주세요.",
          )
      })
    return () => controller.abort()
  }, [product, attempt])

  useEffect(() => {
    if (showTransfer) {
      window.scrollTo(0, 0)
      transferHeading.current?.focus()
    }
  }, [showTransfer])

  async function copyAccount() {
    if (!ready || !config?.bank) return
    try {
      await navigator.clipboard.writeText(
        config.bank.account.replace(/\D/g, ""),
      )
      setCopied(true)
      setCopyMessage(
        "계좌번호를 복사했어요. 은행 앱에서 예금주와 금액을 확인한 뒤 이체해 주세요.",
      )
    } catch {
      setCopyMessage(
        "자동 복사가 되지 않았어요. 계좌번호를 길게 눌러 복사해 주세요.",
      )
    }
  }

  async function share() {
    try {
      if (navigator.share)
        await navigator.share({ title: product?.name, url: location.href })
      else {
        await navigator.clipboard.writeText(location.href)
        setShareMessage("상품 링크를 복사했어요.")
      }
    } catch (failure) {
      if (!(failure instanceof DOMException && failure.name === "AbortError"))
        setShareMessage("주소창의 상품 링크를 복사해 주세요.")
    }
  }

  function showPickup() {
    setTab("수령 · 교환")
    document
      .getElementById("field-info")
      ?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div
      className={"app field-sale app-" + (showTransfer ? "checkout" : "detail")}
    >
      <a className="field-skip" href="#field-content">
        상품 안내로 바로가기
      </a>
      <header className="header app-navigation">
        {showTransfer && (
          <button
            className="icon-button header-back"
            aria-label="상품으로 돌아가기"
            onClick={() => setShowTransfer(false)}
          >
            <Icon name="back" />
          </button>
        )}
        <button
          className="wordmark"
          aria-label="큐릿 상품 상세"
          onClick={() => {
            setShowTransfer(false)
            window.scrollTo(0, 0)
          }}
        >
          <span className="brand-logo" aria-hidden="true">
            CURI:T
          </span>
        </button>
        {!showTransfer && product && (
          <button className="order-history-link" onClick={showPickup}>
            <Icon name="box" size={18} />
            <span>구매 안내</span>
          </button>
        )}
      </header>

      {!product ? (
        <main id="field-content" className="checkout info-section">
          <h1>상품 링크를 확인해 주세요</h1>
          <p>상품 옆의 QR을 다시 스캔하거나 매장에 문의해 주세요.</p>
        </main>
      ) : showTransfer && ready ? (
        <main id="field-content" className="checkout">
          <div className="checkout-title">
            <h1
              ref={transferHeading}
              tabIndex={-1}
              className="field-transfer-heading"
            >
              계좌이체 안내
            </h1>
            <p>
              상품과 금액을 확인한 뒤, 사용하시는 은행 앱에서 직접 이체해
              주세요.
            </p>
          </div>
          <div className="checkout-grid">
            <div>
              <section className="form-section">
                <h2>
                  <Icon name="box" />
                  <span>구매 상품</span>
                </h2>
                <div className="order-product">
                  <img src={asset(product.image)} alt={product.name} />
                  <div>
                    <small>매장 현장 수령</small>
                    <strong>{product.name}</strong>
                    <p>
                      {money(offer!.price!)} · {quantity}개
                    </p>
                  </div>
                </div>
              </section>
              <section className="form-section">
                <h2>
                  <Icon name="receipt" />
                  <span>입금 계좌</span>
                </h2>
                <dl className="field-transfer-account">
                  <div>
                    <dt>은행</dt>
                    <dd>{config!.bank!.name}</dd>
                  </div>
                  <div>
                    <dt>계좌번호</dt>
                    <dd className="field-account">{config!.bank!.account}</dd>
                  </div>
                  <div>
                    <dt>예금주</dt>
                    <dd>{config!.bank!.holder}</dd>
                  </div>
                </dl>
                <p className="hint">
                  이체 전에 매장에서 상품과 구매 수량을 확인해 주세요.
                </p>
              </section>
              <section className="form-section">
                <h2>
                  <Icon name="check" />
                  <span>이체 후 현장 수령</span>
                </h2>
                <p className="hint">
                  판매자에게 실제 입금 확인을 요청한 뒤 상품을 받아 주세요. 이
                  화면은 결제 완료 증빙이 아니에요.
                </p>
              </section>
            </div>
            <aside className="order-summary">
              <h2>입금할 금액</h2>
              <dl>
                <div>
                  <dt>상품 금액</dt>
                  <dd>{money(offer!.price!)}</dd>
                </div>
                <div>
                  <dt>구매 수량</dt>
                  <dd>{quantity}개</dd>
                </div>
                <div className="total">
                  <dt>총 상품 금액</dt>
                  <dd>{money(amount!)}</dd>
                </div>
              </dl>
              <p className="hint">
                계좌번호를 복사해 은행 앱에서 이체해 주세요.
              </p>
              <button className="primary" onClick={copyAccount}>
                {copied ? "계좌번호 다시 복사" : "계좌번호 복사"}
                <Icon name="arrow" />
              </button>
              <p className="field-copy-status" role="status">
                {copyMessage}
              </p>
            </aside>
          </div>
        </main>
      ) : (
        <main id="field-content">
          <div className="detail-grid">
            <div className="visual">
              <img
                className="hero-image"
                src={asset(product.image)}
                alt={product.name}
              />
              <div className="hero-copy">
                <span className="hero-badge">{saleStatus}</span>
                <h1>{product.name}</h1>
                <p>{product.subtitle}</p>
              </div>
            </div>
            <div className="product-intro">
              <div className="eyebrow">
                <span>{product.category}</span>
                <button
                  className="icon-button"
                  aria-label="상품 링크 공유"
                  onClick={share}
                >
                  <Icon name="share" size={19} />
                </button>
              </div>
              <div className="artist-line">
                <span className="avatar">
                  <Icon name="box" size={22} />
                </span>
                <span>
                  <strong>{config?.storeName || "매장 현장 전시"}</strong>
                  <small>전시된 실물을 확인하고 현장에서 받아 가세요.</small>
                </span>
              </div>
              <div className="price-row">
                <strong>
                  {offer?.price ? money(offer.price) : "가격 확인 중"}
                </strong>
                <span className="stock-badge">{saleStatus}</span>
              </div>
              <div className="tags">
                {product.tags.map((tag) => (
                  <span key={tag}>#{tag}</span>
                ))}
              </div>
              <div className="delivery-note">
                <Icon name="box" />
                <div>
                  <strong>마음에 든 상품을, 지금 이 공간에서</strong>
                  <p>계좌이체 · 입금 확인 후 현장 수령</p>
                </div>
              </div>
              <div className="quantity-line">
                <span>
                  구매 수량{" "}
                  <small>
                    {offer?.quantity == null
                      ? "재고는 매장에서 확인해 주세요"
                      : "남은 수량 " + offer.quantity + "개"}
                  </small>
                </span>
                <div className="stepper">
                  <button
                    aria-label="수량 줄이기"
                    disabled={!ready || quantity <= 1}
                    onClick={() => setQuantity((value) => value - 1)}
                  >
                    −
                  </button>
                  <output aria-live="polite">{quantity}</output>
                  <button
                    aria-label="수량 늘리기"
                    disabled={!ready || quantity >= (offer?.quantity ?? 1)}
                    onClick={() => setQuantity((value) => value + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
              {error ? (
                <div className="field-state" role="alert">
                  <p className="payment-error">{error}</p>
                  <button
                    className="secondary-button"
                    onClick={() => setAttempt((value) => value + 1)}
                  >
                    다시 불러오기
                  </button>
                </div>
              ) : (
                <p className="sample-note" role="status">
                  {!config
                    ? "판매 안내를 불러오고 있어요."
                    : offer?.quantity === 0
                      ? "판매가 마감됐어요. 이체하지 마시고 매장에 문의해 주세요."
                      : !ready
                        ? "입금 안내를 준비 중이에요. 구매는 매장에 문의해 주세요."
                        : "이체 전 매장에서 상품과 수량을 확인해 주세요."}
                </p>
              )}
              {shareMessage && (
                <p className="field-copy-status" role="status">
                  {shareMessage}
                </p>
              )}
            </div>
          </div>
          <div className="content-grid">
            <div id="field-info">
              <nav className="tabs" aria-label="상품 정보">
                {tabs.map((label) => (
                  <button
                    key={label}
                    className={tab === label ? "active" : ""}
                    aria-pressed={tab === label}
                    onClick={() => setTab(label)}
                  >
                    {label}
                  </button>
                ))}
              </nav>
              {tab === "상품 소개" ? (
                <section className="story">
                  <h2 className="story-label">{product.subtitle}</h2>
                  <p className="story-lead">{product.description}</p>
                  <div className="story-divider" />
                  <p>
                    이 공간에서 발견한 작은 취향을 일상으로 가져가 보세요. 상품
                    옆 QR에서 구매 방법을 확인하고, 입금 확인 후 현장에서 받아
                    갈 수 있어요.
                  </p>
                </section>
              ) : tab === "상품 정보" ? (
                <section className="info-section">
                  <h2>상품을 조금 더 알아보세요</h2>
                  <dl>
                    <div>
                      <dt>상품명</dt>
                      <dd>{product.name}</dd>
                    </div>
                    <div>
                      <dt>구성</dt>
                      <dd>{product.composition}</dd>
                    </div>
                    <div>
                      <dt>가격</dt>
                      <dd>{offer?.price ? money(offer.price) : "확인 중"}</dd>
                    </div>
                    <div>
                      <dt>색상 · 디자인</dt>
                      <dd>매장에서 실물 확인</dd>
                    </div>
                    <div>
                      <dt>수령 방법</dt>
                      <dd>입금 확인 후 현장 수령</dd>
                    </div>
                  </dl>
                  <p>
                    사진 속 상품은 참고용이에요. 표시 가격은 1개 기준이며,
                    구성과 재고는 매장에서 확인해 주세요.
                  </p>
                </section>
              ) : (
                <section className="info-section">
                  <h2>수령 · 교환 안내</h2>
                  <details open>
                    <summary>매장에서 바로 받아 가세요</summary>
                    <p>
                      상품과 구매 수량을 확인한 뒤 안내된 계좌로 이체해 주세요.
                      판매자가 실제 입금을 확인한 후 상품을 받아 가세요.
                    </p>
                  </details>
                  <details>
                    <summary>입금 · 취소 · 교환</summary>
                    <p>
                      입금 확인, 취소와 교환은 현장 판매자에게 문의해 주세요. 이
                      웹페이지는 주문이나 결제 완료를 자동으로 확인하지
                      않습니다.
                    </p>
                  </details>
                </section>
              )}
            </div>
            <aside className="related">
              <div className="section-title">
                <h3>함께 전시 중인 상품</h3>
                <span>이 공간에서 만나보세요</span>
              </div>
              {Object.entries(fieldProducts)
                .filter(([otherId]) => otherId !== id)
                .map(([otherId, item]) => (
                  <a
                    key={otherId}
                    className="related-item field-related"
                    href={"?buy=" + otherId}
                  >
                    <img
                      src={asset(item.image)}
                      alt={item.name}
                      loading="lazy"
                    />
                    <span>
                      <small>현장 수령</small>
                      <strong>{item.name}</strong>
                      <b>
                        {config?.products[
                          (otherId as keyof typeof fieldProducts)
                        ].price
                          ? money(
                              config.products[
                                (otherId as keyof typeof fieldProducts)
                              ].price!,
                            )
                          : "가격 확인 중"}
                      </b>
                    </span>
                    <Icon name="arrow" size={18} />
                  </a>
                ))}
              <div className="brand-note">
                <Icon name="leaf" />
                <strong>공간과 예술 사이, 큐릿</strong>
                <p>
                  마음에 닿은 소품을
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
              <small>총 상품 금액</small>
              <strong>
                {offer?.price ? money(offer.price * quantity) : "가격 확인 중"}
              </strong>
            </div>
            <button
              className="primary"
              disabled={!ready}
              onClick={() => setShowTransfer(true)}
            >
              {offer?.quantity === 0
                ? "품절"
                : ready
                  ? "구매하기"
                  : error
                    ? "안내 확인 불가"
                    : !config
                      ? "안내 불러오는 중"
                      : "입금 안내 준비 중"}
              <Icon name="arrow" size={19} />
            </button>
          </div>
        </main>
      )}
    </div>
  )
}
