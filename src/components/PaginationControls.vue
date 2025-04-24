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
  <div class="pagination">
    <button :disabled="currentPage === 1" @click="$emit('goToPage', currentPage - 1)">Previous</button>
    <span>Page {{ currentPage }} of {{ totalPages }}</span>
    <button :disabled="currentPage === totalPages" @click="$emit('goToPage', currentPage + 1)">Next</button>
  </div>
</template>

<style scoped>
.pagination {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}

.pagination button {
  padding: 0.5rem 1rem;
  border: none;
  cursor: pointer;
  background-color: #f0f0f0;
  border-radius: 4px;
}

.pagination button:disabled {
  background-color: #e0e0e0;
  cursor: not-allowed;
}
</style>
