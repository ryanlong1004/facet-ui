<template>
  <div class="person-timeline">
    <!--expanded view-->
    <span class="person-timeline__image" v-if="!collapseHorizontalTimelines">
      <div class="face-image timeline-face" :style="{ 'background-image': `url(${faceUrl})` }"></div>
      <img src="../../../assets/Combine.svg" class="group-into-icon">
      <button class="remove-face-button" @click="togglePersonOff"><i class="far fa-times"></i></button>
    </span>

    <div class="person-timeline__timeline-wrapper" v-if="!collapseHorizontalTimelines">
      <div class="person-timeline__filters">
        <div class="person-timeline__name">
          <span :innerHTML.prop="personName | highlightFilter({ type: CONSTANTS.HIGHLIGHT_TYPES.PEOPLE })">{{ personName }}</span>
          <el-tooltip
            :hide-after="2000"
            :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
            class="item"
            content="Click to edit person/faces"
            effect="dark"
            placement="top"
          >
            <button
              @click.stop="enterEditMode"
              class="edit-button"
              v-if="$hasScope(SCOPES.EDIT_PEOPLE)"
            >
              <i class="far fa-pencil"></i>
            </button>
          </el-tooltip>
        </div>
        <el-dropdown v-if="showEmotionsDropdown && currentEmotion">
          <span class="el-dropdown-link">
            {{ currentEmotion }} <i class="el-icon-arrow-down el-icon--right"></i>
          </span>
          <el-dropdown-menu slot="dropdown" class="person-emotion-dropdown">
            <el-dropdown-item
              v-for="emotion in emotions"
              :key="emotion"
              :divided="emotion === CONSTANTS.ALL_EMOTIONS"
            >
              <div @click="selectEmotion(emotion)">{{ emotion }}</div>
            </el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </div>
      <horizontal-timeline
        :items="currentTimeline"
      ></horizontal-timeline>
    </div>

    <!--collapsed view-->
    <div class="person-timeline__timeline-wrapper-compacted" v-if="collapseHorizontalTimelines">
      <div class="person-timeline__filters-compacted">
        <div class="person-timeline__name-compacted">
          <span :innerHTML.prop="personName | highlightFilter({ type: CONSTANTS.HIGHLIGHT_TYPES.PEOPLE })">{{ personName }}</span>
        </div>
      </div>
      <horizontal-timeline
        :items="currentTimeline"
        :is-insights="true"
      ></horizontal-timeline>
    </div>

  </div>
</template>

<script>
import _ from 'lodash'
import { mapActions, mapGetters, mapMutations } from 'vuex'
import { ITEM, PEOPLE_FACES } from 'src/store/storeModules'
import {
  GET_PERSON_TIMELINES,
  GET_PERSON_TIMELINES_BUSY
} from 'src/store/modules/people-faces/getters'
import {
  SET_TIMELINE_EMOTION,
  SET_ITEM_PERSON_ACTIVE,
  SET_SHOW_ITEM_EDITOR,
  SET_CURRENT_PERSON_ID
} from 'src/store/modules/people-faces/mutations'
import {
  FETCH_ITEM_PERSON_TIMELINE,
  FETCH_ITEM_PERSON_FACES
} from 'src/store/modules/people-faces/actions'
import {
  ITEM_ID
} from 'src/store/modules/item/getterTypes'

import { peopleTypeaheadSearch } from 'src/components/search/typeahead-helper'
import HorizontalTimeline from 'src/components/item/timeline/HorizontalTimeline.vue'

import PlayheadMixin from 'src/mixins/PlayheadMixin'
import VuexItemMixin from 'src/mixins/VuexItemMixin'
import VuexItemUIStateMixin from '../../../mixins/VuexItemUIStateMixin'

export default {
  name: 'person-timeline',

  components: {
    HorizontalTimeline
  },

  mixins: [
    PlayheadMixin,
    VuexItemMixin,
    VuexItemUIStateMixin
  ],

  props: {
    faceUrl: {
      type: String,
      required: true
    },
    personId: {
      type: String,
      required: true
    },
    personName: {
      type: String,
      required: true
    }
  },

  computed: {
    ...mapGetters(ITEM, {
      itemId: ITEM_ID
    }),

    ...mapGetters(PEOPLE_FACES, {
      timelines: GET_PERSON_TIMELINES
    }),

    emotions () {
      return _.get(this.timelines, [this.personId, 'availableEmotions'], []) || []
    },

    currentEmotion () {
      return _.get(this.timelines, [this.personId, 'currentEmotion'], this.CONSTANTS.ALL_EMOTIONS)
    },

    currentTimeline () {
      return _.get(this.timelines, [this.personId, 'timelines', this.currentEmotion], []) || []
    },

    showEmotionsDropdown () {
      return this.emotions.length > this.CONSTANTS.MIN_NUM_OF_EMOTIONS
    }
  },

  methods: {
    ...mapActions(PEOPLE_FACES, {
      fetchPersonTimeline: FETCH_ITEM_PERSON_TIMELINE,
      fetchFaces: FETCH_ITEM_PERSON_FACES
    }),
    ...mapMutations(PEOPLE_FACES, {
      setCurrentEmotion: SET_TIMELINE_EMOTION,
      setPersonActive: SET_ITEM_PERSON_ACTIVE,
      setShowItemEditor: SET_SHOW_ITEM_EDITOR,
      setCurrentPerson: SET_CURRENT_PERSON_ID
    }),

    selectEmotion (emotion) {
      this.setCurrentEmotion({ personId: this.personId, emotion })
    },
    togglePersonOff () {
      this.setPersonActive({ personId: this.personId, active: false })
    },
    enterEditMode () {
      this.setCurrentPerson(this.personId)
      const params = {
        itemId: this.itemId,
        personId: this.personId
      }
      this.fetchFaces(params)
      this.fetchPersonTimeline(params)
      this.setShowItemEditor(true)
      this.forceStop()
    }
  }
}
</script>

