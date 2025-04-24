import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSelectedImagesStore = defineStore('selectedImages', () => {
  const selectedImages = ref([])

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

  return {
    selectedImages,
    toggleSelection,
    isImageSelected,
  }
})
