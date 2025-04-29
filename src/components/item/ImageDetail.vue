<template>
  <div class="image-detail" @click="cancelEditing()">
    <div class="image-detail__top">
      <div class="image-detail__top--left">
        <div class="image-wrapper">
          <div class="image-view">
            <image-displayer
              :itemCategory="item.mime_category"
            ></image-displayer>
          </div>
          <div class="file-info">
            <categories-tab-header></categories-tab-header>
            <el-menu mode="horizontal" menu-trigger="click" @select="rotateThumb">
              <el-submenu index="1">
                <template slot="title">Rotate Image</template>
                <el-menu-item index="flip"><i class="far fa-sync-alt"></i> 180&deg;</el-menu-item>
                <el-menu-item index="clockwise"><i class="far fa-redo-alt"></i> 90&deg; Clockwise</el-menu-item>
                <el-menu-item index="counterclockwise"><i class="far fa-undo-alt"></i> 90&deg; Counter Clockwise</el-menu-item>
              </el-submenu>
            </el-menu>
          </div>
        </div>
      </div>
      <div class="image-detail__top--right">
        <div class="vertical-timelines" ref="vertical-timelines">
          <el-tabs id="vertical-tabs" :value="verticalTab" @tab-click="setVerticalTab" ref="vertical-timeline-tabs">
            <el-tab-pane label="Technical Data" :name="CONSTANTS.VERTICAL_TABS.TECH_DATA">
              <span slot="label"><i class="far fa-table"></i> Technical Data</span>
              <div class="timeline-content-wrapper">
                <technical-metadata></technical-metadata>
              </div>
            </el-tab-pane>
            <el-tab-pane label="Tags" :name="CONSTANTS.VERTICAL_TABS.TAGS_DESCRIPTIONS">
              <span slot="label"><i class="far fa-tags"></i> Tags &amp; descriptions</span>
              <div>
                <flat-description
                  :description-meta-id="descriptionMetaID"
                  :description-text="descriptionText"
                  :description-id="descriptionID"
                  :description-updating="descriptionUpdating"
                  :edit-mode-id="descriptionEditID"
                >
                </flat-description>
                <tag-collection
                  no-tags-message="No tags found in this image"
                  :tag-collection-meta-id="tagsMetaID"
                  :tags="tags"
                  :edit-mode-id="tagsEditID"
                >
                </tag-collection>
              </div>
            </el-tab-pane>
            <el-tab-pane label="OCR" :name="CONSTANTS.VERTICAL_TABS.OCR">
              <span slot="label"><i class="icon-OCR"></i> Visual text (OCR)</span>
              <div v-if="hasOcrs" class="ocr">
                <ocr-item
                  :segment-index="CONSTANTS.INDEX_FOR_IMAGE_DATA"
                  :phrases="imageOcrs"
                  display-time="0">
                </ocr-item>
              </div>
              <div v-else class="horizontal-timeline-container__empty-notification">
                We didn't detect any OCR in this file.
              </div>
            </el-tab-pane>
            <el-tab-pane label="Custom Data" :name="CONSTANTS.VERTICAL_TABS.CUSTOM_DATA">
              <span slot="label"><i class="far fa-clipboard-list"></i> Custom Data</span>
              <div class="timeline-content-wrapper">
                <custom-data-fields></custom-data-fields>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </div>
    <div class="image-detail__bottom" :class="{ 'no-faces': !showPeopleFaces, sixths: awsCustomTagsEnabled }">
      <div class="image-detail__bottom-content image-detail__bottom--far-left" v-if="awsCustomTagsEnabled">
        <div class="column-header">
          <span slot="label"><i class="fas fa-user-tag"></i> Custom Tags</span>
        </div>
        <div class="column-content">
          <div v-if="hascustomTags" class="logos">
            <ul>
              <li class="tag" v-for="(customObject, index) in customTags" :key="index">
                <span :innerHTML.prop="customObject | highlightFilter({ type: CONSTANTS.HIGHLIGHT_TYPES.CUSTOM_TAGS })"></span>
              </li>
            </ul>
          </div>
          <div v-else class="horizontal-timeline-container__empty-notification">
            <em>We didn't detect any custom tags in this image.</em>
          </div>
        </div>
      </div>
      <div class="image-detail__bottom-content image-detail__bottom--left" v-if="showPeopleFaces">
        <div class="column-header">
          <span slot="label"><i class="far fa-user"></i> People</span>
        </div>
        <div class="column-content" v-loading="facesBusy">
          <el-tabs v-if="hasPeople">
            <el-tab-pane label="Known">
              <span slot="label">Known</span>
              <div v-if="knownFaces.length" class="person-list">
                <person-face-renamable
                  v-for="face in knownFaces"
                  :key="face.face_id"
                  :person-id="face.person_id"
                  :person-name="face.person.name"
                  :face-image-url="face.faceImageUrl"
                  @renamed="renameFaceNew(face.face_id, $event)"
                  @renamed-existing="renameFaceExisting(face.face_id, $event)">
                  <template slot="overlay">
                    <div class="face-status-indicator" v-if="face.used_for_training"><i class="icon icon-model-training-icon454545"></i></div>
                    <el-dropdown placement="bottom-start">
                      <button class="face-menu-button"><i class="far fa-bars"></i></button>
                      <el-dropdown-menu slot="dropdown">
                        <el-dropdown-item v-if="!face.used_for_training"><div @click="trainFace(face.face_id, face.person_id)"><i class="icon icon-model-training-icon454545"></i> Train this face</div></el-dropdown-item>
                        <el-dropdown-item><div @click="makeFaceUnknown(face.face_id)"><i class="far fa-redo"></i> Make face unknown</div></el-dropdown-item>
                        <el-dropdown-item><div @click="deleteFace(face.face_id)"><i class="far fa-trash"></i> Delete this face</div></el-dropdown-item>
                      </el-dropdown-menu>
                    </el-dropdown>
                  </template>
                </person-face-renamable>
              </div>
              <div v-else class="horizontal-timeline-container__empty-notification">
                <em>We didn't detect any Known People in this image.</em>
              </div>
            </el-tab-pane>
            <el-tab-pane label="Unknown">
              <span slot="label">Unknown</span>
              <div v-if="unknownFaces.length" class="person-list">
                <person-face-renamable
                  v-for="face in unknownFaces"
                  :key="face.face_id"
                  :person-id="face.person_id"
                  :person-name="face.person.name"
                  :face-image-url="face.faceImageUrl"
                  @renamed="renameFaceNew(face.face_id, $event)"
                  @renamed-existing="renameFaceExisting(face.face_id, $event)">
                  <template slot="overlay">
                    <el-tooltip class="item" effect="dark" content="Delete this face" placement="top" :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY">
                      <button class="remove-face-button" @click="deleteFace(face.face_id)"><i class="far fa-trash"></i></button>
                    </el-tooltip>
                  </template>
                </person-face-renamable>
              </div>
              <div v-else class="horizontal-timeline-container__empty-notification">
                <em>We didn't detect any Unknown People in this image.</em>
              </div>
            </el-tab-pane>
          </el-tabs>
          <div v-else class="horizontal-timeline-container__empty-notification">
            <em>We didn't detect any People in this image.</em>
          </div>
        </div>
      </div>
      <div class="image-detail__bottom-content image-detail__bottom--middle-left">
        <div class="column-header">
          <span slot="label"><i class="far fa-images"></i> Known graphics</span>
        </div>
        <div class="column-content">
          <div v-if="hasKnownGraphics" class="logos">
            <ul>
              <li class="tag" v-for="(knownGraphic, index) in knownGraphics" :key="index">
                <span :innerHTML.prop="knownGraphic | highlightFilter({ type: CONSTANTS.HIGHLIGHT_TYPES.KNOWN_GRAPHICS })"></span>
              </li>
            </ul>
          </div>
          <div v-else class="horizontal-timeline-container__empty-notification">
            <em>We didn't detect any known graphics in this image.</em>
          </div>
        </div>
      </div>
      <div class="image-detail__bottom-content image-detail__bottom--middle">
        <div class="column-header">
          <span slot="label"><i class="far fa-eye-slash"></i> Adult Content</span>
        </div>
        <div class="column-content">
          <ul v-if="hasAdultCategories" class="categories">
            <li v-for="(adultCategory, index) in adultCategories" :key="index">
              <span :innerHTML.prop="adultCategory | highlightFilter"></span>
            </li>
          </ul>
          <div v-else class="horizontal-timeline-container__empty-notification">
            <em>We didn't detect any Adult Content content in this image.</em>
          </div>
        </div>
      </div>
      <div class="image-detail__bottom-content image-detail__bottom--middle-right">
        <div class="column-header">
          <span slot="label"><i class="far fa-flag"></i> Insights</span>
        </div>
        <div class="column-content" v-loading="insightsLoading">
          <ul v-if="insightGroups && insightGroups.length" class="horizontal-timeline-container__topics-list">
            <template v-for="group in insightGroups">
              <li
                :key="group.id"
                :style="{'color': group.isActive ? group.color : '#666'}"
                @click="togglePhrase(group)"
                class="horizontal-timeline-container__topics-list-item"
              >
                <i class="fa-circle" :class="{ 'fas': group.isActive, 'far': !group.isActive }"></i>
                <span>{{ group.name }}</span>
              </li>
            </template>
          </ul>
          <div v-else class="horizontal-timeline-container__empty-notification">
            <em>We didn't find any matching Insights in this image.</em>
          </div>
        </div>
      </div>
      <div class="image-detail__bottom-content image-detail__bottom--right">
        <div class="column-header">
          <span slot="label"><i class="far fa-globe-americas"></i> Location</span>
        </div>
        <div class="column-content">
          <ul v-if="hasGeoCoding">
            <li v-for="(location, $index) in geoCoding" :key="$index">
              <span v-if="location.label" class="label">{{ location.label }}: </span>
              <span :innerHTML.prop="location.Name | highlightFilter"></span>
            </li>
            <li v-for="place in places" :key="place"><span :innerHTML.prop="place | highlightFilter"></span></li>
          </ul>
          <div v-else class="horizontal-timeline-container__empty-notification">
            <em>We didn't detect any Locations in this image.</em>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import httpStatusCodes from 'http-status-codes'
