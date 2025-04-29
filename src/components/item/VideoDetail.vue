<template>
  <section class="video-detail timeline-layout horizontal-timelines-flex-wrapper" :class="{ 'select-none': dragging }">
    <div id="top">
      <div id="video" ref="video">
        <video-player ref="video-player"></video-player>
        <div class="categories-container">
          <categories-tab-header></categories-tab-header>
        </div>
      </div>
      <div ref="drag-vertical" @mousedown="startDragV" @dblclick="resetDrag" class="drag drag-vertical"></div>
      <div id="vertical-timelines" ref="vertical-timelines">
        <el-tabs id="vertical-tabs" :value="verticalTab" @tab-click="setVerticalTab" ref="vertical-timeline-tabs">
          <el-tab-pane label="Asset Overview" :name="CONSTANTS.VERTICAL_TABS.ASSET_OVERVIEW" id="asset-overview">
            <span slot="label"><i class="far fa-ballot-check"></i> Overview</span>
            <div class="iframe-container" @mouseup="iframeContainerMouseUp" :class="{'not-dragging' : !dragging, 'dragging' : dragging}">
              <iframe :src="`/api/data/v3/summary/items/${item.id}/overview`" width="100%" height=100% frameBorder="0" @mouseup="iframeContainerMouseUp"> </iframe>
            </div>
          </el-tab-pane>
          <el-tab-pane label="Technical Data" :name="CONSTANTS.VERTICAL_TABS.TECH_DATA">
            <span slot="label"><i class="far fa-table"></i> Tech Data</span>
            <technical-metadata></technical-metadata>
          </el-tab-pane>
          <el-tab-pane label="Speech to Text" :name="CONSTANTS.VERTICAL_TABS.SPEECH_TO_TEXT" id="speech-to-text">
            <span slot="label"><i class="far fa-comments-alt"></i> Speech-to-text</span>
            <speech-to-text
              :current-video-time="currentPlayheadTime"
              :set-current-video-time="setSeekTo"
              :current-tab="verticalTab">
            </speech-to-text>
          </el-tab-pane>
          <el-tab-pane label="External Audio" :name="CONSTANTS.VERTICAL_TABS.EXT_AUDIO" id="ext-audio">
            <span slot="label"><i class="far fa-waveform-lines"></i> Ext. Audio</span>
            <ext-audio></ext-audio>
          </el-tab-pane>
          <el-tab-pane label="Captions" :name="CONSTANTS.VERTICAL_TABS.CAPTIONS" id="captions">
            <span slot="label"><i class="far fa-closed-captioning"></i> Captions</span>
            <captions
              :current-video-time="currentPlayheadTime"
              :set-current-video-time="setSeekTo"
              :current-tab="verticalTab">
            </captions>
          </el-tab-pane>
          <el-tab-pane label="Tags" :name="CONSTANTS.VERTICAL_TABS.TAGS_DESCRIPTIONS_VUEX">
            <span slot="label"><i class="far fa-tags"></i> Tags &amp; descriptions</span>
            <tags-descriptions-vuex
              :current-video-time="currentPlayheadTime"
              :set-current-video-time="setSeekTo"
              :current-tab="verticalTab">
            </tags-descriptions-vuex>
          </el-tab-pane>
          <el-tab-pane label="OCR" :name="CONSTANTS.VERTICAL_TABS.OCR">
            <span slot="label"><i class="icon-OCR"></i>OCR</span>
            <ocr
              :current-video-time="currentPlayheadTime"
              :set-current-video-time="setSeekTo"
              :current-tab="verticalTab">
            </ocr>
          </el-tab-pane>
          <el-tab-pane label="Custom Data" :name="CONSTANTS.VERTICAL_TABS.CUSTOM_DATA">
            <span slot="label"><i class="far fa-clipboard-list"></i> Custom Data</span>
            <custom-data-fields></custom-data-fields>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
    <div ref="drag-horizontal" class="drag drag-horizontal"></div>
    <div id="horizontal-timelines" class="horizontal-timelines" ref="horizontal-timelines">

      <div class="collapse-expand" v-if="!collapseHorizontalTimelines">
        <el-tooltip
          content="Collapse Timeline View"
          effect="dark"
          placement="top"
          :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
          :hide-after="CONSTANTS.TOOLTIP.HIDE_DELAY"
        >
          <i class="far fa-compress-arrows-alt" @click="toggleCollapseTimelines"></i>
        </el-tooltip>
      </div>

      <div class="collapse-expand" v-if="collapseHorizontalTimelines">
        <el-tooltip
          content="Expand Timeline View"
          effect="dark"
          placement="top"
          :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
          :hide-after="CONSTANTS.TOOLTIP.HIDE_DELAY"
        >
          <i class="far fa-expand-arrows-alt" @click="toggleCollapseTimelines"></i>
        </el-tooltip>
      </div>

      <el-tabs id="horizontal-tabs" @tab-click="setHorizontalTab" :value="horizontalTab" ref="horizontal-tabs">
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
          <people :is-tab-visible="horizontalTab === CONSTANTS.HORIZONTAL_TABS.PEOPLE"></people>
        </el-tab-pane>
        <el-tab-pane label="Logos" :name="CONSTANTS.HORIZONTAL_TABS.GRAPHICS">
          <span slot="label"><i class="far fa-images"></i> Known graphics</span>
          <categories-with-summary
            :title="'Logos'"
            :categories-vuex-prefix="CONSTANTS.CATEGORIES_PREFIX.KNOWN_GRAPHICS"
            :show-summary="false"
            ></categories-with-summary>
        </el-tab-pane>
        <el-tab-pane label="Insights" :name="CONSTANTS.HORIZONTAL_TABS.INSIGHTS">
          <span slot="label"><i class="far fa-flag"></i> Insights</span>
          <insights v-if="horizontalTab === CONSTANTS.HORIZONTAL_TABS.INSIGHTS"></insights>
        </el-tab-pane>
        <el-tab-pane label="Locations" :name="CONSTANTS.HORIZONTAL_TABS.LOCATIONS">
          <span slot="label"><i class="far fa-globe-americas"></i> Locations</span>
          <categories-with-summary
            :title="'Locations'"
            :categories-vuex-prefix="CONSTANTS.CATEGORIES_PREFIX.PLACES"
          ></categories-with-summary>
        </el-tab-pane>
        <el-tab-pane label="Audio" :name="CONSTANTS.HORIZONTAL_TABS.AUDIO">
          <span slot="label"><i class="far fa-volume-up"></i> Audio</span>
          <categories-with-summary
            :title="'Audio'"
            :categories-vuex-prefix="CONSTANTS.CATEGORIES_PREFIX.AUDIO"
            :show-summary="false"
            ></categories-with-summary>
        </el-tab-pane>
        <el-tab-pane label="Adult Content" :name="CONSTANTS.HORIZONTAL_TABS.MATURE_CONTENT">
          <span slot="label"><i class="far fa-eye-slash"></i> Adult Content</span>
          <categories-with-summary
            :title="'Adult Content'"
            :categories-vuex-prefix="CONSTANTS.CATEGORIES_PREFIX.ADULT"
          ></categories-with-summary>
        </el-tab-pane>
        <el-tab-pane label="Technical cues" :name="CONSTANTS.HORIZONTAL_TABS.TECHNICAL_CUES">
          <span slot="label"><i class="icon-Black-Frames"></i> Technical cues</span>
          <categories-with-summary
            :title="'Technical cues'"
            :categories-vuex-prefix="CONSTANTS.CATEGORIES_PREFIX.TECH"
            :show-summary="false"></categories-with-summary>
        </el-tab-pane>
        <el-tab-pane
          v-if="!isSaasPlatform"
          label="Sports"
          :name="CONSTANTS.HORIZONTAL_TABS.SPORTS"
        >
          <span slot="label"><i class="far fa-walking"></i> Sports</span>
          <categories-with-summary
            :title="'Sport events'"
            :categories-vuex-prefix="'SPORTS'"
            :show-summary="false"></categories-with-summary>
        </el-tab-pane>
        <el-tab-pane label="MediaDNA" :name="CONSTANTS.HORIZONTAL_TABS.MEDIA_DNA">
          <span slot="label"><i class="icon-Media-DNA"></i> MediaDNA</span>
          <media-dna
            v-if="horizontalTab === CONSTANTS.HORIZONTAL_TABS.MEDIA_DNA"
          ></media-dna>
        </el-tab-pane>
      </el-tabs>
    </div>
  </section>
