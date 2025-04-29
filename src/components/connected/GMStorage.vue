<template>
  <div class="file-browser">
    <tools-header>
      <template v-slot:right>
        <collections-button></collections-button>
      </template>
    </tools-header>

    <div class="search-results-loading" v-loading="status === 'loading'"></div>
    <div class="search-results__container app-fluid-container" v-if="status !== 'loading'">
      <section class="search-results__results app-fluid-container__section--middle">
        <template v-if="hasGMStorageFiles">
          <div class="storage-header">
            <h2><i class="fal fa-folder-open"></i> GrayMeta Cloud Storage</h2>
            <div v-if="selectedFileActions && !loadingAction" class="actions">
              <ul>
                <li @click="deleteFiles">
                  <i class="far fa-trash-alt"></i>
                  Delete selected
                </li>
              </ul>
            </div>
          </div>

          <el-breadcrumb separator-class="el-icon-arrow-right">
            <el-breadcrumb-item
              v-for="(breadcrumb, index) in getBreadcrumbs(currentFolder.path)"
              :key="index"
              @click.native="setCurrentFolder(currentFolder, index)"
            >
              <span v-if="breadcrumb === '/'">GrayMeta Storage</span>
              <span v-else>{{ breadcrumb }}</span>
            </el-breadcrumb-item>
          </el-breadcrumb>

          <p v-if="messageUndoDelete" class="message message-alert">
            <span>
              {{ selectedFiles.length }} file<template v-if="selectedFiles.length > 1">s</template> to be deleted.
            </span>
            <span>
              <a @click="cancelMoveOrDelete" class="digit">Undo :{{ countdownSeconds | twoDigits }}</a>
              <i @click="cancelCountdown" class="far fa-times"></i>
            </span>
          </p>

          <div
            class="status-message done"
            :class="{ error: erroredFiles.length > 0 }"
            v-if="actionFiles.length > 0"
          >
            <span v-if="erroredFiles.length > 0">
              <i class="far fa-exclamation-circle"></i>
              <span>{{actionType}} Error: {{ erroredFiles.length }} file<template v-if="erroredFiles.length > 1">s</template></span>
            </span>
            <span v-if="selectedFileCount > 0">
              <i class="far fa-check-circle"></i>
              <span>{{actionType}} {{ selectedFileCount }} file<template v-if="selectedFileCount > 1">s</template></span>
            </span>
            <i class="far fa-times" @click="clearFilesAction"></i>
          </div>

          <div class="content" v-loading="loadingAction">
            <div class="scroll-wrapper">
              <div class="files-folders">
                <div class="folder-list">
                  <storage-item-tile-folder
                    :folder="folder"
                    :key="folder.path"
                    :command="handleCommand"
                    @select="setCurrentFolder(folder)"
                    @toggleCheckbox="toggleSelectedFolder(folder)"
                    v-for="folder in sortedFolderList"
                  ></storage-item-tile-folder>
                </div>
              </div>

              <div class="results">
                <storage-item-tile-file
                  :file="file"
                  :key="file.id"
                  :command="handleCommand"
                  @select="setCurrentFolder(folder)"
                  @toggleCheckbox="toggleSelectedFile(file)"
                  v-for="file in sortedFileList"
                ></storage-item-tile-file>
              </div>
            </div>
          </div>
        </template>
        <empty-states v-else :page="CONSTANTS.EMPTY_STATES.GM_STORAGE"></empty-states>
      </section>
      <section class="app-fluid-container__section--right">
        <div v-if="hasGMStorageFiles" class="information">
          <div class="storage-information">
            <p>
              {{ usedStorageSpace | fileSize }} out of {{ totalStorage | fileSize }}<br />
            </p>
            <div class="bar" :class="{ error: overLimit }">
              <div class="bar-filling" :style="`width: ${usedStorageSpace / totalStorage * 100}%`"></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import humanize from 'humanize-plus'
import moment from 'moment'
import { mapActions, mapGetters } from 'vuex'

