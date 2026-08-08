import { ref } from 'vue'

export interface ToastMessage {
  id: number
  title: string
  message?: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration?: number
}

const toasts = ref<ToastMessage[]>([])
let nextId = 1

export function useToast() {
  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = nextId++
    toasts.value.push({ ...toast, id })
    if (toast.duration !== 0) {
      setTimeout(() => removeToast(id), toast.duration || 4000)
    }
  }
  
  const removeToast = (id: number) => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  const success = (title: string, message?: string) => addToast({ title, message, type: 'success' })
  const error = (title: string, message?: string) => addToast({ title, message, type: 'error' })
  const info = (title: string, message?: string) => addToast({ title, message, type: 'info' })
  const warning = (title: string, message?: string) => addToast({ title, message, type: 'warning' })

  return { toasts, addToast, removeToast, success, error, info, warning }
}
