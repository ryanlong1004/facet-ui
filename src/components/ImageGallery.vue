<script setup>
import ImageItem from './ImageItem.vue'
import { defineProps, defineEmits } from 'vue'

defineProps({
  images: {
    type: Array,
    required: true
  },
  viewMode: {
    type: String,
    required: true
  },
  isImageSelected: {
    type: Function,
    required: true
  }
})

defineEmits(['toggleSelection'])
</script>

<template>

  <div :class="[
    'gap-4',
    viewMode === 'grid' ? 'grid grid-cols-5' : 'flex flex-col'
  ]">

    <ImageItem v-for="image in images" :key="image.url" :image="image" :isSelected="isImageSelected(image)"
      @select="$emit('toggleSelection', image)" />
  </div>
</template>

<style scoped>
/* No additional styles needed as Tailwind handles layout */
</style>
