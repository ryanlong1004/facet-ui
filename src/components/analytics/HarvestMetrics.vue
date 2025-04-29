<template>
  <div class="harvest-metrics">
    <div class="layout-row">
      <div class="layout-col">
        <h2>Harvest</h2>
      </div>
      <div class="layout-col-end">
        <el-select v-model="value" @change="getData(value)" placeholder="Select date range" size="large">
          <el-option
            v-for="item in this.options"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </div>
    </div>
    <div class="layout-row">
      <div class="layout-col center summary-label large">{{ this.totals.files_uploaded }}
        <p v-if="this.totals.files_uploaded > 1">Files uploaded</p>
        <p v-else>File uploaded</p>
      </div>
      <div class="layout-col center summary-label large">{{ this.totals.total_runtime_hours }}
        <p>Hours of runtime</p>
      </div>
      <div class="layout-col center">
        <div class="totals-box-header">
          <div class="layout-row small">
            <div class="layout-col small summary-label">Type</div>
            <div class="layout-col small end summary-label">Files</div>
          </div>
        </div>
        <div class="totals-box">
          <div class="layout-row small">
            <div class="layout-col small"><p>Video</p></div>
            <div class="layout-col small end"><p>{{ this.totals.video.count }}</p></div>
          </div>
          <div class="layout-row small">
            <div class="layout-col small"><p>Audio</p></div>
            <div class="layout-col small end"><p>{{ this.totals.audio.count }}</p></div>
          </div>
          <div class="layout-row small">
            <div class="layout-col small"><p>Images</p></div>
            <div class="layout-col small end"><p>{{ this.totals.images.count }}</p></div>
          </div>
          <div class="layout-row small">
            <div class="layout-col small"><p>Documents</p></div>
            <div class="layout-col small end"><p>{{ this.totals.documents.count }}</p></div>
          </div>
        </div>
      </div>
    </div>
    <div class="chart-widgets">
      <div class="chart-widget__outer-wrapper">
        <div class="chart-widget">
          <header>Assets Harvested</header>
          <div class="chart-widget__wrapper">
            <line-chart :chart-data="assetCountChartData" :options="lineChartOptions" :height="200"></line-chart>
          </div>
        </div>
      </div>
      <div class="chart-widget__outer-wrapper">
        <div class="chart-widget">
          <header>Hours of Video</header>
          <div class="chart-widget__wrapper">
            <line-chart :chart-data="videoHoursChartData" :options="lineChartOptions" :height="200"></line-chart>
          </div>
        </div>
      </div>
    </div>
    <hr>
  </div>
</template>

<script>
import api from '../../api'
import moment from 'moment'
import LineChart from './LineChart'

const WEEK = 'week'
const MONTH = 'month'
const YEAR = 'year'

const VIDEO = 'video'
const AUDIO = 'audio'
const IMAGE = 'image/raster'
const DOCUMENT = 'document'

const MAX_PLOT_POINTS = 10

