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
  <div class="image-item" :class="{ selected: isSelected }" @click="handleClick">
    <div class="image-container">
      <img :src="image.url" :alt="`Image: ${image.url}`" />
      <div class="checkbox-overlay">
        <input type="checkbox" :checked="isSelected" readonly />
      </div>
      <div class="overlay">
        <p v-for="(value, key) in image.attributes" :key="key" class="animated-text">
          <strong>{{ key.replace(/_/g, ' ') }}:</strong>
          <span>{{ typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : value }}</span>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.image-item {
  position: relative;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color 0.3s ease;
}

.image-item.selected {
  border-color: #007bff;
}

.image-container {
  position: relative;
}

.image-container img {
  width: 100%;
  height: auto;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.checkbox-overlay {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 10;
}

.checkbox-overlay input[type='checkbox'] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.overlay {
  position: absolute;
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
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 4px;
}

.image-container:hover .overlay {
  opacity: 1;
}
</style>
