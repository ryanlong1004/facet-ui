<template>
  <section class="multi-page-document timeline-layout horizontal-timelines-flex-wrapper" id="main" v-bind:class="{ 'select-none': dragging }">
    <div id="top">
      <div id="video" ref="video">
        <div v-if="documentThumbnailsLoading" v-loading="documentThumbnailsLoading" class="loading-thumbnails"></div>
        <document-thumbnails
           v-else
          :docmaxheight="docMaxHeight"
          :is-pdf="isPdf"
          :thumbnails="documentThumbnails">
        </document-thumbnails>
        <div class="categories-container">
          <categories-tab-header></categories-tab-header>
        </div>
      </div>
      <div ref="drag-vertical" @mousedown="startDragV" @dblclick="resetDrag" class="drag drag-vertical"></div>
      <div class="vertical-timelines" ref="vertical-timelines">
        <el-tabs id="vertical-tabs" :value="verticalTab" @tab-click="setVerticalTab">
          <el-tab-pane :lazy="true" label="Technical Data" :name="CONSTANTS.VERTICAL_TABS.TECH_DATA">
              <span slot="label"><i class="far fa-table"></i> Technical Data</span>
              <div class="timeline-content-wrapper">
                <technical-metadata></technical-metadata>
              </div>
          </el-tab-pane>
          <el-tab-pane :lazy="true" label="Text" :name="CONSTANTS.VERTICAL_TABS.TEXT_CONTENT">
            <span slot="label"><i class="far fa-quote-right"></i> Text</span>
            <div class="timeline-content-wrapper">
              <document-pagethrough></document-pagethrough>
              <document-text></document-text>
            </div>
          </el-tab-pane>
          <el-tab-pane :lazy="true" label="Tags" :name="CONSTANTS.VERTICAL_TABS.TAGS_DESCRIPTIONS_VUEX">
            <span slot="label"><i class="far fa-tags"></i> Tags &amp; descriptions</span>
            <div class="timeline-content-wrapper">
              <document-pagethrough></document-pagethrough>
              <document-tags-descriptions></document-tags-descriptions>
            </div>
          </el-tab-pane>
          <el-tab-pane :lazy="true" label="OCR" :name="CONSTANTS.VERTICAL_TABS.OCR">
            <span slot="label"><i class="icon-OCR"></i> Visual text (OCR)</span>
            <div class="timeline-content-wrapper">
              <document-pagethrough></document-pagethrough>
              <document-ocr></document-ocr>
            </div>
          </el-tab-pane>
          <el-tab-pane :lazy="true" label="Custom Data" :name="CONSTANTS.VERTICAL_TABS.CUSTOM_DATA">
            <span slot="label"><i class="far fa-clipboard-list"></i> Custom Data</span>
            <div class="timeline-content-wrapper">
              <custom-data-fields></custom-data-fields>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
    <div ref="drag-horizontal" class="drag drag-horizontal"></div>
    <div id="horizontal-timelines" class="horizontal-timelines" ref="horizontal-timelines">
      <el-tabs id="horizontal-tabs" v-on:tab-click="setHorizontalTab" :value="horizontalTab">
        <el-tab-pane label="Search Term" :name="CONSTANTS.HORIZONTAL_TABS.SEARCH_TERM">
          <span slot="label"><i class="far fa-search"></i> Search term</span>
          <searched-for-term></searched-for-term>
        </el-tab-pane>
        <el-tab-pane label="Custom Tags" :name="CONSTANTS.HORIZONTAL_TABS.CUSTOM_TAGS" v-if="awsCustomTagsEnabled">
          <span slot="label"><i class="fas fa-user-tag"></i> Custom Tags</span>
          <categories-with-summary
            :title="'Custom Tags'"
            :categories-vuex-prefix="CONSTANTS.CATEGORIES_PREFIX.CUSTOM_TAGS"
            :show-summary="false"
            ></categories-with-summary>
        </el-tab-pane>
        <el-tab-pane label="People" :name="CONSTANTS.HORIZONTAL_TABS.PEOPLE" v-if="showPeopleFaces">
          <span slot="label"><i class="far fa-user"></i> People</span>
          <people
            :is-document="true"
            :is-tab-visible="horizontalTab === CONSTANTS.HORIZONTAL_TABS.PEOPLE"
          ></people>
        </el-tab-pane>
        <el-tab-pane label="Logos" :name="CONSTANTS.HORIZONTAL_TABS.GRAPHICS">
          <span slot="label"><i class="far fa-images"></i> Known graphics</span>
          <categories-with-summary
            :title="'Logos'"
            :categories-vuex-prefix="CONSTANTS.CATEGORIES_PREFIX.KNOWN_GRAPHICS"
            ></categories-with-summary>
        </el-tab-pane>
        <el-tab-pane label="Locations" :name="CONSTANTS.HORIZONTAL_TABS.LOCATIONS">
          <span slot="label"><i class="far fa-globe-americas"></i> Locations</span>
          <categories-with-summary
            :title="'Locations'"
            :categories-vuex-prefix="CONSTANTS.CATEGORIES_PREFIX.PLACES"
          ></categories-with-summary>
        </el-tab-pane>
        <el-tab-pane label="Adult Content" :name="CONSTANTS.HORIZONTAL_TABS.MATURE_CONTENT">
          <span slot="label"><i class="far fa-eye-slash"></i> Adult Content</span>
          <categories-with-summary
            :title="'Adult Content'"
            :categories-vuex-prefix="CONSTANTS.CATEGORIES_PREFIX.ADULT"
          ></categories-with-summary>
        </el-tab-pane>
        <el-tab-pane label="Insights" :name="CONSTANTS.HORIZONTAL_TABS.INSIGHTS">
          <span slot="label"><i class="far fa-flag"></i> Insights</span>
          <insights></insights>
        </el-tab-pane>
      </el-tabs>
    </div>
  </section>
