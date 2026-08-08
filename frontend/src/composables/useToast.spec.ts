import { describe, it, expect, beforeEach } from 'vitest'
import { useToast } from './useToast'

describe('useToast', () => {
  beforeEach(() => {
    // Clear toasts before each test
    const { toasts } = useToast()
    toasts.value = []
  })

  it('should add a success toast', () => {
    const { toasts, success } = useToast()
    success('Success Message')
    
    expect(toasts.value.length).toBe(1)
    expect(toasts.value[0].title).toBe('Success Message')
    expect(toasts.value[0].type).toBe('success')
  })

  it('should add an error toast', () => {
    const { toasts, error } = useToast()
    error('Error Message')
    
    expect(toasts.value.length).toBe(1)
    expect(toasts.value[0].title).toBe('Error Message')
    expect(toasts.value[0].type).toBe('error')
  })

  it('should remove toast', () => {
    const { toasts, info, removeToast } = useToast()
    info('Test')
    
    expect(toasts.value.length).toBe(1)
    const id = toasts.value[0].id
    
    removeToast(id)
    expect(toasts.value.length).toBe(0)
  })
})