</template>

<script>
import _ from 'lodash'
import { mapGetters, mapActions } from 'vuex'

import { setCookie, getCookie } from 'src/cookie-helper'

import CategoriesTabHeader from 'src/components/item/CategoriesTabHeader'
import CategoriesWithSummary from 'src/components/item/CategoriesWithSummary'
import HorizontalTimeline from 'src/components/item/timeline/HorizontalTimeline.vue'
import MediaDna from 'src/components/item/MediaDNA.vue'
import People from 'src/components/item/People.vue'
import SearchedForTerm from 'src/components/item/SearchedForTerm.vue'
import VideoPlayer from 'src/components/item/VideoPlayer.vue'

import * as storeModules from 'src/store/storeModules'
import * as rightPanelMutators from 'src/store/modules/rightPanel/mutationTypes'
// ocr store
import { GET_ITEM_OCR, GET_OCR_LOADING } from 'src/store/modules/item/ocrs/getters'
// s2t store
import { FETCH_S2T } from 'src/store/modules/item/s2t/actions'
// people faces
import { GET_SHOW_ITEM_EDITOR } from 'src/store/modules/people-faces/getters'
// session
import { GET_AWS_CUSTOM_TAGS_ENABLED } from 'src/store/modules/session/session'

import Captions from 'src/components/item/timeline/Captions.vue'
import Insights from 'src/components/item/Insights.vue'
import Locations from 'src/components/admin/AdminStorage'
import Ocr from 'src/components/item/timeline/OCR.vue'
import SpeechToText from 'src/components/item/timeline/SpeechToText.vue'
import ExtAudio from 'src/components/item/ExtAudio.vue'
import LocationEnforcerMixin from 'src/components/global/LocationEnforcerMixin'
import VariableStateMixin from 'src/mixins/VariableStateMixin'
import VuexItemMixin from 'src/mixins/VuexItemMixin'
import PlayheadMixin from 'src/mixins/PlayheadMixin'
import VuexItemUIStateMixin from 'src/mixins/VuexItemUIStateMixin'
import TagsDescriptionsVuex from './timeline/TagsDescriptionsVuex'
import {RESET_STORE} from 'src/store/store-helpers'
import TechnicalMetadata from './TechnicalMetadata'
import CustomDataFields from 'src/components/item/custom-data-fields/CustomDataFields'
import CUSTOM_DATA, {CAPTIONS} from 'src/store/storeModules'
import { FETCH_ITEM_CUSTOM_DATA } from 'src/store/modules/item/custom-data-fields/actions'
import {FETCH_CAPTIONS} from '../../store/modules/item/captions/actions'
import {FETCH_EXT_AUDIOS} from '../../store/modules/item/ext-audios/actions'

