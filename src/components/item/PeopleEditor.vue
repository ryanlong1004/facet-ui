<template>
  <div class="people-editor layout-col">
    <el-dialog
      :visible.sync="showFacesRenameDialog"
      :append-to-body="true"
      custom-class="faces-rename-dialog"
      title="Rename Selected"
    >
      <p>Type a new person's name and press ENTER or select an existing name from the typeahead dropdown to continue.</p>
      <person-rename-typeahead @on-submit="handleRenameFacesSubmit" @on-select="handleRenameFacesSelectExisting"></person-rename-typeahead>
    </el-dialog>
    <header class="filters layout-row">
      <people-filter-sort-bar :show-sorting="false" />
    </header>
    <div class="people-editor-main-wrapper layout-row">
      <aside class="people-list layout-col">
        <person-list
          :people="peopleListFiltered"
          :show-face-count="true"
          :selectable="true"
          :selected-person-id="currentPersonId"
          @on-select="selectPerson"
          face-border-radius="4px"
          face-height="46px"
          face-width="46px"/>
        <p class="no-content-message" v-if="noKnownPeople">No known people found in this item</p>
        <p class="no-content-message" v-if="noUnknownPeople">No unknown people found in this item</p>
      </aside>
      <section class="content layout-col">
        <div class="content-top layout-row">
          <div class="video-wrapper">
            <video-player v-if="isVideo"></video-player>
            <document-thumbnails
              v-if="isDocument"
              :docmaxheight="200"
              :is-pdf="false"
              :thumbnails="documentThumbnails">
            </document-thumbnails>
            <footer>
              <template v-if="currentPerson">
                <person-face-renamable
                  :person-id="currentPersonId"
                  :person-name="currentPerson.name"
                  :face-image-url="currentPerson.faceImageUrl"
                  :hide-image="true"
                  :dark-mode="true"
                  @renamed="handlePersonRenamed"
                  @renamed-existing="handlePersonRenamedExisting"
                />
                <p>Appears {{ currentPersonFacesCount }} times in this video</p>
              </template>
            </footer>
          </div>
          <div class="tools-wrapper layout-col">
            <div class="tools layout-row" v-loading="facesBusy">
              <div>
                <el-button type="primary" @click="trainSelectedFaces" :disabled="!selectedFacesCount || currentPersonType === CONSTANTS.PEOPLE_TYPES.UNKNOWN"><i class="icon-model-training-icon454545"></i> Add to AI Studio</el-button>
                <face-list
                  v-if="trainedFaces.length"
                  class="tools-face-list"
                  :faces="trainedFaces"
                  :removable="true"
                  @on-remove="untrainFace"
                  face-border-radius="4px"
                  face-height="52px"
                  face-width="52px"
                  face-margin="4px"
                  :clear-margin-right-nth="4"/>
                <p class="no-content-message no-top-margin" v-if="currentPersonType === CONSTANTS.PEOPLE_TYPES.UNKNOWN">Face training is only available for known people</p>
              </div>
              <div>
                <el-button type="primary" @click="renameSelectedFaces" :disabled="!selectedFacesCount"><i class="far fa-user"></i> Rename selected</el-button>
                <div class="tools-face-list">
                  <div>
                    <person-face-name
                      v-for="person in createdPeople"
                      :key="person.person_id"
                      style="margin-bottom: 5px;"
                      :person-name="person.name"
                      :face-image-url="person.faceImageUrl"
                      @click="selectPerson(person)"
                    />
                  </div>
                </div>
              </div>
              <div>
                <el-button type="primary" @click="unknownSelectedFaces" :disabled="!selectedFacesCount"><i class="far fa-question"></i> Make selected unknown</el-button>
                <face-list
                  v-if="unknownedFaces.length"
                  class="tools-face-list"
                  :faces="unknownedFaces"
                  :removable="false"
                  face-border-radius="4px"
                  face-height="52px"
                  face-width="52px"
                  face-margin="4px"
                  :clear-margin-right-nth="4"/>
              </div>
              <div>
                <el-button type="primary" @click="deleteSelectedFaces" :disabled="!selectedFacesCount"><i class="far fa-trash-alt"></i> Remove selected faces</el-button>
                <face-list
                  v-if="deletedFaces.length"
                  class="tools-face-list"
                  :faces="deletedFaces"
                  :removable="false"
                  face-border-radius="4px"
                  face-height="52px"
                  face-width="52px"
                  face-margin="4px"
                  :clear-margin-right-nth="4"/>
              </div>
            </div>
            <div class="select-faces-message layout-row" v-if="!selectedFacesCount">
              <p>Select faces to get started</p>
            </div>
          </div>
        </div>
        <div class="timeline">
          <horizontal-timeline :items="currentPersonTimeline"></horizontal-timeline>
          <div
            v-if="hasPagination"
            class="purple-underline-wrapper"
            :style="{ 'padding-left': `${currentFacePageStartPercent}%` }">
            <div
              class="purple-underline"
              :style="{ width: `${currentFacePageWidthPercent}%` }"
            >
            </div>
          </div>
        </div>
        <div class="face-stats layout-row">
          <div class="face-viewing-stats"><span v-if="hasPagination">Viewing faces {{ firstFaceShownIndex }} - {{ lastFaceShownIndex }}</span></div>
          <face-selection-count v-if="currentPersonFacesCount"></face-selection-count>
        </div>
        <div class="faces-wrapper" v-loading="!currentPersonFacesCount && facesLoading">
          <template v-if="currentPersonFacesCount">
            <div class="face-pager" :class="{ disabled: !hasPagination }" @click="pageFaces('previous')">
              <i class="far fa-arrow-left"></i>
            </div>
            <el-carousel
              :interval="0"
              :autoplay="false"
              arrow="never"
              height="350px"
              indicator-position="none"
              ref="faces-carousel"
              @change="facePaginationChanged">
              <el-carousel-item
                v-for="(page, index) in currentPersonFacesPaged"
                :key="index">
                  <div class="faces-list">
                    <person-face-image-selectable
                      class="face"
                      v-for="face in page"
                      :key="face.face_id"
                      @click="toggleFaceSelected(face.face_id)"
                      :image-url="face.faceImageUrl"
                      :selected="face.selected"
                      :selectable="!face.renamedToNewPerson && !face.resetToUnknown && !face.deleted"
                      :dimmable="selectedFacesCount > 0"
                      border-radius="6px"
                      height="108px"
                      width="108px">
                      <template slot="overlay">
                        <div class="face-status-indicator" v-if="face.usedForTraining">
                          <i class="icon icon-model-training-icon454545"></i>
                        </div>
                        <div class="face-action-overlay" v-if="face.renamedToNewPerson">
                          <i class="icon far fa-user"></i>
                        </div>
                        <div class="face-action-overlay" v-if="face.resetToUnknown">
                          <i class="icon far fa-question"></i>
                        </div>
                        <div class="face-action-overlay" v-if="face.deleted">
                          <i class="icon far fa-trash-alt"></i>
                        </div>
                      </template>
                    </person-face-image-selectable>
                  </div>
              </el-carousel-item>
            </el-carousel>
            <div class="face-pager" :class="{ disabled: !hasPagination }" @click="pageFaces('next')">
              <i class="far fa-arrow-right"></i>
            </div>
          </template>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import { mapGetters, mapActions, mapMutations } from 'vuex'

