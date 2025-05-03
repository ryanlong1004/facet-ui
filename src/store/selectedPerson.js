import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSelectedPersonStore = defineStore('selectedPerson', () => {
  // State: Holds the currently selected person
  const selectedPerson = ref(null)

  // Action: Set the selected person
  const setSelectedPerson = (person) => {
    selectedPerson.value = person
  }

  // Action: Clear the selected person
  const clearSelectedPerson = () => {
    selectedPerson.value = null
  }

  return {
    selectedPerson,
    setSelectedPerson,
    clearSelectedPerson,
  }
})
