import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSelectedFacesStore = defineStore('selectedImages', () => {
  // State: Holds the selected images
  const selectedFaces = ref([])

  // Action: Toggle the selection of an image
  const toggleFaceSelection = (image) => {
    const index = selectedFaces.value.findIndex((selected) => selected.url === image.url)
    if (index === -1) {
      selectedFaces.value.push(image)
    } else {
      selectedFaces.value.splice(index, 1)
    }
  }

  // Getter: Check if an image is selected
  const isFaceSelected = (image) => {
    return selectedFaces.value.some((selected) => selected.url === image.url)
  }

  return {
    selectedImages: selectedFaces,
    toggleImageSelection: toggleFaceSelection,
    isImageSelected: isFaceSelected,
  }
})
