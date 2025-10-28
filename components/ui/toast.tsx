import * as React from "react"

export interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
}

export function toast(props: ToastProps) {
  // Simple toast implementation
  const toastEl = document.createElement('div')
  toastEl.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg border-2 border-cyan-500 bg-black/90 text-cyan-400 shadow-[0_0_30px_rgba(0,255,255,0.5)]`
  toastEl.textContent = props.message
  document.body.appendChild(toastEl)
  
  setTimeout(() => {
    toastEl.remove()
  }, 3000)
}
