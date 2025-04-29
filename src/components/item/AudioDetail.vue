<template>
  <div class="audio-details timeline-layout horizontal-timelines-flex-wrapper">
    <div id="top">
      <div class="audio-playback">
        <div class="waveform">
          <div class="playhead" :style="{ left: playbackPercent + '%' }"></div>
          <!-- <div class="playhead hover" :style="{ left: waveformHoveredX }"></div> -->
          <img v-if="waveformPath" :src="waveformUrl" @click.stop="waveformClicked">
          <div v-else class="no-waveform">
            <i class="fal fa-volume"></i>
          </div>
        </div>
        <audio controls controlsList="nodownload" ref="audio">
          <source :src="audioUrl" type="audio/mpeg">
        </audio>
        <div class="categories-container">
          <categories-tab-header></categories-tab-header>
        </div>
      </div>

      <div id="vertical-timelines" ref="vertical-timelines">
        <el-tabs id="vertical-tabs" :value="verticalTab" @tab-click="setVerticalTab" ref="vertical-timeline-tabs">
          <el-tab-pane :name="CONSTANTS.VERTICAL_TABS.TECH_DATA" :id="CONSTANTS.VERTICAL_TABS.TECH_DATA">
            <span slot="label"><i class="far fa-table"></i> Technical Data</span>
            <technical-metadata></technical-metadata>
          </el-tab-pane>
          <el-tab-pane :name="CONSTANTS.VERTICAL_TABS.SPEECH_TO_TEXT" :id="CONSTANTS.VERTICAL_TABS.SPEECH_TO_TEXT">
            <span slot="label"><i class="far fa-comments-alt"></i> Speech-to-text</span>
            <speech-to-text
              :current-video-time="currentPlayheadTime"
              :set-current-video-time="setSeekTo"
              :current-tab="verticalTab">
            </speech-to-text>
          </el-tab-pane>

          <el-tab-pane :name="CONSTANTS.VERTICAL_TABS.CAPTIONS" :id="CONSTANTS.VERTICAL_TABS.CAPTIONS">
            <span slot="label"><i class="far fa-closed-captioning"></i> Captions</span>
            <captions
              :current-video-time="currentPlayheadTime"
              :set-current-video-time="setSeekTo"
              :current-tab="verticalTab">
            </captions>
          </el-tab-pane>
          <el-tab-pane :name="CONSTANTS.VERTICAL_TABS.CUSTOM_DATA" :id="CONSTANTS.VERTICAL_TABS.CUSTOM_DATA">
            <span slot="label"><i class="far fa-closed-captioning"></i> Custom Data</span>
            <custom-data-fields></custom-data-fields>
          </el-tab-pane>
        </el-tabs>

      </div>
    </div>

    <div id="horizontal-timelines" class="horizontal-timelines" ref="horizontal-timelines">
      <el-tabs id="horizontal-tabs" @tab-click="setHorizontalTab" :value="horizontalTab">
        <el-tab-pane label="Search Term" :name="CONSTANTS.HORIZONTAL_TABS.SEARCH_TERM">
          <span slot="label"><i class="far fa-search"></i> Search term</span>
          <searched-for-term>
          </searched-for-term>
        </el-tab-pane>
        <el-tab-pane label="Insights" :name="CONSTANTS.HORIZONTAL_TABS.INSIGHTS">
          <span slot="label"><i class="far fa-flag"></i> Insights</span>
          <insights></insights>
        </el-tab-pane>
        <el-tab-pane label="Audio" :name="CONSTANTS.HORIZONTAL_TABS.AUDIO">
          <span slot="label"><i class="far fa-volume-up"></i> Audio</span>
          <categories-with-summary
            :title="'Audio'"
            :categories-vuex-prefix="'AUDIO'"
            :show-summary="false"
          ></categories-with-summary>
        </el-tab-pane>
        <el-tab-pane label="Technical cues" :name="CONSTANTS.HORIZONTAL_TABS.TECHNICAL_CUES">
          <span slot="label"><i class="icon-Black-Frames"></i> Technical cues</span>
          <categories-with-summary
            :title="'Technical cues'"
            :categories-vuex-prefix="CONSTANTS.CATEGORIES_PREFIX.TECH"
            :show-summary="false"></categories-with-summary>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import { mapGetters } from 'vuex'

