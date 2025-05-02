<template>
  <div class="people-faces-admin">
    <header class="search-results__header">
      <div class="app-fluid-container">

        <div class="search-results__header-section--middle app-fluid-container__section--middle">
          <ul class="search-results__header-tools">
            <li class="search-results__sort search-results__sort--filter">
              <div :class="{ active: personType === PEOPLE_TYPES.KNOWN }" @click="setPersonType(PEOPLE_TYPES.KNOWN)"><i class="fa-circle" :class="{ 'fas': personType === PEOPLE_TYPES.KNOWN, 'far': personType !== PEOPLE_TYPES.KNOWN }"></i>Known</div>
              <div :class="{ active: personType === PEOPLE_TYPES.UNKNOWN }" @click="setPersonType(PEOPLE_TYPES.UNKNOWN)"><i class="fa-circle" :class="{ 'fas': personType === PEOPLE_TYPES.UNKNOWN, 'far': personType !== PEOPLE_TYPES.UNKNOWN }"></i>Unknown</div>
            </li>
            <li
              class="search-results__sort search-results__sort--a-z"
              :class="{ 'search-results__sort--active': sortBy === SORT_TYPES.NAME }"
              @click.stop="sort(SORT_TYPES.NAME)">
              <i v-if="sortBy === SORT_TYPES.NAME" class="fas" :class="{ 'fa-angle-down': sortDirection === 1, 'fa-angle-up': sortDirection === -1 }"></i> A-Z
            </li>
            <li
              class="search-results__sort search-results__sort--date"
              :class="{ 'search-results__sort--active': sortBy === SORT_TYPES.COUNT }"
              @click.stop="sort(SORT_TYPES.COUNT)">
              <i v-if="sortBy === SORT_TYPES.COUNT" class="fas" :class="{ 'fa-angle-down': sortDirection === -1, 'fa-angle-up': sortDirection === 1 }"></i> Number of Faces
            </li>
            <li
              class="search-results__sort search-results__sort--file-size"
              :class="{ 'search-results__sort--active': sortBy === SORT_TYPES.DATE }"
              @click.stop="sort(SORT_TYPES.DATE)">
              <i v-if="sortBy === SORT_TYPES.DATE" class="fas" :class="{ 'fa-angle-down': sortDirection === -1, 'fa-angle-up': sortDirection === 1 }"></i> Recent
            </li>
          </ul>
        </div>
        <div class="search-results__header-section--right app-fluid-container__section--right">
          <ul class="search-results__header-tools">
            <li v-if="analyzingFacesProgress < 100" class="reanalyzing-progress">
              <el-progress
                type="circle"
                color="#228df8"
                :percentage="analyzingFacesProgress"
                :show-text="false"
                :stroke-width="5"
                :width="25">
              </el-progress>
              <span class="reanalyzing-progress-copy">Analyzing People&hellip;</span>
            </li>
            <li
              v-loading="analyzingFaces"
              class="search-results__sort search-results__sort--active reanalyze"
              @click.stop="retrainFaces"
              v-if="$hasScope(SCOPES.MODEL_TRAINING_PEOPLE) && analyzingFacesProgress === 100">
              <i class="far fa-sync"></i> Re-analyze People
            </li>
          </ul>
        </div>
      </div>
    </header>

    <div class="app-fluid-container people-faces-admin__content">
      <div class="app-fluid-container__section--left" ref="people-faces-admin-left-column">
        <p v-if="noResultsMessage.length" class="no-people-faces-message">{{ noResultsMessage }}</p>
        <ul v-infinite-scroll="loadPeopleNextPage" class="people-list">
          <div class="people-filter-input">
            <div class="el-input el-input-suffix">
              <input
                type="text"
                class="el-input__inner"
                @input="debouncedPeopleSearch"
                @keydown.esc="clearPeopleSearch"
                v-model="peopleSearchQuery"
                placeholder="Find people by name...">
              <span class="el-input__suffix">
                <span class="el-input__suffix-inner">
                  <i class="el-input__icon far fa-times clear-people-search-icon" @click="clearPeopleSearch" v-if="peopleSearchQuery.length"></i>
                </span>
              </span>
            </div>
          </div>
          <li
            v-for="person in peopleList"
            :key="person.person_id"
            class="person-item"
            :class="{ active: currentPerson && currentPerson.person_id === person.person_id }"
            @click="setCurrentPerson(person.person_id)">
            <!-- known people are droppable -->
            <drop @drop="handleDropOnExistingPerson(person, ...arguments)" class="person-item__dropzone" v-if="person.is_known">
              <div class="face-image" :style="{ 'background-image': `url(${person.faceImageUrl})` }"></div>
              <h5>
                {{ person.name }} ({{ person.num_faces }})
              </h5>
            </drop>
            <!-- unknown people have no dropzone -->
            <div v-else class="person-item__dropzone">
              <div class="face-image" :style="{ 'background-image': `url(${person.faceImageUrl})` }"></div>
              <h5>
                {{ person.name }} ({{ person.num_faces }})
              </h5>
            </div>
          </li>
        </ul>
      </div> <!-- left -->

      <div v-loading="isTrainingFaces" class="app-fluid-container__section--middle" ref="people-faces-admin-middle-column">
        <div v-if="currentPerson !== null" class="current-person-name">
          <div class="name-container">
            <h1>{{ currentPerson.name }}</h1>
            <el-tooltip
              class="item"
              :content="`Rename ${currentPerson.name}`"
              effect="dark"
              placement="top"
              :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY">
              <i class="far fa-pencil" @click="editPerson(currentPerson)"></i>
            </el-tooltip>
            <el-tooltip
              class="item"
              content="Show items this person belongs to"
              effect="dark"
              placement="top"
              :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY">
              <i class="far fa-chart-network" @click="goToPersonItems(currentPerson)"></i>
            </el-tooltip>
          </div>
          <div class="face-selection-area">
            <span v-if="numSelectedFaces > 0" class="num-selected-faces-notice">
              {{ prettyNumSelectedFaces }}
            </span>
            <div class="mass-face-selectors">
              <span class="select-deselect left" @click="selectAllFaces">Select All</span>
              <span class="select-deselect right" @click="deselectAllFaces">Deselect All</span>
            </div>
          </div>
        </div>
        <div v-if="currentPerson !== null" class="face-list" :class="{ 'active-selections': numSelectedFaces > 0 }" v-loading="resettingFace">
          <div
            v-for="face in currentPerson.faces"
            :key="face.face_id"
            class="face"
            :class="{
              active: face.selected,
              trashed: face.trashed,
              training: face.used_for_training
            }"
            @click="face.selected = !face.selected">
            <drag :transfer-data="face" @dragstart="handleDragStart(face)">
              <div class="face-action-menu" v-if="face.showActionMenu" @click.stop.prevent>
                <ul>
                  <li><router-link :to="{ name: 'itemDetails', params: { id: face.item_id }, query: face.deepLinkQueryParams }"><i class="icon far fa-link"></i> Go to asset</router-link></li>
                </ul>
              </div>
              <div class="face-status-indicator" v-if="face.used_for_training">
                <i class="icon icon-model-training-icon454545"></i>
              </div>
              <div
                class="face-action-menu-popper"
                :class="{ 'open': face.showActionMenu }"
                @click.stop.prevent="face.showActionMenu = !face.showActionMenu"
                v-if="face.item_id">
                  <i class="icon fas fa-bars" v-if="!face.showActionMenu"></i>
                  <i class="icon far fa-times" v-if="face.showActionMenu"></i>
              </div>
              <div class="face-image-wrapper">
                <div class="face-image" :style="{ 'background-image': `url(${face.faceImageUrl})` }"></div>
              </div>
            </drag>
          </div>
        </div>
        <div class="load-more-wrapper" v-if="showLoadMoreFacesButton">
          <el-button
            @click="loadFaces(currentPerson.person_id, nextPageTokenFaces)"
            :disabled="loadingFaces"
            type="primary"
            size="mini">
            <i class="far fa-spinner fa-spin" v-if="loadingFaces"></i> Load more faces
          </el-button>
        </div>
      </div> <!-- middle -->

      <div v-if="$hasScope(SCOPES.MODEL_TRAINING_PEOPLE)" class="app-fluid-container__section--right">
        <div class="tools-container training" v-if="currentPerson && currentPerson.is_known">
          <h5>AI Studio</h5>
          <drop @drop="handleDropTraining">
            <div class="dropzone" data-dropzone-type="training">
              <i class="icon-model-training-icon454545"></i>
              <h6>Drag &amp; Drop to train</h6>
            </div>
          </drop>
          <ul class="trained-faces-list">
            <li class="face" v-for="face in currentPersonFacesForTraining" :key="face.face_id">
              <div class="face-image" :style="{ 'background-image': `url(${face.faceImageUrl})` }"></div>
              <button class="remove-face-button" @click="removeFaceFromTraining(face)"><i class="far fa-times"></i></button>
            </li>
          </ul>
        </div>
        <div class="tools-container new-people">
          <h5>New People</h5>
          <drop @drop="handleDropNewPerson">
            <div class="dropzone" data-dropzone-type="newPerson">
              <i class="far fa-user-plus"></i>
              <h6>Drag &amp; Drop to add person</h6>
            </div>
          </drop>
          <ul class="added-people-list">
            <li v-for="person in addedPeople" :key="person.person_id">
              <drop class="newly-added-person" @drop="handleDropOnExistingPerson(person, ...arguments)">
                <div class="newly-added-person__face face-image" :style="{ 'background-image': `url(${person.faceImageUrl})` }"></div>
                <h5 class="newly-added-person__name">{{ person.name }}</h5>
              </drop>
            </li>
          </ul>
        </div>
        <div class="tools-container deleted-faces">
          <h5>Trash</h5>
          <drop @drop="handleDropTrash">
            <div class="dropzone" data-dropzone-type="trash">
              <i class="far fa-trash"></i>
              <h6>Drag &amp; Drop to trash</h6>
            </div>
          </drop>
          <ul class="deleted-faces-list">
            <li class="face" v-for="face in deletedFaces" :key="face.face_id">
              <div class="face-image" :style="{ 'background-image': `url(${face.faceImageUrl})` }"></div>
            </li>
          </ul>
        </div>
        <div class="tools-container deleted-faces" v-if="currentPerson && currentPerson.is_known">
          <h5>Unknown Person <el-tooltip content="Attempt to reset a face back to an unknown state" placement="top"><i class="fas fa-question-circle"></i></el-tooltip></h5>
          <drop @drop="handleDropReset">
            <div class="dropzone" data-dropzone-type="reset">
              <i class="far fa-redo"></i>
              <h6>Drag &amp; Drop to make unknown</h6>
            </div>
          </drop>
          <ul class="deleted-faces-list">
            <li v-for="face in resetFaces" :key="face.face_id" class="face">
              <div class="face-image" :style="{ 'background-image': `url(${face.faceImageUrl})` }"></div>
            </li>
          </ul>
        </div>
      </div> <!-- right -->

    </div> <!-- content -->
    <!-- create new person dialog -->
    <el-dialog
      :title="editingPersonName ? 'Rename person' : 'Add new person'"
      :visible.sync="showPersonDialog"
      class="add-person-dialog"
      @close="resetPersonFaces"
    >
      <ul class="deleted-faces-list">
        <li class="face" v-for="face in newPersonFaces" :key="face.face_id">
          <div class="face-image" :style="{ 'background-image': `url(${face.faceImageUrl})` }"></div>
        </li>
      </ul>
      <template v-if="editingPersonName && personType === PEOPLE_TYPES.KNOWN">
        <h4 class="add-person-dialog__input-label is-editing">Existing Name</h4>
        <p>{{currentPerson.name}}</p>
      </template>
      <h4 class="add-person-dialog__input-label">New Name</h4>
      <el-autocomplete
        v-if="showPersonDialog"
        v-model="addUpdatePersonName"
        size="small"
        class="name-input"
        popper-class="person-typeahead alternate"
        :placeholder="editingPersonName ? `Rename ${currentPerson.name}` : 'Enter new name...'"
        :disabled="savingNewPerson"
        :fetch-suggestions="debouncedQueryPeople"
        :trigger-on-focus="false"
        @select="handleNewPersonTypeaheadSelect"
        ref="addUpdatePersonName"
        value-key="label">
        <template slot-scope="{ item }">
          <person-typeahead-entry :person-name="item.person.name" :face-image-url="item.person.faceImageUrl"></person-typeahead-entry>
        </template>
      </el-autocomplete>
      <div class="add-person-dialog__buttons">
        <el-button type="text" size="small" @click="showPersonDialog = false">Cancel</el-button>
        <el-button
          :disabled="addUpdatePersonName.length === 0 || savingNewPerson"
          @click="handleAddingOrRenamingPerson(currentPerson)"
          @keyup.native.esc.prevent.stop="resetPersonFaces"
          size="small"
          type="primary"
        >Save</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import _ from 'lodash'
