<template>
  <div
    class="upload-button"
    v-if="this.isEnterpriseLoadstore && $hasScope(SCOPES.STORAGE_MANAGE, SCOPES.STORAGE_VIEW)"
    :class="{ 'options-showing': showUploadOptions }"
  >
    <div class="upload-files">
      <el-button
        @click="toggleUploadOptions"
        @keyup.esc.native="onCloseUploadOptions"
        class="upload-files-link"
      >
        <span id="upload-button">Upload Files &amp; Folders</span>
      </el-button>
      <ul v-show="showUploadOptions" class="options">
        <li @click="handleCommand('files')">Files</li>
        <li @click="handleCommand('folder')">Folder</li>
      </ul>
    </div>

    <el-dialog
      :before-close="cancelActions"
      :visible.sync="dialogUploadVisible"
      title="Upload to..."
      top="5%"
    >
      <folder-tree-view
        :folders="folders"
        @folder-selected="selectFolder"
      ></folder-tree-view>

      <span slot="footer" class="dialog-footer">
        <div v-if="currentFolder" class="new-folder-actions">
          <div v-if="addingNewFolder" class="addingNewFolder el-input">
            <input
              @click.stop
              @keyup.enter="saveNewFolder"
              class="el-input__inner"
              v-alphanumeric-input
              placeholder="Enter folder name and press ENTER"
              ref="add-folder-input"
              type="text"
              v-model="newFolder"
            >
          </div>
          <template v-else>
            <a @click="addFolder"><i class="far fa-plus"></i> New Folder</a>
          </template>
        </div>
        <div class="user-actions">
          <el-button size="mini" type="text" @click="cancelActions">Cancel</el-button>
          <el-upload
            :auto-upload="true"
            :before-upload="onBeforeUpload"
            :headers="uploadHeaders"
            :http-request="customHttp"
            :on-error="onFileUploadError"
            :on-progress="onProgress"
            :on-success="onFileUploaded"
            :show-file-list="false"
            action
            multiple
            ref="gm-storage-uploader"
          >
            <el-button type="primary" size="mini">
              <span v-if="uploadType === 'folder'">Choose Folder</span>
              <span v-else>Choose Files</span>
            </el-button>
          </el-upload>
        </div>
      </span>
    </el-dialog>

    <div class="user-alert" v-if="showIgnoredFilesMessage">
      <div role="alert" class="el-alert el-alert--error">
        <div class="el-alert__content">
          <span class="el-alert__title is-bold">
            The following files cannot be uploaded to GM Storage and were ignored.
          </span>
          <ul class="el-alert__description">
            <li v-for="(fileName, index) in ignoredFiles" :key="index">{{ fileName }}</li>
          </ul>
          <i @click="cancelActions" class="el-alert__closebtn el-icon-close"></i>
        </div>
      </div>
    </div>

    <div
      class="status-message"
      :class="{'done': (uploadedCount > 0 && uploadingContent.length === 0)}"
      v-if="showMessage"
    >
      <template v-if="uploadingContent.length > 0">
        <span>
          <i class="far fa-sync"></i>
          <span v-truncate-text="55">Uploading {{ uploadingContent[0].name }} &middot; {{ uploadingContent.length }} file<template v-if="uploadingContent.length > 1">s</template> left</span>
        </span>
        <el-progress
          v-if="uploadingContent[0].percentage < 100"
          :text-inside="false"
          :show-text="false"
          :stroke-width="6.2"
          :percentage="uploadingContent[0].percentage"
          :color="backgroundColor"
        ></el-progress>
      </template>
      <template v-else>
        <span>
          <i class="far fa-check-circle"></i>
          <span>Uploaded {{ uploadedCount }} file<template v-if="uploadedCount > 1">s</template></span>
        </span>
        <i class="far fa-times" @click="showMessage = false"></i>
      </template>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import httpStatusCodes from 'http-status-codes'
import elementUIAjax from 'element-ui/packages/upload/src/ajax'
import minimatch from 'minimatch'
import moment from 'moment'

