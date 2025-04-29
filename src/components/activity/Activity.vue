<template>
  <div class="content content-activity">
    <div class="live-updates">
      <span class="updates-toggle">
        Live Updates
        <i
          :class="{ inactive: !live }"
          @click="toggleInterval(live)"
          class="far fa-toggle-on"
        ></i>
      </span>
    </div>

    <div class="activity-data">
      <dashboard-stats></dashboard-stats>
      <el-table :data="activity" stripe>
        <el-table-column
          label="Date"
          prop="ts"
          width="160px"
        >
          <template slot-scope="scope">
            <el-tooltip class="item" effect="dark" :content="scope.row.tsRaw" placement="top" :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY">
              <p class="ellipsis">{{scope.row.ts}}</p>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="File Name" :data="activity">
          <template slot-scope="scope">
            <p v-if="scope.row.kind === 'harvest'" class="ellipsis">
              <router-link :to="{ name: 'itemDetails', params: { id: scope.row.item_id } }">{{scope.row.name}}</router-link>
            </p>
            <p v-else class="ellipsis">{{scope.row.name}}</p>
          </template>
        </el-table-column>
        <el-table-column
          label="Source"
          prop="source"
          width="220px"
        >
          <template slot-scope="scope">
            <span v-if="scope.row.error" class="extractor-error ellipsis">
              <el-tooltip class="item" effect="dark" :content="scope.row.error" placement="left" :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY">
                <i class="far fa-exclamation-circle"><span class="text">{{scope.row.error}}</span></i>
              </el-tooltip>
            </span>
            <p v-else-if="scope.row.magnet" class="extractor-success ellipsis">
              <i class="far fa-check-circle"></i>
              <span>{{scope.row.magnet}}</span>
            </p>
            <p v-else-if="scope.row.source" class="extractor-success ellipsis">
              <i class="far fa-check-circle"></i>
              <span>{{scope.row.source}}</span>
            </p>
          </template>
        </el-table-column>
        <el-table-column
          label="Status"
          prop="kind"
          width="100px"
        ></el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script>
import api from 'src/api'
import { CONSTANTS } from 'src/constants'
import { getAPIErrorMsg } from 'src/apiHelpers'
import moment from 'moment'
import DashboardStats from 'src/components/activity/DashboardStats.vue'

export default {
  name: 'activity',

  components: {
    DashboardStats
  },

  data () {
    return {
      CONSTANTS,
      summary: [],
      activity: [],
      results: [],
      kind: null,
      loading: true,
      error: null,
      live: true,
      liveInterval: null
    }
  },

  mounted () {
    this.timeout = setTimeout(this.loadData, 500)
    this.liveInterval = setInterval(this.loadData, 5000)
  },

  beforeDestroy () {
    clearTimeout(this.timeout)
    clearInterval(this.liveInterval)
  },

  methods: {
    toggleInterval () {
      this.live = !this.live
      if (this.live) {
        this.liveInterval = setInterval(this.loadData, 5000)
      } else {
        clearInterval(this.liveInterval)
        this.liveInterval = null
      }
    },

    loadData () {
      api.getActivity()
        .then((response) => {
          this.activity = response
          for (let index of this.activity) {
            index.tsRaw = moment(index.ts).format('MMMM Do YYYY, h:mm:ss a')
            index.ts = moment(index.ts).calendar()
          }
        })
        .catch((err) => {
          this.$message({
            duration: CONSTANTS.MESSAGE_DURATION,
            message: getAPIErrorMsg(err),
            showClose: true,
            type: 'error'
          })
        })
        .finally(() => {
          this.loading = false
        })
    }
  }
}
</script>

<style lang="less">
@import (reference) '~src/styles/_variables';

.admin-page.admin-page {
  .content {
    &.content-activity {
      .live-updates {
        align-items: center;
        display: flex;
        justify-content: flex-end;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 1px;
        line-height: 1;
        text-transform: uppercase;

        .fa-toggle-on {
          color: @primary-button-color;
          display: inline-block;
          font-size: 27px;
          margin-left: 5px;
          position: relative;
          top: 6px;

          &.inactive {
            color: @color-alert;
            transform: rotate(180deg);
          }

          &:hover {
            cursor: pointer;
          }
        }
      }

      .activity-data {
        padding-top: 25px;
      }

      .el-table {
        .el-table__body-wrapper {
          table.el-table__body {
            tbody {
              tr.el-table__row {
                td {
                  .cell {
                    font-size: 12px;
                    padding: 9px;

                    p {
                      font-size: 12px;
                      line-height: 1;
                      margin: 0;
                      padding: 0;

                      &.ellipsis {
                        margin: 2px 0;
                      }
                    }

                    .error-tag {
                      max-width: 185px;
                    }

                    .extractor-error,
                    .extractor-success {
                      .text {
                        font-family: @default-font-family;
                        margin-left: 5px;
                      }
                    }

                    .extractor-error {
                      color: @color-alert;
                    }

                    .extractor-success {
                      .far {
                        color: @primary-button-color;
                      }

                      .text {
                        color: @text-darkest;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
</style>
