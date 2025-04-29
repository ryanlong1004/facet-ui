<script setup>
import { defineProps, defineEmits } from 'vue'

defineProps({
  image: {
    type: Object,
    required: true
  },
  isSelected: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select'])

const handleClick = (image) => {
  emit('select', image)
}
</script>

<template>
  <div class="relative cursor-pointer border-2 transition-all duration-300 rounded-lg" @click="handleClick">
    <div class="relative">
      <img :src="image.url" :alt="`Image: ${image.url}`" class="w-full h-auto rounded-lg shadow-md" />
      <div class="absolute top-2 left-2 z-10">
        <input type="checkbox" :checked="isSelected" readonly class="w-5 h-5 cursor-pointer" />
      </div>
      <div
        class="absolute inset-0 bg-black bg-opacity-60 text-white flex flex-col justify-center items-center opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-lg">
        <p v-for="(value, key) in image.attributes" :key="key" class="text-sm">
          <strong>{{ key.replace(/_/g, ' ') }}:</strong>
          <span>{{ typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : value }}</span>
        </p>
      </div>
    </div>
  </div>
</template>
