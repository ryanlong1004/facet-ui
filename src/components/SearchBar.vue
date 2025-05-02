<!-- filepath: /src/components/SearchBar.vue -->
<template>
  <div class="search-bar flex items-center gap-2 p-4 bg-gray-100 sticky top-0 z-10">
    <input type="text" :id="id" v-model="modelValue" :placeholder="placeholder"
      class="p-2 border border-gray-300 rounded-lg w-full placeholder-gray-700"
      @input="$emit('update:modelValue', modelValue)" :aria-label="ariaLabel" />
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

// Props
defineProps({
  modelValue: {
    type: String,
    required: true
  },
  id: {
    type: String,
    default: 'search'
  },
  placeholder: {
    type: String,
    default: 'Search...'
  },
  ariaLabel: {
    type: String,
    default: 'Search input'
  }
})

// Emits
defineEmits(['update:modelValue'])
</script>

<style scoped>
.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background-color: #f9f9f9;
}
</style>