export default {

  name: 'harvest-metrics',
  components: {LineChart},
  beforeMount () {
    this.getData(MONTH)
  },

  data () {
    return {
      options: [
        {
          value: WEEK,
          label: 'This week'
        },
        {
          value: MONTH,
          label: 'This month'
        },
        {
          value: YEAR,
          label: 'This year'
        }
      ],

      value: MONTH,

      dateRange: {
        from: null,
        middle: null,
        to: null
      },

      audioDurationForPeriod: 0,

      dateRanges: [],

      promises: [],

      responses: [],

      totals: {
        video: {
          count: 0,
          millis: 0,
          hours: 0
        },
        audio: {
          count: 0,
          millis: 0,
          hours: 0
        },
        images: {
          count: 0,
          millis: 0,
          hours: 0
        },
        documents: {
          count: 0,
          millis: 0,
          hours: 0,
          pages: 0
        },
        files_uploaded: 0,
        total_runtime_millis: 0,
        total_runtime_hours: 0
      },

      assetCountChartData: {},
      videoHoursChartData: {},

      lineChartOptions: {
        responsive: true,
        legend: { display: false },
        tooltip: { position: 'average' }
      }
    }
  },

  methods: {

    getMillisInPeriod (dateRangeName) {
      const startMillis = moment().startOf(dateRangeName).valueOf()
      const endMillis = moment().valueOf()
      return (endMillis - startMillis) / MAX_PLOT_POINTS
    },

    getFromToDates (dateRangeName) {
      this.dateRanges = []
      let interval = this.getMillisInPeriod(dateRangeName)
      let startMillis = moment().startOf(dateRangeName).valueOf()
      let endMillis = 0
      for (let x = 0; x < MAX_PLOT_POINTS; x++) {
        endMillis = startMillis + interval
        this.dateRanges.push({
          start: new Date(startMillis).toISOString(),
          end: new Date(endMillis).toISOString()
        })
        startMillis = endMillis
      }
    },

    async getData (dateRangeName) {
      this.getFromToMiddle(dateRangeName)
      await this.getAudioTotal(dateRangeName)
      this.promises = []
      this.responses = []
      this.getMillisInPeriod(dateRangeName)
      this.getFromToDates(dateRangeName)
      for (let x = 0; x < this.dateRanges.length; x++) {
        let request = this.getSearchPayload(this.dateRanges[x].start, this.dateRanges[x].end)
        this.promises.push(
          new Promise(async (resolve, reject) => {
            const res = await api.doSearch(request)
            resolve()
            this.responses.push(res)
          })
        )
      }
      await Promise.all(this.promises)
      this.sortSearchData()
      this.aggregateResults()
    },

    getFromToMiddle (dateRangeName) {
      this.dateRange.from = moment().startOf(dateRangeName).format('MM-DD-YY')
      this.dateRange.to = moment().format('MM-DD-YY')
      const diff = moment().valueOf() - moment().startOf(dateRangeName).valueOf()
      const mid = diff / 2
      const middle = ((moment().startOf(dateRangeName).valueOf()) + mid)
      this.dateRange.middle = moment(middle).format('MM-DD-YY')
    },

    async getAudioTotal (dateRangeName) {
      const from = moment().startOf(dateRangeName).toISOString()
      const to = moment().endOf(dateRangeName).toISOString()
      const resp = await api.doSearch(this.getAudioTotalPayload(from, to))
      this.audioDurationForPeriod = resp.aggregations.metrics['total duration']
    },

    sortSearchData () {
      this.responses.sort(
        (h1, h2) => (
          h1.filters.ranges[0].from > h2.filters.ranges[0].from
        ) ? 1 : (h1.filters.ranges[0].from < h2.filters.ranges[0].from) ? -1 : 0
      )
    },

    convertMillisToHours (millis) {
      return (millis / 3600000)
    },

    aggregateResults () {

      let videoCount = 0
      let videoMillis = 0
      let audioCount = 0
      let imageCount = 0
      let imageMillis = 0
      let documentCount = 0
      let documentPages = 0
      let documentMillis = 0
      let totalHarvested = 0

      let assetCountChartLabels = []
      let assetCountChartDatasetData = []

      let videoHoursChartLabels = []
      let videoHoursChartDatasetData = []

      // count totals by type
      for (let x = 0; x < this.responses.length; x++) {
        if (this.responses[x].total_hits > 0) {
          totalHarvested = totalHarvested + this.responses[x].total_hits
          let data = this.responses[x].aggregations.terms['file.type'].buckets
          data.forEach(item => {
            switch (item.key) {
              case 'audio':
                audioCount = audioCount + item.count
                break
              case 'video':
                videoCount = videoCount + item.count
                break
              case 'image/raster':
                imageCount = imageCount + item.count
                break
              case 'document':
                documentCount = documentCount + item.count
                break
            }
          })

          videoMillis = videoMillis + this.responses[x].aggregations.metrics['total video duration']
          imageMillis = imageCount * 1000
          documentPages = documentPages + this.responses[x].aggregations.metrics['total pages']
          documentMillis = documentPages * 1000
        }

        // special case for first record. Need a plot point at the very beginning of the period
        // so grab the from date in the first record for starting plot point
        // all the rest of the data points are plotted at the from date
        if (x === 0) {
          assetCountChartLabels.push(this.responses[x].filters.ranges[0].from)
          assetCountChartDatasetData.push(audioCount + videoCount + imageCount + documentCount)
          videoHoursChartLabels.push(this.responses[x].filters.ranges[0].from)
          videoHoursChartDatasetData.push(this.convertMillisToHours(videoMillis))
        }

        // handle subsequent records normally
        assetCountChartLabels.push(this.responses[x].filters.ranges[0].to)
        assetCountChartDatasetData.push(audioCount + videoCount + imageCount + documentCount)
        videoHoursChartLabels.push(this.responses[x].filters.ranges[0].to)
        videoHoursChartDatasetData.push(this.convertMillisToHours(videoMillis).toFixed(2))
      }

      const assetCountChartData = {
        labels: [this.dateRange.from, '', '', '', '', this.dateRange.middle, '', '', '', '', this.dateRange.to],
        datasets: [{
          backgroundColor: '#25a5be',
          borderColor: '#25a5be',
          fill: false,
          lineTension: 0,
          data: assetCountChartDatasetData
        }]
      }

      const videoHoursChartData = {
        labels: [this.dateRange.from, '', '', '', '', this.dateRange.middle, '', '', '', '', this.dateRange.to],
        datasets: [{
          backgroundColor: '#25a5be',
          borderColor: '#25a5be',
          fill: false,
          lineTension: 0,
          data: videoHoursChartDatasetData
        }]
      }

      this.assetCountChartData = assetCountChartData
      this.videoHoursChartData = videoHoursChartData

      this.totals.audio.count = audioCount
      this.totals.audio.millis = this.audioDurationForPeriod
      this.totals.audio.hours = this.convertMillisToHours(this.audioDurationForPeriod)

      this.totals.video.count = videoCount
      this.totals.video.millis = videoMillis
      this.totals.video.hours = this.convertMillisToHours(videoMillis)

      this.totals.images.count = imageCount
      this.totals.images.millis = imageMillis
      this.totals.images.hours = this.convertMillisToHours(imageMillis)

      this.totals.documents.count = documentCount
      this.totals.documents.pages = documentPages
      this.totals.documents.millis = documentMillis
      this.totals.documents.hours = this.convertMillisToHours(documentMillis)

      this.totals.files_uploaded = totalHarvested
      this.totals.total_runtime_millis = this.audioDurationForPeriod + videoMillis + imageMillis + documentMillis
      this.totals.total_runtime_hours = this.convertMillisToHours(this.totals.total_runtime_millis).toFixed(2)
    },

    getSearchPayload (from, to) {
      return {
        query: '',
        only: ['aggregations'],
        filters: {
          ranges: [
            {
              from: from,
              to: to,
              field: 'last_harvested'
            }
          ]
        },
        aggregations: {
          metrics: [
            {
              type: 'sum',
              field: 'mediainfo.video.duration',
              name: 'total video duration'
            },
            {
              type: 'sum',
              field: 'mediainfo.audio.duration',
              name: 'total audio duration'
            },
            {
              type: 'sum',
              field: 'document.pages',
              name: 'total pages'
            }
          ],
          terms: [
            {
              name: 'file.type',
              field: 'gm_item_type'
            }
          ]
        }
      }
    },

    getAudioTotalPayload (from, to) {
      return {
        query: '',
        only: [
          'aggregations'
        ],
        filters: {
          ranges: [{
            from: from,
            to: to,
            field: 'last_harvested'
          }],
          exact_terms: [{
            field: 'gm_item_type',
            value: 'audio'
          }]
        },
        aggregations: {
          metrics: [{
            type: 'sum',
            field: 'mediainfo.audio.duration',
            name: 'total duration'
          }]
        }
      }
    }
  }
}
</script>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables.less';
@import (reference) '~src/styles/_mixins.less';

