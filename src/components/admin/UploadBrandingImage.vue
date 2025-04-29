<template>
  <div
    class="upload-file"
    :class="brandingFile.name"
    v-loading="fileBusy"
  >
    <div class="image" v-loading="isBusy">
      <img
        v-if="logo !== ''"
        :src="logo"
        :alt="brandingFile.name"
      />
      <img
        v-else
        :src="getImageUrl(brandingFile.name)"
        :alt="brandingFile.name"
      />

      <span v-if="!brandingImageCustomImage">Default background image</span>
    </div>
    <div class="instructions">
      <div class="text">
        <p>{{ brandingFile.description }}</p>
        <ul>
          <li>The maximum width of the image is {{ brandingFile.max_width }}.</li>
          <li>The maximum height of the image is {{ brandingFile.max_height }}.</li>
        </ul>
      </div>
      <div
        v-if="customImage"
        @click="doDeleteBrandingFile(brandingFile.name)"
        class="action"
      >
        <i class="far fa-trash-alt"></i>
        <span>Delete {{ brandingFile.name }}</span>
      </div>
    </div>
    <el-upload
      :auto-upload="true"
      :before-upload="onBeforeUpload"
      :data="{ name: fileType }"
      :headers="uploadHeaders"
      :http-request="customHttp"
      :multiple="false"
      :on-error="onFileUploadError"
      :on-success="onFileUploaded"
      :show-file-list="false"
      accept="image/jpg, image/jpeg, image/png, image/gif"
      action
      class="upload"
      drag
    >
      <i v-if="uploading" class="fa fa-spinner fa-spin"></i>
      <i v-else class="far fa-upload"></i>
    </el-upload>
  </div>
</template>

<script>
import elementUIAjax from 'element-ui/packages/upload/src/ajax'
import {
  mapActions,
  mapGetters,
  mapMutations
} from 'vuex'
import { BRANDING, SESSION } from 'src/store/storeModules'
import { GET_AUTH_TOKEN } from 'src/store/modules/session/session'
import {
  GET_BRANDING_ERROR,
  GET_BRANDING_FILE,
  GET_BRANDING_FILE_BUSY,
  GET_BRANDING_FILES
} from 'src/store/modules/admin/branding/getters'
import { DELETE_BRANDING_FILE, FETCH_BRANDING_FILE } from 'src/store/modules/admin/branding/actions'
import {CONSTANTS} from "../../constants";

const FILE_UPLOAD_URL = '/api/data/branding'

