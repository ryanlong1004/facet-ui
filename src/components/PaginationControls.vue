<script setup>
import { defineProps, defineEmits } from 'vue'

defineProps({
  currentPage: {
    type: Number,
    required: true
  },
  totalPages: {
    type: Number,
    required: true
  }
})

defineEmits(['goToPage'])
</script>

<template>
  <div class="flex justify-center items-center gap-4 mt-4">
    <button :disabled="currentPage === 1" @click="$emit('goToPage', currentPage - 1)"
      class="px-4 py-2 rounded-lg font-medium text-white bg-blue-500 hover:bg-blue-600 focus:ring-2 focus:ring-blue-300 focus:outline-none disabled:bg-gray-300 disabled:cursor-not-allowed transition">
      Previous
    </button>
    <span class="text-gray-700 font-medium">
      Page {{ currentPage }} of {{ totalPages }}
    </span>
    <button :disabled="currentPage === totalPages" @click="$emit('goToPage', currentPage + 1)"
      class="px-4 py-2 rounded-lg font-medium text-white bg-blue-500 hover:bg-blue-600 focus:ring-2 focus:ring-blue-300 focus:outline-none disabled:bg-gray-300 disabled:cursor-not-allowed transition">
      Next
    </button>
  </div>
</template>