import VuexItemMixin from 'src/mixins/VuexItemMixin'
import HorizontalTimeline from './timeline/HorizontalTimeline.vue'
import FaceSelectionCount from 'src/components/people-faces/FaceSelectionCount.vue'
import PersonFaceImageSelectable from 'src/components/people-faces/PersonFaceImageSelectable.vue'
import PersonList from 'src/components/people-faces/PersonList.vue'
import FaceList from 'src/components/people-faces/FaceList.vue'
import PersonFaceRenamable from 'src/components/people-faces/PersonFaceRenamable.vue'
import PersonFaceName from 'src/components/people-faces/PersonFaceName.vue'
import PersonRenameTypeahead from 'src/components/people-faces/PersonRenameTypeahead.vue'
import PeopleFilterSortBar from 'src/components/people-faces/PeopleFilterSortBar.vue'
import VideoPlayer from 'src/components/item/VideoPlayer.vue'
import DocumentThumbnails from 'src/components/item/DocumentThumbnails'

import { PEOPLE_FACES, ITEM, DOCUMENT_THUMBNAILS } from 'src/store/storeModules'

// item people store
import {
  FETCH_ITEM_PEOPLE,
  FETCH_ITEM_PERSON_FACES,
  FETCH_ITEM_PERSON_TIMELINE,
  TRAIN_FACES,
  UNTRAIN_FACE,
  DELETE_FACES,
  UNKNOW_FACES,
  RENAME_ITEM_PERSON,
  RENAME_FACES,
  RENAME_FACES_TO_NEW_PERSON,
  RENAME_FACES_TO_EXISTING_PERSON
} from 'src/store/modules/people-faces/actions'