</template>

<script>
import _ from 'lodash'
import { mapActions, mapGetters } from 'vuex'
import api from 'src/api'
import { CONSTANTS } from 'src/constants'
import People from 'src/components/item/People.vue'
import Insights from 'src/components/item/Insights.vue'
import SearchedForTerm from 'src/components/item/SearchedForTerm.vue'
import DocumentPagethrough from 'src/components/item/timeline/DocumentPagethrough'
import DocumentText from 'src/components/item/timeline/DocumentText'
import DocumentOcr from 'src/components/item/timeline/DocumentOCR'
import DocumentTagsDescriptions from 'src/components/item/timeline/DocumentTagsDescriptions'
import { setCookie, getCookie } from 'src/cookie-helper'
import * as storeModules from 'src/store/storeModules'
import * as rightPanelMutators from 'src/store/modules/rightPanel/mutationTypes'

// document thumbnails store
import { GET_ITEM_DOCUMENT_THUMBNAILS, GET_DOCUMENT_THUMBNAILS_LOADING } from 'src/store/modules/item/document-thumbnails/getters'
import { FETCH_DOCUMENT_THUMBNAILS } from 'src/store/modules/item/document-thumbnails/actions'

import { GET_AWS_CUSTOM_TAGS_ENABLED } from 'src/store/modules/session/session'

import DocumentThumbnails from 'src/components/item/DocumentThumbnails'
import { PROPERTY_PATHS } from 'src/property-paths'
import CategoriesTabHeader from 'src/components/item/CategoriesTabHeader'
import CategoriesWithSummary from 'src/components/item/CategoriesWithSummary'

import VuexItemUIStateMixin from 'src/mixins/VuexItemUIStateMixin'
import VariableStateMixin from 'src/mixins/VariableStateMixin'
import VuexItemMixin from 'src/mixins/VuexItemMixin'
import PlayheadMixin from 'src/mixins/PlayheadMixin'
// technical metadata (for Asset Overview tab)
import TechnicalMetadata from './TechnicalMetadata'
// custom fields data
import CustomDataFields from 'src/components/item/custom-data-fields/CustomDataFields'
import CUSTOM_DATA from 'src/store/storeModules'
import { FETCH_ITEM_CUSTOM_DATA } from 'src/store/modules/item/custom-data-fields/actions'

