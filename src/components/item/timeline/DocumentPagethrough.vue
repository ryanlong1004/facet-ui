<template>
  <div class="document-pagethrough">
    <div class="arrow-button" @click="goPreviousPage"><i class="far fa-angle-left arrow-icon"></i></div>
    <div><strong>Page {{ currentDisplayPage }}</strong> / {{ totalPages }}</div>
    <div class="arrow-button" @click="goNextPage"><i class="far fa-angle-right arrow-icon"></i></div>
  </div>
</template>

<script>
import _ from 'lodash'
import PlayheadMixin from 'src/mixins/PlayheadMixin'
import { DOCUMENT_THUMBNAILS } from 'src/store/storeModules'
import { GET_ITEM_DOCUMENT_THUMBNAILS } from 'src/store/modules/item/document-thumbnails/getters'

export default {
  name: 'document-pagethrough',
  mixins: [PlayheadMixin],
  computed: {
    currentDisplayPage () {
      return this.currentPlayheadTime + 1
    },
    totalPages () {
      return _.get(this.$store.getters[`${DOCUMENT_THUMBNAILS}/${GET_ITEM_DOCUMENT_THUMBNAILS}`], 'length', 0)
    }
  },
  methods: {
    goNextPage () {
      let nextPage = this.currentPlayheadTime + 1
      if (nextPage >= this.totalPages) {
        nextPage = 0
      }
      this.setPlayheadTime(nextPage)
    },
    goPreviousPage () {
      let prevPage = this.currentPlayheadTime - 1
      if (prevPage < 0) {
        prevPage = this.totalPages - 1
      }
      this.setPlayheadTime(prevPage)
    }
  }
}
</script>

<style lang="less" scoped>
@import '../../../styles/_variables.less';
.document-pagethrough {
  align-items: center;
  background-color: @color-base;
  border-bottom: 1px solid @color-tone-lighter;
  color: @color-tone;
  display: flex;
  font-size: 12px;
  font-weight: 500;
  justify-content: center;
  min-height: 30px;
  text-transform: uppercase;
  strong {
    color: @color-primary;
  }
  .arrow-button {
    cursor: pointer;
    padding: 4px;
    margin: 0 5px;
    i.arrow-icon {
      color: @color-accent;
    }
    &:hover i.arrow-icon {
      color: @color-primary;
    }
  }
}
</style>