export default {
  name: 'video-detail',
  components: {
    Captions,
    CategoriesTabHeader,
    CategoriesWithSummary,
    CustomDataFields,
    HorizontalTimeline,
    Insights,
    Locations,
    MediaDna,
    Ocr,
    People,
    SearchedForTerm,
    SpeechToText,
    TagsDescriptionsVuex,
    VideoPlayer,
    TechnicalMetadata,
    ExtAudio
  },
  mixins: [
    LocationEnforcerMixin,
    PlayheadMixin,
    VariableStateMixin,
    VuexItemMixin,
    VuexItemUIStateMixin
  ],
  data () {
    return {
      dragging: false,
      collapseExpandLabel: 'Collapse'
    }
  },

  beforeMount () {
    this.loadSpeechToText()
    this.loadCustomData()
    this.loadCaptions()
    this.loadExtAudios()

    // set default horizontal and vertical tabs
    this.setHorizontalTab({ name: this.CONSTANTS.HORIZONTAL_TABS.SEARCH_TERM })
    this.setVerticalTab({ name: this.CONSTANTS.VERTICAL_TABS.ASSET_OVERVIEW })
  },

  mounted () {
    if (this.getCookie('video_width')) {
      this.$refs['video'].style.width = this.getCookie('video_width')
      this.$refs['vertical-timelines'].style.width = this.getCookie('vertical_timelines_width')
      window.addEventListener('resize', this.windowResized)
    } else {
      this.resetDrag()
    }

    const htab = this.$route.query[this.CONSTANTS.QUERY_PARAMS.HORIZONTAL_TAB]
    if (htab) {
      this.setHorizontalTab({ name: htab })
    }

    const seekTo = this.$route.query[this.CONSTANTS.QUERY_PARAMS.SEEK_TO]
    if (seekTo) {
      const to = _.toNumber(seekTo)
      if (_.isNumber(to) && !_.isNaN(to)) {
        this.setSeekTo(to)
      }
    }
  },

  beforeDestroy: function () {
    window.removeEventListener('mousemove', this.moveDragV)
    document.removeEventListener('mouseup', this.stopDragV)
  },

  methods: {

    iframeContainerMouseUp () {
      this.dragging = false
    },

    toggleCollapseTimelines () {
      this.setCollapseHorizontalTimelines(!this.collapseHorizontalTimelines)
    },

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
      // const resizeEvent = document.createEvent('Event')
      // resizeEvent.initEvent('resize', true, true)
      // window.dispatchEvent(resizeEvent)
      this.setCookie()
    },

    loadSpeechToText () {
      this.$store.dispatch(`${storeModules.S2T}/${FETCH_S2T}`)
    },

    loadCaptions () {
      this.$store.dispatch(`${storeModules.CAPTIONS}/${FETCH_CAPTIONS}`)
    },

    loadExtAudios () {
      this.$store.dispatch(`${storeModules.EXT_AUDIOS}/${FETCH_EXT_AUDIOS}`)
    },

    loadCustomData () {
      this.$store.dispatch(`${storeModules.CUSTOM_DATA}/${FETCH_ITEM_CUSTOM_DATA}`)
    },

    windowResized: function () {
      if (this.$refs['video'] && this.$refs['video'].clientHeight && this.$refs['video-player'] && this.$refs['video-player'].$el && this.$refs['video-player']) {
        if (this.$refs['video'].clientHeight - this.$refs['video-player'].$el.clientHeight < 52 || this.$refs['vertical-timelines'].clientWidth < this.$el.clientHeight - 480 - 30) {
          this.resetDrag()
        }
      }
    },

    moveDragV: function (e) {
      if (e.clientX > 500 && e.clientX < e.view.innerWidth - 500) {
        const widthLeftSideBar = 180 //px
        const marginLeftOfContent = 30 //px
        const marginRightOfContent = 30 //px

        this.$refs['video'].style.width = 'calc(' + ((e.clientX - (widthLeftSideBar + marginLeftOfContent)) / (e.view.innerWidth - (widthLeftSideBar + marginLeftOfContent + marginRightOfContent))) * 100 + '% - 15px)'
        this.$refs['vertical-timelines'].style.width = 'calc(' + (100 - (((e.clientX - (widthLeftSideBar + marginLeftOfContent)) / (e.view.innerWidth - (widthLeftSideBar + marginLeftOfContent + marginRightOfContent))) * 100)) + '% - 15px)'
        if (this.$refs['video'].clientHeight - this.$refs['video-player'].$el.clientHeight < 52) {
          this.resetDrag()
        }
      }
    },

    resetDrag: function (e) {
      let maxVideoWidth

      const paddingTop = 30
      const paddingRight = 30
      const paddingBottom = 30
      const paddingLeft = 30

      const splitterWidth = 30 // splitter width in px
      const minVerticalTabsWidth = 500 // min width of the vertical menus section in px

      const videoPlayerBottomHeight = 52 // video player's bottom category section height
      const horizontalTimelinesHeaderHeight = 40 // 40px: header of horizontal tabs,
      const spaceBetweenTopAndHorizontalTimelines = 30 //30px: space between #top and horizontal tabs section
      const minHeightOfHorizontalTimelinesTab = 170 //170px: timelines tab min-height
      const videoAspectRatio = 16 / 9

      maxVideoWidth = this.$el.clientWidth - paddingLeft - paddingRight - splitterWidth - minVerticalTabsWidth

      let maxVideoWidthBecauseOfHeight
      maxVideoWidthBecauseOfHeight = (this.$el.clientHeight - minHeightOfHorizontalTimelinesTab - paddingTop - horizontalTimelinesHeaderHeight - videoPlayerBottomHeight - spaceBetweenTopAndHorizontalTimelines) * videoAspectRatio

      maxVideoWidth = maxVideoWidthBecauseOfHeight > maxVideoWidth ? maxVideoWidth : maxVideoWidthBecauseOfHeight

      try {
        this.$refs['video'].style.width = maxVideoWidth - 60 + 'px'
        this.$refs['vertical-timelines'].style.width = 'calc(100% + 30px - ' + maxVideoWidth + 'px)'
      } catch (exception) {}

      this.setCookie()
    }
  },

  computed: {
    ...mapGetters(storeModules.OCR, {
      ocrs: GET_ITEM_OCR,
      ocrsLoading: GET_OCR_LOADING
    }),
    ...mapGetters(storeModules.PEOPLE_FACES, {
      showItemEditor: GET_SHOW_ITEM_EDITOR
    }),
    ...mapGetters(storeModules.SESSION, {
      awsCustomTagsEnabled: GET_AWS_CUSTOM_TAGS_ENABLED
    })
  }
}
</script>

