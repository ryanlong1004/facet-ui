<template>
  <div class="captions-timeline">
    <header class="vertical-timeline__header">
      <div class="caption-flyout__closer" @click="showUploader = false" v-if="showUploader"></div>
      <div class="configation-options">
        <div class="caption-selection" v-if="hasCaptions">
          <el-select
            v-model="currentCaptionID"
            size="mini"
            placeholder="Select..."
            class="caption-selector"
            popper-class="alternate small"
            >
            <el-option v-for="caption in captionsList" :key="caption.id" :label="caption.source === 'captions' ? '(embedded)' : caption.filename" :value="caption.id"></el-option>
          </el-select>
        </div>
        <div class="seconds-offset-wrapper" v-if="hasCaptions">
          <el-tooltip
            placement="top"
            content="Number of seconds to offset captions sync">
            <el-input :disabled="savingCaptionOffset" class="seconds-offset" type="number" v-model="currentCaptionOffset" step="0.1"></el-input>
          </el-tooltip>
          <el-tooltip
            v-if="secondsOffsetDirty"
            placement="top"
            content="Save changes to offset">
            <i class="fas fa-save save-offset-btn" :class="{ disabled: savingCaptionOffset }" @click="saveCaptionOffset"></i>
          </el-tooltip>
        </div>
      </div>
      <button
        v-if="$hasScope(SCOPES.MANAGE_CAPTIONS)"
        class="caption-upload-btn"
        :class="{ active: showUploader }"
        @click.stop="toggleUploader()">
        <i class="far fa-edit"></i> Manage
      </button>
      <div class="caption-flyout" v-if="showUploader" @click.stop="() => {}">
        <header class="caption-flyout__header">
          <el-upload
            :action="uploadUrl"
            name="caption_file"
            accept=".scc,.srt,.stl,.ttml,.vtt"
            :multiple="false"
            :show-file-list="false"
            :headers="uploadHeaders"
            :file-list="uploadFileList"
            :before-upload="onBeforeUpload"
            :on-error="onFileUploadError"
            :on-success="onFileUploaded">
            <button class="caption-upload-button"><i class="fa" :class="{ 'fa-upload': !uploading, 'fa-spinner fa-spin': uploading }"></i> Upload Caption File</button>
          </el-upload>
          <p class="accepted-file-types">We accept .scc, .srt, .stl, .ttml and .vtt caption files</p>
        </header>
        <div class="content">
        <table class="caption-list" v-if="captionsList.length">
          <thead>
            <tr>
              <th>Filename</th>
              <th>Date Uploaded</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="caption in captionsList" :key="caption.id">
              <td>
                <span class="caption-list__filename" @click="currentCaptionID = caption.id">
                  <template v-if="caption.source === 'captions'">(embedded)</template>
                  <template v-else>{{ caption.filename }}</template>
                </span>
              </td>
              <td v-if="caption.source === 'captions'">N/A</td>
              <td v-else>{{caption.uploaded}}</td>
              <td>
                <el-tooltip
                  :hide-after="CONSTANTS.TOOLTIP.HIDE_DELAY"
                  :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
                  content="Download Caption"
                  effect="light"
                  placement="top"
                  v-if="caption.source !== 'captions'"
                >
                  <i class="far fa-download" @click="downloadCaption(caption.id)"></i>
                </el-tooltip>
                <el-tooltip
                  :hide-after="CONSTANTS.TOOLTIP.HIDE_DELAY"
                  :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
                  content="Delete Caption"
                  effect="light"
                  placement="top"
                  v-if="caption.source !== 'captions'"
                >
                  <i class="far fa-trash" @click="deleteCaption(caption.id)"></i>
                </el-tooltip>
              </td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>
    </header>
    <div class="horizontal-timeline-container__empty-notification" v-if="!loading && !captionsList.length">We didn't detect any captions in this file.</div>
    <big-data-scroller :segments="currentTranscript" :enabled="tabEnabled" :page-size="20" :offset-top="40" v-if="currentTranscript.length && currentTab === CONSTANTS.VERTICAL_TABS.CAPTIONS">
      <template v-slot="{ segment, active, clickFn }">
        <captions-item
          :active="active"
          :display-time="segment.displayTime"
          :start-at="segment.start_at"
          :text-content="segment.text"
          @item-clicked="clickFn(segment)"
        ></captions-item>
      </template>
    </big-data-scroller>
  </div>
</template>