import api from 'src/api'
import { CONSTANTS } from 'src/constants'
import { fileSorter, folderSorter } from 'src/sort-helper'
import { getAPIErrorMsg } from 'src/apiHelpers'
import {
  buildFolderHierarchy,
  getBreadcrumbs,
  getFolder,
  isFileInFolder
} from 'src/file-upload-helper'
import EmptyStates from 'src/components/global/EmptyStates'
import ToolsHeader from 'src/components/global/ToolsHeader.vue'
import SearchQuery from 'src/components/search/SearchQuery'
import StorageItemTileFile from 'src/components/connected/StorageItemTileFile.vue'
import StorageItemTileFolder from 'src/components/connected/StorageItemTileFolder.vue'
import CollectionsButton from 'src/components/collections/CollectionsButton'

import {
  DASHBOARD,
  LOADNSTORE,
  RIGHT_PANEL
} from 'src/store/storeModules'
import { COLLECTIONS_OPEN } from 'src/store/modules/rightPanel/getterTypes'
import { GET_IS_SAAS_TRIAL_MODE, GET_USER_BILLING } from 'src/store/modules/dashboard/dashboard'
import {
  FETCH_GM_STORAGE_FILES,
  GET_GM_FILES_STATUS,
  GET_GM_STORAGE_FILES
} from 'src/store/modules/loadnstore/loadnstore'

import fileSize from 'src/filters/file-size.filter'
import twoDigits from 'src/filters/two-digits.filter'

