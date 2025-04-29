<template>
  <div class="duplicate-files-wrapper">
    <div class="duplicate-files">
      <div class="list-head">
        <div class="display-mode">
          <el-radio-group v-model="displayMode" fill="#00ce3e" size="mini">
            <el-radio-button :label="DISPLAY_MODES.FILE_NAME"></el-radio-button>
            <el-radio-button :label="DISPLAY_MODES.OBJECT_NAME"></el-radio-button>
            <el-radio-button :label="DISPLAY_MODES.ASSET_TITLE"></el-radio-button>
            <el-radio-button :label="DISPLAY_MODES.STOW_URL"></el-radio-button>
            <el-radio-button :label="DISPLAY_MODES.ITEM_ID"></el-radio-button>
          </el-radio-group>
        </div>
        <div class="bulk-action">
          <el-tooltip
            v-if="!hasStagedFiles"
            content="Select files from below to be removed"
            placement="top"
            :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
          >
            <span class="action disabled">Remove Selected<i class="far fa-trash-alt"></i></span>
          </el-tooltip>
          <el-popover
            v-else-if="hasStagedFiles"
            v-model="isRemovePopoverVisible"
            placement="left"
            trigger="click"
            width="400"
          >
            <span slot="reference" class="action">Remove Selected<i class="far fa-trash-alt"></i></span>
            <div class="remove-files">
              <div class="head">You are about to remove multiple files</div>
              <div>
                <p>Deleting the selected files will ONLY remove them from the Wasabi AiR™ platform. You will need to manually remove them from your connected storage location/container.</p>
                <p>Download the Duplicate Report for this asset to obtain a full list of the item locations.</p>
              </div>
              <div class="foot">Are you sure you want to REMOVE these files FROM Wasabi AiR™?</div>
              <div>
                <el-button type="primary" size="mini" @click="doDeleteFiles({ hash, fileIds: stagedFiles })">Yes, remove selected files</el-button>
                <el-button type="text" size="mini" @click="cancelRemove" class="cancel">Cancel</el-button>
              </div>
            </div>
          </el-popover>
        </div>
      </div>
      <el-checkbox-group v-model="stagedFiles">
        <div v-for="itemId in items" class="duplicate-item" :key="itemId">
          <div class="item-link action">
            <el-tooltip
              content="Opens file in new window/tab."
              placement="top"
              :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
            >
              <router-link :to="{ name: 'itemDetails', params: { id: itemId }}" target="_blank"><i class="far fa-external-link"></i></router-link>
            </el-tooltip>
          </div>
          <div v-show="displayMode === DISPLAY_MODES.FILE_NAME" class="copy-info-wrapper">
            <span class="item-copy action">
              <el-tooltip
                content="Copies file name to clipboard."
                placement="top"
                :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
              >
                <i v-clipboard="loadedFiles[itemId].name" @success="copySuccess" class="far fa-copy"></i>
              </el-tooltip>
            </span>
            <span class="item-info name">{{ loadedFiles[itemId].name }}</span>
          </div>
          <div v-show="displayMode === DISPLAY_MODES.OBJECT_NAME" class="copy-info-wrapper">
            <span class="item-copy action">
              <el-tooltip
                content="Copies object name to clipboard."
                placement="top"
                :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
              >
                <i v-clipboard="loadedFiles[itemId].stow_name" @success="copySuccess" class="far fa-copy"></i>
              </el-tooltip>
            </span>
            <span class="item-info name">{{ loadedFiles[itemId].stow_name }}</span>
          </div>
          <div v-show="displayMode === DISPLAY_MODES.ASSET_TITLE" class="copy-info-wrapper">
            <span class="item-copy action">
              <el-tooltip
                content="Copies asset title to clipboard."
                placement="top"
                :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
              >
                <i v-clipboard="loadedFiles[itemId].gm_asset_title" @success="copySuccess" class="far fa-copy"></i>
              </el-tooltip>
            </span>
            <span class="item-info name">{{ loadedFiles[itemId].gm_asset_title }}</span>
          </div>
          <div v-show="displayMode === DISPLAY_MODES.STOW_URL" class="copy-info-wrapper">
            <span class="item-copy action">
              <el-tooltip
                content="Copies Stow URL to clipboard."
                placement="top"
                :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
              >
                <i v-clipboard="loadedFiles[itemId].stow_url" @success="copySuccess" class="far fa-copy"></i>
              </el-tooltip>
            </span>
            <span class="item-info stow-url">{{ loadedFiles[itemId].stow_url }}</span>
          </div>
          <div v-show="displayMode === DISPLAY_MODES.ITEM_ID" class="copy-info-wrapper">
            <span class="item-copy action">
              <el-tooltip
                content="Copies item ID to clipboard."
                placement="top"
                :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
              >
                <i v-clipboard="itemId" @success="copySuccess" class="far fa-copy"></i>
              </el-tooltip>
            </span>
            <span class="item-info item-id">{{ itemId }}</span>
          </div>
          <div class="item-checkbox">
            <el-checkbox :label="itemId"></el-checkbox>
          </div>
        </div>
      </el-checkbox-group>
      <div v-if="duplicatesHashMap[hash].hasMoreFiles" class="load-more files action" @click="loadMoreFiles(hash)">
        <div>Load More Files</div>
        <div><span><i class="far fa-chevron-down"></i></span></div>
      </div>
    </div>
  </div>
