<template>
  <div class="search-result-item" :class="itemClass">
    <figure>
      <router-link :to="{ name: 'itemDetails', params: { id: itemId }, query: { key: $route.query.key } }">
        <thumbnail-image :id="itemId" :thumb="thumbnail"></thumbnail-image>
      </router-link>
      <cognitive-icons v-if="hasHitCounts" :matches="hitCounts"/>
    </figure>
    <section class="details">
      <router-link :to="{ name: 'itemDetails', params: { id: itemId }, query: { key: $route.query.key } }">
        <h4 class="filename">
          <el-tooltip
            v-if="displayMode === 'grid'"
            :content="filename" placement="top"
            :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
            effect="dark"
          >
            <span v-truncate-text.end="70">{{ filename }}</span>
          </el-tooltip>
          <template v-else>{{ filename }}</template>
        </h4>
      </router-link>
      <ul class="custom-fields" v-if="customFields.length && displayMode === RESULTS_VIEW_TYPES.LIST">
        <li v-for="field in customFields" :key="field.id"><strong>{{ field.name }}:</strong> {{ field.value }}</li>
      </ul>
      <ul class="categories" v-if="categories.length && displayMode === RESULTS_VIEW_TYPES.LIST">
        <li v-for="category in categories" :key="category"><el-tag size="mini">{{ category }}</el-tag></li>
      </ul>
      <ul class="meta">
        <li class="date-analyzed" v-if="showLastAnalyzed">{{ lastAnalyzed }}</li>
        <li class="file-size" v-if="showFileSize">{{ fileSize }}</li>
        <li class="duration-time">{{ durationTime }}</li>
      </ul>
    </section>
    <section class="tools">
      <div>
        <el-tooltip
          v-if="isPartOfArchive"
          :hide-after="CONSTANTS.TOOLTIP.HIDE_DELAY"
          :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
          content="This file is part of an archive"
          effect="dark"
          placement="top">
          <i class="far fa-file-archive"></i>
        </el-tooltip>
        <el-tooltip
          v-if="showSummaryIcon"
          :hide-after="CONSTANTS.TOOLTIP.HIDE_DELAY"
          :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
          content="Asset Overview"
          effect="dark"
          placement="top">
          <i class="far fa-ballot-check" @click.stop.prevent="doShowOverviewModal"></i>
        </el-tooltip>
        <el-tooltip
          v-if="$hasScope(SCOPES.ITEM_DOWNLOAD)"
          :hide-after="CONSTANTS.TOOLTIP.HIDE_DELAY"
          :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
          content="Download Asset"
          effect="dark"
          placement="top">
          <i class="far fa-download" @click.stop.prevent="downloadItem"></i>
        </el-tooltip>
      </div>
      <div
        v-if="!hideSelector"
        class="bulk-item-checkbox"
        :class="{ active: isBulkSelected }"
        @click.stop="toggleSelected">
        <i class="fas fa-check" v-if="isBulkSelected"></i>
      </div>
    </section>
    <el-dialog
      :visible.sync="showOverviewModal"
      class="overview-dialog"
      title="Overview"
    >
      <iframe v-if="showOverviewModal" :src="`/api/data/v3/summary/items/${itemId}/overview`"></iframe>
    </el-dialog>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import api from 'src/api'
import { SEARCH_CONSTANTS } from 'src/constants-search'
import CognitiveIcons from 'src/components/search/CognitiveIcons.vue'
import ThumbnailImage from 'src/components/thumbnail/ThumbnailImage.vue'
import TruncateText from 'src/directives/truncate-text.directive'

import { BULK_ACTIONS } from 'src/store/storeModules'
import {
  GET_SELECTED_ITEMS_MAP,
  SELECT_ITEM,
  DESELECT_ITEM
} from 'src/store/modules/bulk-actions'

export default {
  name: 'search-result-item',
  components: {
    CognitiveIcons,
    ThumbnailImage
  },
  directives: {
    TruncateText
  },
  props: {
    displayMode: {
      type: String,
      default: SEARCH_CONSTANTS.RESULTS_VIEW_TYPES.GRID
    },
    itemId: {
      type: String,
      required: true
    },
    rootId: {
      type: String,
      required: true
    },
    itemType: { // gm_item_type
      type: String,
      required: true
    },
    filename: {
      type: String,
      required: true
    },
    thumbnail: {
      type: Object,
      default: () => {}
    },
    lastAnalyzed: {
      type: String,
      default: ''
    },
    showLastAnalyzed: {
      type: Boolean,
      default: true
    },
    fileSize: {
      type: String,
      default: '0 Bytes'
    },
    showFileSize: {
      type: Boolean,
      default: true
    },
    durationTime: {
      type: String,
      default: ''
    },
    categories: {
      type: Array,
      default: () => []
    },
    hitCounts: {
      type: Object,
      default: () => {}
    },
    hideSelector: {
      type: Boolean,
      default: false
    },
    customFields: {
      type: Array,
      default: () => []
    }
  },
  data () {
    return {
      RESULTS_VIEW_TYPES: SEARCH_CONSTANTS.RESULTS_VIEW_TYPES,
      showOverviewModal: false
    }
  },
  computed: {
    ...mapGetters(BULK_ACTIONS, {
      bulkItemsMap: GET_SELECTED_ITEMS_MAP
    }),
    downloadTooltipText () {
      return this.isPartOfArchive ? 'Download parent archive file' : 'Download file'
    },
    hasHitCounts () {
      return Object.keys(this.hitCounts).length > 0
    },
    itemClass () {
      let classes = [this.displayMode]
      if (this.isBulkSelected) {
        classes.push('bulk-selected')
      }
      return classes.join(' ')
    },
    isBulkSelected () {
      return this.bulkItemsMap[this.itemId] !== undefined
    },
    isPartOfArchive () {
      return this.itemId !== this.rootId
    },
    showSummaryIcon () {
      return this.itemType === this.CONSTANTS.ITEM_DETAIL_TYPES.VIDEO
    }
  },
  methods: {
    ...mapActions(BULK_ACTIONS, {
      addToBulkItems: SELECT_ITEM,
      removeFromBulkItems: DESELECT_ITEM
    }),
    doShowOverviewModal () {
      this.showOverviewModal = true
    },
    async downloadItem () {
      try {
        await api.downloadItem(this.itemId)
      } catch (e) {
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: 'Item is unavailable for download, ' +
            'this is likely due to the file being removed or renamed in storage.',
          showClose: true,
          type: 'error'
        })
        console.error(err)
      }
    },
    toggleSelected () {
      if (this.isBulkSelected) {
        this.removeFromBulkItems(this.itemId)
      } else {
        this.addToBulkItems(this.itemId)
      }
    }
  }
}
</script>

