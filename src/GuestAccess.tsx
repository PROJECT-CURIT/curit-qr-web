import { useEffect, useState } from "react"
import { commerceRequest, isPresentation } from "./commerce"

type Props = {
  loading: boolean
  serviceError: string
  onVerified: (phone: string) => void
}

export default function GuestAccess({
  loading,
  serviceError,
  onVerified,
}: Props) {
  const [phone, setPhone] = useState("")
  const [consent, setConsent] = useState(false)
  const [remember, setRemember] = useState(true)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const phoneValid = /^01[016789]\d{7,8}$/.test(phone)
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) setOpen(false)
    }
    window.addEventListener("keydown", close)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener("keydown", close)
    }
  }, [open, busy])
  const confirm = async () => {
    if (busy || !phoneValid || !consent) return
    setBusy(true)
    setMessage("")
    try {
      const result = await commerceRequest("/api/auth/identity/start", {
        phone,
        remember,
        consent: true,
        returnUrl: window.location.href,
      })
      if (isPresentation || result?.verified === true) {
        const session = await commerceRequest("/api/auth/session")
        if (session?.verified !== true || session.phone !== phone)
          throw new Error("브라우저 저장 설정을 확인해 주세요.")
        onVerified(phone)
      } else {
        if (typeof result.authUrl !== "string")
          throw new Error("연락처 확인 창을 열지 못했어요. 다시 시도해 주세요.")
        const destination = new URL(result.authUrl, window.location.origin)
        const hosts = [
          "niceid.co.kr",
          "nice.checkplus.co.kr",
          "mobileauth.kcb.co.kr",
          "sci.co.kr",
        ]
        if (
          destination.origin !== window.location.origin &&
          (destination.protocol !== "https:" ||
            !hosts.some(
              (host) =>
                destination.hostname === host ||
                destination.hostname.endsWith("." + host),
            ))
        )
          throw new Error("연락처 확인 주소를 확인하지 못했어요.")
        window.location.assign(destination.href)
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "다시 시도해 주세요.")
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="app app-access">
      <header className="header">
        <span className="wordmark" aria-label="큐릿">
          <span className="brand-logo" aria-hidden="true">
            CURI:T
          </span>
        </span>
      </header>
      <main className="guest-access">
        <div className="access-symbol">큐릿</div>
        <h1>
          마음에 닿은 작품을,
          <br />
          당신의 일상으로.
        </h1>
        <p className="access-intro">
          주문 안내를 받을 휴대폰 번호를 확인해 주세요.
        </p>
        {serviceError && (
          <p className="access-message" role="alert">
            {serviceError}
          </p>
        )}
        {loading ? (
          <div className="session-loading" role="status">
            <span className="loading-spinner" />
            잠시만 기다려 주세요.
          </div>
        ) : (
          <form
            className="access-form"
            onSubmit={(event) => {
              event.preventDefault()
              if (phoneValid && consent) {
                setMessage("")
                setOpen(true)
              }
            }}
          >
            <label htmlFor="guest-phone">휴대폰 번호</label>
            <input
              id="guest-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="010-0000-0000"
              value={phone}
              maxLength={13}
              required
              onChange={(event) =>
                setPhone(event.target.value.replace(/\D/g, ""))
              }
            />
            <label className="access-check">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
              />
              <span>
                주문 안내를 위한 개인정보 이용 동의 <b>(필수)</b>
              </span>
            </label>
            <details className="access-policy">
              <summary>이용 안내</summary>
              <p>
                휴대폰 번호는 주문 안내와 주문 내역 확인에 사용됩니다. 연락처
                정보는 유지 기간까지, 거래 기록은 관련 법령에 따라 보관됩니다.
              </p>
            </details>
            <label className="access-check remember-check">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              <span>이 기기에서 연락처 유지</span>
            </label>
            <button
              className="primary"
              disabled={!phoneValid || !consent}
              type="submit"
            >
              휴대폰으로 시작하기 <span aria-hidden="true">→</span>
            </button>
          </form>
        )}
        <div className="access-footer">공간과 예술 사이, 큐릿</div>
      </main>
      {open && (
        <div
          className="modal-backdrop"
          onClick={() => {
            if (!busy) setOpen(false)
          }}
        >
          <section
            className="modal identity-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="identity-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close icon-button"
              aria-label="닫기"
              disabled={busy}
              onClick={() => setOpen(false)}
            >
              ×
            </button>
            <span className="identity-kicker">연락처 확인</span>
            <h2 id="identity-title">
              주문 안내 연락처를
              <br />
              확인해 주세요.
            </h2>
            <p className="hint">
              통신사 본인인증이 아닌 비회원 주문 연락처 확인 절차입니다.
            </p>
            <div className="identity-phone">
              {phone.slice(0, 3)}-{phone.slice(3, -4)}-{phone.slice(-4)}
            </div>
            {message && (
              <p className="access-message" role="status">
                {message}
              </p>
            )}
            <button className="primary" onClick={confirm} disabled={busy}>
              {busy ? "확인 중…" : "확인하고 계속하기"}
            </button>
          </section>
        </div>
      )}
    </div>
  )
}