import {
  GET_ALL_PEOPLE,
  GET_PEOPLE_LOADING,
  GET_KNOWN_PEOPLE,
  GET_UNKNOWN_PEOPLE,
  GET_FACES,
  GET_FACE_IDS,
  GET_FACES_LOADING,
  GET_SELECTED_FACES,
  GET_SELECTED_FACE_IDS,
  GET_DELETED_FACES,
  GET_RENAMED_FACES,
  GET_TRAINED_FACES,
  GET_UNKNOWNED_FACES,
  GET_CURRENT_PERSON_ID,
  GET_CURRENT_PERSON_TYPE,
  GET_SORT_BY,
  GET_SORT_DIRECTION,
  GET_PERSON_TIMELINES,
  GET_CREATED_PEOPLE,
  GET_FACES_BUSY_MESSAGE,
  GET_FACES_BUSY
} from 'src/store/modules/people-faces/getters'

import {
  DELETE_PERSON,
  SET_PERSON_TYPE,
  SET_CURRENT_PERSON_ID,
  TOGGLE_FACE_SELECTED,
  RESET_FACE_SELECTIONS,
  RESET_CREATED_PEOPLE
} from 'src/store/modules/people-faces/mutations'

import {
  DURATION,
  ITEM_ID
} from 'src/store/modules/item/getterTypes'

import { GET_ITEM_DOCUMENT_THUMBNAILS } from 'src/store/modules/item/document-thumbnails/getters'

const FACES_PER_PAGE = 30

