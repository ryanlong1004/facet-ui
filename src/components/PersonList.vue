<template>
  <div class="person-list flex flex-col gap-4">
    <!-- Search Bar -->
    <SearchBar v-model="searchQuery" id="search" placeholder="Search by name..." aria-label="Search people by name"
      @update:modelValue="filterPeople" />

    <!-- Person List -->
    <div class="person-list">
      <PersonFaceImageSelectable v-for="person in activePersons" :key="person.person_id" :person="person"
        @select="handleSelect" />
    </div>

    <!-- Infinite Scroll Trigger -->
    <div ref="infiniteScrollTrigger" class="h-4">&#8203;</div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import SearchBar from './SearchBar.vue'
import PersonFaceImageSelectable from './PersonFaceImageSelectable.vue'
import { usePersonSelection } from '@/composables/usePersonSelection'
import { useActivePersonsStore } from '@/store/activePersons'

// Props
const props = defineProps({
  people: {
    type: Array,
    required: true
  },
  currentPage: {
    type: Number,
    default: 1
  },
  showFaceCount: {
    type: Boolean,
    default: true
  },
  selectable: {
    type: Boolean,
    default: false
  },
  selectedPersonId: {
    type: String,
    default: ''
  },
  faceBorderRadius: {
    type: String,
    default: '8px'
  },
  faceHeight: {
    type: String,
    default: '100px'
  },
  faceWidth: {
    type: String,
    default: '100px'
  }
})

// Emits
const emit = defineEmits(['on-select', 'on-filter', 'updatePage', 'select'])

// State
const searchQuery = ref('')
const visiblePeople = ref([]) // People currently visible in the list
const infiniteScrollTrigger = ref(null)

const filterPeople = () => {
  emit('on-filter', searchQuery.value)
}

const loadMorePeople = () => {
  console.log('CALLED!')
  console.log(props.people.length) // Access the people prop
  console.log(props.people[0])

  visiblePeople.value = [...visiblePeople.value, ...props.people]
}

const setupInfiniteScroll = () => {
  console.log('Setting up IntersectionObserver') // Debugging
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      console.log('IntersectionObserver entry:', entry) // Debugging
      if (entry.isIntersecting) {
        console.log('Trigger is intersecting') // Debugging
        emit('updatePage', props.currentPage + 1)
      }
    })
  })
  if (infiniteScrollTrigger.value) {
    observer.observe(infiniteScrollTrigger.value)
  } else {
    console.error('infiniteScrollTrigger ref is not found') // Debugging
  }
}

const { handleSelect } = usePersonSelection(emit)
const activePersons = useActivePersonsStore()


// Watchers
watch(
  () => props.people,
  () => {
    if (!props.people || props.people.length === 0) {
      return
    }
    console.log('People array length:', props.people.length)
    console.log('Current page:', props.currentPage)
    // Reset visible people and load the first page when the people array changes
    loadMorePeople()
  },
  { immediate: true }
)

// Lifecycle Hooks
onMounted(() => {
  setupInfiniteScroll()
})
</script>

<style scoped>
.person-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
</style>
