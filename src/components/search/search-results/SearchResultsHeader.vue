<template>
  <div class="search-results-header">
    <div class="view-type">
      <i class="fas fa-th-list view-type-list" :class="{ active: viewType === VIEW_TYPES.LIST }" @click="applyViewType(VIEW_TYPES.LIST)"></i>
      <i class="fas fa-th-large view-type-grid" :class="{ active: viewType === VIEW_TYPES.GRID }" @click="applyViewType(VIEW_TYPES.GRID)"></i>
    </div>
    <h5 class="num-results">{{ numResultsHumanized }}</h5>
    <div class="per-page sorting">
      <el-dropdown
        placement="bottom"
        trigger="hover"
        :hide-on-click="false">
        <div><span>{{ resultsPerPage }} results/page</span></div>
        <el-dropdown-menu slot="dropdown" class="per-page-dropdown sorting-dropdown">
          <el-dropdown-item><span @click="applyPerPage(25)">25 results/page</span></el-dropdown-item>
          <el-dropdown-item><span @click="applyPerPage(50)">50 results/page</span></el-dropdown-item>
          <el-dropdown-item><span @click="applyPerPage(100)">100 results/page</span></el-dropdown-item>
          <el-dropdown-item><span @click="applyPerPage(200)">200 results/page</span></el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>
    <bulk-item-actions />
    <div class="sorting">
      <el-dropdown
        placement="bottom"
        trigger="hover"
        :hide-on-click="false">
        <div>
          <i
          class="fas"
          :class="{
            'fa-chevron-down': (sortField === '') || (sortDirection === SORT_DIRECTIONS.DESCENDING),
            'fa-chevron-up': sortDirection === SORT_DIRECTIONS.ASCENDING
          }"></i> <span @click="applySort(sortField)">{{ sortLabel }}</span>
        </div>
        <el-dropdown-menu slot="dropdown" class="sorting-dropdown">
          <el-dropdown-item><span @click="applySort('')">Most relevant</span></el-dropdown-item>
          <el-dropdown-item><span @click="applySort(SORTING_TYPES.LAST_HARVESTED.field)">Last Analyzed</span></el-dropdown-item>
          <el-dropdown-item><span @click="applySort(SORTING_TYPES.NAME.field)">File name</span></el-dropdown-item>
          <el-dropdown-item><span @click="applySort(SORTING_TYPES.SIZE.field)">File size</span></el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapMutations, mapActions } from 'vuex'
import { pluralize } from 'humanize-plus'

import { CONSTANTS } from 'src/constants'
import { SEARCH_CONSTANTS } from 'src/constants-search'

import BulkItemActions from 'src/components/search/search-results/BulkItemActions.vue'

import { BULK_ACTIONS, SEARCH, SEARCH_RESULTS } from 'src/store/storeModules'
const SORT_TYPES_FLAT = Object.values(SEARCH_CONSTANTS.SORTING_TYPES)

import {
  GET_PER_PAGE,
  GET_SORTING_DIRECTION,
  GET_SORTING_FIELD
} from 'src/store/modules/search/getters'
import {
  SET_PER_PAGE,
  SET_SORTING
} from 'src/store/modules/search/mutations'
import {
  DO_SEARCH
} from 'src/store/modules/search/actions'
import {
  GET_NUM_RESULTS,
  GET_NUM_RESULTS_HUMANIZED,
  GET_VIEW_TYPE
} from 'src/store/modules/search-results/getters'
import {
  SET_VIEW_TYPE
} from 'src/store/modules/search-results/mutations'
import {
  GET_SELECTED_ITEMS
} from 'src/store/modules/bulk-actions'

const VIEW_MODE_LOCAL_STORAGE_KEY = 'gm_search_results_view_mode'

