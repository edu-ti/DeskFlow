<template>
  <div class="max-w-6xl mx-auto">
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-2xl font-bold text-df-text">All Tickets</h1>
        <p class="text-df-text-muted text-sm mt-1">Manage and respond to customer requests</p>
      </div>
      <button class="bg-df-primary hover:bg-df-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-df-primary/20">
        <PlusIcon class="w-4 h-4" />
        New Ticket
      </button>
    </div>

    <!-- Empty State for now -->
    <div class="glass-panel rounded-xl p-12 text-center mt-10">
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 text-df-text-muted mb-4">
        <InboxIcon class="w-8 h-8" />
      </div>
      <h3 class="text-lg font-medium text-df-text">No tickets found</h3>
      <p class="text-sm text-df-text-muted mt-2 max-w-sm mx-auto">
        Your queue is empty right now. When customers submit new tickets, they will appear here.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus as PlusIcon, Inbox as InboxIcon } from 'lucide-vue-next'
</script>
