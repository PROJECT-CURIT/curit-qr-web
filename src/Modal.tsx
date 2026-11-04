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

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const previousOverflow = document.body.style.overflow
    dialog.showModal()
    document.body.style.overflow = "hidden"
    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
    }
  }, [])

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