export default {
  name: 'search-results-header',
  components: {
    BulkItemActions
  },
  beforeMount () {
    const viewType = this.$localStorage.get(VIEW_MODE_LOCAL_STORAGE_KEY)
    if (viewType) {
      this.setViewType(viewType)
    }
  },
  data () {
    return {
      SORT_DIRECTIONS: CONSTANTS.SORT_DIRECTIONS,
      SORTING_TYPES: SEARCH_CONSTANTS.SORTING_TYPES,
      VIEW_TYPES: SEARCH_CONSTANTS.RESULTS_VIEW_TYPES
    }
  },
  computed: {
    ...mapGetters(BULK_ACTIONS, {
      selectedItems: GET_SELECTED_ITEMS
    }),
    ...mapGetters(SEARCH, {
      resultsPerPage: GET_PER_PAGE,
      sortDirection: GET_SORTING_DIRECTION,
      sortField: GET_SORTING_FIELD
    }),
    ...mapGetters(SEARCH_RESULTS, {
      numResults: GET_NUM_RESULTS,
      numResultsHumanized: GET_NUM_RESULTS_HUMANIZED,
      viewType: GET_VIEW_TYPE
    }),
    hasSelectedItems () {
      return this.selectedItems.length > 0
    },
    sortLabel () {
      const t = SORT_TYPES_FLAT.find(t => t.field === this.sortField)
      if (t) {
        return t.label
      } else {
        return 'Most relevant'
      }
    }
  },
  methods: {
    ...mapActions(SEARCH, {
      doSearch: DO_SEARCH
    }),
    ...mapMutations(SEARCH, {
      setPerPage: SET_PER_PAGE,
      setSort: SET_SORTING
    }),
    ...mapMutations(SEARCH_RESULTS, {
      setViewType: SET_VIEW_TYPE
    }),
    async applyPerPage (num) {
      this.setPerPage(num)
      const key = await this.doSearch()
      this.$router.push({ name: this.CONSTANTS.ROUTES.SEARCH.NAME, query: { key }})
    },
    async applySort (field) {
      let direction = CONSTANTS.SORT_DIRECTIONS.DESCENDING
      if (this.sortField === field) {
        if (this.sortDirection === CONSTANTS.SORT_DIRECTIONS.DESCENDING) {
          direction = CONSTANTS.SORT_DIRECTIONS.ASCENDING
        } else {
          direction = CONSTANTS.SORT_DIRECTIONS.DESCENDING
        }
      }
      this.setSort({ field, direction })
      const key = await this.doSearch()
      this.$router.push({ name: this.CONSTANTS.ROUTES.SEARCH.NAME, query: { key }})
    },
    applyViewType (type) {
      this.setViewType(type)
      this.$localStorage.set(VIEW_MODE_LOCAL_STORAGE_KEY, type)
    }
  }
}
</script>

<style lang="less">
@import (reference) '~src/styles/_variables.less';
@import (reference) '~src/styles/_mixins.less';

// font mixin
.sorting-font() {
  color: @color-primary;
  font-family: @default-font-family-medium;
  font-size: 11px;
  text-transform: uppercase;
}

.search-results-header {
  .flex-container-between();
  min-width: 100%;
  padding: 0 20px;
  .view-type {
    .flex-box();
    i {
      color: @color-primary;
      cursor: pointer;
      font-size: 14px;
      margin-right: 10px;
      &:hover, &.active {
        color: @color-accent;
      }
    }
  }
  .num-results {
    color: @color-tone-darkest;
    font-family: @default-font-family-medium;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
  }
  .sorting .el-dropdown {
    .flex-container-center();
    .sorting-font();
    i {
      font-size: 10px;
      margin-right: 4px;
    }
    cursor: pointer;
  }
}

// attached to body
.el-dropdown-menu.sorting-dropdown {
  border: 1px solid @color-tone-lightest;
  box-shadow: 2px 2px 4px rgba(0, 0, 0, .1);
  margin-top: 8px;
  padding: 4px 0;
  .el-dropdown-menu__item {
    .sorting-font();
    line-height: 26px;
    padding: 0 10px;
    &:hover {
      color: @color-accent;
    }
    &:focus {
      background-color: transparent;
    }
  }
  .el-dropdown-menu__item--divided:before {
    margin: 0;
  }
}
</style>