import shortid from 'shortid'
import {
  mapActions,
  mapGetters,
  mapMutations
} from 'vuex'

import api from 'src/api'
import { CONSTANTS } from 'src/constants'
import CategoriesTabHeader from 'src/components/item/CategoriesTabHeader'
import CommentsPanel from './CommentsPanel.vue'
import ThumbnailImage from 'src/components/thumbnail/ThumbnailImage.vue'
import ImageDisplayer from './ImageDisplayer'
import FieldList from './FieldList.vue'
import LocationMap from './LocationMap.vue'
import OcrItem from 'src/components/item/timeline/OCRItem.vue'
import PersonFaceRenamable from 'src/components/people-faces/PersonFaceRenamable.vue'
import FlatDescription from './flat-component/FlatDescription.vue'
import TagCollection from './flat-component/TagCollection.vue'
import * as storeModules from 'src/store/storeModules'
import { APPLY_HIGHLIGHTS } from 'src/store/modules/highlights/highlights'
import { THUMBNAIL_URL } from 'src/store/modules/item/thumbnail/mutations'

// ocr store
import { GET_ITEM_OCR, GET_OCR_LOADING } from 'src/store/modules/item/ocrs/getters'
import { FETCH_OCR } from 'src/store/modules/item/ocrs/actions'
// tags store
import { GET_ITEM_TAGS, GET_TAGS_LOADING } from 'src/store/modules/item/tags/getters'
import { FETCH_TAGS } from 'src/store/modules/item/tags/actions'
// descriptions store
import { GET_ITEM_DESCRIPTIONS, GET_DESCRIPTIONS_LOADING } from 'src/store/modules/item/descriptions/getters'
import { FETCH_DESCRIPTIONS } from 'src/store/modules/item/descriptions/actions'
// edit mode store
import { SET_EDIT_MODE } from 'src/store/modules/item/edit-mode'
import { ROTATE_THUMBNAIL } from 'src/store/modules/item/thumbnail/actions'
// session
import { GET_AWS_CUSTOM_TAGS_ENABLED } from 'src/store/modules/session/session'
// people store
import {
  GET_IMAGE_ASSET_FACES
} from 'src/store/modules/people-faces/getters'
import {
  RESET_FACES
} from 'src/store/modules/people-faces/mutations'
import {
  FETCH_IMAGE_ASSET_FACES,
  DELETE_IMAGE_ASSET_FACE,
  RENAME_IMAGE_ASSET_FACE_NEW_PERSON,
  RENAME_IMAGE_ASSET_FACE_EXISTING_PERSON,
  UNKNOW_IMAGE_ASSET_FACE,
  TRAIN_IMAGE_ASSET_FACE
} from 'src/store/modules/people-faces/actions'
// insights store
import { GET_INSIGHTS_BUSY, GET_INSIGHTS_GROUPS } from 'src/store/modules/item/insights/getters'
import { LOAD_INSIGHTS, UPDATE_INSIGHTS } from 'src/store/modules/item/insights/actions'
// custom tags store
import { GET_CUSTOM_TAGS, GET_CUSTOM_TAG_NAMES } from 'src/store/modules/item/custom-tags/getters'
import { LOAD_CUSTOM_TAGS_TIMELINES } from 'src/store/modules/item/custom-tags/actions'