<script>
  import _ from 'lodash'
  import moment from 'moment'
  import { mapGetters, mapActions } from 'vuex'

  import BigDataScroller from './BigDataScroller'
  import CaptionsItem from './CaptionsItem'
  import TimelineType from './TimelineType'
  import api from 'src/api'
  import { ANALYTICS_CATEGORIES, ANALYTICS_ACTIONS } from 'src/config/analytics'

  import * as storeModules from 'src/store/storeModules'
  // captions store
  import {
    GET_CAPTIONS_LOADING,
    GET_CAPTIONS_LOADING_ERROR,
    GET_CAPTIONS,
    GET_CAPTIONS_LIST,
    GET_CURRENT_CAPTION_ID,
    GET_CURRENT_CAPTION,
    GET_CURRENT_CAPTION_TRANSCRIPT,
    GET_CURRENT_CAPTION_TRANSCRIPT_MAP
  } from 'src/store/modules/item/captions/getters'
  import {
    SET_CURRENT_CAPTION_ID
  } from 'src/store/modules/item/captions/mutations'
  import {
    FETCH_CAPTIONS,
    DELETE_CAPTION,
    CHANGE_CAPTION_OFFSET
  } from 'src/store/modules/item/captions/actions'
  import { GET_AUTH_TOKEN } from 'src/store/modules/session/session'
  import VuexItemMixin from 'src/mixins/VuexItemMixin'
  import {ITEM_ID} from 'src/store/modules/item/getterTypes'
  import { errStringToJson } from 'src/apiHelpers'

  const THIS_TAB_NAME = 'captions'

  export default {
    name: 'captions',
    mixins: [
      VuexItemMixin
    ],
    components: {
      BigDataScroller,
      CaptionsItem
    },
    props: {
      currentTab: {
        type: String,
        default: ''
      }
    },
    data () {
      return {
        currentCaptionOffset: 0,
        savingCaptionOffset: false,
        showUploader: false,
        uploadFileList: [],
        uploading: false
      }
    },
    mounted () {
      this.$watch('currentCaption', newVal => {
        if (newVal && newVal.start_offset) {
          this.currentCaptionOffset = newVal.start_offset
        }
      })
    },
    computed: {
      ...mapGetters(storeModules.CAPTIONS, {
        loading: GET_CAPTIONS_LOADING,
        loadingError: GET_CAPTIONS_LOADING_ERROR,
        captionsList: GET_CAPTIONS_LIST,
        currentCaption: GET_CURRENT_CAPTION,
        currentTranscript: GET_CURRENT_CAPTION_TRANSCRIPT,
        currentTranscriptMap: GET_CURRENT_CAPTION_TRANSCRIPT_MAP
      }),
      ...mapGetters(storeModules.ITEM, {
        itemId: ITEM_ID
      }),
      currentCaptionID: {
        get () {
          return this.$store.getters[`${storeModules.CAPTIONS}/${GET_CURRENT_CAPTION_ID}`]
        },
        set (id) {
          this.$store.commit(`${storeModules.CAPTIONS}/${SET_CURRENT_CAPTION_ID}`, id)
        }
      },
      hasCaptions () {
        return this.captionsList.length > 0
      },
      secondsOffsetDirty () {
        if (this.currentCaption) {
          return this.currentCaption.start_offset !== this.currentCaptionOffset
        }
        return false
      },
      tabEnabled () {
        return this.currentTab === this.CONSTANTS.VERTICAL_TABS.CAPTIONS
      },
      uploadHeaders () {
        return {
          'Authorization': 'Bearer ' + this.$store.getters[`${storeModules.SESSION}/${GET_AUTH_TOKEN}`]
        }
      },
      uploadUrl () {
        return '/api/data/v3/items/' + this.itemId + '/captions'
      }
    },
    methods: {
      ...mapActions(storeModules.CAPTIONS, {
        changeCaptionOffset: CHANGE_CAPTION_OFFSET,
        doDeleteCaption: DELETE_CAPTION,
        loadCaptions: FETCH_CAPTIONS
      }),

      downloadCaption (captionId) {
        api.downloadCaptions(this.itemId, captionId)
      },

      onBeforeUpload () {
        this.uploading = true
      },

      onFileUploadError (err) {
        this.uploading = false
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: `Error uploading file: ${errStringToJson(err).message}`,
          showClose: true,
          type: 'error'
        })
      },

      async onFileUploaded (response, file, fileList) {
        this.uploading = false
        this.$ma.trackEvent({
          action: ANALYTICS_ACTIONS.CAPTION_UPLOADED,
          properties: {
            category: ANALYTICS_CATEGORIES.ITEM_DETAILS,
            itemId: this.itemId
          }
        })
        await this.loadCaptions()
        this.currentCaptionID = response.id
      },

      async deleteCaption (captionId) {
        try {
          await this.doDeleteCaption({ captionId })
        } catch (err) {
          console.error(err)
        }
      },

      async saveCaptionOffset () {
        this.savingCaptionOffset = true
        try {
          await this.changeCaptionOffset({
            captionId: this.currentCaptionID,
            offset: _.toNumber(this.currentCaptionOffset)
          })
        } catch (err) {
          this.$notify({
            type: 'error',
            title: 'Error',
            message: 'Error saving caption offset, please try again'
          })
          this.currentCaptionOffset = this.currentCaption.start_offset
        } finally {
          this.savingCaptionOffset = false
        }
      },

      toggleUploader () {
        this.showUploader = !this.showUploader
      }
    }
  }
