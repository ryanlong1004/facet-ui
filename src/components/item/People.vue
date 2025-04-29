<template>
  <div class="horizontal-timeline-container people" v-loading="peopleLoading">
    <el-dialog
      :visible.sync="showPeopleEditor"
      :fullscreen="true"
      :append-to-body="true"
      :before-close="beforePeopleEditorClosed"
      title="Edit item people/faces"
      custom-class="people-editor-dialog"
    >
      <people-editor/>
    </el-dialog>
    <div class="horizontal-timeline-container__empty-notification" v-if="!hasPeople">
      We didn't detect any people in this file.
    </div>
    <div class="horizontal-timeline-container--left" v-if="hasPeople">
      <el-tabs :value="selectedPeopleTab" class="known-unknown-tabs">
        <el-tab-pane label="Known People" :name="KNOWN_PEOPLE_TAB_NAME">
          <div class="horizontal-timeline-container__empty-notification" v-if="!knownPeople.length">
            No known people detected in this file.
          </div>
          <div class="people-list-wrapper" v-if="knownPeople.length">
            <list-filter placeholder="Filter by name" v-model="knownPeopleFilterStr"></list-filter>
            <p class="no-matches-found" v-if="knownPeopleFilterStr.length && !knownPeopleFiltered.length">No known people found matching your search. <span class="linkable" @click.stop="resetKnownPeopleFilter">Reset search.</span></p>
            <ul class="people-list people-list--known">
              <li
                v-for="person in knownPeopleFiltered"
                :key="person.person_id"
                @click="togglePerson(person.person_id)"
              >
                <person
                  :personFaceUrl="person.faceImageUrl"
                  :personId="person.person_id"
                  :personKnown="person.is_known"
                  :personName="person.name"
                  :personStatus="person.active"
                ></person>
              </li>
            </ul>
          </div>
        </el-tab-pane>
        <el-tab-pane label="Unknown People" :name="UNKNOWN_PEOPLE_TAB_NAME">
          <div class="horizontal-timeline-container__empty-notification" v-if="!unknownPeople.length">
            No unknown people detected in this file.
          </div>
          <div class="people-list people-list--unknown" v-if="unknownPeople.length">
            <div
              v-for="person in unknownPeople"
              @click="togglePerson(person.person_id)"
              :key="person.person_id"
            >
              <person
                :personFaceUrl="person.faceImageUrl"
                :personId="person.person_id"
                :personKnown="person.is_known"
                :personName="person.name"
                :personStatus="person.active"
              ></person>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
    <div class="horizontal-timeline-container--right" v-if="hasPeople">
      <div class="scrolling-timelines-container" ref="timelineContainer">
        <div v-for="person in activePeople" :key="person.person_id">
          <person-timeline
            :face-url="person.faceImageUrl"
            :person-id="person.person_id"
            :person-name="person.name"
          ></person-timeline>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import httpStatusCodes from 'http-status-codes'
import { CONSTANTS } from 'src/constants'
import { mapActions, mapGetters, mapMutations } from 'vuex'
import { ITEM, PEOPLE_FACES } from 'src/store/storeModules'

import {
  ITEM_ID
} from 'src/store/modules/item/getterTypes'
import {
  FETCH_ITEM_PEOPLE,
  FETCH_ITEM_PERSON_TIMELINE
} from 'src/store/modules/people-faces/actions'
import {
  GET_ALL_PEOPLE,
  GET_CURRENT_PERSON_TYPE,
  GET_PEOPLE_LOADING,
  GET_KNOWN_PEOPLE,
  GET_UNKNOWN_PEOPLE,
  GET_PERSON_TIMELINES,
  GET_SHOW_ITEM_EDITOR
} from 'src/store/modules/people-faces/getters'

import {
  SET_PERSON_TYPE,
  SET_CURRENT_PERSON_ID,
  SET_ITEM_PERSON_ACTIVE,
  SET_SHOW_ITEM_EDITOR
} from 'src/store/modules/people-faces/mutations'

import Person from 'src/components/item/Person.vue'
import PersonTimeline from 'src/components/item/timeline/PersonTimeline.vue'
import PeopleEditor from 'src/components/item/PeopleEditor.vue'
import ListFilter from 'src/components/global/ListFilter.vue'
import PlayheadMixin from 'src/mixins/PlayheadMixin'
import VuexItemMixin from 'src/mixins/VuexItemMixin'

const KNOWN_PEOPLE_TAB_NAME = 'known-people'
const UNKNOWN_PEOPLE_TAB_NAME = 'unknown-people'
const PEOPLE_TYPES = CONSTANTS.PEOPLE_TYPES
const SORT_BY = CONSTANTS.SORT_BY
const SORT_DIRECTION = CONSTANTS.SORT_DIRECTION

