<template>
  <div class="bulk-actions">
    <span class="bulk-count">{{ selectedItemCountHumanized }}</span>
    <el-dropdown placement="bottom-start">
      <span class="el-dropdown-link select-action">
        <i class="fas fa-chevron-right"></i> Select a bulk action
      </span>
      <el-dropdown-menu slot="dropdown" class="sorting-dropdown">
        <el-dropdown-item v-if="hasSelectedFiles"><span @click="currentBulkAction = BULK_ACTION_TYPES.COLLECTIONS">Add to collection(s)</span></el-dropdown-item>
        <el-dropdown-item v-if="hasSelectedFiles && $hasScope(SCOPES.EDIT_FIELDS)"><span @click="currentBulkAction = BULK_ACTION_TYPES.CUSTOM_FIELDS">Apply Custom Data</span></el-dropdown-item>
        <el-dropdown-item v-if="hasSelectedFiles && $hasScope(SCOPES.EDIT_CATEGORIES)"><span @click="currentBulkAction = BULK_ACTION_TYPES.CATEGORIZE">Categorize selected files</span></el-dropdown-item>
        <el-dropdown-item v-if="hasSelectedFiles && $hasScope(SCOPES.ITEM_DELETE)"><span @click="currentBulkAction = BULK_ACTION_TYPES.DELETE">Delete selected files</span></el-dropdown-item>
        <el-dropdown-item :divided="hasSelectedFiles"><span @click="selectAllItems">Select all files on page</span></el-dropdown-item>
        <el-dropdown-item v-if="hasSelectedFiles"><span @click="deselectAllItems">De-select all files</span></el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>

    <!-- bulk action modal -->
    <el-dialog
      :visible.sync="currentBulkAction.length > 0"
      :append-to-body="true"
      :before-close="closeDialog"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :title="currentActionTitle">
      <div class="bulk-dialog-content">
        <bulk-categorize v-if="currentBulkAction === BULK_ACTION_TYPES.CATEGORIZE"/>
        <bulk-collections v-if="currentBulkAction === BULK_ACTION_TYPES.COLLECTIONS"/>
        <bulk-custom-fields v-if="currentBulkAction === BULK_ACTION_TYPES.CUSTOM_FIELDS"/>
        <bulk-delete v-if="currentBulkAction === BULK_ACTION_TYPES.DELETE"/>
      </div>
    </el-dialog>

  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { pluralize } from 'humanize-plus'

import BulkCategorize from './bulk-action-dialogs/Categorize.vue'
import BulkCollections from './bulk-action-dialogs/Collections.vue'
import BulkCustomFields from './bulk-action-dialogs/CustomFields.vue'
import BulkDelete from './bulk-action-dialogs/Delete.vue'

import { BULK_ACTIONS } from 'src/store/storeModules'
import {
  BULK_ACTION_TYPES,
  //getters
  GET_SELECTED_ITEMS,
  // actions
  CLEAR_ITEMS,
  SELECT_ALL_ITEMS
} from 'src/store/modules/bulk-actions'

export default {
  name: 'bulk-item-actions',
  components: {
    BulkCategorize,
    BulkCollections,
    BulkCustomFields,
    BulkDelete
  },
  data () {
    return {
      BULK_ACTION_TYPES,
      currentBulkAction: ''
    }
  },
  computed: {
    ...mapGetters(BULK_ACTIONS, {
      selectedItems: GET_SELECTED_ITEMS
    }),
    currentActionTitle () {
      switch (this.currentBulkAction) {
        case BULK_ACTION_TYPES.CATEGORIZE:
          return 'Categorize selected files'
        case BULK_ACTION_TYPES.COLLECTIONS:
          return 'Add to collection(s)'
        case BULK_ACTION_TYPES.CUSTOM_FIELDS:
          return 'Apply Custom Field Value'
        case BULK_ACTION_TYPES.DELETE:
          return 'Delete selected files'
        default:
          return ''
      }
    },
    hasSelectedFiles () {
      return this.selectedItemCount > 0
    },
    selectedItemCount () {
      return this.selectedItems.length
    },
    selectedItemCountHumanized () {
      return `${this.selectedItemCount} selected ${pluralize(this.selectedItemCount, 'file', 'files')}`
    }
  },
  methods: {
    ...mapActions(BULK_ACTIONS, {
      selectAllItems: SELECT_ALL_ITEMS,
      deselectAllItems: CLEAR_ITEMS
    }),
    closeDialog () {
      this.currentBulkAction = ''
    }
  }
}
</script>

<style lang="less">
@import (reference) '~src/styles/_variables.less';
@import (reference) '~src/styles/_mixins.less';

.bulk-actions {
  .flex-container();
  border: 1px solid @color-tone-lightest;
  border-radius: 3px;
  color: @color-primary;
  font-family: @default-font-family-medium;
  font-size: 10px;
  height: 26px;
  padding: 2px;
  text-transform: uppercase;
  .bulk-count {
    background-color: @color-accent;
    border-radius: 3px;
    color: @color-base;
    padding: 4px 6px;
  }
  .el-dropdown {
    font-size: 10px;
  }
  .el-dropdown-link.select-action {
    cursor: pointer;
    font-size: 10px;
    margin: 0;
    padding: 4px 8px;
  }
}
// attached to body
.el-dropdown-menu.sorting-dropdown {
  border: 1px solid @color-tone-lightest;
  box-shadow: 2px 2px 4px rgba(0, 0, 0, .1);
  margin-top: 8px;
  padding: 4px 0;
  .el-dropdown-menu__item {
    color: @color-primary;
    font-family: @default-font-family-medium;
    font-size: 11px;
    line-height: 26px;
    padding: 0 10px;
    text-transform: uppercase;
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

.bulk-dialog-content {
  h2, h4 {
    color: @color-primary;
    font-family: @default-font-family-black;
    font-size: 12px;
    margin: 0 0 10px 0;
    text-transform: uppercase;
  }
  h4 {
    font-size: 11px;
    margin-bottom: 15px;
  }
  p {
    font-size: 12px;
    line-height: 1.5;
    word-break: normal;
  }
}
</style>
