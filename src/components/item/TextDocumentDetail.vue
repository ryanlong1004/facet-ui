<template>
  <div class="text-detail" @click="cancelEditing()">
    <div class="text-detail__top">
      <div class="text-detail__top--left">
        <div class="image-wrapper">
          <div class="image-view">
            <image-displayer :itemCategory="item.mime_category"></image-displayer>
          </div>
          <div class="file-info">
            <categories-tab-header></categories-tab-header>
          </div>
        </div>
      </div>
      <div class="text-detail__top--right">
        <div class="vertical-timelines" ref="vertical-timelines">
          <el-tabs id="vertical-tabs" :value="verticalTab" @tab-click="setVerticalTab" ref="vertical-timeline-tabs">
            <el-tab-pane label="Technical Data" :name="CONSTANTS.VERTICAL_TABS.TECH_DATA">
              <span slot="label"><i class="far fa-table"></i> Technical Data</span>
              <div class="timeline-content-wrapper">
                <technical-metadata></technical-metadata>
              </div>
            </el-tab-pane>
            <el-tab-pane label="Text" :name="CONSTANTS.VERTICAL_TABS.TEXT_CONTENT">
              <span slot="label"><i class="far fa-quote-right"></i> Text</span>
              <div class="timeline-content-wrapper">
                <div id="document-details">
                  <h1 :innerHTML.prop="name | highlightFilter"></h1>
                  <div id="scroll-panel">
                  <span v-if="tokens">
                  <p><pre :innerHTML.prop="tokens | highlightFilter"></pre></p>
                  </span>
                  </div>
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

import * as storeModules from 'src/store/storeModules'
import { APPLY_HIGHLIGHTS } from 'src/store/modules/highlights/highlights'
import { THUMBNAIL_URL } from 'src/store/modules/item/thumbnail/mutations'

import { FETCH_TOKENS } from 'src/store/modules/item/tokens/actions'
import { GET_TOKENS } from 'src/store/modules/item/tokens/getters'
import { ITEM, TOKENS, RIGHT_PANEL } from 'src/store/storeModules'

// edit mode store
import { SET_EDIT_MODE } from 'src/store/modules/item/edit-mode'

import VuexItemUIStateMixin from 'src/mixins/VuexItemUIStateMixin'
import VariableStateMixin from 'src/mixins/VariableStateMixin'
import VuexItemMixin from 'src/mixins/VuexItemMixin'

// technical metadata (for Asset Overview tab)
import TechnicalMetadata from './TechnicalMetadata'
// custom fields data
import CustomDataFields from 'src/components/item/custom-data-fields/CustomDataFields'
import CUSTOM_DATA from 'src/store/storeModules'
import { FETCH_ITEM_CUSTOM_DATA } from 'src/store/modules/item/custom-data-fields/actions'

import { GEOCODING, THUMBNAIL, ITEM_ID } from 'src/store/modules/item/getterTypes'

export default {
  name: 'text-detail',
  name: 'text-document-detail',

  components: {
    CategoriesTabHeader,
    CommentsPanel,
    CustomDataFields,
    FieldList,
    ImageDisplayer,
    TechnicalMetadata,
    ThumbnailImage
  },

  mixins: [
    VariableStateMixin,
    VuexItemMixin,
    VuexItemUIStateMixin
  ],

  beforeMount () {
    // load custom fields data
    this.loadCustomData()

    // set default vertical tab
    this.setVerticalTab({ name: this.CONSTANTS.VERTICAL_TABS.TECH_DATA })

    this.$store.dispatch(`${TOKENS}/${FETCH_TOKENS}`)
  },

  computed: {

    ...mapGetters(storeModules.ITEM, {
      itemId: ITEM_ID,
      thumbnail: THUMBNAIL,
    }),
    ...mapGetters(TOKENS, {
      tokens: GET_TOKENS
    }),

    technicalData () {
      return _.get(this.item, 'media_info.image', null)
    }
  },

  methods: {
    ...mapActions(storeModules.HIGHLIGHTS, {
        applyHighlights: APPLY_HIGHLIGHTS
      }),

    loadCustomData () {
      this.$store.dispatch(`${storeModules.CUSTOM_DATA}/${FETCH_ITEM_CUSTOM_DATA}`)
    },
    cancelEditing: function () {
      this.$store.commit(`${storeModules.EDIT_MODE}/${SET_EDIT_MODE}`, {
        id: this.descriptionEditID,
        editMode: false
      })
    },
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
.text-detail-wrapper,
.text-detail {
  height: 100%;
  min-width: 1200px;
}

.text-detail__top {
  display: flex;
  padding: 20px;
  height: 50%;
  //overflow-y: hidden;
}

.text-detail__top--left {
  background-color: @color-primary;
  width: 40%;
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

.text-detail__top--right {
  background: @background-grey;
  width: 55%;
  height: 150%;
  top: 0;
  right: 0;
  overflow-y: hidden;
  margin-left: 25px;
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

</style>
