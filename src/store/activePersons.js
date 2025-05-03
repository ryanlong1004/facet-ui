import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useActivePersonsStore = defineStore('activePersons', () => {
  const activePersons = ref([]) // Reactive array to store active Persons

  const setActivePersons = (Persons) => {
    activePersons.value = Persons // Update the reactive state
  }

  const clearActivePersons = () => {
    activePersons.value = [] // Clear the active Persons
  }

  return {
    activePersons,
    setActivePersons,
    clearActivePersons,
  }
})
