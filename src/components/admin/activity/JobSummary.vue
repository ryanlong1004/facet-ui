<template>
  <div class="job-summary" v-loading="jobBusy">
    <template v-if="!resourceNotFound">
      <div class="header">
        <h2>
          <router-link :to="{ name: 'admin-activity' }"><i class="fal fa-angle-left"></i></router-link>
          <span>Job ID #{{ jobId }}</span>
        </h2>

        <div class="progress-status" :class="{'inactive': job.progress === CONSTANTS.ACTIVITY.JOB_PROGRESS.COMPLETED || job.progress === CONSTANTS.ACTIVITY.JOB_PROGRESS.CANCELED }">
          <progress-indicator-bar :percentage="job.percentage" :strokeWidth="10"></progress-indicator-bar>

          <div class="job-progress">
            <span v-if="job.progress === CONSTANTS.ACTIVITY.JOB_PROGRESS.CANCELED" class="cancelled-job">Canceled</span>
            <span
              v-else-if="job.progress === CONSTANTS.ACTIVITY.JOB_PROGRESS.COMPLETED"
              class="completed-job"
              :class="{ 'completed-with-errors': job.num_errors }"
            >100% Complete</span>
            <span v-else-if="job.progress === CONSTANTS.ACTIVITY.JOB_PROGRESS.PENDING">Pending</span>
            <span v-else class="progress-percentage">{{ job.percentage }}% In-Progress</span>

            <template v-if="(job.progress === CONSTANTS.ACTIVITY.JOB_PROGRESS.PENDING) || (job.progress === CONSTANTS.ACTIVITY.JOB_PROGRESS.INPROGRESS)">
              <el-popover
                placement="top"
                width="290"
                v-model="job.popover">
                <p>Are you sure to cancel {{ job.job_type }} ({{ jobId }})?</p>
                <div class="popover-footer">
                  <el-button
                    size="mini"
                    type="text"
                    @click="job.popover = false"
                  >
                    Cancel
                  </el-button>
                  <el-button
                    type="primary"
                    size="mini"
                    @click="doCancelInProgressAnalyze(job)"
                  >
                    Confirm
                  </el-button>
                </div>
                <span slot="reference" class="cancel-job">
                  <el-tooltip
                    :content="`Cancel job: ${jobId}`"
                    effect="dark"
                    placement="top">
                    <i class="far fa-times"></i>
                  </el-tooltip>
                </span>
              </el-popover>
            </template>
          </div>
        </div>
      </div>

      <table class="job-summary-table">
        <thead>
          <tr>
            <th class="created">
              <div class="cell">Start Date</div>
            </th>
            <th class="job_type">
              <div class="cell">Job Type</div>
            </th>
            <th class="username">
              <div class="cell">User</div>
            </th>
            <th class="container_id">
              <div class="cell">Container</div>
            </th>
            <th class="total_files">
              <div class="cell">Total Files</div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="created">
              <div class="cell">
                <el-popover
                  placement="top"
                  trigger="hover"
                  :content="`Last Updated: ${job.updated}`">
                  <span slot="reference">{{ job.created }}</span>
                </el-popover>
              </div>
            </td>
            <td class="job_type">
              <div class="cell">
                <p>{{ job.job_type }}</p>
              </div>
            </td>
            <td class="username">
              <div class="cell">{{ job.username }}</div>
            </td>
            <td class="container_id">
              <div class="cell">{{ job.container_name }}</div>
            </td>
            <td class="total_files">
              <div class="cell">{{ job.walked_count }}</div>
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Extractors ran</h2>
      <template v-if="job.extractors && job.extractors.length > 0">
        <div class="extractors">
          <p>Extractor Name</p>
          <p>Total Errors</p>
        </div>
        <ul class="current-job-errors" v-loading="jobBusy">
          <template v-for="extractor in job.extractors">
            <li :key="extractor.name" :class="{ errors: extractor.num_errors }">
              <div class="extractor-information" @click="toggleExtractor(extractor)">
                <div v-if="extractor.num_errors && extractor.num_errors > 0" class="collapse-expand">
                  <i v-if="expandedExtractorName === extractor.name" class="fal fa-angle-down"></i>
                  <i v-else class="fal fa-angle-right"></i>
                </div>

                <div class="extractor-name">
                  <span>{{ extractor.display_name }}</span>
                </div>
                <div class="extractor-total-errors">
                  <span class="extractor-error-status">
                    <template v-if="extractor.num_errors && extractor.num_errors > 0">
                      <i class="far fa-exclamation-triangle"></i>
                      <span class="error">{{ extractor.num_errors }}</span>
                    </template>
                    <template v-else>
                      <i class="far fa-check-circle"></i>
                      <span class="success">None</span>
                    </template>
                  </span>
                </div>
              </div>

              <template v-if="extractor.num_errors && extractor.num_errors > 0">
                <div class="extractor-error-types" v-show="expandedExtractorName === extractor.name">
                  <div class="types">
                    <p>Error Type</p>
                    <p>Total Files Affected</p>
                  </div>
                  <ul class="error-types" v-loading="extractorErrorsBusy">
                    <template v-for="error in extractorErrors">
                      <li :key="error.error_hash">
                        <extractor-errors
                          :extractor-display-name="extractor.display_name"
                          :extractor-name="extractor.name"
                          :extractor-error="error.error"
                          :extractor-error-hash="error.error_hash"
                          :num-files-affected="error.num_files"
                          :requestId="jobId"
                        ></extractor-errors>
                      </li>
                    </template>
                  </ul>
                </div>
              </template>
            </li>
          </template>
        </ul>
      </template>
      <p v-else class="no-results">No extractors for <strong>Job ID #{{ jobId }}</strong> ran.</p>
    </template>
    <template v-else>
      <div class="header">
        <h2>
          <router-link :to="{ name: 'admin-activity' }"><i class="fal fa-angle-left"></i></router-link>
          <span class="error">The Request ID provided has not been found.</span>
        </h2>
      </div>

      <not-found></not-found>
    </template>
  </div>
