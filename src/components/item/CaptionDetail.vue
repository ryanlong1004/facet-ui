<template>
  <div id="main">
    <div id="left">
      <div id="file">
        <image-displayer hide-error></image-displayer>
        <div class="categories-container">
          <categories-tab-header></categories-tab-header>
        </div>
      </div>
    </div>
    <div id="document-details">
      <div class="vertical-timelines" ref="vertical-timelines">
        <el-tabs id="vertical-tabs" :value="verticalTab" @tab-click="setVerticalTab" ref="vertical-timeline-tabs">
            <el-tab-pane label="Technical Data" :name="CONSTANTS.VERTICAL_TABS.TECH_DATA">
              <span slot="label"><i class="far fa-table"></i> Technical Data</span>
              <div class="timeline-content-wrapper">
              <technical-metadata></technical-metadata>
              </div>
            </el-tab-pane>
            <el-tab-pane label="Captions" :name="CONSTANTS.VERTICAL_TABS.CAPTIONS">
              <span slot="label"><i class="far fa-closed-captioning"></i> Captions</span>
              <div class="timeline-content-wrapper">
                <h1 :innerHTML.prop="name | highlightFilter"></h1>
                <div id="scroll-panel" v-if="!captionsLoading">
                  <p v-if="captionsError" class="error"><i class="fas fa-exclamation-triangle"></i> There was an error loading or parsing the captions from this file.</p>
                  <p v-else-if="!transcript.length" class="error"><i class="fas fa-exclamation-triangle"></i> No captions were able to be parsed from this file.</p>
                  <ol v-else class="transcript">
                    <li v-for="captionItem in transcript" :key="captionItem.key" class="caption-item">
                      <div class="time">{{ captionItem.displayTime }}</div>
                      <div class="text">
                        <span :innerHTML.prop="captionItem.text | highlightFilter({ insights: true, type: CONSTANTS.HIGHLIGHT_TYPES.CAPTIONS })"></span>
                      </div>
                    </li>
                  </ol>
                </div>
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
</template>

<script>
import { mapGetters } from 'vuex'

import * as storeModules from 'src/store/storeModules'

import { CONSTANTS } from 'src/constants'
import ImageDisplayer from './ImageDisplayer'
import VuexItemMixin from 'src/mixins/VuexItemMixin'
import VuexItemUIStateMixin from 'src/mixins/VuexItemUIStateMixin'
import VariableStateMixin from 'src/mixins/VariableStateMixin'
import CategoriesTabHeader from 'src/components/item/CategoriesTabHeader'
import { FETCH_CAPTIONS } from 'src/store/modules/item/captions/actions'
import {
  GET_CAPTIONS,
  GET_CAPTIONS_LOADING,
  GET_CAPTIONS_LOADING_ERROR
} from 'src/store/modules/item/captions/getters'
import { THUMBNAIL } from 'src/store/modules/item/getterTypes'
import { CAPTIONS } from 'src/store/storeModules'

// technical metadata (for Asset Overview tab)
import TechnicalMetadata from './TechnicalMetadata'
// custom fields data
import CustomDataFields from 'src/components/item/custom-data-fields/CustomDataFields'
import CUSTOM_DATA from 'src/store/storeModules'
import { FETCH_ITEM_CUSTOM_DATA } from 'src/store/modules/item/custom-data-fields/actions'

export default {
  name: 'caption-detail',

  mixins: [
    VariableStateMixin,
    VuexItemMixin,
    VuexItemUIStateMixin
  ],

  components: {
    CategoriesTabHeader,
    CustomDataFields,
    ImageDisplayer,
    TechnicalMetadata
  },

  beforeMount () {
    this.$store.dispatch(`${CAPTIONS}/${FETCH_CAPTIONS}`)
    // load custom fields data
    this.loadCustomData()

    // set default vertical tab
    this.setVerticalTab({ name: this.CONSTANTS.VERTICAL_TABS.TECH_DATA })
  },

  computed: {
    ...mapGetters(CAPTIONS, {
      captions: GET_CAPTIONS,
      captionsError: GET_CAPTIONS_LOADING_ERROR,
      captionsLoading: GET_CAPTIONS_LOADING
    }),
    transcript () {
      return _.get(this, 'captions[0].transcript', []) || []
    }
  },

  methods: {
    loadCustomData () {
      this.$store.dispatch(`${storeModules.CUSTOM_DATA}/${FETCH_ITEM_CUSTOM_DATA}`)
    }
  }
}
</script>