import api from 'src/api'
import {
  buildFolderHierarchy,
  getBreadcrumbs,
  getFilenameError,
  getFolder,
  joinPaths
} from 'src/file-upload-helper'
import { getAPIErrorMsg } from 'src/apiHelpers'
import { LOADNSTORE, SESSION } from 'src/store/storeModules'
import {
  FETCH_GM_STORAGE_FILES,
  GET_GM_STORAGE_FILES,
  SHOW_UPLOAD_FILE_OPTIONS,
  TOGGLE_UPLOAD_FILES_OPTIONS
} from 'src/store/modules/loadnstore/loadnstore'
import { GET_AUTH_TOKEN, GET_IGNORE_FILE_PATTERNS } from 'src/store/modules/session/session'
import AlphanumericInput from 'src/directives/alphanumeric-input.directive'
import TruncateText from 'src/directives/truncate-text.directive'
import FolderTreeView from 'src/components/global/FolderTreeView'

import LocationEnforcerMixin from 'src/components/global/LocationEnforcerMixin'

const FILE_UPLOAD_URL = '/api/files/loadnstore'

const getReactiveFile = (file, newStatus, currentPercentage) => {
  return {
    name: file.name,
    uid: file.uid,
    path: '/' + file.webkitRelativePath,
    selected: false,
    size: file.size,
    status: file.status || newStatus,
    percentage: file.percentage || currentPercentage
  }
}

