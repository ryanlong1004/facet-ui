<template>
  <draggable :list="items" :options="{group:{name: 'collections', pull: 'clone', put: 'false'}, sort: false, disabled: !collections || !collectionsOpen}" :clone="onDragClone" :move="onMove" class="results--item-grid responsive-item-grid">
    <template v-if="items.length > 0">
    <div v-for="item in items" :key="item._id" class="result-wrapper responsive-item-grid__item">
      <div class="result">
        <div class="result__image" @click="goToItemDetail(item._id)">
          <thumbnail-image :id="item._id" :thumb="item.thumbnail"></thumbnail-image>
        </div>
        <div class="result__details">
          <el-tooltip
            :content="getFilenameFromItemData(item)" placement="top"
            :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
            effect="dark"
          >
            <h4
              v-truncate-text.end="40"
              class="result__title"
              @click="goToItemDetail(item._id)"
            >{{ getFilenameFromItemData(item) }}</h4>
          </el-tooltip>
          <cognitive-icons :matches="item.hit_counts" :nsfw="item.nsfw"></cognitive-icons>
          <div class="bottom-details">
            <p class="result__date">{{ item.lastHarvested }}</p>
            <div
              v-if="shouldShowAssetSummmaryIcon(item)"
              class="tool"
              @click="showSummaryAsset(item._id)"
            >
              <el-tooltip
                :hide-after="CONSTANTS.TOOLTIP.HIDE_DELAY"
                :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
                content="Asset Overview"
                effect="dark"
                placement="top"
              >
                <i class="far fa-ballot-check"></i>
              </el-tooltip>
            </div>
          </div>
        </div>
      </div>
    </div>
    <el-dialog
      :visible.sync="showOverviewModal"
      @close="resetAssetId"
      class="overview-dialog"
      title="Overview"
    >
      <iframe v-if="assetId" :src="`/api/data/v3/summary/items/${assetId}/overview`"></iframe>
    </el-dialog>
    </template>
  </draggable>
</template>

<script>
  import _ from 'lodash'
  import { mapGetters } from 'vuex'
  import { ANALYTICS_ACTIONS } from 'src/config/analytics'
  import { COLLECTIONS_OPEN } from 'src/store/modules/rightPanel/getterTypes'
  import { RIGHT_PANEL } from 'src/store/storeModules'
  import draggable from 'vuedraggable'
  import ThumbnailImage from 'src/components/thumbnail/ThumbnailImage.vue'
  import CognitiveIcons from 'src/components/search/CognitiveIcons.vue'
  import TruncateText from 'src/directives/truncate-text.directive'
  import { getFilenameFromItemData } from 'src/item-helper'

  export default {
    name: 'item-grid',

    directives: {
      TruncateText
    },

    computed: {
      ...mapGetters(RIGHT_PANEL, {
        collectionsOpen: COLLECTIONS_OPEN
      })
    },

    components: {
      ThumbnailImage,
      draggable,
      CognitiveIcons
    },

    props: {
      items: Array,
      collections: {
        type: Boolean,
        default: false
      },
      searchKey: {
        type: String,
        default: null
      },
      from: {
        type: String,
        default: null
      }
    },

    data () {
      return {
      getFilenameFromItemData,
      assetId: '',
        showOverviewModal: false
      }
    },

    methods: {
      onMove (evt, originalEvent) {
        // https://github.com/SortableJS/Vue.Draggable/issues/45
        let draggedId = evt.draggedContext.element._id
        let targetList = evt.relatedContext.list
        let inList = _.find(targetList, {_id: draggedId})
        if (inList) {
          return false
        }
      },
      onDragClone (object) {
        return {
          _id: object._id,
          name: object.name,
          thumbnail: object.thumbnail,
          toDelete: false,
          fake: false
        }
      },

      goToItemDetail (itemId) {
        let location = {
          path: '/item/' + itemId,
          query: { from: this.from }
        }

        if (this.searchKey) {
          location.query.key = this.searchKey
        }
        this.$router.push(location)
      },

      resetAssetId () {
        this.showOverviewModal = false
        this.assetId = ''
      },

      shouldShowAssetSummmaryIcon (item) {
        return _.get(item, 'gm_item_type', '') === this.CONSTANTS.ITEM_DETAIL_TYPES.VIDEO
      },

      showSummaryAsset (id) {
        let analyticsAction = false
        this.assetId = id
        this.showOverviewModal = true
        analyticsAction = ANALYTICS_ACTIONS.ITEM_ASSET_OVERVIEW
      }
    }
  }
</script>

<style lang="less">
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.results--item-grid {
  margin-top: 20px;
  .result {
    background-color: @background-grey;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    height: 293px;
    justify-content: flex-start;
    width: 100%;
    max-width: 270px;
    &__image {
      overflow: hidden;
      .thumbnail-container {
        background-color: @color-tone-lighter;
        height: 100%;
        max-width: 100%;
        min-height: 206px;
        &.single {
          > span {
            background-size: contain;
            background-position: center center;
          }
        }
      }
    }
    &__details {
      display: flex;
      flex: 1;
      flex-direction: column;
      justify-content: space-between;
      height: 77px;
      padding: 10px;
    }
    .cognitive-icons {
      margin: 5px 0;
    }
    &__title {
      color: @text-dark;
      flex: 1 1 auto;
      font-weight: normal;
      font-size: 12px;
      line-height: 1.17;
      margin: 0 0 5px 0;
      overflow-wrap: break-word;
      width: 100%;
    }
    &__date {
      color: @text-dark;
      flex: 0 0 auto;
      font-size: 11px;
      margin: 0;
    }

    .bottom-details {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }

  &.grid {
    .result {
      height: 270px;

      .result__image {
        .thumbnail-container {
          min-height: 216px;
        }
      }
    }

    .result__details {
      height: 40px;
    }
  }
}
</style>