import Insights from './Insights.vue'
import Captions from 'src/components/item/timeline/Captions.vue'
import SpeechToText from './timeline/SpeechToText.vue'
import FieldList from './FieldList.vue'
import CategoriesTabHeader from 'src/components/item/CategoriesTabHeader'
import CategoriesWithSummary from './CategoriesWithSummary.vue'
import SearchedForTerm from 'src/components/item/SearchedForTerm.vue'
// s2t store

import { FETCH_S2T } from 'src/store/modules/item/s2t/actions'

import { PROPERTY_PATHS } from 'src/property-paths'
import VuexItemMixin from 'src/mixins/VuexItemMixin'
import PlayheadMixin from 'src/mixins/PlayheadMixin'
import VuexItemUIStateMixin from 'src/mixins/VuexItemUIStateMixin'
import {DURATION, ITEM_ID} from 'src/store/modules/item/getterTypes'
import {INSIGHTS, ITEM, S2T} from 'src/store/storeModules'
import {HIGHLIGHT_TEXT} from 'src/store/modules/item/insights/getters'
// technical metadata (for Asset Overview tab)
import TechnicalMetadata from './TechnicalMetadata'
// custom fields data
import CustomDataFields from 'src/components/item/custom-data-fields/CustomDataFields'
import CUSTOM_DATA from 'src/store/storeModules'
import { FETCH_ITEM_CUSTOM_DATA } from 'src/store/modules/item/custom-data-fields/actions'
import * as storeModules from 'src/store/storeModules'

export default {

  name: 'audio-detail',

  mixins: [
    PlayheadMixin,
    VuexItemMixin,
    VuexItemUIStateMixin
  ],

  components: {
    Captions,
    CategoriesTabHeader,
    CategoriesWithSummary,
    CustomDataFields,
    FieldList,
    Insights,
    SearchedForTerm,
    SpeechToText,
    TechnicalMetadata
  },

  data () {
    return {
      audioSetup: false,
      audioPlayer: null,
      waveformHoveredX: -100
    }
  },

  beforeMount () {
    // loads S2T
    this.loadSpeechToText()
    // load custom fields data
    this.loadCustomData()
    // set default horizontal and vertical tabs
    this.setHorizontalTab({ name: this.CONSTANTS.HORIZONTAL_TABS.SEARCH_TERM })
    this.setVerticalTab({ name: this.CONSTANTS.VERTICAL_TABS.TECH_DATA })
  },

  mounted: function () {
    if (this.$refs['audio'] && !this.audioSetup) {
      this.addAudioEventListeners()
    }
    this.$watch('seekTo', (newVal) => {
      this.$refs['audio'].currentTime = newVal + 0.5
    })
  },

  beforeDestroy: function () {
    this.removeAudioEventListeners()
  },

  computed: {
    ...mapGetters(ITEM, {
      itemId: ITEM_ID,
      totalAudioTime: DURATION
    }),
    highlight () {
      return this.$store.getters[`${INSIGHTS}/${HIGHLIGHT_TEXT}`]
    },

    playbackPercent: function () {
      return (this.currentPlayheadTime / this.totalAudioTime) * 100
    },

    audioUrl: function () {
      return '/files/' + _.get(this.item, PROPERTY_PATHS.PREVIEW_PATH.path, '')
    },

    waveformPath () {
      return _.get(this.item, PROPERTY_PATHS.THUMBNAIL_PATH.path, '') || ''
    },

    waveformUrl: function () {
      return `/files/${this.itemId}/${this.waveformPath}`
    },

    technicalData: function () {
      return _.get(this.item, 'media_info.audio', null)
    }
  },

  methods: {
    loadSpeechToText () {
      this.$store.dispatch(`${S2T}/${FETCH_S2T}`)
    },

    addAudioEventListeners: function () {
      const a = this.$refs['audio']
      a.addEventListener('timeupdate', this.audioTimeChanged)
    },

    removeAudioEventListeners: function () {
      const a = this.$refs['audio']
      a.removeEventListener('timeupdate', this.audioTimeChanged)
    },

    waveformClicked: function (e) {
      const w = e.currentTarget.offsetWidth
      const x = e.offsetX
      const p = (x / w)
      const t = this.totalAudioTime * p
      this.setSeekTo(t)
    },

    waveformHovered: function (e) {
      this.waveformHoveredX = e.offsetX
    },

    audioTimeChanged: function (e) {
      this.currentPlayheadTime = this.$refs['audio'].currentTime
    },

    loadCustomData () {
      this.$store.dispatch(`${storeModules.CUSTOM_DATA}/${FETCH_ITEM_CUSTOM_DATA}`)
    },

  }
}
</script>

