<template>
  <div class="wrapper">
    <!-- Menu Bar -->
    <div class="menu-bar">
      Name Pencil Find All [active selected] select all | unselect all
    </div>

    <!-- Face List -->
    <div class="face-list">
      <FaceItem v-for="(face, index) in activeFacesStore.activeFaces" :key="face.face_id" :face="face"
        :removable="removable" :face-border-radius="faceBorderRadius" :face-height="faceHeight" :face-width="faceWidth"
        :style="{
          marginBottom: faceMargin,
          marginRight: (index % clearMarginRightNth) === (clearMarginRightNth - 1) ? '5px' : faceMargin
        }" @remove="handleRemove" />
    </div>
  </div>
</template>

<script setup>
import { useSelectedPersonStore } from '@/store/selectedPerson'
import { useActiveFacesStore } from '@/store/activeFaces'
import { defineProps, defineEmits } from 'vue'
import { useFetchFaces } from '@/composables/useFetchFaces'
import FaceItem from './FaceItem.vue'

// Props
defineProps({
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

// Stores
const selectedPersonStore = useSelectedPersonStore()
const activeFacesStore = useActiveFacesStore()

// Methods
const handleRemove = (face) => {
  emit('on-remove', face)
}

// Fetch faces when the selected person changes
useFetchFaces(selectedPersonStore, activeFacesStore)
</script>

<style lang="less" scoped>
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
  gap: 16px;
}
</style>