export default {

  name: 'multi-page-document',

  components: {
    CategoriesTabHeader,
    CategoriesWithSummary,
    CustomDataFields,
    DocumentOcr,
    DocumentPagethrough,
    DocumentTagsDescriptions,
    DocumentText,
    DocumentThumbnails,
    Insights,
    People,
    SearchedForTerm,
    TechnicalMetadata
  },

  mixins: [
    PlayheadMixin,
    VariableStateMixin,
    VuexItemMixin,
    VuexItemUIStateMixin
  ],

  data () {
    return {
      docMaxHeight: 300,
      dragging: false
    }
  },

  beforeMount () {
    // load document thumbnails
    this.getThumbnails(this.itemId)
    // load custom fields data
    this.loadCustomData()
    // set default horizontal and vertical tabs
    this.setHorizontalTab({ name: this.CONSTANTS.HORIZONTAL_TABS.SEARCH_TERM })
    this.setVerticalTab({ name: this.CONSTANTS.VERTICAL_TABS.TECH_DATA })
  },

  mounted: function () {
    // set doc image max height on load based on vertical timeline height
    this.docMaxHeight = this.$refs['vertical-timelines'].clientHeight - 40
    // set doc image max height on window resize
    this.$nextTick(() => {
      window.addEventListener('resize', this.getVerticalTimelineHeight)
    })

    if (this.getCookie('video_width')) {
      this.$refs['video'].style.width = this.getCookie('video_width')
      this.$refs['vertical-timelines'].style.width = this.getCookie('vertical_timelines_width')
    }

    const htab = this.$route.query[this.CONSTANTS.QUERY_PARAMS.HORIZONTAL_TAB]
    if (htab) {
      this.setHorizontalTab({ name: htab })
    }

    const seekTo = this.$route.query[this.CONSTANTS.QUERY_PARAMS.SEEK_TO]
    if (seekTo) {
      const to = _.toNumber(seekTo)
      if (_.isNumber(to) && !_.isNaN(to)) {
        this.setPlayheadTime(to)
      }
    }
  },

  beforeDestroy: function () {
    window.removeEventListener('mousemove', this.moveDragV)
    document.removeEventListener('mouseup', this.stopDragV)
    window.removeEventListener('resize', this.getVerticalTimelineHeight)
  },

  methods: {
    ...mapActions(storeModules.DOCUMENT_THUMBNAILS, {
      getThumbnails: FETCH_DOCUMENT_THUMBNAILS
    }),

    setCookie () {
      setCookie('video_width', this.$refs['video'].style.width)
      setCookie('vertical_timelines_width', this.$refs['vertical-timelines'].style.width)
    },

    getCookie,

    startDragV: function () {
      this.dragging = true
      window.addEventListener('mousemove', this.moveDragV)
      document.addEventListener('mouseup', this.stopDragV)
    },

    stopDragV: function () {
      this.dragging = false
      window.removeEventListener('mousemove', this.moveDragV)
      document.removeEventListener('mouseup', this.stopDragV)
      const resizeEvent = document.createEvent('Event')
      resizeEvent.initEvent('resize', true, true)
      window.dispatchEvent(resizeEvent)
      this.setCookie()
    },

    moveDragV: function (e) {
      if (e.clientX > 400 && e.clientX < e.view.innerWidth - 400) {
        // send max height to doc image based on vertical timeline height
        this.docMaxHeight = this.$refs['vertical-timelines'].clientHeight - 40
        // offset for main menu on left sidebar and middle vertical bar dragger
        this.$refs['video'].style.width = 'calc(' + (e.clientX / e.view.innerWidth) * 100 + '% - 50px)'
        this.$refs['vertical-timelines'].style.width = 'calc(' + (100 - ((e.clientX / e.view.innerWidth) * 100)) + '% + 20px)'
      }
    },

    resetDrag: function (e) {
      // offset for main menu on left sidebar and middle vertical bar dragger
      this.$refs['video'].style.width = 'calc(40% - 50px)'
      this.$refs['vertical-timelines'].style.width = 'calc(60% + 20px)'
      this.setCookie()
    },

    getVerticalTimelineHeight () {
      this.docMaxHeight = this.$refs['vertical-timelines'].clientHeight - 40
    },

    loadCustomData () {
      this.$store.dispatch(`${storeModules.CUSTOM_DATA}/${FETCH_ITEM_CUSTOM_DATA}`)
    },

  },

  computed: {
    ...mapGetters(storeModules.DOCUMENT_THUMBNAILS, {
      documentThumbnails: GET_ITEM_DOCUMENT_THUMBNAILS,
      documentThumbnailsLoading: GET_DOCUMENT_THUMBNAILS_LOADING
    }),
    ...mapGetters(storeModules.SESSION, {
      awsCustomTagsEnabled: GET_AWS_CUSTOM_TAGS_ENABLED
    }),
    isPdf () {
      return _.get(this.item, PROPERTY_PATHS.MIME_TYPE.path, '').indexOf('pdf') > -1
    },
    totalVideoTime () {
      return _.get(this.documentThumbnails, 'length')
    }
  }
}
</script>

