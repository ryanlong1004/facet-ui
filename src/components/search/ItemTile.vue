<template>
  <div class="item-tile-wrapper">
    <router-link :to="{ name: 'itemDetails', params: { id: itemId } }" class="item-tile item">
      <div class="thumbnail">
        <thumbnail-image ref="thumbnail" :id="itemId" :thumb="itemThumbnail"></thumbnail-image>
      </div>
      <div class="item-info-action-wrapper">
        <div class="item-info">
          <el-tooltip
            :content="name"
            :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
            class="item"
            effect="dark"
            placement="top"
          >
            <div v-truncate-text.end="60" class="item-name">{{ name }}</div>
          </el-tooltip>
          <div class="item-categories" v-if="itemCategories">
            {{ stringifyItemCategories }}
          </div>
          <div class="item-last-harvested time">Analyzed {{ timeAgoLastHarvested }}</div>
        </div>
        <div class="item-actions-wrapper">
          <el-tooltip v-if="$hasScope(SCOPES.ITEM_DOWNLOAD)"
            :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
            content="Download"
            effect="light"
            placement="top"
          >
            <i class="far fa-download action" aria-hidden="true" @click.prevent="downloadItem(itemId)"></i>
          </el-tooltip>
          <div
            v-if="shouldShowAssetSummmaryIcon"
            class="tool"
            @click.prevent.stop="showSummaryAsset(itemId)"
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
    </router-link>

    <el-dialog
      :visible.sync="showOverviewModal"
      @close="resetAssetId"
      class="overview-dialog"
      title="Overview"
    >
      <iframe v-if="assetId" :src="`/api/data/v3/summary/items/${assetId}/overview`"></iframe>
    </el-dialog>
  </div>
</template>

<script>
  import moment from 'moment'
  import api from 'src/api'

  import { ANALYTICS_ACTIONS } from 'src/config/analytics'
  import ThumbnailImage from 'src/components/thumbnail/ThumbnailImage.vue'
  import TruncateText from 'src/directives/truncate-text.directive'

  export default {
    name: 'item-tile',
    components: { ThumbnailImage },
    directives: {
      TruncateText
    },
    props: {
      itemId: {
        type: String,
        default: ''
      },
      itemName: {
        type: String,
        default: ''
      },
      itemThumbnail: {
        type: Object
      },
      itemCategories: {
        type: Array,
        default: () => []
      },
      itemLastHarvestedDate: {
        type: String,
        default: ''
      },
      itemGMItemType: {	
        type: String,	
        default: ''	
      }
    },
    data () {
      return {
        assetId: '',
        showOverviewModal: false
      }
    },
    computed: {
      name () {
        return this.itemName
      },
      shouldShowAssetSummmaryIcon () {
        return this.itemGMItemType === this.CONSTANTS.ITEM_DETAIL_TYPES.VIDEO
      },
      stringifyItemCategories () {
        return this.itemCategories.join(', ')
      },
      timeAgoLastHarvested () {
        return moment(this.itemLastHarvestedDate).fromNow()
      }
    },
    methods: {
      downloadItem (itemId) {
        api.downloadItem(itemId)
      },

      resetAssetId () {
        this.showOverviewModal = false
        this.assetId = ''
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
