import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSelectedPersonStore = defineStore('selectedPerson', () => {
  const selectedPerson = ref(null) // Holds the currently selected person

  const setSelectedPerson = (person) => {
    selectedPerson.value = person
  }

  const clearSelectedPerson = () => {
    selectedPerson.value = null
  }

  return {
    selectedPerson,
    setSelectedPerson,
    clearSelectedPerson,
  }
})