export default {
  name: 'people-editor',
  components: {
    FaceList,
    FaceSelectionCount,
    HorizontalTimeline,
    PersonFaceImageSelectable,
    PersonList,
    PersonFaceRenamable,
    PersonFaceName,
    PersonRenameTypeahead,
    PeopleFilterSortBar,
    VideoPlayer,
    DocumentThumbnails
  },
  mixins: [ VuexItemMixin ],
  data () {
    return {
      currentFacePage: 0,
      showFacesRenameDialog: false
    }
  },
  async beforeMount () {
    await this.fetchPeopleByItem(this.itemId)
    if (this.people.length && !this.knownPeople.length) {
      this.setPersonType(this.CONSTANTS.PEOPLE_TYPES.UNKNOWN)
    }
  },
  computed: {
    ...mapGetters(PEOPLE_FACES, {
      currentPersonId: GET_CURRENT_PERSON_ID,
      personType: GET_CURRENT_PERSON_TYPE,
      people: GET_ALL_PEOPLE,
      peopleLoading: GET_PEOPLE_LOADING,
      knownPeople: GET_KNOWN_PEOPLE,
      unknownPeople: GET_UNKNOWN_PEOPLE,
      faces: GET_FACES,
      faceIds: GET_FACE_IDS,
      facesLoading: GET_FACES_LOADING,
      selectedFaces: GET_SELECTED_FACES,
      selectedFaceIds: GET_SELECTED_FACE_IDS,
      deletedFaces: GET_DELETED_FACES,
      renamedFaces: GET_RENAMED_FACES,
      trainedFaces: GET_TRAINED_FACES,
      unknownedFaces: GET_UNKNOWNED_FACES,
      sortBy: GET_SORT_BY,
      sortDirection: GET_SORT_DIRECTION,
      timelines: GET_PERSON_TIMELINES,
      createdPeople: GET_CREATED_PEOPLE,
      facesBusyMessage: GET_FACES_BUSY_MESSAGE,
      facesBusy: GET_FACES_BUSY
    }),
    ...mapGetters(ITEM, {
      duration: DURATION,
      itemId: ITEM_ID
    }),
    ...mapGetters(DOCUMENT_THUMBNAILS, {
      documentThumbnails: GET_ITEM_DOCUMENT_THUMBNAILS
    }),
    peopleListFiltered () {
      if (this.personType === this.CONSTANTS.PEOPLE_TYPES.KNOWN) {
        return _.sortBy(this.knownPeople, ['name'])
      } else {
        return _.sortBy(this.unknownPeople, ['num_faces']).reverse()
      }
    },
    noKnownPeople () {
      return !this.peopleListFiltered.length && this.personType === this.CONSTANTS.PEOPLE_TYPES.KNOWN
    },
    noUnknownPeople () {
      return !this.peopleListFiltered.length && this.personType === this.CONSTANTS.PEOPLE_TYPES.UNKNOWN
    },
    currentPerson () {
      if (this.currentPersonId) {
        return this.people.find(p => p.person_id === this.currentPersonId)
      }
      return null
    },
    currentPersonType () {
      return _.get(this.currentPerson, 'is_known', false) === true ? this.CONSTANTS.PEOPLE_TYPES.KNOWN : this.CONSTANTS.PEOPLE_TYPES.UNKNOWN
    },
    currentPersonFaces () {
      const f = this.faces || []
      return _.sortBy(f, f => f.segment_index)
    },
    currentPersonFacesCount () {
      return _.get(this.faces, 'length', 0)
    },
    selectedFacesCount () {
      return _.get(this.selectedFaces, 'length', 0)
    },
    currentPersonTimeline () {
      return _.get(this, `timelines[${this.currentPersonId}].timelines[${this.CONSTANTS.ALL_EMOTIONS}]`, []) || []
    },
    firstFaceShownIndex () {
      return (this.currentFacePage * FACES_PER_PAGE) + 1
    },
    lastFaceShownIndex () {
      return Math.min(this.currentPersonFacesCount, (this.currentFacePage * FACES_PER_PAGE) + FACES_PER_PAGE)
    },
    currentPersonFacesPaged () {
      return _.chunk(this.currentPersonFaces, FACES_PER_PAGE)
    },
    currentFacePageStartTime () {
      return _.get(this.currentPersonFacesPaged, `[${this.currentFacePage}][0].segment_index`, 0)
    },
    currentFacePageEndTime () {
      const p = _.get(this.currentPersonFacesPaged, `[${this.currentFacePage}]`, [])
      return _.get(p, `[${p.length - 1}].segment_index`, 0)
    },
    currentFacePageStartPercent () {
      return (this.currentFacePageStartTime / this.duration) * 100
    },
    currentFacePageWidthPercent () {
      return ((this.currentFacePageEndTime - this.currentFacePageStartTime) / this.duration) * 100
    },
    hasPagination () {
      return this.currentPersonFacesCount > FACES_PER_PAGE
    }
  },
  methods: {
    ...mapMutations(PEOPLE_FACES, {
      deletePerson: DELETE_PERSON,
      setPersonType: SET_PERSON_TYPE,
      setCurrentPersonId: SET_CURRENT_PERSON_ID,
      toggleFaceSelected: TOGGLE_FACE_SELECTED,
      resetSelectedFaces: RESET_FACE_SELECTIONS,
      resetCreatedPeople: RESET_CREATED_PEOPLE
    }),
    ...mapActions(PEOPLE_FACES, {
      fetchPeopleByItem: FETCH_ITEM_PEOPLE,
      fetchPersonTimeline: FETCH_ITEM_PERSON_TIMELINE,
      fetchFaces: FETCH_ITEM_PERSON_FACES,
      trainFaces: TRAIN_FACES,
      untrainFace: UNTRAIN_FACE,
      deleteFaces: DELETE_FACES,
      unknownFaces: UNKNOW_FACES,
      renamePerson: RENAME_ITEM_PERSON,
      renameFacesToNewPerson: RENAME_FACES_TO_NEW_PERSON,
      renameFacesToExistingPerson: RENAME_FACES_TO_EXISTING_PERSON
    }),
    selectPerson (person) {
      const personId = person.person_id
      this.setCurrentPersonId(personId)
      this.fetchFaces({ itemId: this.itemId, personId })
      this.fetchPersonTimeline({ itemId: this.itemId, personId })
      this.resetCreatedPeople()
    },
    handlePersonRenamed (newName) {
      this.renamePerson({
        itemId: this.itemId,
        personId: this.currentPersonId,
        newName
      })
    },
    async handlePersonRenamedExisting (existingPerson) {
      const newPersonId = existingPerson.person_id
      await this.renameFacesToExistingPerson({
        newPersonId,
        faceIds: this.faceIds
      })
      this.resetSelectedFaces()
      this.deletePerson(this.currentPersonId)
      this.setPersonType(this.CONSTANTS.PEOPLE_TYPES.KNOWN)
      await this.fetchPeopleByItem(this.itemId)
      this.selectPerson(existingPerson)
    },
    async handleRenameFacesSubmit (newName = '') {
      if (newName !== '') {
        await this.renameFacesToNewPerson({ newName, faceIds: this.selectedFaceIds })
        this.resetSelectedFaces()
        this.cancelRenameSelectedFaces()
        this.fetchPersonTimeline({ itemId: this.itemId, personId: this.currentPersonId })
        this.fetchPeopleByItem(this.itemId)
      }
    },
    async handleRenameFacesSelectExisting (selectedPerson) {
      await this.renameFacesToExistingPerson({ newPersonId: selectedPerson.person_id, faceIds: this.selectedFaceIds })
      this.resetSelectedFaces()
      this.fetchPersonTimeline({ itemId: this.itemId, personId: this.currentPersonId })
      this.cancelRenameSelectedFaces()
      this.fetchPeopleByItem(this.itemId)
    },
    renameSelectedFaces () {
      this.showFacesRenameDialog = true
    },
    cancelRenameSelectedFaces () {
      this.showFacesRenameDialog = false
    },
    async trainSelectedFaces () {
      await this.trainFaces({ personId: this.currentPersonId, faceIds: this.selectedFaceIds })
      this.resetSelectedFaces()
    },
    async unknownSelectedFaces () {
      await this.unknownFaces(this.selectedFaceIds)
      this.resetSelectedFaces()
      this.fetchPeopleByItem(this.itemId)
    },
    async deleteSelectedFaces () {
      await this.deleteFaces(this.selectedFaceIds)
      this.resetSelectedFaces()
      this.fetchPeopleByItem(this.itemId)
    },
    pageFaces (direction = 'next') {
      if (!this.hasPagination) {
        return
      }
      const carousel = this.$refs['faces-carousel']
      if (carousel) {
        if (direction === 'next') {
          carousel.next()
        } else {
          carousel.prev()
        }
      }
    },
    facePaginationChanged (page) {
      this.currentFacePage = page
    }
  }
}
</script>