import { mapActions, mapMutations } from 'vuex'
import { capitalize, pluralize } from 'humanize-plus'
import httpStatusCodes from 'http-status-codes'
import api from 'src/api'
import { PROPERTY_PATHS } from 'src/property-paths'
import { getOptimalFaceImage } from 'src/components/item/people-helper'
import { peopleTypeaheadSearch } from 'src/components/search/typeahead-helper'
import PersonTypeaheadEntry from 'src/components/people-faces/PersonTypeaheadEntry.vue'
import PeopleFilterSortBar from 'src/components/people-faces/PeopleFilterSortBar.vue'
import { getAPIErrorMsg } from 'src/apiHelpers'
import { CONSTANTS } from 'src/constants'
import SearchQuery from 'src/components/search/SearchQuery'
import { putSearchQueryInStore } from 'src/components/search/search-helper'

import { SEARCH } from 'src/store/storeModules'
import {
  RESET_SEARCH_STATE,
  ADD_AGGREGATION_FILTER
} from 'src/store/modules/search/mutations'
import {
  DO_SEARCH
} from 'src/store/modules/search/actions'

const ANALYZING_FACES_DELAY_DEFAULT = 2000
const NUM_PEOPLE_PER_PAGE = 100
const NUM_FACES_PER_PAGE = 100

