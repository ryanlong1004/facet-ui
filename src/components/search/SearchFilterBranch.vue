<template>
  <ol class="search-filter-branch">
    <li
      v-for="item in filteredItems"
      v-if="item.hide !== true"
      :class="{ branch: !item.path, leaf: item.path, 'last-branch': lastBranch(item) }"
      :key="item.val"
    >
      <el-checkbox
        v-if="item.path"
        v-model="item.enabled"
        @change="localApplyFilter(item.path, item.field, item.val, item.enabled)"
      >
        {{ item.label }}
      </el-checkbox>
      <span
        v-if="!item.path && !lastBranch(item)"
        @click="toggleCollapsed(item)"
        :class="{ closed: item.collapsed }"
        class="search-filter__collapse-trigger label"
      >
        <i class="fal fa-angle-down"></i><span>{{ item.label }}</span>
      </span>
      <span
        v-if="!item.path && lastBranch(item)"
        @click="toggleCollapsed(item)"
        :class="{ collapsed: item.collapsed, 'last-branch': lastBranch(item) }"
        class="search-filter__collapse-trigger label"
      >
        <i class="fal fa-angle-down"></i><span>{{ item.label }}</span>
      </span>
      <div
        class="search-filter--collapsable"
        :class="{ collapsed: item.collapsed }"
        v-if="lastBranch(item)"
      >
        <search-filter-branch v-if="hasChildren(item)" :items="item.children" :apply-filter="applyFilter"></search-filter-branch>
      </div>
      <div
        v-if="hasChildren(item) && !lastBranch(item)"
        :class="{ 'search-filter--collapsable': !item.path, collapsed: item.collapsed }"
      >
        <search-filter-branch :items="item.children" :apply-filter="applyFilter"></search-filter-branch>
      </div>
    </li>
  </ol>
</template>

<script>
import _ from 'lodash'
import { ANALYTICS_CATEGORIES, ANALYTICS_ACTIONS } from '../../config/analytics'

function isEnabled (item) {
  if (item.enabled) {
    return true
  }
  if (item.children) {
    return item.children.some(isEnabled)
  }
  return false
}

export default {
  name: 'search-filter-branch',
  props: {
    items: Array,
    applyFilter: Function,
    collapsed: true,
    closed: false
  },
  data () {
    return {
      filteredItems: []
    }
  },
  mounted: function () {
    this.applyChanges()
  },
  watch: {
    items: function () {
      this.applyChanges()
    }
  },
  methods: {
    localApplyFilter (path, field, val, enabled) {
      this.applyFilter(path, field, val, enabled)
      this.$ma.trackEvent({
        action: ANALYTICS_ACTIONS.FILTER_SEARCH_RESULTS,
        properties: {
          category: ANALYTICS_CATEGORIES.SEARCH_RESULTS,
          filterType: path,
          filterValue: val
        }
      })
    },
    applyChanges: function () {
      this.filteredItems = this.items.map(item => ({ ...item, collapsed: !isEnabled(item) }))
    },
    hasChildren: function (branch) {
      return branch.children && branch.children.length
    },
    lastBranch: function (branch) {
      return this.hasChildren(branch) && branch.children[0].path
    },
    toggleCollapsed: function (item) {
      item.collapsed = !item.collapsed
    }
  }
}
</script>

<style lang="less">
@import '../../styles/_variables.less';

ol.search-filter-branch {
  color: @text-dark;
  display: flex;
  flex-flow: column nowrap;
  list-style: none;
  margin-top: 0;
  padding-left: 0;
  width: 100%;
  li {
    display: flex;
    flex-flow: column nowrap;

    .el-checkbox {
      display: flex;
      white-space: inherit;

      .el-checkbox__input {
        align-self: center;
      }

      .el-checkbox__label {
        font-size: 11px;
        letter-spacing: normal;
        line-height: 1.36;
      }
    }
  }
  li.branch {
    background: @collapse-background;
    margin-bottom: 1.5px;

    &.last-branch {
      background: @color-tone-light;
      margin-bottom: 0;
      padding-left: 13px;

      span.label {
        letter-spacing: 0;
        text-transform: none;
      }

      .search-filter__collapse-trigger {
        i.fal {
          font-size: 12px;
        }
      }

      &:last-of-type {
        .search-filter__collapse-trigger {
          + .search-filter--collapsable {
            .search-filter-branch {
              margin-bottom: 10px;
            }
          }
        }
      }
    }
    span.label {
      font-size: 11px;
      font-weight: 900;
      line-height: 1.36;
      margin: 10.6px 5px;
      letter-spacing: 0.9px;
      text-transform: uppercase;

      &.last-branch {
        letter-spacing: 0;
        margin: 8px 5px 5px;
        text-transform: none;
      }
    }
  }
  li.leaf {
    margin-bottom: 0;

    .search-filter__collapse-trigger {
      i.fal {
        font-size: 12px;
      }
    }
  }
}
.search-filter__collapse-trigger {
  cursor: pointer;
  i.fal {
    font-size: 15px;
    line-height: 1.25;
    margin: 0 5px 0 0;
  }
  &.closed,
  &.collapsed {
    i.fal {
      transform: rotate(-90deg)
    }
  }
}
.search-filter--collapsable {
  height: auto;

  &.closed,
  &.collapsed {
    height: 0px;
    overflow-y: hidden;
  }

  .search-filter--collapsable {
    margin-bottom: 0;
  }
}
</style>
