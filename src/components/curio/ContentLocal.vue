<template>
  <div>
    <div class="local-storage-header">
      <template v-if="!viewUpload">
        <h2>Add content to Curio</h2>
      </template>
      <template v-else>
        <h2>Curio storage</h2>
      </template>

      <div v-if="viewUpload" class="storage-information">
        <p>
          {{ usedStorageSpace | fileSize }} out of {{ totalStorage | fileSize }}<br />
        </p>
        <div class="bar" :class="{ error: overLimit }">
          <div class="bar-filling" :style="`width: ${usedStorageSpace / totalStorage * 100}%`"></div>
        </div>
      </div>
    </div>

    <div
      v-if="!viewUpload"
      v-loading="busy"
      class="storage-options"
    >
      <div class="load-store-copy">
        <p>Your trial comes with {{ totalStorage | fileSize }} storage to upload content or you can connect to your cloud storage.</p>
      </div>

      <div class="connect-cloud">
        <div class="cloud" @click="connectTo('local')">
          <div class="image">
            <img src="../../assets/curio/cloud-local.png" alt="Local">
          </div>
          <p>Upload Local Content</p>
        </div>
        <div v-for="kind in cloudKinds" :key="kind.id" class="cloud" @click="connectTo(kind.id)">
          <div class="image">
            <img :src="kind.imageUrl" :alt="kind.name" />
          </div>
          <p>{{kind.name}}</p>
        </div>
      </div>

      <message>Your trial comes with a combination of {{ maxLimit }} credits and 5 hours of video runtime. Go to <em>Settings &gt; Account</em> to upgrade.</message>
      <message icon="far fa-cloud">Connect to even more cloud storage providers with a paid account.</message>
      <ul class="storage-enterprise">
        <li v-for="kind in enterpriseKinds" :key="kind.id">
          <img :src="kind.imageUrl" :alt="kind.name" />
        </li>
      </ul>

      <div class="flex-container-end">
        <p>Not ready to add your content?</p>
        <router-link
          :to="{ name: 'curio-account-team' }"
          class="button-link"
          name="curio-account-team"
        >
          <span>Add Content Later</span>
        </router-link>
      </div>
    </div>

    <template v-else>
      <h3>
        <template v-if="fileList.length && uploadingContent">Uploading&hellip;</template>
        <template v-else-if="fileList.length">Upload complete. {{ fileList.length }} Files, {{ usedStorageSpace | fileSize }} Uploaded</template>
        <template v-else>Upload from your local drive&hellip;</template>
      </h3>

      <el-upload
        ref="loadnstore-uploader"
        action
        :on-progress="onProgress"
        :before-upload="onBeforeUpload"
        :headers="uploadHeaders"
        :on-change="onChange"
        :on-error="onFileUploadError"
        :on-success="onFileUploaded"
        :show-file-list="false"
        :auto-upload="true"
        :http-request="customHttp"
        drag
        multiple
      >
        <div class="el-upload__text">
          <i class="fal fa-upload"></i>
          <span>Drag and drop files here to upload</span>
        </div>
        <p slot="tip" class="message" v-if="fileList.length === 0">Your trial comes with {{ totalStorage | fileSize }} storage to upload content. Paid accounts allow the ability to connect to popular cloud storage providers.</p>
        <div slot="tip" v-if="fileList.length > 0" class="flex-container-end">
          <p class="alternate" @click="viewUpload = false">Connect to cloud storage</p>
          <router-link
            :to="{ name: 'curio-account-team' }"
            class="button-link"
            name="curio-account-team"
          >
            <span>Continue</span>
          </router-link>
        </div>
      </el-upload>

      <ul class="el-upload-list uploaded-file-list">
        <li
          v-for="file in sortedFileList"
          :key="file.uid"
          class="el-upload-list__item uploaded-file-list-file"
        >
          <progress-indicator-bar :percentage="file.percentage">
            <template v-slot:details>
              <span class="uploaded-file__filename">{{ file.name }}</span>
              <i class="far fa-check-circle status-icon status-icon--complete" v-if="file.status !== CONSTANTS.FILE_UPLOAD_STATES.ERROR && (file.status === CONSTANTS.FILE_UPLOAD_STATES.COMPLETE || file.percentage === 100)"></i>
              <i class="fas fa-spinner fa-spin status-icon status-icon--uploading" v-if="file.status !== CONSTANTS.FILE_UPLOAD_STATES.ERROR && file.percentage < 100"></i>
              <el-tooltip
                class="item"
                content="Please upload file again"
                effect="dark"
                placement="top"
                :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY">
                <i class="far fa-exclamation-circle status-icon status-icon--error" v-if="file.status === CONSTANTS.FILE_UPLOAD_STATES.ERROR"></i>
              </el-tooltip>
            </template>
          </progress-indicator-bar>
        </li>
      </ul>
    </template>
  </div>
