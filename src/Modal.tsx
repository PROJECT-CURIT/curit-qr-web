import { useEffect, useRef, type ReactNode } from "react"

type Props = {
  className?: string
  labelledBy: string
  busy?: boolean
  onClose: () => void
  children: ReactNode
}

export default function Modal({
  className = "",
  labelledBy,
  busy = false,
  onClose,
  children,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const state = useRef({ busy, onClose })
  state.current = { busy, onClose }

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const previousOverflow = document.body.style.overflow
    dialog.showModal()
    document.body.style.overflow = "hidden"
    const href = window.location.href
    const marker = labelledBy
    let mounted = true
    queueMicrotask(() => {
      if (mounted)
        window.history.pushState(
          { ...window.history.state, curitDialog: marker },
          "",
          href,
        )
    })
    const handleBack = () => {
      if (
        window.location.href !== href ||
        window.history.state?.curitDialog === marker
      )
        return
      if (state.current.busy) {
        window.history.pushState(
          { ...window.history.state, curitDialog: marker },
          "",
          href,
        )
      } else {
        state.current.onClose()
      }
    }
    window.addEventListener("popstate", handleBack)
    return () => {
      mounted = false
      window.removeEventListener("popstate", handleBack)
      if (
        window.location.href === href &&
        window.history.state?.curitDialog === marker
      )
        window.history.back()
      dialog.close()
      document.body.style.overflow = previousOverflow
    }
  }, [labelledBy])

  return (
    <dialog
      ref={ref}
      className={`modal ${className}`}
      aria-labelledby={labelledBy}
      aria-busy={busy}
      onCancel={(event) => {
        event.preventDefault()
        if (!busy) onClose()
      }}
      onClick={(event) => {
        if (busy || event.target !== event.currentTarget) return
        const { left, right, top, bottom } =
          event.currentTarget.getBoundingClientRect()
        if (
          event.clientX < left ||
          event.clientX > right ||
          event.clientY < top ||
          event.clientY > bottom
        )
          onClose()
      }}
    >
      {children}
    </dialog>
  )
}
