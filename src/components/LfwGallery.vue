<script setup>
import { ref, onMounted } from 'vue'
import ImageGallery from './ImageGallery.vue'
import PaginationControls from './PaginationControls.vue'
import LoadingOverlay from './LoadingOverlay.vue'

const images = ref([])
const selectedImages = ref([])
const viewMode = ref('grid') // 'grid' or 'list'
const currentPage = ref(1) // Current page number
const totalPages = ref(1) // Total number of pages
const pageLength = ref(12) // Number of images per page
const loading = ref(false) // Loading state

const fetchImages = async () => {
  loading.value = true
  try {
    const response = await fetch(`http://0.0.0.0:5000/faces/?page_number=${currentPage.value}&page_length=${pageLength.value}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    images.value = data.faces
    totalPages.value = data.total_pages
  } catch (error) {
    console.error('Error fetching images:', error)
  } finally {
    loading.value = false
  }
}

const toggleSelection = (image) => {
  const index = selectedImages.value.findIndex((selected) => selected.url === image.url)
  if (index === -1) {
    selectedImages.value.push(image)
  } else {
    selectedImages.value.splice(index, 1)
  }
}

const isImageSelected = (image) => {
  return selectedImages.value.some((selected) => selected.url === image.url)
}

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    fetchImages()
  }
}

onMounted(() => {
  fetchImages()
})
</script>

<template>
  <div>
    <LoadingOverlay v-if="loading" />

    <div class="view-toggle">
      <button @click="viewMode = 'grid'" :class="{ active: viewMode === 'grid' }">Grid View</button>
      <button @click="viewMode = 'list'" :class="{ active: viewMode === 'list' }">List View</button>
    </div>

    <ImageGallery :images="images" :viewMode="viewMode" :isImageSelected="isImageSelected"
      @toggleSelection="toggleSelection" />

    <PaginationControls :currentPage="currentPage" :totalPages="totalPages" @goToPage="goToPage" />

    <div class="selected-images">
      <h3>Selected Images:</h3>
      <ul>
        <li v-for="image in selectedImages" :key="image.url">{{ image.filename }}</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.view-toggle {
  margin-bottom: 1rem;
}

.view-toggle button {
  margin-right: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  cursor: pointer;
  background-color: #f0f0f0;
  border-radius: 4px;
}

.view-toggle button.active {
  background-color: #007bff;
  color: white;
}

.selected-images {
  margin-top: 2rem;
}

.selected-images ul {
  list-style: none;
  padding: 0;
}

.selected-images li {
  margin: 0.5rem 0;
}
</style>
