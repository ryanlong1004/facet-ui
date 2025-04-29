<template>
  <div class="document-ocr">
    <p v-if="!currentPageImages.length" class="empty-notification page-level">No OCR detected in this page</p>
    <div v-else v-for="image in currentPageImages" :key="image.imageID" class="image-row">
      <div :style="{ 'background-image': `url(${image.path})` }" class="image-wrapper"></div>
      <div class="image-ocrs" v-if="image.ocrs && image.ocrs.length">
        <ocr-item
          :image-index="image.imageIndex"
          :segment-index="currentPageOCR.index"
          :phrases="image.ocrs"
          :display-time="`${currentPlayheadTime}`"
        ></ocr-item>
      </div>
      <div v-else class="empty-notification">No OCR detected in this image</div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

import { CONSTANTS } from 'src/constants'
import VuexItemMixin from 'src/mixins/VuexItemMixin'
import PlayheadMixin from 'src/mixins/PlayheadMixin'
import OcrItem from 'src/components/item/timeline/OCRItem.vue'
import { OCR } from 'src/store/storeModules'
import {
  GET_OCR_LOADING,
  GET_OCR_LOADING_ERROR,
  GET_ITEM_OCR
} from 'src/store/modules/item/ocrs/getters'
import { FETCH_OCR, EDIT_OCR } from 'src/store/modules/item/ocrs/actions'

export default {
  name: 'document-ocr',
  components: {
    OcrItem
  },
  mixins: [
    VuexItemMixin,
    PlayheadMixin
  ],
  beforeMount () {
    this.$store.dispatch(`${OCR}/${FETCH_OCR}`, { itemType: CONSTANTS.ITEM_DETAIL_TYPES.DOCUMENT })
  },
  computed: {
    ...mapGetters(OCR, {
      loading: GET_OCR_LOADING,
      loadingError: GET_OCR_LOADING_ERROR,
      ocr: GET_ITEM_OCR
    }),
    currentPageOCR () {
      const ocr = _.get(this.ocr, `[${this.currentPlayheadTime}]`) || null
      return ocr
    },
    currentPageImages () {
      return _.get(this.currentPageOCR, 'images', []) || []
    }
  }
}
</script>

<style lang="less">
@import (reference) '../../../styles/_variables.less';

.document-ocr {
  display: flex;
  flex-direction: column;
  height: auto;
  .image-row {
    align-items: top;
    border-bottom: 1px solid @color-tone-lighter;
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    padding: 20px;
    &:last-child {
      border-bottom: 0 none;
    }
    .image-wrapper {
      background-position: center center;
      background-repeat: no-repeat;
      background-size: contain;
      flex: 0 0 100px;
      height: 100px;
      width: 100px;
    }
    .image-ocrs {
      flex: 1 1 auto;
      padding: 0 15px;
    }
  }
  .empty-notification {
    color: @color-tone-medium;
    font-size: 12px;
    font-style: italic;
    margin: 0;
    padding: 0 15px;
    text-align: left;
    &.page-level {
      padding: 20px;
    }
  }
}
</style>
