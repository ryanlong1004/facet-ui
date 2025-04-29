<template>
  <div class="extractor-history" :v-loading="historyLoading">
    <el-alert
      v-if="historyLoadingError"
      title="Error loading item extractor history"
      type="error">
    </el-alert>
    <section v-for="job in history" :key="job.requestId" class="extractor-job">
      <h4 class="job-date">{{ job.prettyDate }}</h4>
      <h6 class="job-id">Job ID #{{job.requestId}}</h6>
      <h6 class="job-profile">Profile ID #{{job.profileId}}</h6>
      <ol class="extractor-list">
        <li v-for="extractor in job.extractors" :key="extractor.mime_type">
          <i class="far"
            :class="{ 
              'fa-check-circle': extractor.success,
              'success': extractor.success,
              'fa-exclamation-triangle': !extractor.success,
              'error': !extractor.success
            }">
          </i> {{ extractorsNameMap[extractor.name] || extractor.name }}
        </li>
      </ol>
    </section>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

import VuexItemMixin from 'src/mixins/VuexItemMixin'

import {
  EXTRACTORS,
  ITEM_EXTRACTOR_HISTORY
} from 'src/store/storeModules'
import {
  GET_EXTRACTORS_NAME_MAP
} from 'src/store/modules/admin/extractors'
import {
  GET_ITEM_EXTRACTOR_HISTORY,
  GET_ITEM_EXTRACTOR_HISTORY_ERROR,
  GET_ITEM_EXTRACTOR_HISTORY_LOADING
} from 'src/store/modules/item/extractor-history/getters'

export default {
  name: 'ExtractorHistory',
  mixins: [
    VuexItemMixin
  ],
  computed: {
    ...mapGetters(EXTRACTORS, {
      extractorsNameMap: GET_EXTRACTORS_NAME_MAP
    }),
    ...mapGetters(ITEM_EXTRACTOR_HISTORY, {
      history: GET_ITEM_EXTRACTOR_HISTORY,
      historyLoading: GET_ITEM_EXTRACTOR_HISTORY_LOADING,
      historyLoadingError: GET_ITEM_EXTRACTOR_HISTORY_ERROR
    })
  }
}
</script>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';
@job-vertical-spacing: 20px;

.extractor-job {
  border-bottom: 1px dotted @color-tone-lightest;
  margin-bottom: @job-vertical-spacing;
  padding-bottom: @job-vertical-spacing;
  &:last-child {
    border-bottom: 0 none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
}
.job-date {
  color: @color-primary;
  font-family: @default-font-family-black;
  font-size: 13px;
  margin: 0 0 5px 0;
  text-transform: uppercase;
}
.job-id {
  color: @color-tone-darkest;
  font-size: 11px;
  margin: 0 0 5px 0;
}
.job-profile {
  color: @color-tone-darkest;
  font-size: 11px;
  margin: 0 0 10px 0;
}
ol.extractor-list {
  list-style: none;
  margin: 0;
  padding: 0 0 0 10px;
  > li {
    font-size: 12px;
    margin-bottom: 5px;
    &:last-child {
      margin-bottom: 0;
    }
    i {
      margin-right: 3px;
    }
    i.success {
      color: @color-accent;
    }
    i.error {
      color: @color-alert;
    }
  }
}
</style>
