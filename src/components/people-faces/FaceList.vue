<template>
  <div class="wrapper">
    <div class="menu-bar">
      Name Pencil Find All [active selected] select all | unselect all
    </div>
    <div class="face-list">
      <div class="face" v-for="(face, index) in activeFacesStore.activeFaces" :key="index" :style="{
        'margin-bottom': faceMargin,
        'margin-right': (index % clearMarginRightNth) === (clearMarginRightNth - 1) ? '5px' : faceMargin
      }">
        <div class="remove-face-button" v-if="removable" @click="handleRemove(face)">
          <i class="far fa-times">X</i>
        </div>

        <PersonFaceImage :image-url="face.imageUrl" :border-radius="faceBorderRadius" :height="faceHeight"
          :width="faceWidth" />

      </div>
    </div>
  </div>

</template>

<script setup>
import { ref, watch } from 'vue'
import { useSelectedPersonStore } from '@/store/selectedPerson'
import { useActiveFacesStore } from '@/store/activeFaces'
import { defineProps, defineEmits } from 'vue'
import PersonFaceImage from './PersonFaceImage.vue'

// Props
defineProps({
  faces: {
    type: Array,
    required: true
  },
  removable: {
    type: Boolean,
    default: false
  },
  faceBorderRadius: {
    type: String,
    default: '0px'
  },
  faceHeight: {
    type: String,
    default: '100px'
  },
  faceWidth: {
    type: String,
    default: '100px'
  },
  faceMargin: {
    type: String,
    default: '0px'
  },
  clearMarginRightNth: {
    type: Number,
    default: 3
  }
})

// Emits
const emit = defineEmits(['on-remove'])

// Store
const selectedPersonStore = useSelectedPersonStore()
const activeFacesStore = useActiveFacesStore()

// Methods
const handleRemove = (face) => {
  console.log('Removing face:', face)
  // if (removable) {
  //   emit('on-remove', face.face_id)
  // }
}

const fetchImages = async (person_id) => {
  try {
    const response = await fetch(`http://0.0.0.0:5000/faces/group/${person_id}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    console.log('Data fetched:', data) // Debugging
    activeFacesStore.setActiveFaces(data) // Use the store's method to update the state
  } catch (error) {
    console.error('Error fetching faces:', error)
  }
}

// Watcher for selectedPersonStore
watch(
  () => selectedPersonStore.selectedPerson, // Watch the selectedPerson state
  (newPerson, oldPerson) => {
    if (!newPerson) {
      console.log('No person selected')
      activeFacesStore.clearActiveFaces() // Clear faces if no person is selected
      return
    }
    console.log('Selected person changed:', { newPerson, oldPerson })
    fetchImages(newPerson.person_id) // Fetch images for the new person
  },
  { immediate: true } // Trigger the watcher immediately on component mount
)
</script>

<style lang="less" scoped>
@import '../../styles/_variables.less';
@import '../../styles/_mixins.less';

.wrapper {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
  height: 100%;
}

.face-list {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  background-color: blueviolet;
  min-width: 60vw;
  gap: 16px;

  .menu-bar {}

  .face-list-item {
    display: flex;
    flex-direction: row;
    width: 100px;
    height: 100px;
    border-radius: 8px;
    overflow: hidden;
    position: relative;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    &.selected {
      border: 2px solid blue;

      img {
        filter: brightness(0.8);
      }

      &::after,
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 255, 0.5);
        border-radius: 8px;
      }
    }
  }
}
</style>
