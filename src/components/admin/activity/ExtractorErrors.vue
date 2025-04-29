<template>
  <div class="error-type-information">
    <p class="error-type-name">{{ extractorError }}</p>
    <p class="error-files" @click="viewErroredFiles(extractorErrorHash)">
      <el-tooltip
        :content="`View errors files for ${extractorDisplayName}`"
        effect="dark"
        placement="top">
        <i class="far fa-eye"></i>
      </el-tooltip>
      <span>
        {{ numFilesAffected }} file<template v-if="numFilesAffected !== 1">s</template>
      </span>
    </p>

    <el-dialog
      :title="extractorDisplayName"
      :visible.sync="dialogListOfFilesVisible"
      custom-class="extractor-errors-dialog"
      width="50%"
    >
      <div
        v-if="listOfErroredFiles"
        v-loading="listOfErroredFilesBusy"
        class="extractor-errors"
      >
        <div class="error-information">
          <el-collapse v-model="errorCollapse">
            <el-collapse-item :title="extractorError" name="1"></el-collapse-item>
          </el-collapse>

          <p>
            <i class="far fa-exclamation-triangle"></i>
            <span class="error">{{ numFilesAffected }} file<template v-if="numFilesAffected !== 1">s</template> with this error type</span>
          </p>
        </div>

        <div v-if="listOfErroredFiles.length" class="files-information">
          <ol v-infinite-scroll="loadErroredNextPage" infinite-scroll-delay="200" ref="list-of-files">
            <li v-for="(file, index) in listOfErroredFiles" :key="index">
            <el-tooltip
              content="Opens file in new window/tab."
              placement="top"
              :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
            >
             <router-link :to="{ name: 'itemDetails', params: { id: file.itemId }}" target="_blank"><i class="far fa-external-link"></i></router-link></el-tooltip> {{ file.path }}
            </li>
          </ol>

          <div class="footer">
            <div class="download-button">
              <download-csv
                :data="listOfErroredFiles"
                :labels="downloadListLabels"
                delimiter="|"
                name="Curio-Errored-Files-List.csv"
              >
                <el-button type="primary">Download File List</el-button>
              </download-csv>
            </div>

            <!-- <div class="pagination">
              <el-button
                @click="paginatePrevious()"
                size="mini"
                v-if="hasPreviousErrorHash"
              >
                <i class="el-icon-arrow-left"></i>
                {{ previousPageFiles }}
              </el-button>
              <el-button
                @click="paginateNext()"
                size="mini"
                v-if="hasNextErrorHash"
              >
                {{ nextPageFiles }}
                <i class="el-icon-arrow-right"></i>
              </el-button>
            </div> -->
          </div>
        </div>
        <p v-else class="no-results">No files listed.</p>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import _ from 'lodash'
import DownloadCsv from 'vue-json-csv'
import { getAPIErrorMsg } from 'src/apiHelpers'

import { mapGetters, mapActions } from 'vuex'
import {ACTIVITY_ERROR_FILES} from 'src/store/storeModules'
import {
  GET_LIST_OF_ERRORED_FILES,
  GET_LIST_OF_ERRORED_FILES_BUSY
} from 'src/store/modules/admin/activity/getters'
import {
  ERROR_FILES_HAS_NEXT_PAGE,
  ERROR_FILES_HAS_PREVIOUS_PAGE,
  GET_ACTIVITY_ERROR_HASH_PAGE,
  GET_NEXT_ACTIVITY_ERROR_HASH_PAGE,
  GET_PREV_ACTIVITY_ERROR_HASH_PAGE,
  HAS_NEXT_ERROR,
  HAS_PREVIOUS_ERROR
} from 'src/store/modules/admin/activity/erroredFiles/getters'
import {
  PREVIOUS_ACTIVITY_ERROR_HASH_PAGE_NO,
  FETCH_LIST_OF_ERRORED_FILES,
  NEXT_ACTIVITY_ERROR_HASH_PAGE_NO
} from 'src/store/modules/admin/activity/erroredFiles/actions'

