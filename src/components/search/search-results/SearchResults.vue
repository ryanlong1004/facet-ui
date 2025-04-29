<template>

  <section class="search-results">
    <section class="search-results-content-left">
      <search-results-header/>

      <!-- results ============================== -->
      <div class="search-result-items" :class="`${viewMode}`">
        <draggable :list="searchResults" :options="{group:{name: 'collections', pull: 'clone', put: 'false'}, sort: false, disabled: !collectionsOpen}" :clone="onDragClone" :move="onMove" class="results-draggable">
          <search-result-item
            v-for="result in searchResults"
            :key="result.itemId"
            :display-mode="viewMode"
            :item-id="result.itemId"
            :root-id="result.rootId"
            :item-type="result.gm_item_type"
            :filename="getFilenameFromItemData(result)"
            :thumbnail="result.thumbnail"
            :last-analyzed="result.lastHarvested"
            :file-size="result.fileSize"
            :duration-time="result.durationTime"
            :categories="result.categories"
            :hit-counts="result.hit_counts"
            :custom-fields="result.customFields"
          />
        </draggable>
      </div>

      <div class="paging" v-if="totalHits > resultsPerPage">
        <el-pagination
          layout="prev, pager, next"
          :page-size="resultsPerPage"
          :total="totalHits"
          :current-page="currentPageForPaginator"
          @current-change="setCurrentPage">
        </el-pagination>
      </div>

    </section>

    <aside class="search-results-content-right">
      <collections-button></collections-button>
      <search-filter-branch :items="filterTree" :apply-filter="toggleAggregationFilter"></search-filter-branch>
    </aside>

  </section> <!-- .search-results -->

</template>

<script>
import _ from 'lodash'
import { mapGetters, mapMutations, mapActions } from 'vuex'
import draggable from 'vuedraggable'

import api from 'src/api'
import { SEARCH_CONSTANTS } from 'src/constants-search'
import { setCookie, getCookie } from 'src/cookie-helper'
import { getFilenameFromItemData } from 'src/item-helper'

import SearchResultItem from 'src/components/search/search-results/SearchResultItem.vue'
import SearchForm from 'src/components/search/search-form/SearchForm.vue'
import SearchResultsHeader from 'src/components/search/search-results/SearchResultsHeader.vue'
import SearchFilterBranch from 'src/components/search/SearchFilterBranch.vue'

import CollectionsButton from 'src/components/collections/CollectionsButton'

import { CUSTOM_DATA_ADMIN, HIGHLIGHTS, RIGHT_PANEL, SEARCH, SEARCH_FILTERS, SEARCH_RESULTS } from 'src/store/storeModules'
import { COLLECTIONS_OPEN } from 'src/store/modules/rightPanel/getterTypes'
import {
  HAS_SEARCH_RESULTS,
  GET_NUM_RESULTS,
  GET_VIEW_TYPE,
  GET_RESULTS,
  GET_RESULTS_AGGREGATIONS,
  GET_RESULTS_LOADING,
  GET_RESULTS_ERROR
} from 'src/store/modules/search-results/getters'
import {
  GET_PAGE,
  GET_PER_PAGE,
  GET_AGGREGATION_FILTERS
} from 'src/store/modules/search/getters'
import {
  ADD_AGGREGATION_FILTER,
  DELETE_AGGREGATION_FILTER,
  SET_PAGE,
  SATURATE_FROM_SAVED_SEARCH
} from 'src/store/modules/search/mutations'
import {
  DO_SEARCH
} from 'src/store/modules/search/actions'
import {
  GET_SEARCH_FILTER_TREE
} from 'src/store/modules/search-filters/getters'
import {
  FETCH_CUSTOM_DATA_FIELDS
} from 'src/store/modules/admin/custom-data/actions'

