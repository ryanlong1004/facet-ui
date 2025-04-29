<template>
  <div>
    <div class="header">
      <h2>Job History</h2>

      <div class="search-options">
        <div class="job-type-input-wrapper">
          <el-select
            v-model="jobType"
            placeholder="Job Type..."
            popper-class="job-type-dropdown"
            @change="jobSearch"
            @keyup.enter.native="jobSearch"
          >
            <el-option
              v-for="type in CONSTANTS.ACTIVITY.JOB_TYPE"
              :key="type.id"
              :label="type.label"
              :value="type.id">
            </el-option>
          </el-select>
        </div>

        <template v-if="allUsers">
          <div class="user-id-input-wrapper">
            <el-select
              v-model="userId"
              filterable
              placeholder="User..."
              popper-class="user-id-search-dropdown"
              @change="jobSearch"
              @keyup.enter.native="jobSearch"
            >
              <el-option
                v-for="user in allUsers"
                :key="user.id"
                :label="`${user.first_name} ${user.last_name}`"
                :value="user.id">
              </el-option>
            </el-select>
          </div>
        </template>

        <div class="divider-text">OR</div>

        <div class="request-id-input-wrapper">
          <!-- NOTE: Displayed jobs is a computed property, when the user start making changes, the data changes,
          but this is not intended as a filter, so added input/blur/change to help with that. Open to other solutions at a future time -->
          <input
            @keyup.enter="requestIdSearch"
            @keyup.esc="clearSearchFields"
            @input="clearJobStatusUserIdData"
            @change="requestIdSearchActivated = true"
            @blur="requestIdSearchActivated = false"
            class="request-id__input el-input__inner"
            placeholder="Search jobs by ID"
            type="text"
            v-model="requestId"
          >
          <i v-if="requestId !== ''" class="far fa-times" @click="clearSearchFields"></i>
          <i
            v-else
            class="far fa-search"
            @click="requestIdSearch"
          ></i>
        </div>
      </div>
    </div>

    <table class="job-history-table">
      <thead>
        <tr>
          <th
            class="request_id is-sortable"
            :class="sortTableOrder"
            @click="sortJobs"
          >
            <div class="cell">
              Request ID
              <span class="caret-wrapper">
                <i class="sort-caret ascending"></i>
                <i class="sort-caret descending"></i>
              </span>
            </div>
          </th>
          <th class="created">
            <div class="cell">Start Date</div>
          </th>
          <th class="job_type">
            <div class="cell">Job Type</div>
          </th>
          <th class="username">
            <div class="cell">User</div>
          </th>
          <th class="progress">
            <div class="cell">Progress</div>
          </th>
          <th class="errors">
            <div class="cell">Errors</div>
          </th>
          <th class="total_files">
            <div class="cell">Total Files</div>
          </th>
          <th class="job_summary">
            <div class="cell"></div>
          </th>
        </tr>
      </thead>
      <tbody v-loading="isBusy" v-if="displayedJobs">
        <tr v-for="job in displayedJobs" :key="job.request_id">
          <td class="request_id">
            <div class="cell">{{ job.request_id }}</div>
          </td>
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
          <td class="progress">
            <div class="cell">
              <div class="job-progress" :class="{'inactive': job.progress === CONSTANTS.ACTIVITY.JOB_PROGRESS.COMPLETED || job.progress === CONSTANTS.ACTIVITY.JOB_PROGRESS.CANCELED }">
                <template v-if="job.progress !== CONSTANTS.ACTIVITY.JOB_PROGRESS.CANCELED">
                  <span class="progress-percentage">
                    <span
                      v-if="job.progress === CONSTANTS.ACTIVITY.JOB_PROGRESS.COMPLETED"
                      class="completed-job"
                      :class="{ 'completed-with-errors': job.error_count > 0 }"
                    >Completed</span>
                    <span v-else-if="job.progress === CONSTANTS.ACTIVITY.JOB_PROGRESS.PENDING">Pending</span>
                    <template v-else>{{ job.percentage }}%</template>
                  </span>
                  <el-popover
                    placement="top"
                    width="290"
                    v-if="job.progress !== CONSTANTS.ACTIVITY.JOB_PROGRESS.COMPLETED"
                    v-model="job.popover">
                    <p>Are you sure to cancel {{ job.job_type }} ({{ job.request_id }})?</p>
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
                        :content="`Cancel job: ${job.request_id}`"
                        effect="dark"
                        placement="top">
                        <i class="far fa-times"></i>
                      </el-tooltip>
                    </span>
                  </el-popover>
                </template>
                <span v-else class="cancelled-job">Cancelled</span>
              </div>
              <progress-indicator-bar :percentage="job.percentage"></progress-indicator-bar>
            </div>
          </td>
          <td class="errors">
            <div class="cell">
              <span class="extractor-error-status">
                <template v-if="job.error_count > 0">
                  <i class="far fa-exclamation-triangle"></i>
                </template>
                <template v-else>
                  <i class="far fa-check-circle"></i>
                </template>
                {{ job.error_count }}
              </span>
            </div>
          </td>
          <td class="total_files">
            <div class="cell">{{ job.walked_count }}</div>
          </td>
          <td class="job_summary">
            <div class="cell">
              <router-link
                v-if="job.job_type === CONSTANTS.ACTIVITY.JOB_STATUS.ANALYZING"
                :to="{ name: 'job-summary', params: { id: job.request_id } }"
              >
                <el-tooltip
                  :content="`View job summary for ${job.request_id}`"
                  effect="dark"
                  placement="top">
                  <i class="far fa-ballot-check"></i>
                </el-tooltip>
              </router-link>
            </div>
          </td>
        </tr>
      </tbody>
      <tbody v-if="showErrorMessage">
        <tr>
          <td colspan="8">
            <p class="no-results">No {{ jobStatusName }} found<template v-if="userId"> by {{ username }}</template> <template v-if="requestId"> with Request Id: {{ requestId }}</template>.</p>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="pagination" v-if="showPagination">
      <el-button
        @click="previousPage()"
        icon="el-icon-arrow-left"
        size="mini"
        type="primary"
        v-if="hasPreviousPage && !busy"
      >
        {{ CONSTANTS.PAGINATION.PREVIOUS_PAGE }}
      </el-button>
      <el-button
        @click="nextPage()"
        size="mini"
        type="primary"
        v-if="hasNextPage && !busy"
      >
        {{ CONSTANTS.PAGINATION.NEXT_PAGE }}
        <i class="el-icon-arrow-right"></i>
      </el-button>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import {
  mapActions,
  mapGetters,
  mapMutations
} from 'vuex'
import { RESET_ADMIN_STORE } from 'src/store/store-helpers'
import {ACTIVITY, USERS} from 'src/store/storeModules'