</template>

<script>
import { getFilenameFromItemData } from 'src/item-helper'
import { mapActions, mapGetters } from 'vuex'
import { DUPLICATES } from 'src/store/storeModules'
import {
  DELETE_FILES,
  FETCH_DUPLICATE,
  LOAD_DUPLICATE_FILES
} from 'src/store/modules/duplicates/actions'
import {
  GET_DUPLICATES_HASH_MAP,
  GET_LOADED_FILES, IS_BUSY
} from 'src/store/modules/duplicates/getters'

const DISPLAY_MODES = {
  FILE_NAME: 'File Name',
  OBJECT_NAME: 'Object Name',
  ASSET_TITLE: 'Asset Title',
  STOW_URL: 'Stow URL',
  ITEM_ID: 'Item ID'
}

export default {
  name: 'duplicate-files',

  props: {
    hash: {
      type: String,
      required: true
    },
    items: {
      type: Array,
      default: []
    }
  },

  data() {
    return {
      DISPLAY_MODES,
      getFilenameFromItemData,
      displayMode: DISPLAY_MODES.FILE_NAME,
      isRemovePopoverVisible: false,
      stagedFiles: []
    }
  },

  computed: {
    ...mapGetters(DUPLICATES, {
      duplicatesHashMap: GET_DUPLICATES_HASH_MAP,
      loadedFiles: GET_LOADED_FILES,
      isBusy: IS_BUSY
    }),

    hasStagedFiles () {
      return !!this.stagedFiles.length
    }
  },

  methods: {
    ...mapActions(DUPLICATES, {
      deleteFiles: DELETE_FILES,
      loadMoreFiles: FETCH_DUPLICATE
    }),

    cancelRemove () {
      this.isRemovePopoverVisible = false
    },

    copySuccess(e) {
      this.$message({
        duration: this.CONSTANTS.MESSAGE_DURATION,
        message: `"${e.text}" copied to clipboard`,
        showClose: true,
        type: 'success'
      })
    },

    async doDeleteFiles(stagedFiles) {
      try {
        await this.deleteFiles(stagedFiles)
      } catch (err) {
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: this.error,
          showClose: true,
          type: 'error'
        })
      } finally {
        this.isRemovePopoverVisible = false
        this.stagedFiles = []
      }
    }
  },
}
</script>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables.less';
@import (reference) '~src/styles/_mixins.less';

.duplicate-files {

  .action {

    &.disabled {
      color: @color-tone-darkest;
    }
    &.disabled:hover {
      cursor: not-allowed;
    }

    i {
      font-size: 12px;
      line-height: 1.25;
    }
  }

  .list-head {
    .flex-box();
    border-top: solid 1px @color-base;
    padding: 10px;

    .display-mode .el-radio-button--mini .el-radio-button__inner {
      font-size: 10px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .bulk-action {
      margin-left: auto;
      span.action i {
        margin-left: 9px;
      }
    }
  }

  .duplicate-item {
    .flex-box();
    .align-items-center();
    background-color: @color-base;
    border-bottom: solid 1px @background-light-gray;
    font-size: 12px;
    line-height: 1.25;
    color: @color-tone-darkest;
    padding: 10px;

    &> div {
      margin-right: 10px;
    }

    a,
    a:visited {
      color: @color-tone-darkest;
    }

    .copy-info-wrapper {
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      padding-left: 1px;

      .item-copy {
        color: @color-tone-darkest;
        margin-right: 8px;
      }
    }

    .item-info {
      color: @color-primary;
    }

    .item-checkbox {
      margin-left: auto;
      margin-right: 0;
    }
  }

  .load-more {
    background-color: @color-base;
    padding: 10px 0 40px;
  }
}

.remove-files {
  color: @color-primary;
  font-size: 10px;
  padding: 15px 10px;

  .head,
  .foot {
    font-weight: 900;
    text-transform: uppercase;
    margin-bottom: 15px;
  }

  .head {
    margin-bottom: 10px;
  }

  button.cancel {
    color: @color-tone-darkest;

    &:hover {
      color: @color-accent
    }
  }
}
</style>

<style lang="less">
@import (reference) '~src/styles/_variables.less';

.duplicate-files {

  .action {
    color: @color-primary;
  }

  .display-mode .el-radio-button--mini {
    margin: 0 3px;

    .el-radio-button__inner {
      background-color: unset;
      border: none;
      border-radius: 4px;
      font-size: 10px;
      padding: 3px 6px;
      text-transform: uppercase;

      &:hover {
        color: @color-accent;
      }
    }

    &.is-active .el-radio-button__inner:hover {
      color: @color-base;
    }
  }

  .duplicate-item {
    // groups of el checkboxes use the label of the checkbox for the value
    // so the label needs to be hidden to match the design
    .el-checkbox__label {
      display: none;
    }
  }
}
</style>
