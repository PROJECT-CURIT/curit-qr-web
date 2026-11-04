import React, { useEffect } from "react"

import ReactDOM from "react-dom/client"

import App from "./App"

import FieldSale from "./FieldSale"

import "./index.css"

function CuritPage() {
  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    const root = document.documentElement
    let keyboardVisible = false

    const update = () => {
      const layoutHeight = root.clientHeight
      const top = Math.max(0, viewport.offsetTop)
      const height = Math.min(layoutHeight, viewport.height)
      const focused = document.activeElement
      const editing =
        focused instanceof HTMLInputElement &&
        !focused.readOnly &&
        (focused.type === "text" || focused.type === "tel")
      // Keep the visible bounds during the closing animation, including when
      // focus moves from an input to the order confirmation dialog.
      keyboardVisible =
        Math.abs(viewport.scale - 1) < 0.01 &&
        layoutHeight - height > 80 &&
        (editing || keyboardVisible)
      root.toggleAttribute("data-keyboard-open", keyboardVisible)
      if (keyboardVisible) {
        root.style.setProperty("--keyboard-top", `${top}px`)
        root.style.setProperty("--keyboard-height", `${height}px`)
        root.style.setProperty(
          "--keyboard-inset",
          `${Math.max(0, layoutHeight - top - height)}px`,
        )
      }
    }

    viewport.addEventListener("resize", update)
    viewport.addEventListener("scroll", update)
    document.addEventListener("focusin", update)
    update()
    return () => {
      viewport.removeEventListener("resize", update)
      viewport.removeEventListener("scroll", update)
      document.removeEventListener("focusin", update)
      root.removeAttribute("data-keyboard-open")
      for (const property of [
        "--keyboard-top",
        "--keyboard-height",
        "--keyboard-inset",
      ])
        root.style.removeProperty(property)
    }
  }, [])

  return new URLSearchParams(location.search).has("buy") ? (
    <FieldSale />
  ) : (
    <App />
  )
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <CuritPage />
  </React.StrictMode>,
)
