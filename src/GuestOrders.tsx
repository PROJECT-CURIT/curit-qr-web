import { useEffect, useState } from "react"
import {
  CommerceError,
  commerceRequest,
  readPaidOrder,
  type PaidOrder,
} from "./commerce"
import { projects } from "./catalog"

type Props = {
  phone: string
  onOpen: (order: PaidOrder) => void
  onExpired: () => void
}
export default function GuestOrders({ phone, onOpen, onExpired }: Props) {
  const [orders, setOrders] = useState<PaidOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    setLoading(true)
    setError("")
    commerceRequest("/api/orders")
      .then((result) => {
        if (!Array.isArray(result?.orders))
          throw new Error("주문 내역을 확인하지 못했어요. 다시 시도해 주세요.")
        const parsed = result.orders.map(readPaidOrder)
        if (active) setOrders(parsed)
      })
      .catch((failure) => {
        if (!active) return
        if (failure instanceof CommerceError && failure.status === 401)
          onExpired()
        else
          setError(
            failure instanceof Error
              ? failure.message
              : "주문 내역을 불러오지 못했어요.",
          )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [attempt, onExpired])
  const masked = phone.slice(0, 3) + " · **** · " + phone.slice(-4)
  return (
    <main className="guest-orders">
      <div className="orders-heading">
        <span className="section-kicker">MY ORDERS</span>
        <h1>나의 작품 주문</h1>
        <p>{masked} 번호로 주문한 작품을 확인해 보세요.</p>
      </div>
      {loading ? (
        <div className="session-loading" role="status">
          <span className="loading-spinner" />
          주문 내역을 불러오고 있어요.
        </div>
      ) : error ? (
        <div className="orders-empty">
          <p role="alert">{error}</p>
          <button
            className="secondary-button"
            onClick={() => setAttempt(attempt + 1)}
          >
            다시 불러오기
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="orders-empty">
          <h2>아직 주문한 작품이 없어요.</h2>
          <p>
            마음에 닿은 작품을 만나보세요.
            <br />
            결제 후에는 여기서 주문 번호와 수령 안내를 확인할 수 있어요.
          </p>
        </div>
      ) : (
        <div className="owned-orders">
          {orders.map((order) => {
            const project = projects.find((item) =>
              item.goods.some(
                (_, index) => `${item.id}-${index}` === order.artworkId,
              ),
            )
            const item = order.snapshot
              ? {
                  name: order.snapshot.product.name,
                  img: order.snapshot.product.image,
                }
              : project?.goods[Number(order.artworkId.split("-")[1])]
            return (
              <button
                key={order.id}
                className="owned-order"
                onClick={() => onOpen(order)}
              >
                <div className="order-card-top">
                  <span>
                    {order.snapshot
                      ? "저장된 주문"
                      : order.simulated
                        ? "주문 접수"
                        : "결제 완료"}
                  </span>
                  <small>{order.id}</small>
                </div>
                <div className="order-product">
                  {item?.img && <img src={item.img} alt={item.name} />}
                  <div>
                    {order.snapshot && (
                      <small>{order.snapshot.store.name}</small>
                    )}
                    <strong>{item?.name || "주문 작품"}</strong>
                    <p>
                      {order.quantity}개 ·{" "}
                      {order.amount.toLocaleString("ko-KR")}원
                    </p>
                    <small>
                      {order.pickupMode === "exhibition"
                        ? "전시 종료 후 현장 수령"
                        : "카페 방문 수령"}
                    </small>
                  </div>
                </div>
                <span className="order-card-action">
                  주문 내역 · 수령 안내 보기 →
                </span>
              </button>
            )
          })}
        </div>
      )}
      <p className="orders-note">
        매장에 방문해 결제 내역을 보여 주시면 작품을 수령할 수 있어요.
      </p>
    </main>
  )
}