</template>

<script>
import _ from 'lodash'
import httpStatusCodes from 'http-status-codes'

import {
  mapActions,
  mapGetters,
  mapMutations
} from 'vuex'
import { RESET_ADMIN_STORE } from 'src/store/store-helpers'
import { ACTIVITY } from 'src/store/storeModules'
import {
  GET_ACTIVITY_JOB_BUSY,
  GET_ACTIVITY_ERROR,
  GET_ACTIVITY_JOB,
  GET_EXTRACTOR_ERRORS_BUSY,
  GET_EXTRACTOR_ERRORS,
  GET_EXPANDED_EXTRACTOR_NAME, GET_REFRESH_JOBS
} from 'src/store/modules/admin/activity/getters'
import {
  CANCEL_IN_PROGRESS_ANALYZE,
  FETCH_JOB,
  REFRESH_VISIBLE_JOBS,
  TOGGLE_EXTRACTOR
} from 'src/store/modules/admin/activity/actions'

import ExtractorErrors from 'src/components/admin/activity/ExtractorErrors.vue'
import NotFound from 'src/components/404/NotFound.vue'
import ProgressIndicatorBar from 'src/components/global/ProgressIndicatorBar.vue'
import {getAPIErrorMsg} from 'src/apiHelpers'

export default {
  name: 'job-summary',

  components: {
    ExtractorErrors,
    NotFound,
    ProgressIndicatorBar
  },

  data () {
    return {
      jobsRefreshInterval: null,
      resourceNotFound: false
    }
  },

  computed: {
    ...mapGetters(ACTIVITY, {
      error: GET_ACTIVITY_ERROR,
      job: GET_ACTIVITY_JOB,
      jobBusy: GET_ACTIVITY_JOB_BUSY,
      extractorErrorsBusy: GET_EXTRACTOR_ERRORS_BUSY,
      extractorErrors: GET_EXTRACTOR_ERRORS,
      expandedExtractorName: GET_EXPANDED_EXTRACTOR_NAME,
      refreshJobs: GET_REFRESH_JOBS
    }),

    jobId () {
      return this.$route.params.id
    }
  },

  async mounted () {
    await this.getJob(this.jobId)

    this.$watch('refreshJobs', (oldVal, newVal) => {
      if (newVal) {
        this.startJobsRefresh()
      }
      else {
        this.stopJobsRefresh()
      }
    })
  },

  beforeDestroy () {
    this.stopJobsRefresh()
    this.$store.commit(`${ACTIVITY}/${RESET_ADMIN_STORE}`)
  },

  methods: {
    ...mapActions(ACTIVITY, {
      cancelInProgressAnalyze: CANCEL_IN_PROGRESS_ANALYZE,
      loadJob: FETCH_JOB,
      toggleExtractor: TOGGLE_EXTRACTOR,
      refreshVisibleJobs: REFRESH_VISIBLE_JOBS
    }),

    async doCancelInProgressAnalyze (job) {
      try {
        await this.cancelInProgressAnalyze({ requestId: this.jobId })
        job.popover = false
        job.cancelled = true
        job.progress = this.CONSTANTS.ACTIVITY.JOB_PROGRESS.CANCELED
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: `${this.jobId} has been canceled.`,
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
      }
    },

    async getJob () {
      try {
        await this.loadJob(this.jobId)
        if (this.job) {
          const inactiveJob = (_.get(this.job, 'cancelled', '')) || (_.get(this.job, 'completed', ''))
          if (!inactiveJob) {
            this.startJobsRefresh()
          }
        }
      } catch (err) {
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: this.error,
          showClose: true,
          type: 'error'
        })
      }
    },

    startJobsRefresh () {
      if (!this.jobsRefreshInterval && this.refreshJobs) {
        this.jobsRefreshInterval = setInterval(() => {
          this.refreshVisibleJobs({
            requestId: this.jobId,
            userId: '',
            type: '',
            all: ''
          })
        }, this.CONSTANTS.ACTIVITY.REFRESH_INTERVAL)
      }
    },

    stopJobsRefresh () {
      if (this.jobsRefreshInterval) {
        clearInterval(this.jobsRefreshInterval)
        this.jobsRefreshInterval = null
      }
    },

    async toggleExtractor (extractor) {
      try {
        await this.$store.dispatch(`${ACTIVITY}/${TOGGLE_EXTRACTOR}`, { extractor, jobId: this.jobId })
      }
      catch (err) {
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: getAPIErrorMsg(err),
          showClose: true,
          type: 'error'
        })
        console.error(err)
      }
    }
  }
}
</script>