export default {
  name: 'people',

  mixins: [
    PlayheadMixin,
    VuexItemMixin
  ],

  components: {
    ListFilter,
    Person,
    PersonTimeline,
    PeopleEditor
  },

  props: {
    isTabVisible: {
      type: Boolean,
      default: false
    }
  },

  data () {
    return {
      KNOWN_PEOPLE_TAB_NAME,
      UNKNOWN_PEOPLE_TAB_NAME,
      knownPeopleFilterStr: '',
      selectedPeopleTab: KNOWN_PEOPLE_TAB_NAME
    }
  },

  mounted () {
    const peopleUnwatcher = this.$watch('people', newVal => {
      if (newVal && newVal.length) {
        peopleUnwatcher()
        const pid = this.$route.query[this.CONSTANTS.QUERY_PARAMS.PERSON_ID]
        if (pid) {
          const p = _.find(this.people, { person_id: pid })
          if (p) {
            this.selectedPeopleTab = p.is_known ? KNOWN_PEOPLE_TAB_NAME : UNKNOWN_PEOPLE_TAB_NAME
            this.togglePerson(p.person_id, true)
          }
        }
      }
    })
    this.$watch('isTabVisible', newVal => {
      if (newVal && !this.people.length) {
        this.fetchPeopleByItem(this.itemId)
      }
    }, { immediate: true })
  },

  computed: {
    ...mapGetters(ITEM, {
      itemId: ITEM_ID
    }),
    ...mapGetters(PEOPLE_FACES, {
      personType: GET_CURRENT_PERSON_TYPE,
      people: GET_ALL_PEOPLE,
      peopleLoading: GET_PEOPLE_LOADING,
      unsortedKnownPeople: GET_KNOWN_PEOPLE,
      unsortedUnknownPeople: GET_UNKNOWN_PEOPLE,
      timelines: GET_PERSON_TIMELINES
    }),

    showPeopleEditor: {
      get () {
        return this.$store.getters[`${PEOPLE_FACES}/${GET_SHOW_ITEM_EDITOR}`]
      },
      set (val = false) {
        return this.$store.commit(`${PEOPLE_FACES}/${SET_SHOW_ITEM_EDITOR}`, val)
      }
    },

    knownPeople () {
      return _.sortBy(this.unsortedKnownPeople, ['name'])
    },
    unknownPeople () {
      return _.sortBy(this.unsortedUnknownPeople, ['num_faces']).reverse()
    },

    activePeople () {
      const activeKnown = this.knownPeople.filter(person => person.active)
      const activeUnknown = this.unknownPeople.filter(person => person.active)
      return [].concat(activeKnown, activeUnknown)
    },

    hasPeople () {
      return _.get(this, 'knownPeople.length', 0) > 0 || _.get(this, 'unknownPeople.length', 0) > 0
    },

    knownPeopleFiltered () {
      if (this.knownPeopleFilterStr.length) {
        const lookFor = this.knownPeopleFilterStr.toLowerCase()
        return this.knownPeople.filter(p => p.name.toLowerCase().indexOf(lookFor) >= 0)
      }
      return this.knownPeople
    }
  },

  methods: {
    ...mapActions(PEOPLE_FACES, {
      fetchPeopleByItem: FETCH_ITEM_PEOPLE,
      fetchPersonTimeline: FETCH_ITEM_PERSON_TIMELINE
    }),
    ...mapMutations(PEOPLE_FACES, {
      setPersonActive: SET_ITEM_PERSON_ACTIVE
    }),

    resetKnownPeopleFilter () {
      this.knownPeopleFilterStr = ''
    },

    togglePerson (personId, forceOn = false) {
      const person = _.find(this.people, { person_id: personId })
      const active = forceOn ? true : !person.active
      this.setPersonActive({
        personId,
        active
      })
      if (active) {
        this.fetchPersonTimeline({
          itemId: this.itemId,
          personId
        })
      }
    },

    beforePeopleEditorClosed (done) {
      this.forceStop()
      this.$nextTick(done)
    }
  }
}
</script>

<style lang="less">
  @import '../../styles/_variables';
  @menu-face-image-size: 60px;

  .people {
    line-height: 1;
    border-bottom: 1px solid @box-border-grey;

    .horizontal-timeline-container--left {
      .el-tabs {
        .el-tabs__header {
          .el-tabs__nav-wrap {
            .el-tabs__nav-scroll {
              width: 100%;
              .el-tabs__nav {
                width: 100%;
                .el-tabs__item {
                  text-align: center;
                  width: 50%;
                }
              }
            }
          }
        }
      }
    }

    .horizontal-timeline-container--right {
      position: relative;
      .scrolling-timelines-container {
        padding-bottom: 50px;
      }
    }

    .people-filter-wrapper {
      position: relative;
      .el-input {
        margin-bottom: 15px;
        .el-input__inner,
        input {
          border: 1px solid @color-dark-shadow;
          font-size: 12px;
          font-weight: 400;
          line-height: 12px;
          height: 25px;
          padding: 4px 10px;
          width: 100%;
          &:focus {
            outline: none;
          }
        }
        > .el-input__suffix {
          padding-top: 5px;
          color: @text-dark;

          .close-button {
            cursor: pointer;
          }
        }
      }
    }

    .people-list-wrapper {
      padding: 10px;

      .el-input {
        .el-input__inner {
          font-size: 12px;
          font-weight: 400;
        }

        .el-input__icon {
          line-height: 34px;
        }
      }
    }

    .no-matches-found {
      color: @text-medium;
      font-size: 12px;
      .linkable {
        color: @primary-button-color;
        cursor: pointer;
        line-height: 20px;
        &:hover {
          text-decoration: underline;
        }
      }
    }

    .name-input {
      .el-input {
        .el-input__inner {
          font-size: 12px;
          font-weight: 400;
          padding-top: 0px;
          padding-bottom: 0px;
          height: 28px;
          width: 300px;
        }
      }
    }

    .people-list {
      display: flex;
      list-style: none;
      margin: 0;
      padding: 0 0 50px 0;

      &--known {
        flex-direction: column;
      }
      &--unknown {
        flex-wrap: wrap;
        padding-left: 10px;
        > span { // the draggable wrapper
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
          justify-content: flex-start;
          width: 100%;
        }
      }
    } // .people-list
  } // .people

  .people-editor-dialog {
    .el-dialog__body {
      padding: 0;
    }
  }

  // not scoped inside .people cause el-dropdowns
  // are appended to the end of body
  .el-dropdown-menu.person-emotion-dropdown {
    margin-top: 0;

    .el-dropdown-menu__item {
      &:focus, &:not(.is-disabled):hover, &:hover {
        color: @primary-button-color;
      }
    }
  } // .person-emotion-dropdown

</style>
