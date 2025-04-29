<template>
  <div class="face-selection-count">
    <div class="count" v-if="numSelectedFaces > 0">{{ numSelectedFacesHumanized }} selected</div>
    <div class="selectors">
      <span class="selector" @click="selectAllFaces">Select All</span>
      |
      <span class="selector" @click="deselectedAllFaces">Deselect All</span>
    </div>
  </div>
</template>

<script>
import {
  mapGetters,
  mapMutations
} from 'vuex'
import { pluralize } from 'humanize-plus'

import { PEOPLE_FACES } from 'src/store/storeModules'
import {
  GET_SELECTED_FACES,
} from 'src/store/modules/people-faces/getters'

import {
  SELECT_ALL_FACES,
  RESET_FACE_SELECTIONS
} from 'src/store/modules/people-faces/mutations'

export default {
  name: 'face-selection-count',
  computed: {
    ...mapGetters(PEOPLE_FACES, {
      selectedFaces: GET_SELECTED_FACES
    }),
    numSelectedFaces () {
      return this.selectedFaces.length
    },
    numSelectedFacesHumanized () {
      return `${this.numSelectedFaces} ${pluralize(this.numSelectedFaces, 'face')}`
    }
  },
  methods: {
    ...mapMutations(PEOPLE_FACES, {
      selectAllFaces: SELECT_ALL_FACES,
      deselectedAllFaces: RESET_FACE_SELECTIONS
    })
  }
}
</script>

<style lang="less" scoped>
@import '../../styles/_variables';
@import '../../styles/_mixins';

.face-selection-count {
  .flex-container-end();
  font-size: 11px;
  padding-right: 2px;
  .count {
    background-color: @color-accent;
    border-radius: 12px;
    color: @text-lighter;
    display: inline-block;
    margin-right: 5px;
    padding: 4px 8px;
  }
  .selectors {
    .flex-box();
    .selector {
      color: @text-medium;
      cursor: pointer;
      display: inline-block;
      font-weight: 600;
      padding: 0 4px;
      &:hover {
        color: @text-dark;
      }
    }
  }
}
</style>