.harvest-metrics {
  .summary-label {
    font-size: 15px;
    font-weight: bolder;

    &.large {
      font-size: 50px;
      font-weight: lighter;
    }
  }

  p {
    line-height: 0 !important;
  }

  .layout-row {
    &.small {
      line-height: 1.5em;
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      width: 100%;
    }

    .flex-container-between();

    .layout-col {
      .flex-container-column();
      width: 100%;

      &.center {
        align-items: center;
      }

      &.small {
        .flex-container-column();
        flex-direction: column;
        padding: 0;
        margin: 0;
        line-height: 1.5em;
        width: 50%;
        align-items: start;

        &.end {
          align-items: end;
        }
      }
    }
  }
}

.totals-box-header {
  height: 2em;
  line-height: 1em;
  margin: 20px 20px 10px 0;
  padding: 15px;
  width: 90%;
}

.totals-box {
  width: 90%;
  padding: 15px;
  margin-right: 20px;
  height: 150px;
}

.chart-widgets {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}
.chart-widget__outer-wrapper {
  display: flex;
  flex-direction: column;
  flex: 0 1 50%;
  max-width: 50%;
  padding-top: 15px;
  padding-right: 10px;
  @media all and (min-width: 640px) and (max-width: 849px) {}
  @media all and (min-width: 850px) {
    flex: 0 1 50%;
    max-width: 50%;
  }
}

.chart-widget {
  background-color: @background-grey;
  border: 1px solid @box-border-grey;
  display: flex;
  flex-direction: column;
  > header, .chart-widget__wrapper {
    padding: 15px;
  }
  > header {
    background-color: @box-border-grey;
    color: @text-dark;
    font-size: 13px;
    font-weight: 700;
    text-align: center;
    text-transform: uppercase;
  }

  .chart-widget__wrapper {
    .chart-widget__download {
      .chart-widget__download-csv {
        cursor: pointer;
        display: flex;
        flex-direction: row;
        align-items: center;

        color: @text-dark;
        font-weight: 700;
        letter-spacing: 1.1px;
        text-transform: uppercase;

        &:hover {
          text-decoration: none;
          color: lighten(@text-dark, 10%);
        }

        &:active {
          color: darken(@text-dark, 20%);
        }

        .far {
          font-size: 15px;
          margin-right: 3px;
        }

        .text {
          font-size: 10px;
        }
      }
    }
  }
}
</style>
