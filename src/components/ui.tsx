import type { ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react'

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' | 'outline' }) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none'
  const styles = {
    primary: 'bg-brand-500 text-white hover:bg-brand-600',
    outline:
      'border border-brand-500 text-brand-600 hover:bg-brand-50 dark:text-brand-100 dark:border-brand-500 dark:hover:bg-brand-500/15',
    ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  }[variant]
  return (
    <button className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  )
}

export function Input({ label, className = '', ...props }: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>}
      <input
        className={`w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-brand-500/30 ${className}`}
        {...props}
      />
    </label>
  )
}

export function Textarea({ label, className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>}
      <textarea
        className={`w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-brand-500/30 ${className}`}
        {...props}
      />
    </label>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 dark:bg-slate-800 dark:ring-slate-700 dark:shadow-none ${className}`}
    >
      {children}
    </div>
  )
}

export function Alert({ children, type = 'error' }: { children: ReactNode; type?: 'error' | 'success' | 'info' }) {
  const styles = {
    error: 'bg-red-50 text-red-700 ring-red-100 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30',
    success: 'bg-green-50 text-green-700 ring-green-100 dark:bg-green-500/10 dark:text-green-300 dark:ring-green-500/30',
    info: 'bg-blue-50 text-blue-700 ring-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/30',
  }[type]
  return <div className={`rounded-xl px-4 py-3 text-sm ring-1 ${styles}`}>{children}</div>
}

export function Spinner() {
  return (
    <div className="flex h-40 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand-500 dark:border-slate-700 dark:border-t-brand-500" />
    </div>
  )
}
