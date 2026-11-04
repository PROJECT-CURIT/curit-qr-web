import type { FieldProductId } from "./fieldSaleConfig"

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim()

type AnalyticsWindow = Window & { dataLayer?: unknown[] }
let analyticsStarted = false

function gtag(..._args: unknown[]) {
  const analyticsWindow = window as AnalyticsWindow
  const dataLayer = (analyticsWindow.dataLayer ??= [])
  dataLayer.push(arguments)
}

export function trackFieldSale(
  event: "field_product_view" | "field_checkout_open",
  productId: FieldProductId,
) {
  if (!measurementId || !/^G-[A-Z0-9]+$/.test(measurementId)) return

  if (!analyticsStarted) {
    analyticsStarted = true
    gtag("js", new Date())
    gtag("config", measurementId, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    })
    const script = document.createElement("script")
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
    document.head.append(script)
  }

  const productUrl = new URL(location.pathname, location.origin)
  productUrl.searchParams.set("buy", productId)
  gtag("event", event, {
    send_to: measurementId,
    product_id: productId,
    page_location: productUrl.href,
  })
}