const SORT_TYPES = {
  NAME: 'name',
  COUNT: 'count',
  DATE: 'date'
}

const PEOPLE_TYPES = CONSTANTS.PEOPLE_TYPES

const getReactivePerson = person => {
  let reactivePerson = _.assign({}, person, {
    faceImageUrl: getOptimalFaceImage(person),
    faces: []
  })
  if (reactivePerson.is_known === false) {
    reactivePerson.name = CONSTANTS.UNKNOWN_NAME
  }
  return reactivePerson
}
const getReactiveFace = face => {
  return _.assign({}, face, {
    faceImageUrl: getOptimalFaceImage(face),
    processing: false,
    selected: false,
    showActionMenu: false,
    trashed: false,
    deepLinkQueryParams: {
      [CONSTANTS.QUERY_PARAMS.HORIZONTAL_TAB]: CONSTANTS.HORIZONTAL_TABS.PEOPLE,
      [CONSTANTS.QUERY_PARAMS.PERSON_ID]: face.person_id,
      [CONSTANTS.QUERY_PARAMS.SEEK_TO]: face.segment_index
    }
  })
}

let peopleIDsMap = {}

export default {
  name: 'people-faces-admin',
  components: {
    PersonTypeaheadEntry
  },
  data () {
    return {
      CONSTANTS,
      PEOPLE_TYPES,
      SORT_TYPES,
      addUpdatePersonName: '',
      addedPeople: [],
      analyzingFaces: false,
      analyzingFacesProgress: 100,
      analyzingFacesTimeoutDelay: ANALYZING_FACES_DELAY_DEFAULT,
      analyzingFacesTimeoutId: null,
      currentPerson: null,
      debouncedPeopleSearch: _.noop, // to be overwritten on create
      debouncedQueryPeople: _.noop, // to be overwritten on create
      deletedFaces: [],
      editingPersonName: false,
      isTrainingFaces: false,
      loadingFaces: false,
      loadingFacesError: null,
      loadingPeople: false,
      loadingPeopleError: null,
      nextPageTokenFaces: null,
      nextPageTokenPerson: null,
      newPersonFaces: [],
      peopleList: [],
      peopleSearchQuery: '',
      personType: PEOPLE_TYPES.KNOWN,
      resetFaces: [],
      resettingFace: false,
      savingNewPerson: false,
      showLoadMoreFacesButton: false,
      showPersonDialog: false,
      sortBy: SORT_TYPES.COUNT,
      sortDirection: -1,
      totalPeopleKnown: 0,
      totalPeopleUnknown: 0
    }
  },
  created () {
    // create debounced functions for people searching
    this.debouncedQueryPeople = _.debounce(peopleTypeaheadSearch, 250)
    this.debouncedPeopleSearch = _.debounce(this.peopleSearch, 250)
  },
  beforeMount () {
    this.checkAnalyzingFacesStatus()
  },
  mounted () {
    this.$watch('$route.params.personType', newVal => {
      if (!newVal || [PEOPLE_TYPES.KNOWN, PEOPLE_TYPES.UNKNOWN].indexOf(newVal) < 0) {
        this.setPersonType(PEOPLE_TYPES.KNOWN)
      } else {
        this.loadPersonType(newVal)
      }
    }, { immediate: true })
    this.$watch('$route.params.personId', newVal => {
      if (newVal) {
        this.loadPerson(newVal)
      }
    }, { immediate: true })
  },
  beforeRouteLeave (to, from, next) {
    this.resetAnalyzingFaces()
    next()
  },
  computed: {
    noResultsMessage () {
      if (this.peopleList.length === 0) {
        if (this.peopleSearchQuery.length >= 2) {
          return 'No people matched your search query'
        }
        if (this.personType === PEOPLE_TYPES.KNOWN) {
          return 'No known people found'
        }
        return 'No unknown people found'
      }
      return ''
    },
    numSelectedFaces () {
      return _.filter(this.currentPerson.faces, { selected: true }).length
    },
    prettyNumSelectedFaces () {
      return this.numSelectedFaces + ' ' + pluralize(this.numSelectedFaces, 'face') + ' selected'
    },
    currentPersonFacesForTraining () {
      if (_.get(this, 'currentPerson.faces.length', 0) === 0) {
        return []
      }
      return _.filter(this.currentPerson.faces, { used_for_training: true })
    },
    totalPeopleOfCurrentType () {
      return this.personType === PEOPLE_TYPES.KNOWN ? this.totalPeopleKnown : this.totalPeopleUnknown
    },
    showPeopleLoadingSpinner () {
      return this.loadingPeople
    },
    allowFacesInfiniteLoad () {
      return !this.loadingFaces
    },
    showFacesLoadingSpinner () {
      return this.loadingFaces
    },
    nextFacesPage () {
      const cfaces = _.get(this.currentPerson, 'faces')
      if (cfaces && cfaces.length) {
        return Math.floor(cfaces.length / NUM_FACES_PER_PAGE)
      }
      return 0
    }
  },
  methods: {
    ...mapActions(SEARCH, {
      doPersonItemsSearch: DO_SEARCH
    }),
    ...mapMutations(SEARCH, {
      addSearchAggregationFilter: ADD_AGGREGATION_FILTER,
      resetSearchState: RESET_SEARCH_STATE
    }),
    async goToPersonItems (person) {
      try {
        const response = await api.getPersonItems(person.person_id)
        const itemIDs = _.get(response, 'item_ids', []) || []
        if (itemIDs.length) {
          this.resetSearchState()
          this.addSearchAggregationFilter({
            field: PROPERTY_PATHS.ITEM_ID.path,
            value: itemIDs.join(',')
          })
          const key = this.doPersonItemsSearch()
          this.$router.push({name: this.CONSTANTS.ROUTES.SEARCH.NAME, query: { key: key }})
        } else {
          this.$message({
            duration: this.CONSTANTS.MESSAGE_DURATION,
            message: 'We could not find any items associated with this person',
            showClose: true,
            type: 'error'
          })
        }
      } catch (err) {
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: 'Error loading items associated with this person',
          showClose: true,
          type: 'error'
        })
      }
    },
    async checkAnalyzingFacesStatus () {
      this.analyzingFaces = true
      await this.getAnalyzingFacesProgress()
      if (this.analyzingFacesProgress < 100) {
        this.setAnalyzingFacesTimeout()
      } else {
        this.analyzingFaces = false
      }
    },
    resetAnalyzingFaces () {
      clearTimeout(this.analyzingFacesTimeoutId)
      this.analyzingFacesTimeoutId = null
      this.analyzingFacesTimeoutDelay = ANALYZING_FACES_DELAY_DEFAULT
      this.analyzingFaces = false
    },
    setAnalyzingFacesTimeout () {
      if (this.analyzingFaces) {
        this.analyzingFacesTimeoutId = setTimeout(() => {
          this.getAnalyzingFacesProgress()
          this.setAnalyzingFacesTimeout()
        }, (this.analyzingFacesTimeoutDelay > ANALYZING_FACES_DELAY_DEFAULT) ? this.analyzingFacesTimeoutDelay : ANALYZING_FACES_DELAY_DEFAULT)
      } else {
        this.resetAnalyzingFaces()
      }
    },
    async getAnalyzingFacesProgress () {
      try {
        const status = await api.getReanalyzeFacesStatus()
        this.analyzingFacesTimeoutDelay = status.total_faces_in_job * 10
        this.analyzingFacesProgress = _.round((status.faces_processed / status.total_faces_in_job) * 100)
        this.analyzingFaces = (this.analyzingFacesProgress < 100) ? true : false
      } catch (err) {
        this.resetAnalyzingFaces()
        this.analyzingFacesProgress = 100
        console.error(err)
      }
    },
    async retrainFaces () {
      this.analyzingFaces = true
      try {
        await api.retrainFaces(false)
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: 'Retraining Faces',
          showClose: true,
          type: 'success'
        })
        this.setAnalyzingFacesTimeout()
      } catch (err) {
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: getAPIErrorMsg(err),
          showClose: true,
          type: 'error'
        })
      }
    },
    async loadPeople (token = null) {
      try {
        let response
        this.loadingPeopleError = null
        this.loadingPeople = true
        if (!token) {
          peopleIDsMap = {}
          this.peopleList = []
          response = await api.getAllPeople(this.sortBy, this.sortDirection, this.personType, 0, NUM_PEOPLE_PER_PAGE)
        } else {
          response = await api.getAllPeopleByToken(this.sortBy, this.sortDirection, this.personType, token)
        }
        const loadedPeople = response.people.map(person => getReactivePerson(person))
        if (loadedPeople.length) {
          // is this person already loaded? avoid duplicate key errors
          // can sometimes happen while paging - sort is not 100%
          _.each(loadedPeople, p => {
            if (!peopleIDsMap[p.person_id]) {
              this.peopleList.push(p)
              peopleIDsMap[p.person_id] = true
            }
          })
          if (this.currentPerson === null) {
            this.setCurrentPerson(this.peopleList[0].person_id)
          }
        }
        this.nextPageTokenPerson = _.get(response, 'next_page_token', null) || null
      } catch (err) {
        if (err.status !== httpStatusCodes.NOT_FOUND) {
          const defaultError = _.get(err, 'body.error.message', 'Unable to load list of people, please try again')
          this.loadingPeopleError = defaultError
          this.$message({
            duration: this.CONSTANTS.MESSAGE_DURATION,
            message: defaultError,
            showClose: true,
            type: 'error'
          })
        }
      }
      // ensure data rendered before re-enabling ability to load more
      this.$nextTick(() => {
        this.loadingPeople = false
      })
    },
    loadPeopleNextPage () {
      if (this.nextPageTokenPerson) {
        this.loadPeople(this.nextPageTokenPerson)
      }
    },
    async loadFaces (personId, token = null) {
      this.loadingFacesError = null
      this.loadingFaces = true
      try {
        let response
        if (!token) {
          response = await api.getPersonFaces({
            personId,
            itemId: '',
            next_page_token: CONSTANTS.FIRST_PAGE_TOKEN,
            offset: CONSTANTS.DEFAULT_OFFSET,
            limit: NUM_FACES_PER_PAGE
          })
        } else {
          response = await api.getPersonFacesByToken(personId, token)
        }
        const loadedPersonId = _.get(response, 'person_id', '')
        // prevent race conditions when quickly switching active person
        // while faces from previous active people still responding
        if (loadedPersonId === _.get(this.currentPerson, 'person_id')) {
          const loadedFaces = _.get(response, 'faces', []).map(face => getReactiveFace(face))
          this.currentPerson.faces = this.currentPerson.faces.concat(loadedFaces)
          this.$nextTick(() => {
            if (loadedFaces.length && loadedFaces.length >= NUM_FACES_PER_PAGE) {
              this.showLoadMoreFacesButton = true // there are likely more faces to load
            } else {
              this.showLoadMoreFacesButton = false
            }
          })
        }
        this.nextPageTokenFaces = _.get(response, 'next_page_token', null) || null
      } catch (err) {
        if (err.status !== httpStatusCodes.NOT_FOUND) {
          const defaultError = _.get(err, 'body.error.message', 'Unable to load faces, please try again')
          this.loadingFacesError = defaultError
          this.$message({
            duration: this.CONSTANTS.MESSAGE_DURATION,
            message: defaultError,
            showClose: true,
            type: 'error'
          })
        }
        this.showLoadMoreFacesButton = false
      }
      // ensure data rendered before re-enabling ability to load more
      this.$nextTick(() => {
        this.loadingFaces = false
      })
    },
    setPersonType (type = PEOPLE_TYPES.KNOWN) {
      this.$router.push({ name: CONSTANTS.ROUTES.PEOPLE_FACES.NAME, params: { personType: type } })
    },
    loadPersonType (type = PEOPLE_TYPES.KNOWN) {
      this.currentPerson = null
      this.personType = type
      this.peopleSearchQuery = ''
      this.nextPageTokenPerson = this.nextPageTokenFaces = null
      this.loadPeople()
    },
    sort (by = SORT_TYPES.COUNT) {
      this.currentPerson = null
      if (this.sortBy === by) {
        this.sortDirection = -this.sortDirection
      } else {
        this.sortBy = by
        this.sortDirection = by === SORT_TYPES.NAME ? 1 : -1
      }
      this.peopleSearchQuery = ''
      this.nextPageTokenPerson = this.nextPageTokenFaces = null
      this.loadPeople()
    },
    async peopleSearch () {
      if (this.peopleSearchQuery.length === 0) {
        this.loadPeople()
      } else if (this.peopleSearchQuery.length >= 2) {
        const response = await api.getPeopleSearch(this.peopleSearchQuery)
        this.peopleList = []
        if (_.get(response, 'people.map', false)) {
          this.peopleList = response.people.map(person => getReactivePerson(person))
        }
      }
    },
    clearPeopleSearch () {
      this.peopleSearchQuery = ''
      this.nextPageTokenPerson = this.nextPageTokenFaces = null
      this.loadPeople()
    },
    setCurrentPerson (personId) {
      this.$router.push({ name: CONSTANTS.ROUTES.PEOPLE_FACES.NAME, params: { personType: this.personType, personId: personId } })
    },
    async loadPerson (personId) {
      // clear out the "trash" (deleted faces, reset people) and "new people" right panels
      this.deletedFaces = []
      this.resetFaces = []
      this.addedPeople = []
      this.editingPersonName = false
      this.showLoadMoreFacesButton = false
      const response = await api.getPerson(personId)
      this.currentPerson = getReactivePerson(response)
      this.loadFaces(personId)
    },
    selectAllFaces () {
      _.each(this.currentPerson.faces, f => {
        f.selected = true
      })
    },
    deselectAllFaces () {
      _.each(this.currentPerson.faces, f => {
        f.selected = false
      })
    },
    editPerson (person) {
      this.editingPersonName = true
      this.showPersonDialog = true
      this.addUpdatePersonName = this.personType === PEOPLE_TYPES.KNOWN ? this.currentPerson.name : ''
      this.$nextTick(() => this.$refs['addUpdatePersonName'].focus())
    },
    resetPersonFaces () {
      this.addUpdatePersonName = ''
      this.editingPersonName = false
      this.newPersonFaces = []
      this.showPersonDialog = false
      this.savingNewPerson = false
    },
    async handleNewPersonTypeaheadSelect (selectedPerson) {
      if (this.editingPersonName) {
        this.renameAllSelectedPersonFaces(selectedPerson)
      } else {
        this.renameSelectedPersonFaces(selectedPerson)
      }
    },
    // this is called when selecting a person name from the typeahead
    // in the rename person dialog
    async renameAllSelectedPersonFaces (selectedPerson) {
      const selectedPersonID = selectedPerson.person.person_id
      this.savingNewPerson = true
      try {
        await api.renameAllPersonFaces(this.currentPerson.person_id, selectedPersonID)
        this.addUpdatePersonName = ''
        this.showPersonDialog = false
        // remove them from left nav
        this.peopleList = _.filter(this.peopleList, p => {
          return p.person_id !== this.currentPerson.person_id
        })

        if (_.get(this.peopleList, 'length')) {
          this.setCurrentPerson(this.peopleList[0].person_id)
        }
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: `Person was successfully renamed to ${selectedPerson.person.name}`,
          showClose: true,
          type: 'success'
        })
      } catch (err) {
        const defaultError = 'There was a problem renaming this person, please try again'
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: err.body ? _.get(err, 'body.error.message', defaultError) : _.get(err, 'message', defaultError),
          showClose: true,
          type: 'error'
        })
      } finally {
        this.savingNewPerson = false
      }
    },
    // this is called when selected a person name from the typeahead
    // in the add new person dialog
    async renameSelectedPersonFaces (selectedPerson) {
      const selectedPersonID = selectedPerson.person.person_id
      this.savingNewPerson = true
      let changedFaces = this.newPersonFaces.concat([])
      let faceIds = changedFaces.map(f => f.face_id)
      try {
        await api.renameFaces(selectedPersonID, faceIds)
        const newPerson = _.find(this.peopleList, { person_id: selectedPersonID })
        if (newPerson) {
          newPerson.num_faces += faceIds.length
        }
        this._removeFacesFromCurrentPerson(changedFaces)
        this.addUpdatePersonName = ''
        this.showPersonDialog = false
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message:`${faceIds.length} ${pluralize(faceIds.length, 'face')} successfully re-assigned to ${selectedPerson.person.name}` ,
          showClose: true,
          type: 'success'
        })
      } catch (err) {
        const defaultError = 'There was a problem re-assigning selected faces, please try again'
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: err.body ? _.get(err, 'body.error.message', defaultError) : _.get(err, 'message', defaultError),
          showClose: true,
          type: 'error'
        })
      } finally {
        this.savingNewPerson = false
        this.resetPersonFaces()
      }
    },

    async handleAddingOrRenamingPerson (selectedPerson) {
      this.savingNewPerson = true
      let changedFaces = []
      let faceIds = []
      let response = null
      try {
        if (this.editingPersonName) {
          changedFaces = this.currentPerson.faces.concat([])
          faceIds = changedFaces.map(f => f.face_id)
          response = await api.renamePerson(selectedPerson.person_id, this.addUpdatePersonName)
          this.$message({
            duration: this.CONSTANTS.MESSAGE_DURATION,
            message: `Person renamed to ${this.addUpdatePersonName}`,
            showClose: true,
            type: 'success'
          })
          // if person was already known and we're only doing a rename...
          if (selectedPerson.is_known) {
            const listPerson = _.find(this.peopleList, { person_id: selectedPerson.person_id })
            listPerson.name = selectedPerson.name = this.addUpdatePersonName
            this.resetPersonFaces()
            return
          }
        } else {
          changedFaces = this.newPersonFaces.concat([])
          faceIds = changedFaces.map(f => f.face_id)
          response = await api.addNewPerson(this.addUpdatePersonName, faceIds)
          const newPersonId = response.person.person_id
          this.$message({
            duration: this.CONSTANTS.MESSAGE_DURATION,
            message: `${this.addUpdatePersonName} was successfully created with ${faceIds.length} faces`,
            showClose: true,
            type: 'success'
          })
        }
        const newReactivePerson = getReactivePerson(response.person)
        // add new person to right added people list
        this.addedPeople = this.addedPeople.concat([newReactivePerson])
        // only add new person to left list if current type is known
        if (this.personType === PEOPLE_TYPES.KNOWN) {
          this.peopleList = [newReactivePerson].concat(this.peopleList)
        }
        this._removeFacesFromCurrentPerson(changedFaces)
      } catch (err) {
        const defaultError = this.editingPersonName ? 'There was a problem renaming person, please try again' : 'There was a problem adding a new person, please try again'
        const errorTitle = this.editingPersonName ? 'Error renaming person' : 'Error creating new person'
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message:err.body ? _.get(err, 'body.error.message', defaultError) : _.get(err, 'message', defaultError) ,
          showClose: true,
          type: 'error'
        })
      } finally {
        this.savingNewPerson = false
        this.resetPersonFaces()
      }
    },
    handleDragStart (face) {
      face.selected = true
    },
    async handleDropOnExistingPerson (droppedPerson, draggedFace) {
      if (droppedPerson.person_id === this.currentPerson.person_id) {
        return false
      }
      let selectedFaces = _.filter(this.currentPerson.faces, { selected: true })
      let faceIds = []
      if (selectedFaces.length > 0) {
        faceIds = selectedFaces.map(f => f.face_id)
      } else {
        faceIds.push(draggedFace.face_id)
      }
      try {
        await api.renameFaces(droppedPerson.person_id, faceIds)
        const newPerson = _.find(this.peopleList, { person_id: droppedPerson.person_id })
        if (newPerson) {
          newPerson.num_faces += faceIds.length
        }
        this._removeFacesFromCurrentPerson(selectedFaces)
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: `${selectedFaces.length} ${pluralize(selectedFaces.length, 'face')} successfully re-assigned to ${droppedPerson.name}`,
          showClose: true,
          type: 'success'
        })
      } catch (err) {
        console.error(err)
      }
    },
    async handleDropTraining () {
      const trainingFaces = _.filter(this.currentPerson.faces, { selected: true })
      let faceIds = []
      _.each(trainingFaces, f => {
        faceIds.push(f.face_id)
      })
      this.isTrainingFaces = true
      try {
        await api.setFacesForTraining(this.currentPerson.person_id, faceIds)
        _.each(trainingFaces, f => {
          f.selected = false
          f.used_for_training = true
        })
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: `${trainingFaces.length} faces set to ${this.currentPerson.name} training set`,
          showClose: true,
          type: 'success'
        })
      } catch (err) {
        console.error('error training faces', err)
      } finally {
        this.isTrainingFaces = false
      }
    },
    async removeFaceFromTraining (face) {
      this.isTrainingFaces = true
      try {
        await api.deleteFaceFromTraining(face.face_id)
        face.used_for_training = false
        // api.setFaceForTraining(f.face_id, false)
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: `Face removed from ${this.currentPerson.name} training set`,
          showClose: true,
          type: 'success'
        })
      } catch (err) {
        console.error('error removing face from training', err)
      } finally {
        this.isTrainingFaces = false
      }
    },
    async handleDropReset () {
      const facesToReset = _.filter(this.currentPerson.faces, { selected: true })
      let faceIds = []
      let trainingAlert = false
      _.each(facesToReset, f => {
        if (f.used_for_training) {
          trainingAlert = true
          return false
        }
        faceIds.push(f.face_id)
      })
      if (trainingAlert) {
        return this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: 'You can not reset faces that are used for training. Please untrain first, then make unknown.',
          showClose: true,
          type: 'error'
        })
      }
      this.resettingFace = true
      try {
        const response = await api.resetFacesToUnknown(faceIds)
        this._removeFacesFromCurrentPerson(facesToReset)
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: `Face(s) were reset to a new unknown person`,
          showClose: true,
          type: 'success'
        })
        this.resetFaces = this.resetFaces.concat(facesToReset)
      } catch (err) {
        console.error(err)
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: 'Reset failed, please try again',
          showClose: true,
          type: 'error'
        })
      }
      this.resettingFace = false
    },
    handleDropNewPerson (draggedFace) {
      this.newPersonFaces = _.filter(this.currentPerson.faces, { selected: true })
      this.addUpdatePersonName = ''
      this.showPersonDialog = true
    },
    async handleDropTrash (draggedFace) {
      let selectedFaces = _.filter(this.currentPerson.faces, { selected: true })
      if (selectedFaces.length === 0) {
        selectedFaces.push(draggedFace)
      }
      const faceIds = selectedFaces.map(f => f.face_id)
      const pluralizedFaces = pluralize(faceIds.length, 'face')
      const capitalPluralizedFaces = capitalize(pluralizedFaces)
      const loading = this.$loading({
        lock: true,
        text: `Deleting ${capitalPluralizedFaces}`,
        spinner: 'el-icon-loading',
        background: 'rgba(255, 255, 255, 0.85)',
        customClass: 'fullscreen-loader'
      })
      try {
        await api.deleteFaces(faceIds)
        this.deletedFaces = this.deletedFaces.concat(selectedFaces)
        this._removeFacesFromCurrentPerson(selectedFaces)
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: `${selectedFaces.length} ${pluralizedFaces} successfully deleted`,
          showClose: true,
          type: 'success'
        })
      } catch (err) {
        console.error('err deleting face(s)', err)
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: `An error occurred deleting ${pluralizedFaces}, please try again`,
          showClose: true,
          type: 'error'
        })
      }
      loading.close()
    },
    _removeFacesFromCurrentPerson (facesToRemove = []) {
      _.each(facesToRemove, f => {
        f.selected = false
      })
      this.currentPerson.faces = _.difference(this.currentPerson.faces, facesToRemove)
      const currentPersonID = _.get(this.currentPerson, 'person_id')
      let currentPersonIndex = this.peopleList.findIndex(p => p.person_id === currentPersonID)
      currentPersonIndex = (currentPersonIndex === -1) ? 0 : currentPersonIndex
      if (currentPersonID) {
        const currentListPerson = _.find(this.peopleList, { person_id: currentPersonID })
        if (currentListPerson) {
          currentListPerson.num_faces -= facesToRemove.length
          if (currentListPerson.num_faces <= 0) {
            this.peopleList = _.filter(this.peopleList, p => {
              return p.person_id !== currentPersonID
            })
            this.currentPerson = null
            this.setCurrentPerson(this.peopleList[currentPersonIndex].person_id)
          }
        }
      }
    }
  }
}
</script>