</script>

<style lang="less">
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.captions-timeline {
  height: 100%;

  .vertical-timeline__header {
    .configation-options {
      .flex-container();
    }
    .caption-selection {
      .el-select {
        margin-right: 10px;
        width: 195px;
        .el-input {
          .el-input__inner {
            background-color: @box-border-grey;
            font-size: 12px;
            font-weight: normal;
            height: 28px !important;
          }

          .el-input__suffix {
            margin-top: 0;
          }
        }
      }
    }
    .el-popover {
      word-break: break-word;
    }
    .seconds-offset-wrapper {
      .flex-container();
      .seconds-offset {
        margin-right: 5px;
        width: 80px;
        .el-input__inner {
          background-color: @box-border-grey;
          font-size: 12px;
          font-weight: normal;
          height: 28px !important;
        }
      }
      .save-offset-btn {
        color: @text-medium;
        cursor: pointer;
        &:hover {
          color: @color-accent;
        }
        &.disabled {
          cursor: normal;
          &:hover {
            color: @text-medium;
          }
        }
      }
    }
  }
}

.caption-flyout {
  header {
    .el-upload {
      background: transparent;
      border: 0 none;
      height: auto;

      i {
        color: @color-base;
        font-size: 12px;
      }

      &:hover {
        i {
          color: @color-accent;
        }
      }
    }
  }
}
</style>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';
@caption-header-height: 40px;
@caption-background-light: lighten(@color-accent, 10%);
@caption-background-medium: darken(@color-accent, 10%);
@caption-background-dark: darken(@color-accent, 10%);
@caption-background-darker: darken(@color-accent, 25%);

.vertical-timeline__header {
  background-color: @item-grey;
  border-bottom: 1px solid @box-border-grey;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  min-height: @caption-header-height;
  position: sticky;
  top: 0;
  z-index: 5;
  h6, .caption-upload-btn {
    color: @text-dark;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
  }
  .caption-selection {
    align-items: center;
    display: flex;
    margin-left: 15px;
    h6 {
      line-height: @caption-header-height;
      margin: 0 4px 0 0;
      padding: 0;
    }
  }
  .caption-upload-btn {
    align-items: center;
    background-color: transparent;
    border: 0 none;
    border-radius: 0;
    cursor: pointer;
    display: flex;
    height: @caption-header-height;
    padding-left: 15px;
    padding-right: 15px;
    i.far {
      font-size: 15px;
      margin-right: 4px;
    }
    &:hover {
      color: @caption-background-medium;
    }
    &.active {
      background-color: @caption-background-medium;
      color: @color-base;
    }
    &:focus, &:active {
      outline: none;
    }
  }

  .caption-flyout {
    background-color: @caption-background-light;
    position: absolute;
    right: 0;
    max-width: 450px;
    top: 40px;
    header {
      align-items: center;
      display: flex;
      padding: 10px;
      button {
        background-color: @caption-background-medium;
        border: 0 none;
        border-radius: 0;
        color: @color-base;
        cursor: pointer;
        font-size: 12px;
        font-weight: 700;
        padding: 5px 10px;
        text-transform: uppercase;
        &:hover {
          background-color: @color-base;
          color: @caption-background-medium;
        }
        &:focus, &:active {
          outline: none;
        }
      }
      .accepted-file-types {
        color: @caption-background-darker;
        font-size: 11px;
        font-style: italic;
        margin: 0 0 0 10px;
        padding: 0;
      }
    }
    .content {
      height: 100%;
      max-height: 150px;
      overflow: auto;
    }
    table {
      border-collapse: collapse;
      color: @color-base;
      max-width: 100%;
      table-layout: fixed;
      word-break: break-all;
      word-wrap: break-word;
      width: 100%;
    }
    td, th {
      background-color: @caption-background-medium;
      &:nth-child(2) {
        background-color: @caption-background-dark;
        width: 100px;
      }
      &:last-child {
        text-align: center;
        width: 60px;
      }
    }
    th {
      font-size: 10px;
      font-weight: 700;
      padding: 4px 8px;
      text-align: left;
      text-transform: uppercase;
    }
    td {
      border-top: 1px solid @caption-background-light;
      font-size: 12px;
      padding: 8px 8px;
      &:first-child {
        overflow-wrap: break-word;
        // text-overflow: ellipsis;
      }
      &:last-child {
        i.far {
          cursor: pointer;
          font-size: 14px;
          margin: 0 3px;
          &:hover {
            color: @caption-background-darker;
          }
        }
      }
    }
    .caption-list__filename {
      cursor: pointer;
    }
  }
}

.captions-timeline .timeline-item {
  min-height: 28px;
}

.caption-flyout__closer {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
}
</style>