export default {
  name: 'extractor-errors',

  components: {
    DownloadCsv
  },

  props: {
    extractorDisplayName: {
      type: String,
      required: true
    },
    extractorName: {
      type: String,
      required: true
    },
    extractorError: {
      type: String,
      default: ''
    },
    extractorErrorHash: {
      type: String,
      required: true
    },
    numFilesAffected: {
      type: Number,
      default: 0
    },
    requestId: {
      type: String,
      required: true
    }
  },

  data () {
    return {
      errorCollapse: [],
      dialogListOfFilesVisible: false,
      downloadList: {},
      downloadListLabels: {
        jobId: 'Job Request ID',
        extractorImpacted: 'Extractor Impacted',
        errorMessage: 'Error Message',
        itemId: 'Item ID',
        path: 'Item Path'
      }
    }
  },

  computed: {
    ...mapGetters(ACTIVITY_ERROR_FILES, {
      listOfErroredFiles: GET_LIST_OF_ERRORED_FILES,
      listOfErroredFilesBusy: GET_LIST_OF_ERRORED_FILES_BUSY,
      hasNextPage: ERROR_FILES_HAS_NEXT_PAGE,
      hasPreviousPage: ERROR_FILES_HAS_PREVIOUS_PAGE,
      extractorErrorHashPage: GET_ACTIVITY_ERROR_HASH_PAGE,
      nextExtractorErrorHashPage: GET_NEXT_ACTIVITY_ERROR_HASH_PAGE,
      previousExtractorErrorHashPage: GET_PREV_ACTIVITY_ERROR_HASH_PAGE,
      hasNextError: HAS_NEXT_ERROR,
      hasPreviousError: HAS_PREVIOUS_ERROR,
      currentExtractorError: GET_ACTIVITY_ERROR_HASH_PAGE
    }),

    nextPageFiles () {
      const numberOfFiles = _.get(this.nextExtractorErrorHashPage, `num_files`, 0) || 0
      const fileString = numberOfFiles > 1 ? 'Files' : 'File'

      return `Next Error (${numberOfFiles} ${fileString})`
    },

    previousPageFiles () {
      const numberOfFiles = _.get(this.previousExtractorErrorHashPage, `num_files`, 0) || 0
      const fileString = numberOfFiles > 1 ? 'Files' : 'File'

      return `Previous Error (${numberOfFiles} ${fileString})`
    }
  },

  methods: {
    ...mapActions(ACTIVITY_ERROR_FILES, {
      loadlistOfErroredFiles: FETCH_LIST_OF_ERRORED_FILES,
      nextErrorHashPage: NEXT_ACTIVITY_ERROR_HASH_PAGE_NO,
      prevErrorHashPage: PREVIOUS_ACTIVITY_ERROR_HASH_PAGE_NO
    }),

    closeDialog () {
      this.dialogListOfFilesVisible = false
    },

    loadErroredNextPage () {
      if (this.hasNextPage) {
        this.viewErroredFiles(this.currentExtractorError.error_hash, true)
      }
    },

    paginateNext () {
      this.nextErrorHashPage()
      this.viewErroredFiles(this.currentExtractorError.error_hash)
    },

    paginatePrevious () {
      this.prevErrorHashPage()
      this.viewErroredFiles(this.currentExtractorError.error_hash)
    },

    async viewErroredFiles (errorHash, nextPage = false) {
      try {
        await this.loadlistOfErroredFiles({
          requestId: this.requestId,
          extractorName: this.extractorName,
          errorMD5: errorHash,
          nextPage
        })

        this.dialogListOfFilesVisible = true
      } catch (err) {
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: getAPIErrorMsg(err),
          showClose: true,
          type: 'error'
        })
      }
    }
  }
}
</script>

