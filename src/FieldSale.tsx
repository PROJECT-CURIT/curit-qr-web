import { useEffect, useRef, useState } from "react"
import {
  fieldProductId,
  fieldProducts,
  readFieldSaleConfig,
  transferAmount,
  type FieldSaleConfig,
} from "./fieldSaleConfig"
import "./fieldSale.css"

const money = (amount: number) => `${amount.toLocaleString("ko-KR")}원`
const asset = (file: string) => `${import.meta.env.BASE_URL}field-sale/${file}`

export default function FieldSale() {
  const id = fieldProductId(new URLSearchParams(location.search).get("buy"))
  const product = id ? fieldProducts[id] : null
  const [config, setConfig] = useState<FieldSaleConfig | null>(null)
  const [error, setError] = useState("")
  const [attempt, setAttempt] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [copied, setCopied] = useState(false)
  const [copyMessage, setCopyMessage] = useState("")
  const [showTransfer, setShowTransfer] = useState(false)
  const transferHeading = useRef<HTMLHeadingElement>(null)
  const offer = id ? config?.products[id] : null
  const amount = transferAmount(
    offer?.price ?? null,
    quantity,
    offer?.quantity ?? null,
  )
  const ready = Boolean(config?.bank && amount !== null)

  useEffect(() => {
    if (!product) return
    document.title = `${product.name} 구매 안내 | CURI:T`
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
    if (showTransfer) transferHeading.current?.focus()
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
        "자동 복사가 되지 않았어요. 아래 계좌번호를 길게 눌러 복사해 주세요.",
      )
    }
  }

  return (
    <div className="field-sale">
      <a className="field-skip" href="#field-content">
        상품 안내로 바로가기
      </a>
      <header className="field-header">
        <a
          className="brand-logo"
          href={import.meta.env.BASE_URL}
          aria-label="큐릿 홈"
        >
          CURI:T
        </a>
        <span>매장 현장 구매</span>
      </header>
      <main id="field-content" className="field-main">
        {!product ? (
          <section className="field-state">
            <h1>상품 링크를 확인해 주세요</h1>
            <p>상품 옆의 QR을 다시 스캔하거나 매장에 문의해 주세요.</p>
          </section>
        ) : (
          <>
            <figure className="field-photo">
              <img
                src={asset(product.image)}
                alt={
                  id === "kendama"
                    ? "나무 손잡이와 색상 공으로 구성된 켄다마"
                    : "고양이 당고 모양의 키링"
                }
              />
              <figcaption>
                사진을 참고해 매장에서 실물을 확인해 주세요.
              </figcaption>
            </figure>
            <div className="field-details">
              <h1>{product.name}</h1>
              <p className="field-description">{product.description}</p>
              {error ? (
                <div className="field-state" role="alert">
                  <h2>판매 안내를 불러오지 못했어요</h2>
                  <p>{error}</p>
                  <button
                    className="field-secondary"
                    onClick={() => setAttempt((value) => value + 1)}
                  >
                    다시 불러오기
                  </button>
                </div>
              ) : !config ? (
                <p className="field-status" role="status">
                  가격과 입금 안내를 불러오는 중이에요.
                </p>
              ) : (
                <>
                  <p className="field-price">
                    {offer?.price ? money(offer.price) : "판매 준비 중"}
                    <span>{offer?.price ? " / 1개" : ""}</span>
                  </p>
                  <div className="field-pickup">
                    <strong>{config.storeName}</strong>
                    <span>상품 확인 → 계좌이체 → 입금 확인 후 수령</span>
                  </div>
                  {offer?.quantity === 0 ? (
                    <p className="field-status">
                      이 상품은 판매가 마감됐어요. 이체하지 마시고 매장에 문의해
                      주세요.
                    </p>
                  ) : !ready ? (
                    <p className="field-status">
                      가격과 입금 계좌를 준비하고 있어요. 지금은 송금할 수
                      없어요.
                    </p>
                  ) : (
                    <>
                      <div className="field-quantity">
                        <label htmlFor="field-quantity">구매 수량</label>
                        <div>
                          <button
                            aria-label="구매 수량 줄이기"
                            disabled={quantity <= 1}
                            onClick={() => setQuantity((value) => value - 1)}
                          >
                            −
                          </button>
                          <output id="field-quantity" aria-live="polite">
                            {quantity}
                          </output>
                          <button
                            aria-label="구매 수량 늘리기"
                            disabled={quantity >= (offer?.quantity ?? 1)}
                            onClick={() => setQuantity((value) => value + 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <p className="field-before">
                        이체 전에 매장에서 상품과 구매 수량을 확인해 주세요.
                      </p>
                      {!showTransfer ? (
                        <button
                          className="field-primary"
                          onClick={() => setShowTransfer(true)}
                        >
                          {money(amount!)} 계좌이체 안내 보기
                          <span aria-hidden="true">→</span>
                        </button>
                      ) : (
                        <section
                          className="field-transfer"
                          aria-labelledby="field-transfer-title"
                        >
                          <h2
                            ref={transferHeading}
                            tabIndex={-1}
                            id="field-transfer-title"
                          >
                            아래 계좌로 이체해 주세요
                          </h2>
                          <p>사용하시는 은행 앱에서 직접 송금해 주세요.</p>
                          <dl>
                            <div>
                              <dt>입금할 금액</dt>
                              <dd className="field-amount">{money(amount!)}</dd>
                            </div>
                            <div>
                              <dt>은행</dt>
                              <dd>{config.bank!.name}</dd>
                            </div>
                            <div>
                              <dt>계좌번호</dt>
                              <dd className="field-account">
                                {config.bank!.account}
                              </dd>
                            </div>
                            <div>
                              <dt>예금주</dt>
                              <dd>{config.bank!.holder}</dd>
                            </div>
                          </dl>
                          <button
                            className="field-primary"
                            onClick={copyAccount}
                          >
                            {copied ? "계좌번호 다시 복사" : "계좌번호 복사"}
                          </button>
                          <p className="field-copy-status" role="status">
                            {copyMessage}
                          </p>
                          <div className="field-receive">
                            <h3>이체하셨나요?</h3>
                            <p>
                              판매자에게 입금 확인을 요청한 뒤 상품을 받아
                              주세요. 이 화면은 결제 완료 증빙이 아니에요.
                            </p>
                          </div>
                        </section>
                      )}
                    </>
                  )}
                  <details className="field-help">
                    <summary>구매·취소·교환 안내</summary>
                    <p>
                      현장 수령 상품이에요. 이체 후 입금 확인과 수령,
                      취소·교환은 판매자에게 문의해 주세요. 확인되지 않는 계좌로
                      송금하지 마세요.
                    </p>
                  </details>
                </>
              )}
            </div>
          </>
        )}
      </main>
      <footer className="field-footer">
        CURI:T · 일상에서 만나는 작은 발견
      </footer>
    </div>
  )
}
