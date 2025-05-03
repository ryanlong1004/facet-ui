import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', () => {
  // State: Holds the current count
  const count = ref(0)

  // Getter: Compute the double of the current count
  const doubleCount = computed(() => count.value * 2)

  // Action: Increment the count
  const increment = () => {
    count.value++
  }

  return {
    count,
    doubleCount,
    increment,
  }
})