import VuexItemUIStateMixin from 'src/mixins/VuexItemUIStateMixin'
import VariableStateMixin from 'src/mixins/VariableStateMixin'
import VuexItemMixin from 'src/mixins/VuexItemMixin'
import { GEOCODING, THUMBNAIL, ITEM_ID } from 'src/store/modules/item/getterTypes'
import { LOAD_ADULT_TIMELINES } from 'src/store/modules/item/adult/actions'
import { LOAD_KNOWN_GRAPHICS_TIMELINES } from 'src/store/modules/item/known–graphics/actions'
import {GET_KNOWN_GRAPHICS} from 'src/store/modules/item/known–graphics/getters'
import {GET_ADULT_CATEGORIES} from 'src/store/modules/item/adult/getters'

import { GET_PLACE_NAMES } from 'src/store/modules/item/places/getters'
import { LOAD_PLACES_TIMELINES } from 'src/store/modules/item/places/actions'
// technical metadata (for Asset Overview tab)
import TechnicalMetadata from './TechnicalMetadata'
// custom fields data
import CustomDataFields from 'src/components/item/custom-data-fields/CustomDataFields'
import CUSTOM_DATA from 'src/store/storeModules'
import { FETCH_ITEM_CUSTOM_DATA } from 'src/store/modules/item/custom-data-fields/actions'

