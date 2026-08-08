<template>
  <div class="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none w-full max-w-sm px-4 sm:px-0">
    <TransitionGroup name="toast">
      <div 
        v-for="toast in toasts" 
        :key="toast.id" 
        class="glass-panel p-4 rounded-xl flex items-start gap-3 pointer-events-auto cursor-pointer border-l-4 shadow-lg backdrop-blur-md"
        :class="{
          'border-l-green-400 bg-green-500/10': toast.type === 'success',
          'border-l-red-400 bg-red-500/10': toast.type === 'error',
          'border-l-blue-400 bg-blue-500/10': toast.type === 'info',
          'border-l-orange-400 bg-orange-500/10': toast.type === 'warning',
        }"
        @click="removeToast(toast.id)"
      >
        <div class="flex-1">
          <h4 class="text-sm font-bold text-df-text">{{ toast.title }}</h4>
          <p v-if="toast.message" class="text-xs text-df-text-muted mt-1">{{ toast.message }}</p>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useToast } from '../composables/useToast'

const { toasts, removeToast } = useToast()
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.toast-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