export default {
  name: 'upload-files',

  mixins: [LocationEnforcerMixin],

  directives: {
    AlphanumericInput,
    TruncateText
  },

  components: {
    FolderTreeView
  },

  props: {
    currentFolderPath: {
      type: String,
      default: '/'
    }
  },

  data () {
    const folders = _.cloneDeep(this.CONSTANTS.GM_STORAGE_FOLDER)

    return {
      addingNewFolder: false,
      backgroundColor: '#00b1ff',
      currentFolder: folders[0],
      dialogUploadVisible: false,
      ignoredFiles: [],
      folders,
      newFolder: '',
      showMessage: false,
      uploadType: '',
      uploadedCount: 0
    }
  },

  computed: {
    ...mapGetters(LOADNSTORE, {
      gmStorageFiles: GET_GM_STORAGE_FILES,
      showUploadOptions: SHOW_UPLOAD_FILE_OPTIONS
    }),

    ...mapGetters(SESSION, {
      ignoredFilePatterns: GET_IGNORE_FILE_PATTERNS
    }),

    gmStorageFilesCount () {
      return this.gmStorageFiles ? this.gmStorageFiles.length : null
    },

    showIgnoredFilesMessage () {
      return this.uploadingContent.length === 0 && this.ignoredFiles.length > 0
    },

    uploadHeaders () {
      return {
        'Authorization': 'Bearer ' + this.$store.getters[`${SESSION}/${GET_AUTH_TOKEN}`]
      }
    },

    uploadingContent () {
      if (this.gmStorageFiles) {
        return [...this.gmStorageFiles]
          .filter(file => file.status === this.CONSTANTS.FILE_UPLOAD_STATES.UPLOADING || file.status === this.CONSTANTS.FILE_UPLOAD_STATES.READY)
          .sort((a, b) => b.percentage - a.percentage)
      } else {
        return []
      }
    }
  },

  watch: {
    gmStorageFilesCount: {
      handler (newValue, oldValue) {
        if (this.gmStorageFiles) {
          const files = this.gmStorageFiles.map(file => file.path)
          this.folders = buildFolderHierarchy(files)

          if (this.folders.length > 0) {
            this.currentFolder = getFolder(this.folders, this.currrentFolder ? this.currentFolder.path : this.currentFolderPath)
          }
        }
      },
      immediate: true
    },

    showIgnoredFilesMessage: {
      handler (newValue, oldValue) {
        if (this.showIgnoredFilesMessage) {
          this.dialogUploadVisible = false
        }
      }
    }
  },

  methods: {
    ...mapActions(LOADNSTORE, {
      loadGMFiles: FETCH_GM_STORAGE_FILES,
      toggleUploadOptions: TOGGLE_UPLOAD_FILES_OPTIONS
    }),

    addFolder () {
      this.addingNewFolder = !this.addingNewFolder
    },

    cancelActions () {
      this.addingNewFolder = false
      this.ignoredFiles = []
      this.newFolder = ''
      this.dialogUploadVisible = false
      this.clearSelectedStatus()
    },

    clearSelectedStatus () {
      if (this.currentFolder) {
        this.currentFolder.expanded = false
        this.currentFolder.selected = false
      }
    },

    customHttp (options) {
      const path = options.file.webkitRelativePath || options.file.name
      return elementUIAjax(_.assign(options, {
        action: `${FILE_UPLOAD_URL}${joinPaths(this.currentFolder.path, path)}`
      }))
    },

    handleCommand (command) {
      this.onCloseUploadOptions()
      this.selectFolder(getFolder(this.folders, this.currentFolderPath))
      this.dialogUploadVisible = true
      this.uploadedCount = 0
      const uploadInput = this.$refs['gm-storage-uploader'].$el.querySelector('input')

      // https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/webkitdirectory
      if (command === 'folder') {
        this.uploadType = 'folder'
        uploadInput.webkitdirectory = true
        uploadInput.mozdirectory = true
      } else {
        this.uploadType = 'files'
        uploadInput.webkitdirectory = false
        uploadInput.mozdirectory = false
      }
    },

    onBeforeUpload (file) {
      if (this.ignoredFilePatterns.some(pattern => minimatch(file.name, pattern))) {
        this.ignoredFiles.unshift(file.name)
        return false
      }

      if (this.newFolder !== '') {
        this.saveNewFolder()
      }

      const filenameErr = getFilenameError(file.name)
      if (filenameErr) {
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: `The file ${file.name} has an error: ${filenameErr}. Please re-name your file and try again.`,
          showClose: true,
          type: 'error'
        })
        return false
      }

      this.uploadedCount++
      this.gmStorageFiles.unshift(getReactiveFile(file, this.CONSTANTS.FILE_UPLOAD_STATES.READY, 0))
      this.showMessage = true
    },

    onCloseUploadOptions () {
      this.toggleUploadOptions()
    },

    onFileUploadError (err, file) {
      this.$message({
        duration: this.CONSTANTS.MESSAGE_DURATION,
        message: 'Error deleting file. Please try again.',
        showClose: true,
        type: 'error'
      })
      file.status = this.CONSTANTS.FILE_UPLOAD_STATES.ERROR
    },

    onFileUploaded (response, file) {
      file.status = this.CONSTANTS.FILE_UPLOAD_STATES.COMPLETE
      this.loadGMFiles()
    },

    onProgress (event, file) {
      const currentFile = this.gmStorageFiles.find(f => f.uid === file.uid)

      if (currentFile) {
        currentFile.percentage = event.percent
        currentFile.status = (currentFile.percentage === 100) ? this.CONSTANTS.FILE_UPLOAD_STATES.COMPLETE : this.CONSTANTS.FILE_UPLOAD_STATES.UPLOADING
      }

      this.dialogUploadVisible = false
    },

    saveNewFolder () {
      const newFolder = {
        children: [],
        expanded: false,
        name: this.newFolder,
        path: joinPaths(this.currentFolder.path, this.newFolder),
        selected: true
      }
      this.currentFolder.children.push(newFolder)
      this.currentFolder.expanded = true
      this.selectFolder(newFolder)
      this.addingNewFolder = false
      this.newFolder = ''
    },

    selectFolder (folder) {
      this.clearSelectedStatus()
      this.currentFolder = folder
      this.currentFolder.selected = true

      // expand parent folders
      const breadcrumbs = getBreadcrumbs(this.currentFolder.path)
      let i = 0
      let parentFolder = this.folders[i]
      while (++i < breadcrumbs.length) {
        parentFolder.selected = false
        parentFolder.expanded = true
        parentFolder = parentFolder.children.find(child => child.name === breadcrumbs[i])
      }
    }
  }
}
</script>

<style lang="less">
@import (reference) '~src/styles/_mixins';

.search-results__header {
  .app-fluid-container {
    .align-items-center();
  }
}

