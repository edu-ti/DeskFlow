<template>
  <div class="min-h-screen bg-df-bg flex flex-col items-center justify-center p-4 relative overflow-hidden">
    <!-- Background Decorators -->
    <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-df-primary/20 rounded-full mix-blend-screen filter blur-[100px] opacity-50 animate-blob"></div>
    <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-df-accent/20 rounded-full mix-blend-screen filter blur-[100px] opacity-50 animate-blob animation-delay-2000"></div>

    <div class="glass-panel p-12 rounded-3xl z-10 flex flex-col items-center text-center max-w-lg w-full">
      <div class="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center text-white/50 mb-8 border border-white/10">
        <SearchXIcon class="w-12 h-12" />
      </div>
      
      <h1 class="text-4xl font-bold text-df-text mb-4">404</h1>
      <h2 class="text-xl text-df-text font-medium mb-2">Página não encontrada</h2>
      <p class="text-df-text-muted mb-8">
        Ops! A página que você está procurando não existe ou foi movida.
      </p>
      
      <router-link to="/" class="btn-primary flex items-center justify-center w-full">
        <HomeIcon class="w-5 h-5 mr-2" />
        Voltar para o Início
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SearchX as SearchXIcon, Home as HomeIcon } from 'lucide-vue-next'
</script>