<style lang="less">
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.admin-page.admin-page {
  .content {
    &.content-activity {
      .job-summary {
        .el-progress {
          width: 137px;

          .el-progress-bar__outer,
          .el-progress-bar__inner {
            border-radius: 0;
          }

          .el-progress-bar__outer {
            border: 1px solid @box-border-grey;
            padding: 2px;
          }

          .el-progress-bar__inner {
            height: 65%;
            left: 2px;
            top: 2px;
          }
        }

        .inactive {
          .el-progress {
            display: none;
          }
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
    &.content-activity {
      .job-summary {
        margin-top: 5px;

        .header {
          i {
            &:hover {
              color: @color-accent;
            }
          }

          .progress-status {
            .flex-box();
            font-size: 12px;
            font-weight: 500;
            line-height: 1.17;
            margin-left: auto;
            text-transform: uppercase;

            > div {
              .flex-box();
              .align-items-center();
            }

            .job-progress {
              .flex-container-between();
              position: relative;
              margin-left: 6.4px;

              .progress-percentage {
                display: inline-block;
                margin-right: 10px;
              }

              .completed-job {
                color: @color-accent;
              }

              .completed-with-errors,
              .cancelled-job {
                color: @color-alert;
              }

              > span {
                display: inline-block;
                margin-right: 5px;
              }

              .cancel-job {
                margin-left: auto;

                &:hover {
                  cursor: pointer;
                }
              }

              + div {
                .abs-pos(auto, auto, 0, auto);
                width: 100px;
              }
            }
          }
        }

        .job-summary-table {
          + h2 {
            font-size: 15px;
            margin-top: 10px;
          }
        }

        .extractors,
        .types {
          .flex-container-between();
          background-color: @background-grey;
          line-height: 1.1;
          margin-top: 14.4px;
          padding: 6px 13px;

          p {
            color: @color-primary;
            font-size: 10px;
            font-weight: 900;
            letter-spacing: 0.8px;
            line-height: 1.1;
            margin: 0;
            padding: 0;
            text-align: left;
            text-transform: uppercase;

            &:last-of-type {
              width: 80px;
            }
          }
        }

        .current-job-errors {
          list-style: none;
          margin: 0 0 20px;
          padding: 0;

          li {
            border-bottom: 1px solid @box-border-grey;
            padding: 0;

            i {
              &:first-child {
                margin-right: 2px;
              }
            }

            &.errors {
              .extractor-information {
                color: @color-alert;
                padding-left: 13px;

                .extractor-name {
                  margin-left: 4px;

                  .error {
                    color: @color-alert;
                  }
                }

                &:hover {
                  cursor: pointer;
                }
              }
            }
          }

          .extractor-information {
            .flex-container();
            .align-items-center();
            font-size: 12px;
            line-height: 1.17;
            padding: 0 13px 0 30px;

            .extractor-name {
              text-transform: capitalize;
            }

            .collapse-expand {
              i {
                font-size: 22px;
                width: 11px;
              }
            }

            .extractor-total-errors {
              margin-left: auto;
              width: 80px;

              .extractor-error-status {
                display: inline-block;
                font-size: 10px;
                font-weight: 900;
                letter-spacing: 0.8px;
                line-height: 1.1;
                margin: 8.4px 0;
                text-transform: uppercase;

                .error,
                .fa-exclamation-triangle {
                  color: @color-alert;
                }

                .success,
                .fa-check-circle {
                  color: @color-accent;
                }
              }
            }
          }

          .extractor-error-types {
            background: @background-grey;
            border-top: 1px solid @box-border-grey;
            margin: 0;

            .types {
              .flex-container();
              border-bottom: 1px solid @box-border-grey;
              margin: 0;
              padding-bottom: 10px;
              padding-top: 10px;

              p {
                color: @color-tone-darkest;
                flex: 1 auto;
                width: 80%;

                &:first-of-type {
                  padding-left: 5px;
                }

                &:last-of-type {
                  padding-left: 8px;
                  width: 20%;
                }
              }
            }

            .error-types {
              list-style: none;
              margin: 0;
              max-height: 300px;
              overflow-y: auto;
              padding: 0;

              li {
                border-bottom: 1px solid @box-border-grey;

                &:last-of-type {
                  border: 0 none;
                }

                .error-type-information {
                  .flex-container();
                  .align-items-start();
                  padding: 0 13px 0 30px;

                  .error-files,
                  .error-type-name {
                    color: @color-primary;
                    flex: 1 auto;
                    font-size: 12px;
                    font-weight: 500;
                    font-style: italic;
                    line-height: 2.5;
                    margin: 0;
                  }

                  .error-files {
                    i {
                      color: @color-tone-darkest;

                      &:first-child {
                        margin-right: 5px;
                      }
                    }

                    span {
                      font-style: normal;
                    }
                  }
                }
              }
            }
          }
        }

        p.no-results {
          font-size: 12px;
        }
      }
    }
  }
}
</style>
