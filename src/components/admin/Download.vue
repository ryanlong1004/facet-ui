<template>
  <div class="wrapper">
    <el-tooltip
      :hide-after="CONSTANTS.TOOLTIP.HIDE_DELAY"
      :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
      content="This may take a few minutes..."
      effect="light"
      placement="top"
    >
    <el-button class="" type="primary" @click="downloadEverything()">Export All Metadata</el-button>
    </el-tooltip>
  </div>
</template>

<script>
  import api from 'src/api'
  import SearchQuery from 'src/components/search/SearchQuery'

  import { SESSION } from 'src/store/storeModules'
  import { GET_AUTH_TOKEN } from 'src/store/modules/session/session'

  export default {
    name: 'download',

    methods: {
      downloadEverything () {
        api.downloadEverything(this.$store.getters[`${SESSION}/${GET_AUTH_TOKEN}`])
      }
    }
  }
</script>

<style lang="less" scoped>
  .wrapper {
    display: grid;
    grid-template-columns: 300px 300px;
    grid-gap: 5px;
    padding:  50px;

    .complete-span {
      text-align: center;
    }

    .buffer {
      height: 35px;
    }
  }
</style>
