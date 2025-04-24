<script setup>
import { ref, onMounted } from 'vue'
import ImageItem from './ImageItem.vue'

const images = ref([])
const selectedImages = ref([])
const viewMode = ref('grid') // 'grid' or 'list'
const currentPage = ref(1) // Current page number
const totalPages = ref(1) // Total number of pages
const pageLength = ref(12) // Number of images per page
const loading = ref(false) // Loading state

const fetchImages = async () => {
  loading.value = true // Show loading overlay
  try {
    const response = await fetch(`http://0.0.0.0:5000/faces/?page_number=${currentPage.value}&page_length=${pageLength.value}`) // Fetch from the backend
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    images.value = data.faces // Assuming the backend returns an object with `faces` and `total_pages`
    totalPages.value = data.total_pages // Dynamically set total pages from backend response
    if (images.value.length === 0) {
      console.warn('No images found for the current page.')
    }
  } catch (error) {
    console.error('Error fetching images:', error)
  } finally {
    loading.value = false // Hide loading overlay
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
    <!-- Loading Overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
      <p>Loading images...</p>
    </div>

    <!-- View Toggle Buttons -->
    <div class="view-toggle">
      <button @click="viewMode = 'grid'" :class="{ active: viewMode === 'grid' }">Grid View</button>
      <button @click="viewMode = 'list'" :class="{ active: viewMode === 'list' }">List View</button>
    </div>

    <!-- Image Gallery -->
    <div v-if="images.length === 0 && !loading">No images found.</div>
    <div v-else :class="['gallery', viewMode]">
      <ImageItem v-for="image in images" :key="image.url" :image="image" :isSelected="isImageSelected(image)"
        @select="toggleSelection" />
    </div>

    <!-- Pagination Controls -->
    <div class="pagination">
      <button :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">Previous</button>
      <span>Page {{ currentPage }} of {{ totalPages }}</span>
      <button :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">Next</button>
    </div>

    <!-- Selected Images List -->
    <div class="selected-images">
      <h3>Selected Images:</h3>
      <ul>
        <li v-for="image in selectedImages" :key="image.url">{{ image.filename }}</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
/* Loading Overlay */
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

/* View Toggle Buttons */
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

/* Gallery Styles */
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

/* Pagination Controls */
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

/* Selected Images List */
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