<style lang="less">
  @import (reference) '~src/styles/_mixins';

  .audio-details {
    .no-waveform {
      .flex-container-center();

      height: 100%;
      width: 100%;
      background-image: linear-gradient(287deg, var(@color-anchor), var(@color-accent));

      i {
        font-size: 180px;
        font-weight: 300;
        letter-spacing: normal;
        text-align: center;
        color: @color-base;
        opacity: 0.17;
      }
    }
    #horizontal-timelines {

      .el-tabs__header {
        position: sticky;
        top: 0px;
        z-index: 4;
        margin: 0 0 0 0;
      }

      .el-tabs__content {
        overflow: visible;
      }
    }
    &.horizontal-timelines-flex-wrapper .horizontal-timelines {
      min-height: unset;
    }
  }
</style>

<style lang="less" scoped>
  @import (reference) '~src/styles/_variables';

  .audio-details {
    display: -ms-flexbox;
    display: flex;
    -ms-flex-direction: column;
    flex-direction: column;
    -ms-flex-wrap: nowrap;
    flex-wrap: nowrap;
    -ms-flex-pack: start;
    justify-content: flex-start;
    -ms-flex-line-pack: stretch;
    align-content: stretch;
    -ms-flex-align: start;
    align-items: flex-start;
    /*height: ~'calc(100vh - 100px)';*/
    /*min-height: ~'calc(100vh - 100px)';*/
    /*max-height: ~'calc(100vh - 100px)';*/
    overflow: hidden;
    padding-left: 30px;
    padding-right: 30px;
    padding-top: 30px;
    height: 100%;

    #vertical-timelines {
      display: inline-block;
      height: 100%;
      position: absolute;
      top: 0;
      right: 0;
      width: calc(~'45% - 30px');
      overflow-y: hidden;
      border-bottom: 1px solid @line-grey;
    }

    #top {
      display: flex;
      flex-direction: column;
      //overflow: hidden;
      position: relative;
      width: 100%;
      min-height: 310px;

      margin-bottom: 30px;

      .audio-playback {
        background: @color-tone-light;
        border: 1px solid @box-border-grey;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        flex: 1 1 auto;
        width: 55%;

        div.waveform {
          background-color: @color-base;
          border-bottom: 1px solid @box-border-grey;
          position: relative;
          height: 225px;
          .playhead {
            position: absolute;
            height: 100%;
            left: 10px;
            top: 0;
            width: 2px;
            background-color: #333;
          }
        }

        .categories-container {
          background: @color-primary;
          padding: 9px;
        }
        img, audio {
          width: 100%;
        }
        img {
          height: 100%;
        }
      }
    }
    .bottom {
      height: ~'calc(100vh - 395px)';
      min-height: ~'calc(100vh - 395px)';
      max-height: ~'calc(100vh - 395px)';

      display: flex;
      flex-direction: row;
      justify-content: space-between;
      width: 100%;
      .left, .right {
        display: block;
        height: 100%;
      }
      .left {
        width: 66.6%;
        margin-right: 10px;
      }
      .right {
        width: 33.3%;
        margin-left: 10px;
      }
    }
  }
</style>