<style lang="less">
@import '../../styles/_mixins';
.people-editor .tools-wrapper .tools .el-button {
  > span {
    .flex-box();
    .flex-container-center();
  }
}
</style>

<style lang="less" scoped>
@import '../../styles/_variables';
@import '../../styles/_mixins';

@left-width: 250px;
@content-width: 1300px;
@content-padding: 20px;
@player-width: 280px;
@tools-padding: 15px;

.layout-col, .layout-row {
  .flex-box();
}
.layout-col {
  .flex-direction(column);
}
.layout-row {
  .flex-direction(row);
}
.people-editor {
  .flex(1, 0, auto);
  height: 100%;
  .people-editor-main-wrapper {
    .flex(1, 0, auto);
  }
}

.faces-rename-dialog {
  p {
    margin-top: 0;
  }
}

.filters {
  background-color: @color-tone-light;
  border-bottom: 1px solid @color-tone-lighter;
  padding: 0 15px;
}
.people-list {
  .flex(0, 0, @left-width);
  background-color: @color-tone-light;
  max-height: calc(100vh - 88px);
  overflow-y: auto;
  padding-bottom: 20px;
}
.content {
  .flex(0, 0, @content-width);
  padding: @content-padding;
}
.content-top {
  max-width: @content-width - (@content-padding * 2);
}
.video-wrapper {
  .flex(0, 0, @player-width);
  footer {
    background-color: @color-primary;
    color: @color-base;
    margin: 0;
    padding: 10px;
    p {
      font-size: 11px;
      margin: 0;
      padding: 0;
    }
    .person-face-renamable {
      font-size: 14px;
      font-weight: 300;
      margin-bottom: 5px;
    }
  }
}
.no-content-message {
  color: @text-medium;
  font-size: 11px;
  font-style: italic;
  margin: 0;
  padding: 15px;
}
.tools-wrapper {
  .flex(0, 0, @content-width - (@content-padding * 2) - @player-width);
  background-color: @color-tone-light;
  padding: @tools-padding 0px @tools-padding @tools-padding;
}
.tools > div {
  .flex(0, 0, 25%);
  padding: 0 15px 0 0;
}
.tools .el-button {
  border-radius: 3px;
  letter-spacing: 0px;
  font-size: 9px;
  width: 100%;
  i {
    font-size: 14px;
    margin-right: 3px;
    width: 14px;
  }
}
.tools-face-list {
  padding: 10px 0;
}
.select-faces-message {
  .flex-box();
  .flex(1, 0, auto);
  align-items: center;
  p {
    color: @text-medium;
    font-size: 14px;
    margin: 10px 0 0 0;
    padding: 0;
    text-align: center;
    width: 100%;
  }
}
.timeline {
  margin-top: 10px;
  .horizontal-timeline {
    background-color: transparent;
  }
}
.purple-underline-wrapper {
  margin-bottom: 15px;
  margin-top: -7px;
  position: relative;
  transition: padding-left 200ms ease-in-out;
  .purple-underline {
    border-top: 3px solid @color-saas-premium;
    position: absolute;
    transition: width 200ms ease-in-out;
    width: 20%;
  }
}
.face-stats {
  justify-content: space-between;
  .face-viewing-stats {
    color: @text-medium;
    font-size: 11px;
    font-weight: 600;
  }
}

