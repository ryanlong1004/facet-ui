import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useActiveFacesStore = defineStore('activeFaces', () => {
  const activeFaces = ref([]) // Reactive array to store active faces

  const setActiveFaces = (faces) => {
    activeFaces.value = faces // Update the reactive state
  }

  const clearActiveFaces = () => {
    activeFaces.value = [] // Clear the active faces
  }

  return {
    activeFaces,
    setActiveFaces,
    clearActiveFaces,
  }
})
