<template>
  <ToastContainer />
  <GlobalDialog />
  <router-view></router-view>
</template>

<script setup lang="ts">
import ToastContainer from './components/ToastContainer.vue'
import GlobalDialog from './components/ui/GlobalDialog.vue'
</script>