</template>

<script>
import _ from 'lodash'
import httpStatusCodes from 'http-status-codes'
import elementUIAjax from 'element-ui/packages/upload/src/ajax'
import api from 'src/api'
import { CONSTANTS } from 'src/constants'
import { mapGetters, mapMutations } from 'vuex'
import { CURIO, SESSION, DASHBOARD } from 'src/store/storeModules'
import { GET_AUTH_TOKEN, GET_MAX_LIMIT } from 'src/store/modules/session/session'
import { GET_IS_SAAS_TRIAL_MODE, GET_USER_BILLING } from 'src/store/modules/dashboard/dashboard'
import { getAPIErrorMsg } from 'src/apiHelpers'
import { getFilenameError } from 'src/file-upload-helper'
import { fileSorter } from 'src/sort-helper'
import fileSize from 'src/filters/file-size.filter'
import Message from 'src/components/global/Message'
import ProgressIndicatorBar from 'src/components/global/ProgressIndicatorBar.vue'

const FILE_UPLOAD_URL = '/api/files/loadnstore/'

const getImageUrl = kind => {
  return require(`../../assets/curio/cloud-${kind}.png`)
}

const getReactiveFile = file => {
  return {
    name: file.name,
    uid: file.id || file.uid,
    size: file.size,
    status: file.status || CONSTANTS.FILE_UPLOAD_STATES.READY,
    percentage: file.percentage || 0
  }
}

const getReactiveLocationKind = kind => {
  return _.assign({}, kind, {
    category: _.get(_.find(CONSTANTS.LOCATION_KIND, { id: kind.id }), 'category', ''),
    imageUrl: getImageUrl(kind.id)
  })
}