<style lang="less">
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';
.people-faces-admin {
  .search-results__header {
    background-color: @background-grey;
    border-bottom: 1px solid @box-border-grey;
    font-size: 10px;
    font-weight: 900;
    height: 44px;
    margin-bottom: 0;
    text-transform: uppercase;

    .app-fluid-container {
      i {
        margin-right: 5px;
      }

      .search-results__sort--filter {
        > div {
          &:first-child {
            margin-right: 20px;
          }

          &.active {
            color: @primary-button-color;
          }
        }
      }

      .app-fluid-container__section--middle {
        .flex-box();
        .align-content-center();
        height: 44px;

        .search-results__header-tools {
          .flex-box();
          list-style: none;
          margin: 0 20px 0 0;
          padding: 0;

          > li {
            .flex-container-between();
            padding: 0 15px;

            &:hover {
              cursor: pointer;
            }
          }
        }

        .search-results__mode-toggle {
          button {
            background-color: transparent;
            border: 0 none;
            color: @text-light;
            cursor: pointer;
            font-size: 16px;
            padding: 0;

            &:first-child {
              margin-right: 10px;
            }

            &.active {
              color: @text-dark;
            }

            &:active, &:focus {
              outline: none;
            }
          }
        }
      }

      .app-fluid-container__section--right {
        display: flex;

        ul.search-results__header-tools {
          margin-left: auto;
          margin-right: 15px;

          li {
            list-style-type: none;
            padding: 5px 10px;

            &.reanalyze {
              cursor: pointer;
            }

            &.reanalyzing-progress {
              display: flex;
              align-items: center;

              .el-progress__text {
                font-size: 6px;
                font-weight: 500;
                font-style: normal;
                font-stretch: normal;
                line-height: 1.33;
                letter-spacing: normal;
              }

              .reanalyzing-progress-copy {
                color: @color-tone;
                font-size: 10px;
                font-weight: 900;
                font-style: normal;
                font-stretch: normal;
                line-height: 1.3;
                letter-spacing: 0.8px;
                margin-left: 5px;
              }
            }
          }
        }
      }
    }
  }

  .infinite-scroller {
    min-height: 10px;
    > div {
      min-height: 50px;
      .el-loading-mask {
        background-color: transparent;
      }
      .el-loading-spinner .path {
        stroke: @primary-button-color;
      }
    }
  }
  .app-fluid-container {
    padding: 0;
  }
  .app-fluid-container__section--left, .app-fluid-container__section--right {
    flex: 0 0 300px;
  }
  .no-people-faces-message {
    color: @text-medium;
    font-style: italic;
    font-size: 13px;
    padding: 0 10px;
  }
  .people-faces-admin__content {
    .flex-box();
    .justify-content-space-between();
    align-items: normal;
    background-color: @color-base;
    max-height: calc(100vh - 85px);
    min-height: calc(100vh - 85px);

    .app-fluid-container__section--left, .app-fluid-container__section--right {
      background-color: @background-grey;
      overflow: auto;
    }
    .app-fluid-container__section--right {
      padding: 20px;
    }
    .app-fluid-container__section--middle {
      padding: 0;
      overflow: auto;
    }
  }
  .people-filter-input {
    padding: 10px;
    .el-input__inner {
      background-color: @color-base;
      font-size: 12px;
      font-weight: 400;
    }
  }
  .clear-people-search-icon {
    cursor: pointer;
    line-height: 33px;
    &:hover {
      color: @text-dark;
    }
  }
  .tools-container {
    margin-bottom: 25px;
    > h5 {
      color: @text-medium;
      font-size: 11px;
      text-transform: uppercase;
      margin: 0 0 3px 0;
      padding: 0;
    }
    .dropzone {
      background-color: @box-border-grey;
      border-radius: 4px;
      border: 1px dashed transparent;
      color: @text-light;
      display: flex;
      flex-direction: column;
      padding: 10px;
      text-align: center;
      i {
        font-size: 25px;
        margin-bottom: 5px;
      }
      > h6 {
        font-size: 11px;
        margin: 0;
        padding: 0;
        text-transform: uppercase;
      }
      &:hover, &.over {
        border-color: @text-light;
      }
    }
  }
  .people-list {
    height: calc(~'100vh - 85px'); // header, subheader, filter plus padding heights
    list-style: none;
    margin: 0;
    overflow: auto;
    padding: 0;
    .person-item {
      padding-left: 10px;
      .person-item__dropzone {
        align-items: center;
        cursor: pointer;
        display: flex;
        padding: 4px;
        .face-image {
          background-size: cover;
          background-repeat: no-repeat;
          border-radius: 3px;
          margin-right: 5px;
          height: 46px;
          width: 46px;
        }
        > h5 {
          color: @text-dark;
          font-size: 12px;
          font-weight: 700;
          margin: 0;
        }
      }
      &.active {
        background-color: @box-border-grey;
      }
    }
  }
  .current-person-name {
    align-items: center;
    background-color: @color-base;
    border-bottom: 1px solid @box-border-grey;
    display: flex;
    justify-content: space-between;
    padding: 10px 25px;
    position: sticky;
    top: 0;
    z-index: 1;
    .name-container {
      .flex-container();

      h1 {
        align-items: center;
        color: @text-dark;
        display: flex;
        font-size: 20px;
        font-weight: 700;
        line-height: 40px;
        margin: 0;
        padding: 0;
      }
      i {
        color: @text-medium;
        cursor: pointer;
        font-size: 14px;
        margin-left: 10px;
        &:hover {
          color: @text-dark;
        }
      }
    }
    .el-input {
      min-width: 400px;
    }
    .num-selected-faces-notice {
      background-color: @primary-button-color;
      border-radius: 12px;
      color: @color-base;
      display: inline-block;
      font-size: 12px;
      padding: 4px 8px;
      margin-right: 5px;
    }
  }
  .face-selection-area {
    align-items: center;
    display: flex;
    justify-content: flex-end;

    .mass-face-selectors {
      display: flex;

      .select-deselect {
        cursor: pointer;
        padding-left: 2px;
        padding-right: 2px;


        letter-spacing: 0.6px;
        color: @color-face-action;
        font-size: 8px;
        font-weight: 900;
        text-transform: uppercase;
        &.left {
          border-right: solid 1px black;
          padding-right: 5px;
        }

        &.right {
          padding-left: 5px;
        }
      }
    }
  }
  .face-list {
    .flex-box();
    background-color: @color-base;
    margin: 0;
    padding: 15px 25px 0;
    flex-wrap: wrap;
    .face {
      margin: 0 15px 15px 0;
      position: relative;
      .face-image-wrapper {
        border: 3px solid transparent;
        border-radius: 8px;
        cursor: pointer;
        padding: 1px;
        height: 112px;
        width: 112px;
        .face-image {
          background-size: cover;
          background-repeat: no-repeat;
          background-position: center center;
          border-radius: 6px;
          height: 100%;
          width: 100%;
        }
      }
      .face-status-indicator, .face-action-menu-popper {
        border-radius: 50%;
        position: absolute;
        height: 26px;
        width: 26px;
        text-align: center;
        i.icon {
          color: @color-base;
          font-size: 15px;
          line-height: 26px;
        }
      }
      .face-status-indicator {
        background-color: @primary-button-color;
        top: -4px;
        left: -4px;
      }
      .face-action-menu-popper {
        background-color: @color-accent-calm;
        cursor: pointer;
        display: none;
        bottom: -4px;
        right: -4px;
        &.open {
          display: block;
        }
      }
      .face-action-menu {
        background-color: rgba(0, 0, 0, 0.75);
        border-radius: 6px;
        display: flex;
        align-items: center;
        position: absolute;
        left: 3px;
        right: 3px;
        top: 3px;
        bottom: 3px;
        > ul {
          list-style: none;
          margin: 0 0 0 10px;
          padding: 0;
          a {
            color: white;
            font-size: 11px;
            font-weight: 500;
            text-decoration: none;
            text-transform: uppercase;
            .icon {
              margin-right: 2px;
            }
          }
        }
      }
      &.active {
        .face-image-wrapper {
          border-color: @primary-button-color;
        }
      }
      &:hover {
        .face-action-menu-popper {
          display: block;
        }
      }
      &.trashed {
        img {
          border-color: @highlight-bad;
          opacity: .5;
        }
      }
    }
    &.active-selections {
      .face {
        opacity: 0.6;
        &.active {
          opacity: 1;
        }
      }
    }
  }
  .load-more-wrapper {
    margin-bottom: 25px;
    padding: 0 25px;
  }
  .add-person-dialog {
    .el-dialog__body {
      background-color: @color-tone-light;
      padding: 20px;
    }
    .el-autocomplete {
      width: 100%;

      .el-input {
        .el-input__inner {
          background-color: @color-base;
          font-size: 15px;
          font-weight: 500;

          &::placeholder,
          &::-webkit-input-placeholder {
            color: @text-dark;
            font-size: 15px;
            font-weight: 500;
            line-height: 1.33;
          }
        }
      }
    }
    .el-button.el-button--primary {
      width: 119px;
    }
    .deleted-faces-list {
      margin-top: 0;
    }
    .add-person-dialog__input-label {
      font-size: 10px;
      margin-bottom: 4px;
      text-transform: uppercase;

      &.is-editing {
        margin-top: 0;
      }

      + p {
        font-size: 15px;
        font-weight: 700;
        margin-top: 5px;
      }
    }
    .add-person-dialog__buttons {
      margin-top: 20px;
      text-align: right;
    }
  }
  .deleted-faces-list, .trained-faces-list {
    display: flex;
    flex-wrap: wrap;
    list-style: none;
    margin: 10px 0 0 0;
    padding: 0;
    width: 100%;
    li.face {
      margin: 0 5px 5px 0;
      position: relative;
      .face-image {
        background-size: cover;
        background-repeat: no-repeat;
        background-position: center center;
        border-radius: 4px;
        width: 62px;
        height: 62px;
      }
    } // li.face
  }
  .trained-faces-list {
    li.face {
      .face-image {
        width: 60px;
        height: 60px;
      }
      .remove-face-button {
        background-color: @primary-button-color;
        border: 2px solid transparent;
        border-radius: 50%;
        border: 0 none;
        color: @color-base;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        position: absolute;
        top: -8px;
        left: -7px;
        height: 17px;
        width: 17px;
        opacity: 0;
        &:hover {
          background-color: darken(@primary-button-color, 15%);
          border-color: darken(@primary-button-color, 25%);
        }
      } // .remove-face-button
      &:hover {
        .remove-face-button {
          opacity: 1;
        }
      }
    }
  } // .trained-faces-list
  .added-people-list {
    list-style: none;
    margin: 10px 0 0 0;
    padding: 0;
    width: 100%;
    > li {
      margin-bottom: 10px;
      &:last-child {
        margin-bottom: 0;
      }
    }
    .newly-added-person {
      align-items: center;
      display: flex;
      justify-content: flex-start;
      .face-image {
        background-size: cover;
        background-repeat: no-repeat;
        background-position: center center;
        border-radius: 4px;
        margin-right: 5px;
        width: 62px;
        height: 62px;
      }
      &__name {
        color: @text-dark;
        font-size: 12px;
      }
    }
  } // .added-people-list

  .reanalyze {
    margin-left: auto;
    &:hover {
      background-color: darken(@background-grey, 10%);
    }
  }
}
</style>