export default {
  name: 'upload-branding-image',

  props: {
    fileType: {
      type: String,
      required: true
    }
  },

  data () {
    return {
      brandingImageCustomImage: false,
      customImage: false,
      loading: false,
      logo: '',
      uploadedType: '',
      uploading: false
    }
  },

  computed: {
    ...mapGetters(BRANDING, {
      brandingFiles: GET_BRANDING_FILES,
      error: GET_BRANDING_ERROR,
      fileBusy: GET_BRANDING_FILE_BUSY,
      uploadResponse: GET_BRANDING_FILE
    }),

    ...mapGetters(SESSION, {
      authToken: GET_AUTH_TOKEN
    }),

    brandingFile () {
      return this.brandingFiles.find(file => file.name === this.fileType)
    },

    isBusy () {
      return this.loading || this.fileBusy || this.uploading
    },

    uploadHeaders () {
      return {
        'Authorization': `Bearer ${this.authToken}`
      }
    }
  },

  mounted () {
    this.logo = ''

    this.$watch('brandingFiles', (newVal) => {
      if (this.brandingFile && _.get(this.brandingFile, 'has_custom', false)) {
        this.logo = `/api/data/branding/${this.fileType}`
        this.customImage = true
        if (this.fileType === CONSTANTS.LOGOS.IMAGE) {
          this.brandingImageCustomImage = true
        }
      }
    }, { immediate: true })
  },

  methods: {
    ...mapActions(BRANDING, {
      deleteBrandingFile: DELETE_BRANDING_FILE,
      fetchBrandingFile: FETCH_BRANDING_FILE
    }),

    customHttp (options) {
      this.uploadedType = options.data.name

      return elementUIAjax(_.assign(options, {
        action: `${FILE_UPLOAD_URL}/${options.data.name}`
      }))
    },

    doDeleteBrandingFile (name) {
      this.$confirm(`Are you sure you want to delete this custom ${name}?`, 'Warning', {
        cancelButtonText: 'Cancel',
        confirmButtonText: 'OK',
        type: 'warning'
      }).then(async () => {
        this.loading = true
        try {
          await this.deleteBrandingFile(name)
          this.$message({
            duration: this.CONSTANTS.MESSAGE_DURATION,
            message: `${name} deleted.`,
            showClose: true,
            type: 'success'
          })

          this.customImage = false

          if (name === this.CONSTANTS.LOGOS.IMAGE) {
            this.brandingImageCustomImage = false
          }
          this.logo = ''
        } catch (err) {
          this.$message({
            duration: this.CONSTANTS.MESSAGE_DURATION,
            message: this.error,
            showClose: true,
            type: 'error'
          })
        } finally {
          this.loading = false
        }
      }).catch(() => {})
    },

    async getFile (fileType) {
      await this.fetchBrandingFile(fileType)
    },

    getImageUrl (image) {
      if (image && image === this.CONSTANTS.LOGOS.IMAGE) {
        return require(`../../assets/sample-${image}.jpg`)
      } else if (image && (image === this.CONSTANTS.LOGOS.LOGO || image === this.CONSTANTS.LOGOS.APP_LOGO || image === this.CONSTANTS.LOGOS.APP_LOGO_DARK || image === this.CONSTANTS.LOGOS.WATERMARK)) {
        return require(`../../assets/sample-${image}.png`)
      }
    },

    onBeforeUpload () {
      this.uploading = true
      this.loading = true
      this.logo = ''
    },

    onFileUploadError (err) {
      console.error('error uploading file', err)
      this.uploading = false
    },

    async onFileUploaded () {
      try {
        await this.getFile(this.fileType)
        this.logo = this.uploadResponse.url
        this.customImage = true

        if (this.fileType === this.CONSTANTS.LOGOS.IMAGE) {
          this.brandingImageCustomImage = true
        }

        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: `${this.fileType} updated.`,
          showClose: true,
          type: 'success'
        })
      } catch (err) {
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: this.error,
          showClose: true,
          type: 'error'
        })
      } finally {
        this.loading = false
        this.uploading = false
      }
    }
  }
}
</script>

<style lang="less">
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.admin-page {
  .content {
    &.content-branding {
      .el-upload {
        .size(200px, 200px);

        .el-upload-dragger {
          .size(200px, 200px);
          overflow: hidden;
          position: relative;
          z-index: auto;
        }
      }
    }
  }
}
</style>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.admin-page {
  .content {
    &.content-branding {
      .upload-file {
        .flex-container();
        .align-items-start();
        margin-bottom: 40px;

        &.image {
          .image {
            img {
              object-fit: fill;
            }

            span {
              .abs-pos(auto, auto, 46%, 0);
              color: @color-light-shadow;
              display: block;
              font-size: 16px;
              transform: rotate(45deg);
            }
          }
        }

        .image {
          .size(200px, 200px);
          .flex(1, 0, 200px);
          background-image: linear-gradient(45deg, @color-tone-lighter 25%, transparent 25%, transparent 75%, @color-tone-lighter 75%, @color-tone-lighter 100%),linear-gradient(45deg, @color-tone-lighter 25%, @color-base 25%, @color-base 75%, @color-tone-lighter 75%, @color-tone-lighter 100%);
          background-position: 0px 0px, 10px 10px;
          background-size: 20px 20px;
          border: 1px solid @box-border-grey;
          margin-right: 20px;
          max-width: 200px;
          position: relative;

          img {
            .size(100%, 100%);
            object-fit: contain;
          }

          span {
            display: none;
          }
        }

        .instructions {
          .flex-container-column();
          .justify-content-space-between();
          height: 200px;
          margin-right: 15px;

          .text {
            ul {
              list-style-position: inside;
              margin: 0;
              padding: 0;

              li {
                font-size: 13px;
              }
            }

            p {
              margin-top: 0;
            }
          }

          .action {
            span {
              font-size: 12px;
              font-weight: bold;
            }

            i {
              margin-right: 5px;
            }

            &:hover {
              color: @color-alert;
              cursor: pointer;
            }
          }
        }

        .upload {
          .flex-container-center();
          .align-items-center();
          .flex(1, 0, 200px);
          .size(200px, 200px);
          background: @color-tone-light;
          border-radius: 0;
          max-width: 200px;
          overflow: hidden;
          position: relative;

          i {
            color: @text-dark;
            cursor: pointer;
            font-size: 24px;

            &:hover {
              color: @color-accent;
            }

            &:first-child {
              margin-right: 0;
            }
          }
        }
      }
    }
  }
}
</style>
