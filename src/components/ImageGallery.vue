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
  <div :class="['gallery', viewMode]">
    <ImageItem v-for="image in images" :key="image.url" :image="image" :isSelected="isImageSelected(image)"
      @select="$emit('toggleSelection', image)" />
  </div>
</template>

<style scoped>
.gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.gallery.grid .image-item {
  flex: 1 1 calc(25% - 1rem);
}

.gallery.list {
  flex-direction: column;
}

.gallery.list .image-item {
  flex: 1 1 100%;
}
</style>