.admin-page {
  .upload-button {
    .el-dialog__wrapper {
      .el-dialog {
        .el-dialog__body {
          padding-bottom: 18px;
          padding-top: 18px;
        }

        .el-dialog__footer {
          background-color: @color-base;
          margin-top: 0;
          padding-top: 18px;
        }
      }
    }
  }
}

.upload-button {
  .user-alert {
    .abs-pos(10%, auto, auto, 33%);
    z-index: 3;

    .el-alert {
      .el-alert__title {
        text-transform: none;
      }

      .el-alert__closebtn {
        color: @text-dark;
      }
    }
  }

  .el-dialog__wrapper {
    .el-dialog {
      width: 523.7px;

      .el-dialog__body {
        background-color: @color-tone-light;
        font-size: 12px;
        font-weight: normal;
        letter-spacing: 0;
        line-height: 1.33;
        padding-bottom: 18px;
        padding-top: 18px;
        text-transform: none;

        p {
          font-size: 13px;
          margin: 15px 0 10px;
        }

        a {
          color: @color-anchor;

          &:hover {
            text-decoration: underline;
          }
        }
      }

      .el-dialog__footer {
        margin-top: 0;
        padding: 18px;

        .dialog-footer {
          .flex-container();

          .new-folder-actions {
            a {
              color: @color-primary;
              font-size: 14px;
              font-weight: 500;
              letter-spacing: 1.1px;
              line-height: 1.36;
              text-transform: uppercase;

              &:hover {
                cursor: pointer;
              }
            }
          }

          .user-actions {
            display: flex;
            margin-left: auto;

            .el-button {
              font-size: 14px;
              font-weight: 500;
              padding-left: 0;
              padding-right: 0;

              &.el-button--primary {
                padding-left: 15px;
                padding-right: 15px;
              }

              + div {
                display: inline-block;
                margin-left: 10px;
              }
            }

            .el-upload {
              border-style: solid;
              height: auto;
              width: auto;

              .el-upload-dragger {
                height: auto;
                width: auto;
              }

              span {
                color: @color-base;
                display: inline-block;
                font-size: 14px;
                font-weight: 700;
                height: auto;
                line-height: 1;
                text-align: center;
                text-transform: uppercase;
                width: auto;
              }
            }
          }
        }
      }
    }
  }

  &.disabled {
    .upload-files {
      &:hover {
        cursor: default;
      }

      .el-button {
        &:hover {
          cursor: default;
        }

        &.upload-files-link {
          color: @color-tone-dark;
        }
      }
    }
  }

  &.options-showing {
    background: @background-darker;

    .upload-files {
      .el-button {
        &.upload-files-link {
          color: @color-base;
        }
      }
    }
  }
}
</style>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';
@import '~src/styles/status_messages';

.upload-files {
  position: relative;

  &:hover {
    cursor: pointer;
  }

  .el-button {
    &:hover {
      cursor: pointer;
    }

    &.upload-files-link {
      background: transparent;
      border: 0 none;
      color: @color-tone-darkest;
      font: 500 10px @default-font-family-medium;
      letter-spacing: 0;
      padding: 5px 18px 5px 42px;
      text-align: left;
      width: 100%;

      &:hover {
        color: @color-accent;
        text-decoration: none;
      }

      &.active {
        background: @background-darker;
        color: @color-base;
      }
    }
  }

  ul.options {
    .abs-pos(-11px, auto, auto, 180px);
    background: @background-darker;
    color: @color-base;
    list-style: none;
    margin: 0;
    padding: 15px 16.55px 15px 10px;
    z-index: 10;

    li {
      color: @color-base;
      font-size: 10px;
      font-weight: 900;
      letter-spacing: 0.8px;
      line-height: 1.33;
      margin-bottom: 13px;
      padding: 0;
      text-transform: uppercase;
      width: 180px;

      &:last-of-type {
        margin-bottom: 0;
      }

      &:hover {
        color: @color-accent;
      }
    }
  }
}

.addingNewFolder {
  width: 240px;

  .el-input__inner {
    background-color: @color-base;
    font-size: 12px;

    &::placeholder,
    &::-webkit-input-placeholder {
      font-size: 12px;
    }
  }
}
</style>