<style lang="less">
  .video-detail {
    #horizontal-timelines {
      .el-tabs__header {
        position: sticky;
        top: 0;
        z-index: 4;
        margin: 0;
      }

      .el-tabs__content {
        overflow: visible;
      }
    }
    &.horizontal-timelines-flex-wrapper .horizontal-timelines {
      min-height: unset;
    }

    .horizontal-timelines {
      .el-tabs__nav-wrap.is-scrollable {
        padding-right: 36px;
      }
    }
  }
</style>

<style lang="less" scoped>
  @import (reference) '~src/styles/_variables';

  .collapse-expand {
    position: absolute;
    right: 46px;
    text-align: right;
    z-index: 5;
    padding-top: 10px;
    i {
      color: @color-primary;
      font-size: 14px;

      &:hover {
        color: @color-accent;
        cursor: pointer;
      }
    }
  }

  .ce-label {
    color: red;
    top: 30px;
    z-index: 5;
  }

  .categories-container {
    background: @color-primary;
    padding: 9px;
  }

  .video-detail {
    height: 100%;
    position: relative;
    padding-left: 30px;
    padding-right: 30px;
    padding-top: 30px;
    flex-grow: 1;
    .horizontal-timelines-flex-wrapper .horizontal-timelines {
      min-height: 90%;
    }
  }

  .video-detail.select-none {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
     -khtml-user-select: none;
       -moz-user-select: none;
        -ms-user-select: none;
            user-select: none;
  }

  #top {
    display: flex;
    //overflow: hidden;
    position: relative;
    width: 100%;
    min-height: 322px; // 300px * 9 / 16 + 52px, 52px = height of bottom part of the video player
  }

  #video {
    background-color: @panel-background-dark;
    width: 45%;
    display: inline-block;
    position: relative;
    top: 0;
    left: 0;
    min-width: 480px;
    //overflow-y: auto;
  }

  #vertical-timelines {
    display: inline-block;
    height: 100%;
    position: absolute;
    top: 0;
    right: 0;
    width: calc(~'55% - 30px');
    max-width: calc(100% - 480px - 30px);
    overflow-y: hidden;
    border-bottom: 1px solid @line-grey;
  }

  #vertical-timelines .iframe-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  #vertical-timelines .iframe-container iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  #vertical-timelines .iframe-container.not-dragging:hover iframe {
    pointer-events: auto;
  }

  #vertical-timelines .iframe-container.dragging:hover iframe {
    pointer-events: none;
  }

  .drag-vertical {
    transition: all 0.25s ease-in-out;
    display: inline-flex;
    width: 10px;
    margin-bottom: 10px;
    margin-top: 10px;
    margin-left: 10px;
    min-height: 100%;
    border: 1px solid transparent;
    background-color: #EEEEEE;
    top: 0;
    cursor: col-resize;
  }

  .drag-vertical:hover {
    border: 1px solid lightgrey;
    -webkit-box-shadow: 0px 0px 5px 0px rgba(0,0,0,0.11);
    -moz-box-shadow: 0px 0px 5px 0px rgba(0,0,0,0.11);
    box-shadow: 0px 0px 5px 0px rgba(0,0,0,0.11);
    background-color: #dddddd;
    z-index: 90002;
  }

  .drag-horizontal {
    display: inline-block;
    height: 30px;
    min-height: 30px;
    min-width: 100%;
    position: relative;
    top: 0;
  }

  .icon-Media-DNA {
    display: inline-block;
    margin-right: 2px;
    width: 20px;
    height: 20px;
    background: url(/static/img/media-dna-black.svg) no-repeat center center;
    vertical-align: middle;
    position: relative;
    top: -2px;
  }

  .is-active .icon-Media-DNA {
    background-image: url(/static/img/media-dna.svg);
  }

  .expand-collapse {
    i {
      color: @color-primary;
      font-size: 14px;

      &:hover {
        color: @color-accent;
        cursor: pointer;
      }
    }
  }

</style>
