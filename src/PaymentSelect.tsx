import { useEffect, useId, useRef, useState } from 'react';

type Option = { value: string; label: string };
type Props = { label: string; value: string; options: Option[]; onChange: (value: string) => void; placeholder?: string };

export default function PaymentSelect({ label, value, options, onChange, placeholder = '선택해 주세요' }: Props) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const selected = options.find(option => option.value === value);
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);
  useEffect(() => {
    if (open) document.getElementById(`${id}-option-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [open, active, id]);
  useEffect(() => {
    if (!open || !window.matchMedia('(min-width: 681px)').matches) return;
    const frame = requestAnimationFrame(() => {
      document.getElementById(`${id}-list`)?.scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    });
    return () => cancelAnimationFrame(frame);
  }, [open, id]);
  const select = (index: number) => { onChange(options[index].value); setOpen(false); };
  return <div className="payment-select" ref={root}><span className="select-label" id={`${id}-label`}>{label}</span><button className={`select-trigger ${open ? 'open' : ''}`} type="button" role="combobox" aria-labelledby={`${id}-label`} aria-expanded={open} aria-controls={`${id}-list`} aria-haspopup="listbox" aria-activedescendant={open ? `${id}-option-${active}` : undefined} onClick={() => { setActive(Math.max(0, options.findIndex(option => option.value === value))); setOpen(!open); }} onBlur={event => { if (!root.current?.contains(event.relatedTarget as Node)) setOpen(false); }} onKeyDown={event => {
    if (event.key === 'Escape') { setOpen(false); return; }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      if (!open) { setActive(Math.max(0, options.findIndex(option => option.value === value))); setOpen(true); return; }
      setActive(index => event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length);
    } else if ((event.key === 'Enter' || event.key === ' ') && open) { event.preventDefault(); select(active); }
    else if (event.key === 'Tab') setOpen(false);
  }}><span className={!selected ? 'select-placeholder' : ''}>{selected?.label || placeholder}</span><span className="select-chevron" aria-hidden="true" /></button>{open && <div className="select-list" id={`${id}-list`} role="listbox" aria-labelledby={`${id}-label`}>{options.map((option, index) => <div key={option.value} id={`${id}-option-${index}`} role="option" aria-selected={option.value === value} className={`select-option ${index === active ? 'highlighted' : ''} ${option.value === value ? 'selected' : ''}`} onPointerDown={event => event.preventDefault()} onPointerMove={() => setActive(index)} onClick={() => select(index)}>{option.label}{option.value === value && <span aria-hidden="true">✓</span>}</div>)}</div>}</div>;
}
