<template>
  <div class="content content-analytics analytics-dashboard">
    <div class="layout-col">
      <user-login-metrics></user-login-metrics>
      <harvest-metrics></harvest-metrics>
    </div>
    <div class="select-header">
      <div class="layout-col"><h2>Analytics</h2></div>
    </div>
    <div class="chart-widgets">
      <div class="chart-widget__outer-wrapper" v-for="chart in pieCharts" :key="chart.id">
          <div class="chart-widget">
          <header>{{ chart.name }}</header>
          <div class="chart-widget__wrapper">
            <doughnut-chart :chart-data="chart.chartData" :options="pieChartOptions"></doughnut-chart>
            <div class="chart-widget__download">
              <div
                @click="downloadCsv(chart.csvFields, chart.csvData, chart.name + '.csv')"
                class= "chart-widget__download-csv">
                <i class="far fa-download" aria-hidden="true"></i>
                <div class="text">CSV</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import api from 'src/api'

import UserLoginMetrics from './UserLoginMetrics.vue'
import HarvestMetrics from './HarvestMetrics.vue'
import DoughnutChart from './DoughnutChart.vue'
import LineChart from './LineChart'
import Papa from 'papaparse'
import download from 'downloadjs'

const AGGREGATIONS = [
  {
    name: 'Files By Location',
    csvFieldName: 'location',
    aggregation: { name: 'files_by_location' }
  },
  {
    name: 'Files By Extension',
    csvFieldName: 'extension',
    aggregation: { name: 'files_by_extension' }
  },
  {
    name: 'Files By Type',
    csvFieldName: 'type',
    aggregation: { name: 'files_by_type' }
  },
  {
    name: 'Files By Category',
    csvFieldName: 'category',
    aggregation: { name: 'files_by_category' }
  },
  {
    name: 'NSFW',
    csvFieldName: 'nsfw',
    aggregation: { name: 'explicit_content' }
  }
]

const PALETTE = [
  '#699CB5', '#43808F', '#52B8A8',
  '#5E8BA2', '#3C727F', '#48A496',
  '#537C90', '#356571', '#409286',
  '#4E7487', '#315F6A', '#E4E4E4',
  '#486C7E', '#2D5863', '#378075',
  '#436475', '#E4E4E4', '#33776D'
]
let COLORS = []
for (let i = 0; i < 10; i++) {
  COLORS = COLORS.concat(PALETTE)
}

export default {
  name: 'analytics-dashboard',
  components: {
    UserLoginMetrics,
    HarvestMetrics,
    LineChart,
    DoughnutChart
  },
  data () {
    return {
      pieCharts: [],
      pieChartOptions: {
        responsive: true,
        legend: { display: false },
        tooltip: { position: 'average' }
      }
    }
  },
  mounted () {
    this.fetchPieCharts()
  },
  methods: {
    downloadCsv (fields, data, name) {
      let cvsData = Papa.unparse({fields: fields, data: data})
      download(cvsData, name, 'application/csv')
    },
    async fetchPieCharts () {
      let analytics = await api.searchAnalytics()
       AGGREGATIONS.map(a => {
        const bucketData = _.get(analytics, a.aggregation.name)
        const final = {
          labels: bucketData.map(d => d.key),
          datasets: [{
            data: bucketData.map(d => d.count),
            backgroundColor: []
          }]
        }

        let csvFields = [a.csvFieldName, 'count']

        let csvData = _.map(bucketData, d => {
          return {
            [a.csvFieldName]: d.key,
            'count': d.count
          }
        })

        final.datasets[0].backgroundColor = COLORS
        this.pieCharts.push({ name: a.name, chartData: final, csvFields: csvFields, csvData: csvData })
      })
    }
  }
}

</script>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables.less';
@import (reference) '~src/styles/_mixins.less';

.select-header {
  .flex-container-column();
  width: 100%;
  .layout-row {
    .flex-container-between();
    margin-bottom: 20px;
    width: 100%;

    &.align-left {
      .justify-content-start();
    }

    &.full-width {
      .flex-container-column();
      margin-bottom: 8px;
    }

    &:last-child {
      margin-bottom: 0;
    }

    .layout-col {
      .flex-container-column();
      width: 48%;
    }
  }
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
  @media all and (min-width: 320px) and (max-width: 849px) {
    // &:nth-child(2n+0) {
    //   padding-right: 0;
    // }
  }
  @media all and (min-width: 850px) {
    flex: 0 1 33%;
    max-width: 33%;
    // &:nth-child(3n+0) {
    //   padding-right: 0;
    // }
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
