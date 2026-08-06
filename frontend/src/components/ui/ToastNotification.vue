<template>
  <transition
    enter-active-class="transform ease-out duration-300 transition"
    enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
    enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
    leave-active-class="transition ease-in duration-100"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div v-if="notification" class="fixed bottom-4 right-4 z-50 pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-df-card shadow-lg ring-1 ring-black ring-opacity-5">
      <div class="p-4 border border-white/10 rounded-lg bg-df-card">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <BellIcon class="h-6 w-6 text-df-accent" aria-hidden="true" />
          </div>
          <div class="ml-3 w-0 flex-1 pt-0.5">
            <p class="text-sm font-medium text-white">{{ notification.title }}</p>
            <p class="mt-1 text-sm text-df-text-muted">{{ notification.message }}</p>
          </div>
          <div class="ml-4 flex flex-shrink-0">
            <button
              type="button"
              @click="$emit('close')"
              class="inline-flex rounded-md bg-df-card text-df-text-muted hover:text-white focus:outline-none focus:ring-2 focus:ring-df-primary focus:ring-offset-2"
            >
              <span class="sr-only">Close</span>
              <XIcon class="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div class="mt-3 flex space-x-3" v-if="notification.ticketId">
          <router-link :to="`/tickets/${notification.ticketId}`" @click="$emit('close')" class="text-sm font-medium text-df-primary hover:text-df-accent transition-colors">
            View Ticket #{{ notification.ticketId }}
          </router-link>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { Bell as BellIcon, X as XIcon } from 'lucide-vue-next'

defineProps<{
  notification: { title: string, message: string, ticketId: number | null } | null
}>()

defineEmits(['close'])
</script>