<style>
  #horizontal-timelines .el-tabs__content {
    overflow: visible;
  }
</style>

<style lang="less" scoped>
  @import (reference) '~src/styles/_variables';
  @import (reference) '~src/styles/_mixins';

  #main {
    height: 100%;
    position: relative;
    padding: 30px 30px 40px 30px;
  }

  #main.select-none {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
     -khtml-user-select: none;
       -moz-user-select: none;
        -ms-user-select: none;
            user-select: none;
  }

  #top {
    overflow: hidden;
    position: relative;
    width: 100%;
    /* set top section height and adds 30px for the file info action buttons */
    min-height: calc(50% + 30px);
  }

  #video {
    width: 45%;
    display: inline-block;
    position: relative;
    top: 0;
    left: 0;
    //overflow-y: hidden;
  }

  .categories-container {
    .abs-pos(auto, auto, -26px, auto);
    .flex-container-center();
    background: @color-primary;
    height: auto;
    min-height: 46px;
    padding: 9px;
    width: 100%;
  }

  .vertical-timelines {
    background-color: @color-tone-light;
    display: inline-block;
    height: 100%;
    position: absolute;
    top: 0;
    right: 0;
    /* offset for middle vertical bar dragger */
    width: calc(55% - 30px);
    overflow-y: hidden;
    border-bottom: 1px solid rgb(209, 215, 229);
  }

  .vertical-timelines > .el-tabs,
  .vertical-timelines > .el-tabs > .el-tabs__content,
  .vertical-timelines > .el-tabs > .el-tabs__content > .el-tab-pane,
  .vertical-timelines > .el-tabs > .el-tabs__content > .el-tab-pane > .timeline-content-wrapper {
    background-color: transparent;
    height: 100%;
  }
  .vertical-timelines > .el-tabs > .el-tabs__content > .el-tab-pane > .timeline-content-wrapper {
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    padding-bottom: 25px;
  }
  .vertical-timelines > .el-tabs > .el-tabs__content > .el-tab-pane > .timeline-content-wrapper > .document-pagethrough {
    position: sticky;
    top: 0;
  }


  .drag-vertical {
    transition: all 0.25s ease-in-out;
    display: inline-block;
    width: 10px;
    margin-top: 10px;
    margin-left: 10px;
    /* offset for middle vertical bar dragger */
    min-height: calc(100% - 20px);
    border: 1px solid transparent;
    background-color: @background-light-gray;
    position: absolute;
    top: 0;
    cursor: col-resize;
  }

  .drag-vertical:hover {
    border: 1px solid lightgrey;
    -webkit-box-shadow: 0px 0px 5px 0px rgba(0,0,0,0.11);
    -moz-box-shadow: 0px 0px 5px 0px rgba(0,0,0,0.11);
    box-shadow: 0px 0px 5px 0px rgba(0,0,0,0.11);
    background-color: @color-tone-lightest;
    z-index: 90002;
  }

  .drag-horizontal {
    display: inline-block;
    height: 30px;
    min-width: 100%;
    position: relative;
    top: 0;
  }
</style>

<style lang="less">
  .multi-page-document {
    #top {
      #video {
        .loading-thumbnails {
          text-align: center;
          margin: 25px;
        }
      }
    }
    .timeline-loading {
      min-height: 100px;
      .el-loading-mask {
        background-color: transparent;
      }
    }
    &.horizontal-timelines-flex-wrapper .horizontal-timelines {
      height: 100%;
      min-height: 200px;
    }
  }

</style>
