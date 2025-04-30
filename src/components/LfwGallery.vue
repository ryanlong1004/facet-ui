<script setup>
import { ref, onMounted } from 'vue'
import { useSelectedImagesStore } from '../store/selectedImages'
import FaceList from './people-faces/FaceList.vue'
import ImageGallery from './ImageGallery.vue'
import PaginationControls from './PaginationControls.vue'
import LoadingOverlay from './LoadingOverlay.vue'
import PersonList from './people-faces/PersonList.vue'

const images = ref([])
const viewMode = ref('grid') // 'grid' or 'list'
const currentPage = ref(1) // Current page number
const totalPages = ref(1) // Total number of pages
const pageLength = ref(12) // Number of images per page
const loading = ref(false) // Loading state

const selectedImagesStore = useSelectedImagesStore()

const fetchImages = async () => {
  loading.value = true // Set loading to true before fetching
  try {
    // const response = await fetch(`http://0.0.0.0:5000/faces/?page_number=${currentPage.value}&page_length=${pageLength.value}`)
    const response = await fetch(`http://0.0.0.0:5000/people/?page_number=${currentPage.value}&page_length=${pageLength.value}`)
    // http://0.0.0.0:5000/people/?page_number=1&page_length=10
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    console.log('Data fetched:', data) // Debugging
    images.value = data.persons
    console.log(`HERE: ${data.persons}`)
    totalPages.value = data.total_pages
  } catch (error) {
    console.error('Error fetching images:', error)
  } finally {
    loading.value = false // Set loading to false after fetching
  }
}

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    fetchImages()
  }
}

onMounted(() => {
  goToPage(1)
})
</script>

<template>
  <div class="wrapper">
    <!-- Pass the loading state to the LoadingOverlay component -->


    <div class="header">() Known () Unknown A-Z ^Number of Faces Recent Re-analyze People</div>

    <div class="main">
      <PersonList :people="images" :current-page="currentPage" :pageLength="pageLength" @fetch-images="fetchImages"
        @toggleSelection="$emit('toggleSelection', $event)" @update-page="goToPage" />

      <FaceList :faces="images" @toggleSelection="$emit('toggleSelection', $event)" />

      <!-- <PaginationControls :currentPage="currentPage" :totalPages="totalPages" @goToPage="goToPage" /> -->
    </div>"


  </div>
</template>

<style scoped>
.wrapper {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  gap: 10px;
}

.main {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: 10px;
}

.header {

  background-color: #f8f9fa;
  color: black;
  padding: 20px;
  text-align: center;
  min-width: 100%;
  min-height: 2vh;
}

nav {
  background-color: (137, 236, 163);
}

.footer {
  background-color: #f8f9fa;
  padding: 20px;
  text-align: center;
  position: fixed;
  bottom: 0;
  width: 100%;
}
</style>
