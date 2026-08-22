<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div 
        v-if="isOpen" 
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
        @click.self="handleCancel"
        @keydown.esc="handleCancel"
      >
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-2"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-2"
        >
          <div 
            v-if="isOpen"
            class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl shadow-slate-900/20 border border-gray-100 relative overflow-hidden"
            role="dialog"
            aria-modal="true"
          >
            <!-- Top Icon & Header -->
            <div class="flex items-start gap-4 mb-4">
              <div 
                class="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border"
                :class="iconContainerClasses"
              >
                <Trash2Icon v-if="options.type === 'danger' && options.mode !== 'prompt'" class="w-5 h-5 text-rose-600" />
                <AlertTriangleIcon v-else-if="options.type === 'warning'" class="w-5 h-5 text-amber-600" />
                <CheckCircle2Icon v-else-if="options.type === 'success'" class="w-5 h-5 text-emerald-600" />
                <HelpCircleIcon v-else-if="options.mode === 'prompt'" class="w-5 h-5 text-df-primary" />
                <InfoIcon v-else class="w-5 h-5 text-blue-600" />
              </div>

              <div class="flex-1 min-w-0 pt-0.5">
                <h3 class="text-base font-extrabold text-gray-900 leading-snug">
                  {{ options.title }}
                </h3>
                <p class="text-xs sm:text-sm text-gray-500 mt-1 leading-relaxed whitespace-pre-wrap">
                  {{ options.message }}
                </p>
              </div>

              <button 
                @click="handleCancel"
                class="text-gray-400 hover:text-gray-600 p-1 -mr-1 -mt-1 rounded-lg transition-colors cursor-pointer"
                title="Fechar"
              >
                <XIcon class="w-4 h-4" />
              </button>
            </div>

            <!-- Prompt Input (Mode Prompt) -->
            <form v-if="options.mode === 'prompt'" @submit.prevent="handleConfirm" class="mt-4 mb-5 space-y-2">
              <label v-if="options.inputLabel" class="block text-xs font-bold text-gray-700">
                {{ options.inputLabel }}
              </label>
              <input 
                ref="inputRef"
                v-model="inputValue"
                type="text"
                :placeholder="options.placeholder"
                class="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-df-primary focus:bg-white focus:ring-2 focus:ring-df-primary/20 transition-all font-medium"
                @keydown.enter.prevent="handleConfirm"
              />
              <p v-if="inputError" class="text-xs text-rose-600 font-semibold mt-1 animate-in fade-in">
                {{ inputError }}
              </p>
            </form>

            <!-- Action Buttons -->
            <div class="flex items-center justify-end gap-2.5 pt-2">
              <button 
                v-if="options.cancelText"
                type="button"
                @click="handleCancel"
                class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs sm:text-sm transition-all active:scale-95 cursor-pointer"
              >
                {{ options.cancelText }}
              </button>

              <button 
                type="button"
                @click="handleConfirm"
                :class="confirmButtonClasses"
                class="px-5 py-2 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                {{ options.confirmText }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { 
  Trash2 as Trash2Icon, 
  AlertTriangle as AlertTriangleIcon, 
  CheckCircle2 as CheckCircle2Icon, 
  Info as InfoIcon, 
  HelpCircle as HelpCircleIcon, 
  X as XIcon 
} from 'lucide-vue-next'
import { useConfirm } from '@/composables/useConfirm'

const { isOpen, options, inputValue, inputError, handleConfirm, handleCancel } = useConfirm()
const inputRef = ref<HTMLInputElement | null>(null)

watch(isOpen, async (open) => {
  if (open && options.value.mode === 'prompt') {
    await nextTick()
    inputRef.value?.focus()
    inputRef.value?.select()
  }
})

const iconContainerClasses = computed(() => {
  if (options.value.mode === 'prompt') {
    return 'bg-blue-50/80 border-blue-100 text-df-primary'
  }
  switch (options.value.type) {
    case 'danger':
      return 'bg-rose-50 border-rose-100 text-rose-600'
    case 'warning':
      return 'bg-amber-50 border-amber-100 text-amber-600'
    case 'success':
      return 'bg-emerald-50 border-emerald-100 text-emerald-600'
    default:
      return 'bg-blue-50 border-blue-100 text-blue-600'
  }
})

const confirmButtonClasses = computed(() => {
  if (options.value.type === 'danger' && options.value.mode !== 'prompt') {
    return 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
  }
  if (options.value.type === 'warning') {
    return 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
  }
  if (options.value.type === 'success') {
    return 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
  }
  return 'bg-df-primary hover:bg-df-primary-hover shadow-blue-500/20'
})
</script>