<style lang="less">
@import (reference) '~src/styles/_variables.less';
@import (reference) '~src/styles/_mixins.less';

.search-result-item {
  .min-max-width(100%);
  .flex-box();
  background-color: @background-grey;
  border: 0 none;
  padding: 0;
  &:hover {
    text-decoration: none;
  }
  figure {
    cursor: pointer;
    display: flex;
    margin: 0;
    padding: 0;
    position: relative;
    .min-max-width(200px);
    .thumbnail-container {
      .min-max-width(200px);
      &.sprite {
        .min-max-height(113px);
      }
      &.single {
        .min-max-height(113px);
        > span {
          background-size: contain;
          background-position: center;
        }
      }
    }
    .cognitive-icons {
      background-color: rgba(0, 0,0, 0.65);
      bottom: 0;
      left: 0;
      right: 0;
      position: absolute;
    }
  }

  .details {
    .flex-box();
    .flex-direction(column);
    overflow: hidden;
    padding: 10px;
  }

  a:hover {
    text-decoration: none;
  }

  .filename {
    color: @text-dark;
    cursor: pointer;
    font-size: 13px;
    font-weight: 700;
    margin: 0;
    padding: 0;
    word-wrap: break-word;
    overflow-wrap: break-word;
    &:hover {
      color: @color-accent;
    }
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  ul.custom-fields {
    > li {
      color: @text-medium;
      font-size: 11px;
      max-width: 100%;
      overflow-x: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      strong {
        font-family: @default-font-family-medium;
      }
    }
  }
  ul.categories {
    .flex-box();
    margin: 0;
    > li {
      font-size: 11px;
      margin-right: 5px;
      .el-tag {
        background-color: lighten(@color-accent, 35%);
        border-color: lighten(@color-accent, 20%);
        color: @color-accent;
      }
    }
  }
  ul.meta {
    .flex-box();
    > li {
      color: @color-tone-medium;
      font-size: 11px;
      margin-right: 20px;
    }
  }

  .tools {
    .flex-container();
    i {
      color: @color-primary;
      cursor: pointer;
      font-size: 13px;
      &:hover {
        color: @color-accent;
      }
    }
    .bulk-item-checkbox {
      .flex-container-center();
      background-color: @color-base;
      border: 1px solid @color-tone-lightest;
      cursor: pointer;
      padding: 0;
      height: 14px;
      width: 14px;
      > i {
        color: @color-base;
        font-size: 8px;
      }
      &.active {
        background-color: @color-accent;
        border-color: @color-accent;
      }
    }
  }

  // list view styles
  &.list {
    .flex-direction(row);
    .justify-content-space-between();

    border-right: 3px solid transparent;
    &.bulk-selected {
      border-right-color: @color-accent;
    }

    .details {
      .justify-content-space-between();
      .flex(1, 1, auto);
    }

    .tools {
      align-items: flex-end;
      flex: 0 0 auto;
      flex-direction: column;
      justify-content: space-between;
      min-height: 100%;
      padding: 8px 8px 8px 0;
    }
  }

  // grid view styles
  @gridViewHeight: 290px;
  @gridViewWidth: 200px;

  &.grid {
    .flex-container-column();
    .min-max-width(@gridViewWidth);
    .min-max-height(@gridViewHeight);
    border-bottom: 3px solid transparent;
    &.bulk-selected {
      border-bottom-color: @color-accent;
    }
    > figure {
      .thumbnail-container {
        .min-max-height(180px);
      }
    }
    .details {
      .flex(1, 1, auto);
      .min-max-width(@gridViewWidth);
      .filename {
        font-size: 12px;
        margin-bottom: 10px;
      }
      ul.meta {
        .flex-direction(column);
        .file-size, .duration-time {
          display: none;
        }
      }
      ul.categories {
        display: none;
      }
    }
    .tools {
      align-items: flex-end;
      justify-content: space-between;
      min-width: 70px;
      padding: 0 10px 10px 10px;
      width: 100%;
      > div > i {
        margin-right: 5px;
      }
      .bulk-item-checkbox > i {
        margin: 0;
      }
    }
  }
}
</style>
