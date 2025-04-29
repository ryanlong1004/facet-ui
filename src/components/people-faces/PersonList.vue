<template>
  <div class="person-list flex flex-col gap-4">
    <!-- Search Bar -->
    <div class="search-bar flex items-center gap-2 p-4 bg-gray-100 sticky top-0 z-10">
      <input type="text" id="search" v-model="searchQuery" placeholder="Search by name..."
        class="p-2 border border-gray-300 rounded-lg w-full placeholder-gray-700" @input="filterPeople"
        aria-label="Search people by name" />
    </div>

    <!-- Person List -->
    <div class="person flex items-center gap-4 p-4 border rounded-lg cursor-pointer"
      :class="{ 'bg-blue-100': person.selected || person.person_id === selectedPersonId }"
      v-for="person in visiblePeople" :key="person.person_id" @click="handlePersonClick(person)">
      <PersonFaceImage :image-url="person.imageUrl" :border-radius="faceBorderRadius" :height="faceHeight"
        :width="faceWidth" />
      <div>
        {{ person.name }}
        <span v-if="showFaceCount" class="text-gray-500">({{ person.num_faces }})</span>
      </div>
    </div>

    <!-- Infinite Scroll Trigger -->
    <div ref="infiniteScrollTrigger" class="h-4">X</div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import PersonFaceImage from './PersonFaceImage.vue';

// Props
const props = defineProps({
  people: {
    type: Array,
    required: true,
  },
  currentPage: {
    type: Number,
    default: 1,
  },
  showFaceCount: {
    type: Boolean,
    default: true,
  },
  selectable: {
    type: Boolean,
    default: false,
  },
  selectedPersonId: {
    type: String,
    default: '',
  },
  faceBorderRadius: {
    type: String,
    default: '8px',
  },
  faceHeight: {
    type: String,
    default: '100px',
  },
  faceWidth: {
    type: String,
    default: '100px',
  },
});

// Emits
const emit = defineEmits(['on-select', 'on-filter', 'updatePage']);

// State
const searchQuery = ref('');
const visiblePeople = ref([]); // People currently visible in the list
const infiniteScrollTrigger = ref(null);

// Methods
const handlePersonClick = (person) => {
  if (props.selectable) {
    emit('on-select', person);
  }
};

const filterPeople = () => {
  emit('on-filter', searchQuery.value);
};

const loadMorePeople = () => {
  console.log('CALLED!');
  console.log(props.people.length); // Access the people prop
  console.log(props.people[0]);

  visiblePeople.value = [...visiblePeople.value, ...props.people];
};

const setupInfiniteScroll = () => {
  console.log('Setting up IntersectionObserver'); // Debugging
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      console.log('IntersectionObserver entry:', entry); // Debugging
      if (entry.isIntersecting) {
        console.log('Trigger is intersecting'); // Debugging
        emit('updatePage', props.currentPage + 1);
      }
    });
  });
  if (infiniteScrollTrigger.value) {
    observer.observe(infiniteScrollTrigger.value);
  } else {
    console.error('infiniteScrollTrigger ref is not found'); // Debugging
  }
};

// Watchers
watch(
  () => props.people,
  () => {
    console.log('People array length:', props.people.length);
    console.log('Current page:', props.currentPage);
    // Reset visible people and load the first page when the people array changes
    loadMorePeople();
  },
  { immediate: true }
);

// Lifecycle Hooks
onMounted(() => {
  setupInfiniteScroll();
});
</script>

<style scoped>
.person-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 80vh;
  /* Ensure the container has a fixed height */
  overflow-y: auto;
  /* Enable scrolling */
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background-color: #f9f9f9;
}

.person {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
}

.person:hover {
  background-color: #f0f8ff;
}

.person.active {
  background-color: #e6f7ff;
}
</style>
