<template>
  <div class="vertical-timelines-ocr" ref="timeline">
    <div class="timeline-loading" v-if="loading" v-loading="loading"></div>
    <div class="horizontal-timeline-container__empty-notification" v-if="!loading && ocrs && ocrs.length === 0">We didn't detect any OCR in this file.</div>

    <big-data-scroller :segments="ocrs" :enabled="tabEnabled" :page-size="20" :offset-top="0" v-else>
      <template v-slot="{ segment, active, clickFn }">
        <ocr-item
          :active="active"
          :segment-index="segment.index"
          :display-time="segment.displayTime"
          :start-at="segment.start_at"
          :phrases="segment.ocrs"
          @item-clicked="clickFn(segment)"
        ></ocr-item>
      </template>
    </big-data-scroller>
  </div>
</template>

<script>
import _ from 'lodash'
import { mapGetters } from 'vuex'
import { OCR } from 'src/store/storeModules'
import { FETCH_OCR } from 'src/store/modules/item/ocrs/actions'
import { GET_ITEM_OCR, GET_OCR_LOADING } from 'src/store/modules/item/ocrs/getters'

import OcrItem from './OCRItem.vue'
import BigDataScroller from './BigDataScroller'
import VuexItemMixin from 'src/mixins/VuexItemMixin'

export default {
  name: 'ocr',
  components: {
    BigDataScroller,
    OcrItem
  },
  mixins: [
    VuexItemMixin
  ],
  props: {
    currentTab: {
      type: String,
      default: ''
    }
  },
  mounted: function () {
    this.$watch('currentTab', newVal => {
      if (newVal === this.CONSTANTS.VERTICAL_TABS.OCR) {
        this.$store.dispatch(`${OCR}/${FETCH_OCR}`, {
          itemType: this.CONSTANTS.ITEM_DETAIL_TYPES.VIDEO
        })
      }
    }, { immediate: true })
  },
  computed: {
    ...mapGetters(OCR, {
      ocrs: GET_ITEM_OCR,
      loading: GET_OCR_LOADING
    }),
    tabEnabled () {
      return this.currentTab === this.CONSTANTS.VERTICAL_TABS.OCR
    }
  }
}
</script>

<style lang="less" scoped>
  .no-data {
    position: absolute;
    top: 10px;
    left: 40px;
  }

  .vertical-timelines-ocr {
    height: 100%;
  }

</style>