<style lang="less" scoped>
  @import (reference) '~src/styles/_variables';
  @import (reference) '~src/styles/_mixins';

div#document-details {
  color: @text-dark;
  height: 100%;
  overflow-y: hidden;
}

  #main {
    display: -ms-flexbox;
    display: flex;
    -ms-flex-direction: row;
    flex-direction: row;
    -ms-flex-wrap: nowrap;
    flex-wrap: nowrap;
    -ms-flex-pack: start;
    justify-content: flex-start;
    -ms-flex-line-pack: stretch;
    align-content: stretch;
    -ms-flex-align: start;
    align-items: flex-start;
    height: calc(100vh - 100px);
    min-height: calc(100vh - 100px);
    max-height: calc(100vh - 100px);
    overflow: hidden;
    padding-left: 30px;
    padding-right: 30px;
    padding-top: 30px;
    border-bottom: 1px solid rgb(209, 215, 229);
  }

  #left {
    -webkit-order: 0;
    -ms-flex-order: 0;
    order: 0;
    -webkit-flex: 1 1 auto;
    -ms-flex: 1 1 auto;
    flex: 1 1 auto;
    -webkit-align-self: stretch;
    -ms-flex-item-align: stretch;
    align-self: stretch;
  }

  #left {
    display: -ms-flexbox;
    display: -webkit-flex;
    display: flex;
    -webkit-flex-direction: column;
    -ms-flex-direction: column;
    flex-direction: column;
    -webkit-flex-wrap: nowrap;
    -ms-flex-wrap: nowrap;
    flex-wrap: nowrap;
    -webkit-justify-content: flex-start;
    -ms-flex-pack: start;
    justify-content: flex-start;
    -webkit-align-content: stretch;
    -ms-flex-line-pack: stretch;
    align-content: stretch;
    -webkit-align-items: flex-start;
    -ms-flex-align: start;
    align-items: flex-start;
    width: 50%;
    min-width: 40%;
    max-width: 40%;
  }

  #file {
    -webkit-order: 0;
    -ms-flex-order: 0;
    order: 0;
    -webkit-flex: 0 0 auto;
    -ms-flex: 0 0 auto;
    flex: 0 0 auto;
    -webkit-align-self: stretch;
    -ms-flex-item-align: stretch;
    align-self: stretch;
  }

  .categories-container {
    background: @color-primary;
    padding: 9px;
  }

  #document-details {
    margin-left: 30px;
    padding-right: 30px;
    width: 60%;

     .vertical-timelines {
    height: 100%;

    > .el-tabs > .el-tabs__content {
      height: calc(~'100% - 40px'); // 40px for the tabs
      overflow-y: auto;
      > .el-tab-pane > div {
        overflow-y: unset;
      }
      > div#pane-text-content.el-tab-pane {
        height: auto;
      }
      >div#pane-technical-metadata.el-tab-pane.el-tab-pane {
        height: auto;
        width: auto;
      }
      }
    }
  }

  #document-details h1 {
    margin-top: 0;
  }

  #scroll-panel {
    overflow-y: auto;
    height: calc(100vh - 180px);
  }

  #scroll-panel p {
    font-size: 12px;
    line-height: 16px;
  }

  h1 {
    margin-bottom: 0;
    padding-top: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid rgb(223, 227, 236);
  }

  code, pre {
    white-space: pre-wrap;
    white-space: -moz-pre-wrap;
    white-space: -pre-wrap;
    white-space: -o-pre-wrap;
    word-wrap: break-word;
  }

  .transcript {
    margin: 0;
    padding: 0;
    padding-bottom: 60px;
    .caption-item {
      .flex-container();
      border-bottom: 1px solid @color-tone-lightest;
      padding: 10px 0;
      .time {
        font-size: 10px;
        .flex(0, 0, 60px);
      }
      .text {
        font-size: 11px;
        .flex(1, 1, auto);
      }
    }
  }

  p.error > i {
    color: @color-danger;
  }
</style>

<style>
  #main .el-tabs__header {
    margin-bottom: 0;
  }
  #file .image-displayer,
  #file .image-displayer .image {
    height: 300px;
  }
</style>
