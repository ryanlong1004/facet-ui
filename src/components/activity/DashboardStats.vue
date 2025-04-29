<template>
  <div class="key-stats" v-loading="loading">
    <div v-if="lastProcessed !== null">
      <h4>Last Processed</h4>
      <p>{{ lastProcessed }}</p>
    </div>
    <div>
      <h4>Total Files</h4>
      <p>{{ totalFiles }}</p>
    </div>
    <div>
      <h4>Video Runtime</h4>
      <p>{{ videoRuntime }}</p>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash'
  import q from 'q'
  import humanize from 'humanize-plus'
  import moment from 'moment'

  import api, { SUMMARY_DATA } from '../../api'

  const NOT_AVAILABLE = 'N/A'

  export default {
    name: 'dashboard-stats',

    data () {
      return {
        loading: false,
        summaryData: {},
        lastProcessed: NOT_AVAILABLE,
        totalFiles: 0,
        videoRuntime: NOT_AVAILABLE
      }
    },

    beforeMount () {
      this.loading = true
      api.getSummary(SUMMARY_DATA)
        .then(response => {
          this.totalFiles = response.total_files || 0
          if (response.last_harvest) {
            const d = moment(response.last_harvest)
            if (d.isValid() && d.year() !== 0) {
              this.lastProcessed = humanize.capitalize(moment(response.last_harvest).fromNow())
            } else {
              this.lastProcessed = NOT_AVAILABLE
            }
          }
          if (response.video_runtime_seconds) {
            const duration = moment.duration(response.video_runtime_seconds * 1000)
            let hours = Math.floor(duration.as('hours'))
            let minutes = duration.minutes()
            let seconds = duration.seconds()
            if (hours < 10) {
              hours = '0' + hours
            } else {
              hours = humanize.formatNumber(hours, 0)
            }
            if (minutes < 10) {
              minutes = '0' + minutes
            }
            if (seconds < 10) {
              seconds = '0' + seconds
            }
            this.videoRuntime = hours + ':' + minutes + ':' + seconds
          }          
        })
        .finally(() => {
          this.loading = false
        })
    }
  }
</script>

<style lang='less' scoped>
  @import (reference) '../../styles/main';

  .key-stats {
    display: flex;
    justify-content: center;
    margin-bottom: 40px;
    text-align: center;
    div {
      margin: 0 20px;
      min-width: 150px;
      h4 {
        .dashboard-tile-header();
        margin-bottom: 10px;
      }
      p {
        color: @text-dark;
        font-size: 1.5rem;
        font-weight: 300;
        margin: 0;
        padding: 0;
      }
    }
  }
</style>