export default {
  name: 'curio-account-content-local',

  components: {
    Message,
    ProgressIndicatorBar
  },

  computed: {
    ...mapGetters(DASHBOARD, {
      billingInfo: GET_USER_BILLING,
      trialMode: GET_IS_SAAS_TRIAL_MODE
    }),
    ...mapGetters(SESSION, {
      authToken: GET_AUTH_TOKEN,
      maxLimit: GET_MAX_LIMIT
    }),
    cloudKinds () {
      return this.kinds
        .filter(kind => kind.category === this.CONSTANTS.LOCATION_CATEGORIES.CLOUD)
        .sort((a, b) => {return b.category.localeCompare(a.category)})
    },
    enterpriseKinds () {
      return this.kinds
        .filter(kind => kind.category === this.CONSTANTS.LOCATION_CATEGORIES.ENTERPRISE)
        .sort((a, b) => {return a.id.localeCompare(b.id)})
    },
    sortedFileList () {
      return this.fileList.sort(fileSorter)
    },
    totalStorage () {
      if (this.trialMode) {
        return this.CONSTANTS.TOTAL_STORAGE_TRIAL
      } else {
        return this.billingInfo.plan === this.CONSTANTS.BILLING_PLAN_OPTION_2 ? this.CONSTANTS.TOTAL_STORAGE_PREMIUM : this.CONSTANTS.TOTAL_STORAGE_PRO
      }
    },
    uploadHeaders () {
      return {
        'Authorization': `Bearer ${this.authToken}`
      }
    },
    usedStorageSpace () {
      return this.fileList.reduce((total, file) => total + file.size, 0)
    },
    uploadingContent () {
      if (this.fileList.length === 0) {
        return false
      }
      return _.filter(this.fileList, f => {
        return [this.CONSTANTS.FILE_UPLOAD_STATES.READY, this.CONSTANTS.FILE_UPLOAD_STATES.UPLOADING].indexOf(f.status) >= 0
      }).length > 0
    }
  },

  mounted () {
    this.loadFiles()
    this.isOverLimit()
  },

  filters: {
    fileSize
  },

  beforeMount () {
    this.setProgress('content')
    this.loadKinds()
  },

  data () {
    return {
      backgroundColor: this.CONSTANTS.DEFAULT_BACKGROUND_COLOR,
      busy: false,
      overLimit: false,
      fileList: [],
      kinds: [],
      viewUpload: false
    }
  },

  methods: {
    ...mapMutations(CURIO, [
      'setProgress'
    ]),

    connectTo (type) {
      if (type === this.CONSTANTS.LOCATION_KIND.BOX.id) {
        window.location.href = `/api/data/storage/connect/box?access_token=${this.authToken}`
      } else if (type === this.CONSTANTS.LOCATION_KIND.DROPBOX.id) {
        window.location.href = `/api/data/storage/connect/dropbox?access_token=${this.authToken}`
      } else if (type === this.CONSTANTS.LOCATION_KIND.GOOGLEDRIVE.id) {
        window.location.href = `/api/data/storage/connect/googledrive?access_token=${this.authToken}`
      } else if (type === this.CONSTANTS.LOCATION_KIND.ONEDRIVE.id) {
        window.location.href = `/api/data/storage/connect/onedrive?access_token=${this.authToken}`
      } else if (type === this.CONSTANTS.LOCATION_KIND.SHAREPOINT.id) {
        window.location.href = `/api/data/storage/connect/sharepoint?access_token=${this.authToken}`
      } else {
        this.viewUpload = true
      }
    },

    customHttp (options) {
      return elementUIAjax(_.assign(options, {
        action: `${FILE_UPLOAD_URL}/${options.file.name}`
      }))
    },

    isOverLimit () {
      if (this.usedStorageSpace > this.totalStorage) {
        this.overLimit = true
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: `You can only upload ${fileSize(this.totalStorage)} worth of files. Contact us to upgrade your storage.`,
          showClose: true,
          type: 'error'
        })
      }
    },

    async loadFiles () {
      try {
        const files = await api.getGMStorageFiles(this.CONSTANTS.LIMIT.GM_STORAGE_FILES)
        const response = _.get(files, 'items', []) || []
        if (response.length) {
          this.fileList = response.map(f => {
            f.uid = f.id
            f.status = this.CONSTANTS.FILE_UPLOAD_STATES.COMPLETE
            f.percentage = 100
            return getReactiveFile(f)
          })
        }
      } catch (err) {
        console.error(err)
        if (err.status !== httpStatusCodes.NOT_FOUND) {
          this.$message({
            duration: this.CONSTANTS.MESSAGE_DURATION,
            message: getAPIErrorMsg(err),
            showClose: true,
            type: 'error'
          })
        }
      }
    },

    async loadKinds () {
      this.busy = true
      try {
        const locationKinds = await api.getLocationKinds()
        this.kinds = locationKinds.map(kind => getReactiveLocationKind(kind))
      } catch (err) {
        console.error(err)
      } finally {
        this.busy = false
      }
    },

    onBeforeUpload (file) {
      const filenameErr = getFilenameError(file.name)
      if (filenameErr.length) {
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: `The file ${file.name} has an error: ${filenameErr}. Please re-name your file and try again.`,
          showClose: true,
          type: 'error'
        })
        return false
      }
      this.fileList.unshift(getReactiveFile(file))
    },

    onProgress (event, file) {
      const stagedFile = _.find(this.fileList, { uid: file.uid })
      if (stagedFile) {
        stagedFile.percentage = event.percent
        stagedFile.status = (event.percent >= 100) ? this.CONSTANTS.FILE_UPLOAD_STATES.COMPLETE : this.CONSTANTS.FILE_UPLOAD_STATES.UPLOADING
      }
    },

    onChange () {
      this.isOverLimit()
    },

    onFileUploadError (err, file) {
      this.$message({
        duration: this.CONSTANTS.MESSAGE_DURATION,
        message: getAPIErrorMsg(err),
        showClose: true,
        type: 'error'
      })
      const stagedFile = _.find(this.fileList, { uid: file.uid })
      if (stagedFile) {
        stagedFile.status = this.CONSTANTS.FILE_UPLOAD_STATES.ERROR
        stagedFile.percentage = 0
      }
    },

    onFileUploaded (response, file) {
      const stagedFile = _.find(this.fileList, { uid: file.uid })
      if (stagedFile) {
        stagedFile.status = this.CONSTANTS.FILE_UPLOAD_STATES.COMPLETE
      }
    }
  }
}
</script>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.curio {
  h3 {
    margin-bottom: 11px;
  }

  .el-upload {
    span {
      display: inline;
      font-size: 11px;
      font-weight: 500;
      height: auto;
      line-height: normal;
      text-transform: none;
      width: auto;
    }
  }

  .storage-options {
    font-size: 13px;

    .flex-container-end {
      margin-top: 80.5px;

      .button-link {
        background-color: @color-tone;
        color: @color-base;
      }
    }
  }

  .message {
    color: @color-primary;
    font-size: 13px;
    line-height: 1.33;
    margin-top: 0;
    text-align: center;
  }

  .load-store-copy {
    p {
      font-size: 13px;
      line-height: 1.33;
      margin: 0;

      &:last-of-type {
        margin-bottom: 14px;
      }
    }
  }

  .connect-cloud {
    .flex-box();
    .flex-wrap(wrap);
    .justify-content-start();
    margin: 4px 0 17px;

    .cloud {
      .align-items-center();
      .flex-box();
      .flex-direction(column);
      .justify-content-space-between();
      .size(240.5px, 240.5px);
      background-color: @color-tone-light;
      cursor: pointer;
      margin-bottom: 11.1px;
      margin-right: 11.1px;
      text-align: center;

      &:last-of-type {
        margin-right: 0;
      }

      .image {
        .align-items-center();
        .flex-box();
        .justify-content-center();
        height: 219.5px;

        img {
          max-width: 80%;
        }
      }

      p {
        .base-font-uppercase();
        background: @color-tone-lighter;
        font-size: 8px;
        font-weight: 700;
        letter-spacing: 0.6px;
        margin: 0;
        padding: 6px 6px 5px;
        width: 100%;
      }
    }
  }

  .storage-enterprise {
    list-style: none;
    margin: 0 0 0 20px;
    padding: 0;

    li {
      background: no-repeat;
      background-size: cover;
      display: inline-block;
      height: 32px;
      margin-right: 18.8px;

      img {
        .size(40px, 32px);
        display: inline-block;
        filter: grayscale(1);
        object-fit: contain;
      }
    }
  }
}

.flex-container-end {
  .flex-container-end();
  margin: 0;

  p {
    margin: 0 21px 0 0;

    &.alternate {
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 1.1;
      line-height: 1.36;
      text-transform: uppercase;

      &:hover {
        cursor: pointer;
      }
    }
  }
}

.storage-information {
  .storage-information();
}

.uploaded-file-list {
  .uploaded-file-list-file {
    .uploaded-file-list-file__details {
      .flex-container-between();
      .align-items-center();
      width: 100%;

      .uploaded-file__filename {
        display: block;
        overflow: hidden;
        padding-right: 15px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .status-icon {
        font-size: 15px;

        &--complete {
          color: @color-accent;
        }
        &--error {
          color: @color-alert;
        }
      }
    }
  }
}
</style>