<style lang="less">
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.admin-page.admin-page {
  .el-dialog__wrapper {
    .el-dialog.extractor-errors-dialog {
      .abs-pos(auto, 0, auto, auto);
      margin: 0 !important;
      height: 100vh;

      .el-dialog__header {
        background: @color-tone-light;
        padding: 23px 23px 12px;

        .el-dialog__headerbtn {
          .el-icon {
            color: @color-tone-darkest;
            font-size: 22px;
          }
        }

        .el-dialog__title {
          color: @color-tone-darkest;
          font-size: 17px;
          font-weight: 500;
          letter-spacing: normal;
          line-height: 1.18;
          padding: 0;
          text-transform: capitalize;
        }
      }

      .el-dialog__body {
        background: @color-tone-light;
        height: calc(~'100vh - 55px'); // dialog height of header
        padding: 0;

        .extractor-errors {
          .error-information {
            border-bottom: 1px solid @box-border-grey;
            padding: 0 23px 23px;
          }

          .files-information {
            .flex-container-column();
            .justify-content-space-between();
            background: @color-base;
            border-bottom: 1px solid @box-border-grey;
            min-height: calc(~'100vh - 121.5px'); // dialog height of header plus error information
            padding: 12.5px 0 0;

            ol {
              list-style-position: inside;
              margin: 0;
              padding: 0 23px 19.5px;
              width: 100%;
            }

            .footer {
              width: 100%;

              .download-button {
                margin: 0 23px 18.5px;
              }

              .pagination {
                .flex-container-between();
                background: @background-grey;
                border-top: 1px solid @box-border-grey;
                margin-bottom: 0;
                padding: 16.5px 18px 16px 23px;
              }
            }
          }
        }

        p.no-results {
          font-size: 12px;
          margin-left: 23px;
        }
      }
    }
  }

  .el-collapse {
    border: 0 none;

    .el-collapse-item__header {
      .size(99%, auto);
      background: transparent;
      border: 0 none;
      color: @color-primary;
      display: inline-block;
      font-size: 13px;
      font-style: italic;
      font-weight: 500;
      line-height: 1.33;
      min-height: 17px;
      overflow: hidden;
      padding: 0;
      text-overflow: ellipsis;
      white-space: nowrap;

      &.is-active {
        height: auto;
        overflow: auto;
        text-overflow: unset;
        white-space: normal;
      }
    }

    .el-collapse-item__wrap {
      background: transparent;
      border: 0 none;

      .el-collapse-item__content {
        overflow: hidden;
        padding: 0;
      }
    }

    .el-collapse-item__arrow {
      color: @color-tone-darker;
      font-size: 17px;
      line-height: 11px;
      margin-left: 15px;
      margin-top: 2px;
    }
  }

  .el-button {
    font-weight: normal;
  }
}
</style>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.admin-page {
  .content {
    &.content-activity {
      .error-type-information {
        .error-files,
        .error-type-name {
          color: @color-primary;
          flex: 1 auto;
          font-size: 12px;
          font-style: italic;
          font-weight: 500;
          line-height: 2.5;
          margin: 0;
          padding-right: 20px;
          width: 80%;
        }

        .error-files {
          width: 20%;

          i {
            color: @color-tone-darkest;

            &:first-child {
              margin-right: 5px;
            }

          }

          span {
            font-style: normal;
          }

          &:hover {
            color: @color-accent;
            cursor: pointer;

            i {
              color: @color-accent;
            }
          }
        }
      }

      .error-information {
        p {
          color: @color-alert;
          font: 900 10px @default-font-family-black;
          letter-spacing: 0.8px;
          line-height: 1.1;
          margin: 12px 0 0;
          padding: 0;
          text-transform: uppercase;
        }
      }

      .fa-external-link {
        color: @color-tone-darkest;

         &:hover {
            color: @color-accent;
         }
      }

      ol {
        list-style-position: inside;
        margin: 20px;
        padding: 0;

        li {
          font-size: 12px;
          letter-spacing: normal;
          line-height: 2.17;
        }
      }
    }
  }
}
</style>