import {
  CANCEL_IN_PROGRESS_ANALYZE,
  FETCH_JOB,
  FETCH_JOBS,
  FETCH_NEXT_PAGE,
  FETCH_PREVIOUS_PAGE,
  REFRESH_VISIBLE_JOBS
} from 'src/store/modules/admin/activity/actions'
import { GET_USERS, FETCH_USERS } from 'src/store/modules/admin/users'
import ProgressIndicatorBar from 'src/components/global/ProgressIndicatorBar.vue'
import {
  GET_ACTIVITY_BUSY,
  GET_ACTIVITY_ERROR,
  GET_ACTIVITY_JOB,
  GET_ACTIVITY_JOB_BUSY,
  GET_ACTIVITY_JOBS, GET_REFRESH_JOBS,
  HAS_NEXT_PAGE,
  HAS_PREVIOUS_PAGE
} from 'src/store/modules/admin/activity/getters'
import {getAPIErrorMsg} from 'src/apiHelpers'

export default {
  name: 'job-history',

  components: {
    ProgressIndicatorBar
  },

  data () {
    return {
      jobsRefreshInterval: null,
      jobType: '',
      requestId: '',
      requestIdSearchActivated: false,
      searchExecuted: false,
      sortTableOrder: 'descending',
      startJobsRefreshTimeout: null,
      userId: ''
    }
  },

  computed: {
    ...mapGetters(ACTIVITY, {
      busy: GET_ACTIVITY_BUSY,
      error: GET_ACTIVITY_ERROR,
      job: GET_ACTIVITY_JOB,
      jobBusy: GET_ACTIVITY_JOB_BUSY,
      jobs: GET_ACTIVITY_JOBS,
      hasNextPage: HAS_NEXT_PAGE,
      hasPreviousPage: HAS_PREVIOUS_PAGE,
      refreshJobs: GET_REFRESH_JOBS
    }),

    ...mapGetters(USERS, {
      users: GET_USERS
    }),

    allUsers () {
      const systemBasedUsers = [
        {
          'id': '',
          'first_name': 'All',
          'last_name': 'Users'
        },
        {
          'id': 'internal',
          'first_name': this.CONSTANTS.ACTIVITY.INTERNAL,
          'last_name': ''
        }
      ]
      return [...systemBasedUsers, ...this.users]
    },

    displayedJobs () {
      return (this.searchExecuted && this.requestId && !this.isBusy) ? [this.job] : this.jobs
    },

    ignoredJobStatuses () {
      return (this.jobType === this.CONSTANTS.ACTIVITY.JOB_PROGRESS.INCOMPLETE) || (this.jobType === this.CONSTANTS.ACTIVITY.JOB_PROGRESS.ALL)
    },

    isBusy () {
      return this.busy || this.jobBusy
    },

    jobStatusName () {
      const type = this.CONSTANTS.ACTIVITY.JOB_TYPE.find(type => type.id === this.jobType)
      return _.get(type, 'label', 'jobs')
    },

    showCompletedJobs () {
      return this.jobType === this.CONSTANTS.ACTIVITY.JOB_PROGRESS.INCOMPLETE ? false : true
    },

    showErrorMessage () {
      return (!this.isBusy && this.displayedJobs.length === 0) || this.error === this.CONSTANTS.ACTIVITY.NO_RESOURCE_FOUND
    },

    showPagination () {
      return this.displayedJobs.length > 0 || !!this.hasNextPage || !this.isBusy
    },

    username () {
      const user = this.allUsers.find(user => user.id === this.userId)
      return `${user.first_name} ${user.last_name}`
    }
  },

  async beforeMount () {
    await this.fetchUsers()
  },

  async mounted () {
    this.$watch('refreshJobs', (oldVal, newVal) => {
      if (newVal) {
        this.startJobsRefresh()
      }
      else {
        this.stopJobsRefresh()
      }
    })

    await this.showJobs()

    if (this.jobs && this.refreshJobs) {
      this.startJobsRefreshTimeout = setTimeout(() => {
        this.startJobsRefreshTimeout = null
        this.startJobsRefresh()
      }, this.CONSTANTS.ACTIVITY.REFRESH_INTERVAL)
    }
  },

  beforeDestroy () {
    this.stopJobsRefresh()

    if (this.startJobsRefreshTimeout) {
      clearTimeout(this.startJobsRefreshTimeout)
      this.startJobsRefreshTimeout = null
    }

    this.$store.commit(`${ACTIVITY}/${RESET_ADMIN_STORE}`)
  },

  methods: {
    ...mapActions(ACTIVITY, {
      cancelInProgressAnalyze: CANCEL_IN_PROGRESS_ANALYZE,
      loadJob: FETCH_JOB,
      loadJobs: FETCH_JOBS,
      refreshVisibleJobs: REFRESH_VISIBLE_JOBS,
      doNextPage: FETCH_NEXT_PAGE,
      doPreviousPage: FETCH_PREVIOUS_PAGE
    }),

    ...mapActions(USERS, {
      fetchUsers: FETCH_USERS
    }),

    clearJobStatusUserIdData () {
      this.jobType = ''
      this.userId = ''
      this.searchExecuted = false
    },

    async clearSearchFields () {
      this.searchExecuted = false
      this.requestId = ''
      this.jobType = ''
      this.userId = ''
      await this.showJobs()
    },

    async doCancelInProgressAnalyze (job) {
      try {
        await this.cancelInProgressAnalyze({ requestId: job.request_id })
        job.popover = false
        job.cancelled = true
        job.progress = this.CONSTANTS.ACTIVITY.JOB_PROGRESS.CANCELED
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: `${job.request_id} has been canceled.`,
          showClose: true,
          type: 'success'
        })
      } catch (err) {
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: getAPIErrorMsg(err),
          showClose: true,
          type: 'error'
        })
      }
    },

    async jobSearch () {
      if (this.jobType || this.userId) {
        this.requestId = ''

        try {
          this.stopJobsRefresh()
          this.searchExecuted = true
          await this.$nextTick()
          await this.showJobs()
        } catch (err) {
          this.$message({
            duration: this.CONSTANTS.MESSAGE_DURATION,
            message: getAPIErrorMsg(err),
            showClose: true,
            type: 'error'
          })
        } finally {
          this.startJobsRefresh()
        }
      }
    },

    async paginateGoToPage () {
      this.stopJobsRefresh()
      await this.$nextTick()
      await this.showJobs()
      this.startJobsRefresh()
    },

    async requestIdSearch () {
      if (this.requestId) {
        // clear userId and jobType as searching by requestId does not account for them
        this.userId = ''
        this.jobType = ''

        try {
          this.stopJobsRefresh()
          this.searchExecuted = true
          await this.$nextTick()
          await this.loadJob(this.requestId)
        } catch (err) {
          this.$message({
            duration: this.CONSTANTS.MESSAGE_DURATION,
            message: getAPIErrorMsg(err),
            showClose: true,
            type: 'error'
          })
        } finally {
          this.startJobsRefresh()
        }
      }
    },

    async nextPage () {
      try {
        await this.doNextPage({
          userId: this.userId,
          type: this.ignoredJobStatuses ? '' : this.jobType,
          all: this.showCompletedJobs
        })
      }
      catch (err) {
        console.error(err)
      }
    },

    async previousPage () {
      try {
        await this.doPreviousPage({
          userId: this.userId,
          type: this.ignoredJobStatuses ? '' : this.jobType,
          all: this.showCompletedJobs
        })
      }
      catch (err) {
        console.error(err)
      }
    },

    async showJobs () {
      try {
        await this.loadJobs({
          userId: this.userId,
          type: this.ignoredJobStatuses ? '' : this.jobType,
          all: this.showCompletedJobs
        })
      }
      catch (err) {
        console.error(err)
      }
    },

    startJobsRefresh () {
      this.searchExecuted = false
      if (!this.jobsRefreshInterval && this.refreshJobs) {
        this.jobsRefreshInterval = setInterval(async () => {
          await this.refreshVisibleJobs({
            requestId: this.requestId,
            userId: this.userId,
            type: this.ignoredJobStatuses ? '' : this.jobType,
            all: this.showCompletedJobs
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

    sortJobs () {
      this.displayedJobs.reverse()
      this.sortTableOrder = (this.sortTableOrder === this.SORT_DIRECTIONS.TITLE.ASCENDING) ? this.SORT_DIRECTIONS.TITLE.DESCENDING : this.SORT_DIRECTIONS.TITLE.ASCENDING
    }
  }
}
</script>

<style lang="less">
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.el-popper[x-placement^=bottom],
.el-select-dropdown {
  &.el-popper {
    border-bottom: 1px solid @box-border-grey;

    &.job-type-dropdown {
      margin-left: 0;
      min-width: 140px !important;
      width: 140px;
    }

    &.user-id-search-dropdown {
      margin-left: 0;
      min-width: 215px;
      width: 215px;
    }
  }
}

tbody {
  .el-loading-mask {
    margin-left: 330px;

    .el-loading-spinner {
      top: 245px;
    }
  }
}

.admin-page {
  .content {
    &.content-activity {
      .header {
        .search-options {
          .job-type-input-wrapper,
          .user-id-input-wrapper {
            .el-select {
              .el-input {
                .el-input__inner {
                  font-size: 12px;

                  &::placeholder,
                  &::-webkit-input-placeholder {
                    font-size: 12px;
                  }
                }
              }
            }

            .el-loading-spinner {
              top: 20px;
            }
          }

          .job-type-input-wrapper {
            .el-select {
              .el-input {
                .el-input__inner {
                  width: 140px;
                }
              }
            }
          }
        }
      }

      table {
        margin-top: 20px;

        th:nth-child(odd),
        th:nth-child(even) {
          .cell {
            color: @color-primary;
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
      .header {
        .search-options {
         .flex-box();
         .align-items-center();
         margin-left: auto;

         .divider-text {
            color: @color-tone;
            font-size: 10px;
            margin-right: 11.2px;
          }
        }

        .request-id-input-wrapper {
          position: relative;

          .request-id__input {
            border: 1px solid @box-border-grey;
            border-radius: 0;
            color: @text-medium;
            font-size: 13px;
            height: 32px;
            position: relative;
            width: 316px;
          }

          i {
            color: @text-dark;
            position: absolute;
            right: 8px;
            top: 7px;

            &:hover {
              cursor: pointer;
            }
          }
        }

        .job-type-input-wrapper,
        .user-id-input-wrapper {
          margin-right: 11.2px;
        }
      }

      p.no-results {
        font-size: 12px;
      }

      .pagination {
        margin: 0 0 10px;
        padding-top: 0;
      }

      .paging {
        padding-bottom: 20px;

        .el-pagination {
          margin-left: auto;
          margin-right: auto;
        }
      }

      a {
        color: @color-primary;
      }

      .job-progress {
        .flex-container-between();
        position: relative;

        .completed-job {
          color: @color-accent;
        }

        .completed-with-errors,
        .cancelled-job {
          color: @color-alert;
        }

        .cancel-job {
          margin-left: auto;

          &:hover {
            cursor: pointer;
          }
        }

        + div {
          .abs-pos(auto, auto, 0, auto);
          width: 100%;
        }

        &.inactive {
          + div {
            display: none;
          }
        }
      }

      .el-upload-list__item-name {
        margin: 0;
        overflow: auto;
        padding: 0;
        white-space: normal;

        p {
          &.process-percentage {
            font-size: 12px;
          }
        }
      }

      .extractor-error-status {
        .fa-exclamation-triangle {
          color: @color-alert;
        }

        .fa-check-circle {
          color: @color-accent;
        }
      }
    }
  }
}
</style>