.faces-wrapper {
  .flex-box();
  margin-top: 10px;
  min-height: 100px;

  .el-carousel {
    .flex(1, 0, auto);
    margin: 0 10px;
  }
  .faces-list {
    .flex-box();
    flex-wrap: wrap;
    .face {
      margin: 0 10px 10px 0;
      &:nth-child(10n) {
        margin-right: 0;
      }
      .face-status-indicator {
        .abs-pos(-3px, auto, auto, -3px);
        background-color: @primary-button-color;
        border-radius: 50%;
        text-align: center;
        height: 22px;
        width: 22px;
        i.icon {
          color: @color-base;
          font-size: 13px;
          line-height: 22px;
        }
      }
      .face-action-overlay {
        .abs-pos(0, -3px, -3px, 0);
        .flex-container-center();
        background-color: rgba(0, 0, 0, 0.75);
        border-radius: 6px;
        display: flex;
        height: 100%;
        width: 100%;
        i.icon {
          color: @color-accent;
          font-size: 30px;
        }
      }
    }
  }
}
.face-pager {
  .flex-box();
  .flex(0, 0, 30px);
  align-items: center;
  background-color: @color-tone-light;
  color: @color-tone;
  cursor: pointer;
  justify-content: center;
  &:hover {
    color: @color-primary;
  }
  &.disabled {
    cursor: default;
    &:hover {
      color: @color-tone;
    }
  }
}
</style>