const PEOPLE_TYPES = CONSTANTS.PEOPLE_TYPES
const SORT_BY = CONSTANTS.SORT_BY
const SORT_DIRECTION = CONSTANTS.SORT_DIRECTION

export default {
  name: 'image-detail',

  components: {
    CategoriesTabHeader,
    CommentsPanel,
    CustomDataFields,
    FieldList,
    FlatDescription,
    ImageDisplayer,
    LocationMap,
    OcrItem,
    PersonFaceRenamable,
    TagCollection,
    TechnicalMetadata,
    ThumbnailImage
  },

  mixins: [
    VariableStateMixin,
    VuexItemMixin,
    VuexItemUIStateMixin
  ],

  data () {
    return {
      facesBusy: false
    }
  },

  beforeMount () {
    // load custom fields data
    this.loadCustomData()
    // load adult categories
    this.$store.dispatch(`${storeModules.ADULT}/${LOAD_ADULT_TIMELINES}`)
    // load custom tags
    this.$store.dispatch(`${storeModules.CUSTOM_TAGS}/${LOAD_CUSTOM_TAGS_TIMELINES}`)
    // load know graphics
    this.$store.dispatch(`${storeModules.KNOWN_GRAPHICS}/${LOAD_KNOWN_GRAPHICS_TIMELINES}`)
    // load ocr
    this.$store.dispatch(`${storeModules.OCR}/${FETCH_OCR}`, {
      itemType: this.CONSTANTS.ITEM_DETAIL_TYPES.IMAGE
    })
    // load tags
    this.$store.dispatch(`${storeModules.TAGS}/${FETCH_TAGS}`)
    this.$store.commit(`${storeModules.EDIT_MODE}/${SET_EDIT_MODE}`, { id: this.tagsEditID, editMode: true })
    // load descriptions
    this.$store.dispatch(`${storeModules.DESCRIPTIONS}/${FETCH_DESCRIPTIONS}`)
    // load places
    this.$store.dispatch(`${storeModules.PLACES}/${LOAD_PLACES_TIMELINES}`)

    // set default vertical tab
    this.setVerticalTab({ name: this.CONSTANTS.VERTICAL_TABS.TECH_DATA })
  },

  async mounted () {
    // image detail does not have "search within a search" so we must apply the highlights when loaded
    await this.applyHighlights()
    // insights
    await this.loadInsights({ isActive: true })

    if (this.insightGroups) {
      this.updateInsights()
    }

    // people
    this.loadPeople()
  },

  computed: {
    ...mapGetters(storeModules.OCR, {
      ocrs: GET_ITEM_OCR,
      loading: GET_OCR_LOADING
    }),
    ...mapGetters(storeModules.ITEM, {
      itemId: ITEM_ID,
      thumbnail: THUMBNAIL,
      geoCoding: GEOCODING
    }),
    ...mapGetters(storeModules.TAGS, {
      rawTags: GET_ITEM_TAGS,
      tagsLoading: GET_TAGS_LOADING
    }),
    ...mapGetters(storeModules.DESCRIPTIONS, {
      rawDescription: GET_ITEM_DESCRIPTIONS,
      tagsLoading: GET_DESCRIPTIONS_LOADING
    }),
    ...mapGetters(storeModules.ADULT, {
      adultCategories: GET_ADULT_CATEGORIES
    }),
    ...mapGetters(storeModules.CUSTOM_TAGS, {
      customTags: GET_CUSTOM_TAG_NAMES
    }),
    ...mapGetters(storeModules.KNOWN_GRAPHICS, {
      knownGraphics: GET_KNOWN_GRAPHICS
    }),
    ...mapGetters(storeModules.INSIGHTS, {
      insightGroups: GET_INSIGHTS_GROUPS,
      insightsLoading: GET_INSIGHTS_BUSY
    }),
    ...mapGetters(storeModules.PEOPLE_FACES, {
      imageAssetFaces: GET_IMAGE_ASSET_FACES
    }),
    ...mapGetters(storeModules.SESSION, {
      awsCustomTagsEnabled: GET_AWS_CUSTOM_TAGS_ENABLED
    }),
    ...mapGetters(storeModules.PLACES, {
      places: GET_PLACE_NAMES
    }),
    tagCollection () {
      return _.get(this.rawTags, '[0]')
    },
    tags () {
      return _.get(this.tagCollection, 'tags', []) || []
    },
    tagsMetaID () {
      return _.get(this.tagCollection, 'metaID', '') || ''
    },
    tagsEditID () {
      return `tags${this.itemId}`
    },
    descriptionEditID () {
      return `description${this.itemId}`
    },
    descriptionMetaID () {
      return _.get(this.rawDescription, '[0].metaID', '') || ''
    },
    description () {
      return _.get(this.rawDescription, '[0].description', null)
    },
    descriptionText () {
      return _.get(this.description, 'text', '')
    },
    descriptionID () {
      return _.get(this.description, 'id', '')
    },
    descriptionUpdating () {
      return _.get(this.description, 'updating', false)
    },
    technicalData () {
      return _.get(this.item, 'media_info.image', null)
    },
    hasAdultCategories () {
      return _.get(this, 'adultCategories.length')
    },
    hascustomTags () {
      return _.get(this, 'customTags.length')
    },
    hasGeoCoding () {
      return _.get(this, 'geoCoding.length') || _.get(this, 'places.length')
    },
    hasKnownGraphics () {
      return _.get(this, 'knownGraphics.length')
    },
    imageOcrs () {
      return _.get(this, 'ocrs[0].ocrs', []) || []
    },
    hasOcrs () {
      // images do not have segments so we look for items in the ocrs array in the first item of the parent ocrs array
      return this.imageOcrs.length > 0
    },
    hasPeople () {
      return _.get(this, 'imageAssetFaces.length', 0)
    },
    knownFaces () {
      return this.imageAssetFaces.filter(f => f.person.is_known === true)
    },
    unknownFaces () {
      return this.imageAssetFaces.filter(f => f.person.is_known === false)
    }
  },

  methods: {
    ...mapActions(storeModules.HIGHLIGHTS, {
        applyHighlights: APPLY_HIGHLIGHTS
      }),

    ...mapActions(storeModules.INSIGHTS, {
      loadInsights: LOAD_INSIGHTS,
      updateInsights: UPDATE_INSIGHTS
    }),

    ...mapActions(storeModules.PEOPLE_FACES, {
      fetchImageAssetFaces: FETCH_IMAGE_ASSET_FACES,
      doDeleteFace: DELETE_IMAGE_ASSET_FACE,
      doRenameFaceNewPerson: RENAME_IMAGE_ASSET_FACE_NEW_PERSON,
      doRenameFaceExistingPerson: RENAME_IMAGE_ASSET_FACE_EXISTING_PERSON,
      doUnknowFace: UNKNOW_IMAGE_ASSET_FACE,
      doTrainFace: TRAIN_IMAGE_ASSET_FACE
    }),

    ...mapMutations(storeModules.PEOPLE_FACES, {
      resetFaces: RESET_FACES
    }),

    loadCustomData () {
      this.$store.dispatch(`${storeModules.CUSTOM_DATA}/${FETCH_ITEM_CUSTOM_DATA}`)
    },

    async loadPeople () {
      this.facesBusy = true
      await this.fetchImageAssetFaces(this.itemId)
      this.facesBusy = false
    },

    togglePhrase (phrase, forceOn = false) {
      if (forceOn === true) {
        phrase.isActive = true
      } else {
        phrase.isActive = !phrase.isActive
      }
      this.updateInsights()
    },

    cancelEditing: function () {
      this.$store.commit(`${storeModules.EDIT_MODE}/${SET_EDIT_MODE}`, {
        id: this.descriptionEditID,
        editMode: false
      })
    },

    async rotateThumb (rotation) {
      await this.$store.dispatch(`${storeModules.THUMBNAIL}/${ROTATE_THUMBNAIL}`, { rotation })
      this.$store.commit(`${storeModules.THUMBNAIL}/${THUMBNAIL_URL}`, `${this.thumbnail}?key=${shortid.generate()}`)
    },

    async renameFaceNew (faceId, newName) {
      this.facesBusy = true
      try {
        await this.doRenameFaceNewPerson({ faceId, newName })
      } catch (err) {
        this.$notify({
          type: 'error',
          title: 'Error',
          message: 'Error renaming face'
        })
      }
      this.facesBusy = false
    },

    async renameFaceExisting (faceId, person) {
      this.facesBusy = true
      try {
        await this.doRenameFaceExistingPerson({ faceId, person })
      } catch (err) {
        this.$notify({
          type: 'error',
          title: 'Error',
          message: 'Error renaming face'
        })
      }
      this.facesBusy = false
    },

    async deleteFace (faceId) {
      this.facesBusy = true
      try {
        await this.doDeleteFace(faceId)
      } catch (err) {
        this.$notify({
          type: 'error',
          title: 'Error',
          message: 'Error deleting face'
        })
      }
      this.facesBusy = false
    },

    async trainFace (faceId, personId) {
      this.facesBusy = true
      try {
        await this.doTrainFace({ faceId, personId })
        this.$notify({
          type: 'success',
          title: 'Success',
          message: 'Face was successfully trained'
        })
      } catch (err) {
        this.$notify({
          type: 'error',
          title: 'Error',
          message: 'Error training face'
        })
      }
      this.facesBusy = false
    },

    async makeFaceUnknown (faceId) {
      this.facesBusy = true
      try {
        await this.doUnknowFace(faceId)
      } catch (err) {
        this.$notify({
          type: 'error',
          title: 'Error',
          message: 'Error making face unknown'
        })
      }
      this.facesBusy = false
    }
  }
}
</script>

