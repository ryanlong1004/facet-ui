<template>
  <div v-if="loading"
    class="fixed inset-0 bg-black bg-opacity-60 flex flex-col justify-center items-center z-50 pointer-events-auto">
    <div class="w-12 h-12 border-4 border-gray-300 border-t-white rounded-full animate-spin"></div>
    <p class="text-white mt-4">Loading images...</p>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

defineProps({
  loading: {
    type: Boolean,
    required: true
  }
})
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid rgba(255, 255, 255, 0.3);
  border-top: 5px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>
