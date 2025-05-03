import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useActiveFacesStore = defineStore('activeFaces', () => {
  // State: Holds the currently active faces
  const activeFaces = ref([])

  // Action: Set the active faces
  const setActiveFaces = (faces) => {
    activeFaces.value = faces
  }

  // Action: Clear all active faces
  const clearActiveFaces = () => {
    activeFaces.value = []
  }

  return {
    activeFaces,
    setActiveFaces,
    clearActiveFaces,
  }
})