<style lang="less">
@import '../../styles/_variables.less';
@import '../../styles/_mixins';

div#item-detail {
  color: @text-dark;
  height: 100%;
  overflow-y: hidden;
}

.item-info {
  height: calc(~'100% - 78px'); // 78px == 45px for header + 33px for related files drawer
}
.image-detail-wrapper,
.image-detail {
  height: 100%;
  min-width: 1200px;
}

.image-detail__top {
  display: flex;
  padding: 20px;
  height: 50%;
  //overflow-y: hidden;
}

.image-detail__top--left {
  background-color: @color-primary;
  width: 55%;
  display: inline-block;
  position: relative;
  top: 0;
  left: 0;
  .image-wrapper {
    height: 100%;
    .image-view {
      height: calc(~'100% - 46px');
      .el-loading-mask {
        background-color: unset;
      }
      .image-displayer {
        height: 100%;
        .image {
          height: 100%;
          background-position: center;
          background-size: contain;
        }
      }
    }
    .file-info {
      .flex-container-end();
      .align-items-center();
      height: 46px;

      .data-area {
        padding: 8px;
      }

      .el-menu--horizontal {
        .flex-box();
        .align-items-center();

        background-color: unset;
        border-bottom: unset;

        &>.el-submenu.is-active .el-submenu__title {
          border-bottom: unset;
        }

        &>.el-submenu {
          .el-submenu__title {
            color: @color-base;
            font-size: 10px;
            font-weight: bold;
            font-style: normal;
            font-stretch: normal;
            letter-spacing: 0.5px;
            height: unset;
            line-height: unset;
            text-transform: uppercase;

            &:hover {
              background-color: unset;
            }

            i {
              color: @color-base;
            }
          }
        }
      }
    }
  }
}