<style lang="less">
  @import (reference) '~src/styles/_variables';
  @import (reference) '~src/styles/_mixins';
  @timeline-face-image-size: 30px;

  .person-timeline {
    .flex-container();
    .flex-wrap(nowrap);
    .align-items-start();
    .align-content-stretch();
    padding-left: 13px;
    padding-right: 13px;

    .person-timeline__image {
      .flex-box();
      .flex(0, 1, auto);
      margin-right: 6px;
      padding-top: 18px;
      position: relative;
      z-index: 5;

      .face-image {
        .size(40px, 40px);
        background-repeat: no-repeat;
        background-position: center;
        background-size: cover;
        border-radius: 6px;
        margin-right: 10px;
      }

      .person-timeline-image__overlay {
        .abs-pos(18px, auto, auto, 0);
        .flex-container-center();
        .size(@timeline-face-image-size, @timeline-face-image-size);
        background-color: @color-dark-shadow;
        border-radius: 50%;
        cursor: pointer;
        opacity: 0;
        transition: opacity 100ms ease-out;

        i.far {
          color: @color-base;
          font-size: 16px;
          margin-top: -2px;
        }
      }

      .remove-face-button {
        .abs-pos(15px, auto, auto, -7px);
        .flex-container-center();
        .size(17px, 17px);
        background-color: @primary-button-color;
        border: 2px solid transparent;
        border-radius: 50%;
        border: 0 none;
        color: @color-base;
        cursor: pointer;
        font-size: 11px;
        opacity: 0;

        &:hover {
          background-color: lighten(@primary-button-color, 10%);
          border-color: lighten(@primary-button-color, 10%);
        }
      }

      img.group-into-icon {
        .abs-pos(18px, auto, auto, 0);
        .size(@timeline-face-image-size, @timeline-face-image-size);
        background-color: @color-dark-shadow;
        border-radius: 100%;
        display: none;
        padding: 3px;
      }

      &.dragged-over {
        img.group-into-icon {
          display: inline-block;
        }
      }

      &:hover {
        .person-timeline-image__overlay,
        .remove-face-button {
          opacity: 1;
        }
      }
    }

    .person-timeline__timeline-wrapper {
      flex: 1 0 auto;
      margin-top: 13px;

      .person-timeline__filters {
        .flex-container-between();

        .person-timeline__edit {
          display: flex;
          flex-direction: column;

          .people-edit-inputs {
            display: flex;
            flex-direction: row;
            font-size: 10px;
            font-weight: 400;

            .name-input {
              margin-right: 5px;
            }

            .rename-save {
              letter-spacing: 0;
              margin-right: 5px;
              padding: 0 8px;
            }

            .rename-cancel {
              letter-spacing: 0;
            }
          }
        }

        .el-dropdown {
          font-size: 12px;

          &:hover {
            cursor: pointer;
          }
        }
      }

      .person-timeline__name {
        .flex-container-center();
        color: @color-tone-medium;
        font-size: 12px;

        > span {
          display: inline-block;
          margin-right: 5px;
          margin-bottom: 2px;
        }

        > button {
          .flex-container-center();
          .size(20px, 20px);
          background-color: transparent;
          border: 0 none;
          border-radius: 50%;
          cursor: pointer;
          text-align: center;

          &:focus {
            outline: 0;
          }

          i.far {
            color: @color-tone-darker;
            font-size: 12px;
            font-weight: normal;
            line-height: 15px;
            margin-left: -1px;
          }

          &:hover {
            background-color: @color-tone-darker;

            i.far {
              color: @color-base;
            }
          }

          &:first-child {
            margin-left: 0;
          }
        }

        .edit-button {
          color: @placeholder-text-color;
          cursor: pointer;

          &:hover {
            color: darken(@placeholder-text-color, 10%)
          }

          &:active {
            color: darken(@placeholder-text-color, 40%)
          }
        }
      }
    }
  }

  .person-timeline__timeline-wrapper-compacted {
    flex: 1 0 auto;

    .horizontal-timeline {
      border-bottom: 0 none;
      padding-bottom: 0;
    }

    .person-timeline__filters-compacted {
      .flex-container-between();

      .person-timeline__name-compacted {
        .flex-container-center();

        color: @color-tone-medium;
        font-size: 12px;
        position: absolute;
        margin-left: 3px;
        z-index: 1;
        margin-top: 30px;

        > span {
          display: inline-block;
          margin-right: 5px;
          margin-bottom: 2px;
        }
      }
    }
  }

  .el-dropdown-menu.person-emotion-dropdown {
    margin-top: 0;

    .el-dropdown-menu__item {
      &:focus,
      &:not(.is-disabled):hover,
      &:hover {
        color: @primary-button-color;
      }
    }
  }
</style>