export default {
  name: 'loadnstore',

  components: {
    CollectionsButton,
    EmptyStates,
    ToolsHeader,
    StorageItemTileFile,
    StorageItemTileFolder
  },

  data () {
    const folders = _.cloneDeep(CONSTANTS.GM_STORAGE_FOLDER)

    return {
      CONSTANTS,
      actionFiles: [],
      actionType: '',
      countdownEndTime: null,
      countdownInterval: null,
      countdownSeconds: 0,
      countdownTimeout: null,
      currentFolder: folders[0],
      deletingFile: false,
      downloadingFile: false,
      folders,
      messageUndoDelete: false,
      overLimit: false,
      selectedFileCount: 0
    }
  },

  filters: {
    fileSize,
    twoDigits
  },

  beforeMount () {
    this.loadGMFiles()
  },

  watch: {
    gmStorageFilesCount: {
      handler (newValue, oldValue) {
        const files = (this.gmStorageFiles || []).map(file => file.path)
        this.folders = buildFolderHierarchy(files)
        if (this.folders.length > 0) {
          this.currentFolder = getFolder(this.folders, this.currentFolder.path)
        }
      },
      immediate: true
    }
  },

  computed: {
    ...mapGetters(DASHBOARD, {
      billingInfo: GET_USER_BILLING,
      trialMode: GET_IS_SAAS_TRIAL_MODE
    }),

    ...mapGetters(LOADNSTORE, {
      gmStorageFiles: GET_GM_STORAGE_FILES,
      status: GET_GM_FILES_STATUS
    }),

    ...mapGetters(RIGHT_PANEL, {
      collectionsOpen: COLLECTIONS_OPEN
    }),

    erroredFiles () {
      return this.actionFiles.filter(file => file.status === 'error')
    },

    gmStorageFilesCount () {
      return this.gmStorageFiles ? this.gmStorageFiles.length : null
    },

    hasGMStorageFiles () {
      return !!this.gmStorageFilesCount
    },

    loadingAction () {
      return this.deletingFile || this.downloadingFile
    },

    selectedFiles () {
      return this.gmStorageFiles.filter(file => file.selected)
    },

    selectedFileActions () {
      return this.selectedFiles.length > 0
    },

    sortedFileList () {
      return this.gmStorageFiles
        .filter(file => {
          const path = file.path
          const folder = path.substring(0, path.lastIndexOf('/')) || '/'
          return (folder === this.currentFolder.path)
        })
        .sort(fileSorter)
    },

    sortedFolderList () {
      return [...this.currentFolder.children].sort(folderSorter)
    },

    successFiles () {
      return this.actionFiles.filter(file => file.status === 'success')
    },

    totalStorage () {
      if (this.trialMode) {
        return CONSTANTS.TOTAL_STORAGE_TRIAL
      } else {
        return this.billingInfo.plan === CONSTANTS.BILLING_PLAN_OPTION_2 ? CONSTANTS.TOTAL_STORAGE_PREMIUM : CONSTANTS.TOTAL_STORAGE_PRO
      }
    },

    usedStorageSpace () {
      return this.gmStorageFiles.reduce((total, file) => total + file.size, 0)
    }
  },

  methods: {
    ...mapActions(LOADNSTORE, {
      loadGMFiles: FETCH_GM_STORAGE_FILES
    }),

    cancelCountdown () {
      clearInterval(this.countdownInterval)
      clearTimeout(this.countdownTimeout)
      this.countdownInterval = null
      this.countdownTimeout = null
      this.messageUndoDelete = false
      if (this.selectedFiles.length > 0) {
        this.processFileDelete()
      }
    },

    cancelMoveOrDelete (file) {
      clearInterval(this.countdownInterval)
      clearTimeout(this.countdownTimeout)
      this.countdownInterval = null
      this.countdownTimeout = null
      this.messageUndoDelete = false
      this.deletingFile = false
    },

    clearFilesAction () {
      this.actionFiles = []
      this.selectedFileCount = 0
    },

    countdown () {
      this.countdownSeconds = CONSTANTS.REMOVE_FILE_COUNTDOWN_DURATION.asSeconds()
      this.countdownEndTime = moment().add(CONSTANTS.REMOVE_FILE_COUNTDOWN_DURATION)
      this.countdownInterval = window.setInterval(() => {
        this.countdownSeconds = this.countdownEndTime.diff(moment(), 'seconds')
        if (this.countdownSeconds < 0) {
          this.messageUndoDelete = false
        }
      }, 500)
    },

    deleteBatchItems (item) {
      this.messageUndoDelete = true
      this.countdown()
      this.countdownTimeout = setTimeout(function () {
        this.setSelected(item, !item.selected)
        for (const file of this.gmStorageFiles) {
          if (isFileInFolder(file, item)) {
            this.processFileDelete()
          }
        }
      }.bind(this), CONSTANTS.REMOVE_FILE_COUNTDOWN_DURATION.asMilliseconds())

      if (item.children) {
        item.children.forEach(f => this.deleteBatchItems(f))
      }
    },

    deleteFile (file) {
      this.toggleSelectedFile(file)
      this.$confirm('Are you sure you want to permanently remove this file?', `Delete: ${file.name}`, {
        cancelButtonText: 'Cancel',
        confirmButtonText: 'Continue',
        type: 'warning'
      })
      .then(() => {
        this.processFileDelete()
      })
      .catch(() => {
        this.cancelMoveOrDelete(file)
      })
    },

    deleteFiles () {
      this.messageUndoDelete = true
      this.countdown()
      this.countdownTimeout = setTimeout(function () { this.processFileDelete() }.bind(this), CONSTANTS.REMOVE_FILE_COUNTDOWN_DURATION.asMilliseconds())
    },

    async downloadBatchItems (folder) {
      for (const file of this.gmStorageFiles) {
        try {
          if (isFileInFolder(file, folder) && file.gm_item_id) {
            await api.downloadItem(file.gm_item_id)
            this.actionFiles.push({
              name: file.name,
              status: 'success',
              type: 'download'
            })
            this.selectedFileCount++
          }
        } catch (err) {
          file.status = CONSTANTS.FILE_UPLOAD_STATES.ERROR
          this.actionFiles.push({
            name: file.name,
            status: 'error',
            type: 'download'
          })
        }
        this.actionType = CONSTANTS.USER_ACTION_TYPE.DONWLOADED
      }
      if (folder.childre) {
        folder.children.forEach(f => this.downloadBatchItems(f))
      }
      this.downloadingFile = false
    },

    getBreadcrumbs, // template needs access to this

    handleCommand (command) {
      this.clearFilesAction()
      switch (command.type) {
        case 'download':
          this.handleDownload(command)
          break
        case 'delete':
          this.handleDelete(command)
          break
      }
    },

    handleDelete (command) {
      if (command.item.gm_item_id) {
        this.deleteFile(command.item)
      } else {
        this.deleteBatchItems(command.item)
      }
    },

    async handleDownload (command) {
      this.downloadingFile = true

      if (command.item.gm_item_id) {
        try {
          await api.downloadItem(command.item.gm_item_id)
          this.actionFiles.push({
            name: command.item.name,
            status: 'success',
            type: 'download'
          })
          this.selectedFileCount++
        } catch (err) {
          command.item.status = CONSTANTS.FILE_UPLOAD_STATES.ERROR
          this.actionFiles.push({
            name: command.item.name,
            status: 'error',
            type: 'download'
          })
        } finally {
          this.downloadingFile = false
        }
      } else {
        this.downloadBatchItems(command.item)
      }
    },

    isOverLimit () {
      if (this.usedStorageSpace > this.totalStorage) {
        this.overLimit = true
        this.$message({
          duration: CONSTANTS.MESSAGE_DURATION,
          message: `You can only upload ${fileSize(this.totalStorage)} worth of files. Contact us to upgrade your storage.`,
          showClose: true,
          type: 'error'
        })
      }
    },

    async processFileDelete () {
      this.clearFilesAction()
      this.deletingFile = true

      for (const file of this.selectedFiles) {
        try {
          await api.deleteGMStorageFile(file.path)
          this.actionFiles.push({
            name: file.name,
            status: 'success',
            type: 'delete'
          })
          this.selectedFileCount++
          this.setSelected(file, !file.selected)
        } catch (err) {
          file.status = CONSTANTS.FILE_UPLOAD_STATES.ERROR
          this.actionFiles.push({
            name: file.name,
            status: 'error',
            type: 'delete'
          })
        }
        this.actionType = CONSTANTS.USER_ACTION_TYPE.DELETED
      }
      this.isOverLimit()
      this.loadGMFiles()
      this.messageUndoDelete = false
      this.deletingFile = false
    },

    setSelected (folder, status) {
      folder.selected = status
      for (const file of this.gmStorageFiles) {
        if (isFileInFolder(file, folder)) {
          file.selected = status
        }
      }

      if (folder.children) {
        folder.children.forEach(f => this.setSelected(f, status))
      }
    },

    setCurrentFolder (folder, parentIndex) {
      if (parentIndex === undefined) {
        this.currentFolder = folder
      } else {
        const breadcrumbs = getBreadcrumbs(this.currentFolder.path)
        let i = 0
        let newCurrentFolder = this.folders[i]

        while (++i <= parentIndex && i < breadcrumbs.length) {
          newCurrentFolder = newCurrentFolder.children.find(child => child.name === breadcrumbs[i])
        }

        this.currentFolder = newCurrentFolder
      }
    },

    toggleSelectedFile (file) {
      file.selected = !file.selected
    },

    toggleSelectedFolder (folder) {
      this.setSelected(folder, !folder.selected)
    }
  }
}
</script>

<style lang="less">
@import '~src/styles/file-browser';
@import (reference) '~src/styles/_mixins';

.el-loading-spinner {
  top: 10%;
}
</style>

<style lang="less" scoped>
@import (reference) '~src/styles/_mixins';
@import '~src/styles/status_messages';

.file-browser {
  .app-fluid-container.search-results__container {
    .search-results__results {
      .content {
        margin-left: 15px;

        .scroll-wrapper {
          // Site-header: 56px, Search results header: 44px, Storage header: 44px
          // Breadcrumbs: 26px
          height: calc(~'100vh - 150px');

          .folder-list {
            margin-left: 0;
          }
        }
      }
    }
  }
}

.search-results-loading {
  .abs-pos(0, 0, 0, 0);
  height: 2.5em;
  margin: auto;
  overflow: show;
  position: fixed;
  width: 2.5em;
  z-index: 999;
}
</style>
