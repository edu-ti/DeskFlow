import { ref } from 'vue'

export type DialogMode = 'confirm' | 'prompt' | 'alert'
export type DialogType = 'danger' | 'warning' | 'info' | 'success'

export interface DialogOptions {
  title?: string;
  message: string;
  mode?: DialogMode;
  type?: DialogType;
  confirmText?: string;
  cancelText?: string;
  placeholder?: string;
  defaultValue?: string;
  inputLabel?: string;
  required?: boolean;
}

const isOpen = ref(false)
const options = ref<DialogOptions>({
  title: '',
  message: '',
  mode: 'confirm',
  type: 'danger',
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  placeholder: '',
  defaultValue: '',
  inputLabel: '',
  required: true,
})
const inputValue = ref('')
const inputError = ref('')

let resolvePromise: ((val: any) => void) | null = null

export function useConfirm() {
  const confirm = (opts: string | DialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      const config: DialogOptions = typeof opts === 'string' ? { message: opts } : opts
      options.value = {
        title: config.title || 'Confirmação',
        message: config.message,
        mode: 'confirm',
        type: config.type || 'danger',
        confirmText: config.confirmText || (config.type === 'danger' ? 'Excluir' : 'Confirmar'),
        cancelText: config.cancelText || 'Cancelar',
      }
      inputValue.value = ''
      inputError.value = ''
      resolvePromise = resolve
      isOpen.value = true
    })
  }

  const prompt = (opts: string | DialogOptions): Promise<string | null> => {
    return new Promise((resolve) => {
      const config: DialogOptions = typeof opts === 'string' ? { message: opts } : opts
      options.value = {
        title: config.title || 'Informação Necessária',
        message: config.message,
        mode: 'prompt',
        type: config.type || 'info',
        confirmText: config.confirmText || 'Salvar',
        cancelText: config.cancelText || 'Cancelar',
        placeholder: config.placeholder || 'Digite aqui...',
        defaultValue: config.defaultValue || '',
        inputLabel: config.inputLabel || '',
        required: config.required !== false,
      }
      inputValue.value = config.defaultValue || ''
      inputError.value = ''
      resolvePromise = resolve
      isOpen.value = true
    })
  }

  const alert = (opts: string | DialogOptions): Promise<void> => {
    return new Promise((resolve) => {
      const config: DialogOptions = typeof opts === 'string' ? { message: opts } : opts
      options.value = {
        title: config.title || 'Aviso',
        message: config.message,
        mode: 'alert',
        type: config.type || 'info',
        confirmText: config.confirmText || 'OK',
        cancelText: '',
      }
      inputValue.value = ''
      inputError.value = ''
      resolvePromise = () => resolve()
      isOpen.value = true
    })
  }

  const handleConfirm = () => {
    if (options.value.mode === 'prompt') {
      if (options.value.required && !inputValue.value.trim()) {
        inputError.value = 'Este campo é obrigatório.'
        return
      }
      isOpen.value = false
      if (resolvePromise) resolvePromise(inputValue.value.trim())
      resolvePromise = null
      return
    }

    isOpen.value = false
    if (resolvePromise) resolvePromise(true)
    resolvePromise = null
  }

  const handleCancel = () => {
    isOpen.value = false
    if (resolvePromise) {
      if (options.value.mode === 'prompt') {
        resolvePromise(null)
      } else {
        resolvePromise(false)
      }
    }
    resolvePromise = null
  }

  return {
    isOpen,
    options,
    inputValue,
    inputError,
    confirm,
    prompt,
    alert,
    handleConfirm,
    handleCancel,
  }
}