export default {
  name: 'search-results',
  components: {
    draggable,
    CollectionsButton,
    SearchFilterBranch,
    SearchResultsHeader,
    SearchResultItem,
    SearchForm
  },
  async beforeMount () {
    await this.fetchCustomDataFields()
  },
  data () {
    return {
      SEARCH_CONSTANTS,
      assetId: '',
      getFilenameFromItemData,
      showOverviewModal: false
    }
  },
  computed: {
    ...mapGetters(RIGHT_PANEL, {
      collectionsOpen: COLLECTIONS_OPEN
    }),
    ...mapGetters(SEARCH, {
      currentAggregationFilters: GET_AGGREGATION_FILTERS,
      currentPage: GET_PAGE,
      resultsPerPage: GET_PER_PAGE
    }),
    ...mapGetters(SEARCH_FILTERS, {
      filterTree: GET_SEARCH_FILTER_TREE
    }),

    ...mapGetters(SEARCH_RESULTS, {
      totalHits: GET_NUM_RESULTS,
      hasSearchResults: HAS_SEARCH_RESULTS,
      viewMode: GET_VIEW_TYPE,
      searchResults: GET_RESULTS,
      searchResultAggregations: GET_RESULTS_AGGREGATIONS,
      isResultsLoading: GET_RESULTS_LOADING,
      searchResultsError: GET_RESULTS_ERROR
    }),
    currentPageForPaginator () {
      return this.currentPage + 1
    }
  },
  methods: {
    ...mapActions(SEARCH, {
      doSearch: DO_SEARCH
    }),
    ...mapMutations(SEARCH, {
      addAggregationFilter: ADD_AGGREGATION_FILTER,
      deleteAggregationFilter: DELETE_AGGREGATION_FILTER,
      setPage: SET_PAGE,
      saturateSearchForm: SATURATE_FROM_SAVED_SEARCH
    }),
    ...mapActions(CUSTOM_DATA_ADMIN, {
      fetchCustomDataFields: FETCH_CUSTOM_DATA_FIELDS
    }),
    async executeSearch () {
      const key = await this.doSearch()
      this.$router.push({ name: this.CONSTANTS.ROUTES.SEARCH.NAME, query: { key } })
    },
    setCurrentPage (page) {
      // paging in the store is 0 based, but 1 based from Element paginator
      page = page - 1
      this.setPage(page)
      this.executeSearch()
    },
    toggleAggregationFilter: function (path, field, value, enabled = true) {
      this.setPage(0)
      enabled ? this.addAggregationFilter({ field, value }) : this.deleteAggregationFilter({ field, value })
      this.executeSearch()
    },
    onMove (evt, originalEvent) {
      // https://github.com/SortableJS/Vue.Draggable/issues/45
      let draggedId = evt.draggedContext.element.itemId
      let targetList = evt.relatedContext.list
      let inList = _.find(targetList, {_id: draggedId})
      if (inList) {
        return false
      }
    },
    onDragClone (object) {
      return {
        _id: object.itemId,
        filename: object.name,
        thumbnail: object.thumbnail,
        toDelete: false,
        fake: false
      }
    }
  }
}

</script>

<style lang="less">
@import (reference) '~src/styles/_variables.less';
@import (reference) '~src/styles/_mixins.less';

@appHeaderHeight: 40px;
@formHeaderHeight: 83px;
@sortingToolsHeight: 50px;
@rightColumnWidth: 200px;

.search-results {
  .flex-box();
  .justify-content-space-between();
  .min-max-width(100%);
  .min-max-height(calc(100vh - @appHeaderHeight - @formHeaderHeight));

  .search-results-content-left, .search-results-content-right {
    .min-max-height(calc(100vh - @appHeaderHeight - @formHeaderHeight));
    .flex-container-column();
    overflow: scroll;
  }

  .search-results-content-left {
    .flex(1, 1, auto);
    position: relative;
    .search-results-header {
      background-color: @color-base;
      position: sticky;
      top: 0;
      z-index: 1;
    }
  }

  .search-results-content-right {
    .flex(0, 0, @rightColumnWidth);
    background-color: @color-tone-light;
    border-left: 1px solid @color-tone-lighter;

    .collections-button {
      color: @color-primary;
      cursor: pointer;
      font-family: @default-font-family-black;
      font-size: 11px;
      margin-bottom: 7px;
      padding: 20px 10px;
      text-align: center;
      text-transform: uppercase;
      width: 100%;

      &:hover {
        color: @color-accent;
      }

      > div {
        height: auto;
      }
    }
  }
} // .search-results

.search-result-items {
  .min-max-width(100%);
  padding: 10px 20px;
  .results-draggable {
    .min-max-width(100%);
    padding-bottom: 20px;
  }
  // list view layout
  &.list {
    .flex-container-column();
    .search-result-item {
      margin-bottom: 10px;
    }
  }
  // grid view layout
  &.grid {
    > .results-draggable {
      .flex-container();
      flex-wrap: wrap;
    }
    .search-result-item {
      margin: 0 10px 10px 0;
    }
  }
}
</style>