.image-detail__top--right {
  background: @background-grey;
  width: 45%;
  top: 0;
  right: 0;
  overflow-y: hidden;
  margin-left: 20px;
  .vertical-timelines {
    height: 100%;
    > .el-tabs > .el-tabs__content {
      height: calc(~'100% - 40px'); // 40px for the tabs
      overflow-y: auto;
      > .el-tab-pane > div {
        overflow-y: unset;
      }
      > div#pane-tags-descriptions.el-tab-pane {
        height: auto;
      }
      >div#pane-technical-metadata.el-tab-pane.el-tab-pane {
        height: auto;
        width: auto;
        padding: 10px 0px 10px 10px;
      }
      > div#pane-ocr.el-tab-pane.el-tab-pane {
        height: auto;
        > .ocr {
          height: auto;
          padding: 10px 0 10px 20px;
          overflow-y: unset;
        }
      }
    }
  }
}

.image-detail__bottom {
  background-color: @background-grey;
  display: flex;
  height: 50%;
  margin: 0 20px;
  > div {
    font-size: 12px;
    height: 100%;
    width: 20%;
    min-width: 240px;
    &:nth-child(even) {
      background-color: @collapse-background;
    }
    // people/faces tab, give it a bit more min-width
    &.image-detail__bottom--left {
      min-width: 240px;
    }
  }
  &.sixths > div {
    width: 16.6666%;
    min-width: 200px;
  }
  &.no-faces > div {
    width: 25%;
  }
  .column-header {
    border-bottom: solid 1px @line-grey;
    padding: 10px;
  }
  .column-content {
    height: calc(~'100% - 65px'); // to help account for when bottom drawer is there and header of container
    overflow-y: auto;

    ul.categories {
      text-transform: capitalize;
    }

    .el-tabs--top {
      height: 100%;
      .el-tabs__nav-next, .el-tabs__nav-prev {
        line-height: 25px;
      }
    }
    .el-tabs__content {
      height: calc(~'100% - 25px'); // 35px == el-tabs__header.is-top
      > div, // tab pane-0 & pane-1 (Known & Unknown) list
      .people-list {
        height: 100%;
        overflow-y: auto;
      }
      .people-list {
        height: 100%;
        padding: 15px 15px 0;
        overflow-y: auto;
        .people {
          border: none;
        }
      }
    }
    .horizontal-timeline-container__topics-list > li {
      cursor: pointer;
      > span.dot {
        display: inline-block;
        height: 8px;
        width: 8px;
        border-radius: 50%;
        background-color: @color-base;
        border: 1px solid @color-tone-medium;
        margin-right: 4px;
      }
    }
  }
  .horizontal-timeline-container__empty-notification {
    padding-top: 10px;
  }
  .image-detail__bottom--left {
    .el-tabs .el-tabs__header {
      border: none;
    }
    .el-tabs.el-tabs--top .el-tabs__header .el-tabs__nav-wrap .el-tabs__nav-scroll .el-tabs__nav .el-tabs__item {
      font-size: 10px;
      font-weight: 900;
      height: 25px;
      line-height: 25px;
      text-transform: uppercase;
    }
  }
  .label {
    font-weight: 700;
  }
  ul {
    overflow-y: auto;
    padding-left: 15px;
    li {
      list-style-type: none;
      margin-bottom: 10px;
    }
  }
}
.el-menu--horizontal .el-menu.el-menu--popup {
  background-color: @color-primary;
  min-width: unset;
  border-radius: 4px;
  border: solid 0.5px @color-tone;
  .el-menu-item,
  .el-menu-item i {
    background-color: @color-primary;
    color: @color-base;
    font-size: 10px;
    font-weight: bold;
    font-style: normal;
    font-stretch: normal;
    height: 20px;
    line-height: 20px;
    letter-spacing: normal;
    margin-right: 4px;
    text-align: left;
  }
}

.person-list {
  padding: 10px;
  > .person-face-renamable {
    margin-bottom: 8px;
    position: relative;
    .face-status-indicator {
      .abs-pos(-4px, auto, auto, -4px);
      background-color: @color-accent;
      border-radius: 50%;
      height: 17px;
      position: absolute;
      width: 17px;
      text-align: center;
      > i {
        color: @color-base;
        font-size: 10px;
        line-height: 17px;
      }
    }
    .el-dropdown,
    .remove-face-button {
      .abs-pos(auto, auto, -7px, 41px);
    }
    .remove-face-button,
    .face-menu-button {
      .flex-container-center();
      background-color: @primary-button-color;
      border-radius: 50%;
      border: 0 none;
      color: @color-base;
      cursor: pointer;
      font-size: 11px;
      height: 17px;
      width: 17px;
      > i {
        line-height: 16px;
      }
      &:hover {
        background-color: @primary-button-color__hover;
      }
    }
  }
}
</style>
