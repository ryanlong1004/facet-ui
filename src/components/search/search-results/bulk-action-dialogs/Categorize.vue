<template>
  <div v-loading="isBusy">
    <h2>Enter one or more categories to add to the {{ selectedItemCountHumanized }}:</h2>
    <el-autocomplete
      :disabled="isBusy"
      :fetch-suggestions="categoriesTypeaheadSearch"
      :select-when-unmatched="false"
      :trigger-on-focus="true"
      @select="addNewCategory"
      @keyup.native.enter="handleEnterKey"
      class="autocomplete-parent"
      placeholder="Type a new category and press ENTER"
      popper-class="categories-typeahead"
      v-model="categoriesString"
    >
    </el-autocomplete>
    <ul class="tags">
      <li v-for="cat in categories" :key="cat">{{ cat }} <i class="far fa-times" @click="removeCategory(cat)"></i></li>
    </ul>
    <el-button size="mini" type="primary" @click="addCategories" :disabled="isButtonDisabled"><i class="fas fa-check"></i> Add categories</el-button>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { pluralize } from 'humanize-plus'

import { categoriesTypeaheadSearch } from 'src/components/search/typeahead-helper'
import { BULK_ACTIONS } from 'src/store/storeModules'
import {
  //getters
  IS_BUSY,
  GET_SELECTED_ITEMS,
  // actions
  CATEGORIZE_SELECTED_ITEMS
} from 'src/store/modules/bulk-actions'

export default {
  name: 'bulk-categorize',
  data () {
    return {
      categoriesString: '',
      categories: []
    }
  },
  computed: {
    ...mapGetters(BULK_ACTIONS, {
      isBusy: IS_BUSY,
      selectedItems: GET_SELECTED_ITEMS
    }),
    isButtonDisabled () {
      return this.isBusy || !this.categories.length
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
      doAddCategories: CATEGORIZE_SELECTED_ITEMS
    }),
    async addCategories () {
      if (this.categoriesString.length) {
        this.handleEnterKey()
      }
      if (this.categories.length === 0) {
        return
      }
      try {
        await this.doAddCategories(this.categories)
        this.$notify({
          title: `${this.categories.length === 1 ? 'Category' : 'Categories' } added`,
          message: `${this.categories.length} ${this.categories.length === 1 ? 'category' : 'categories' } successfully added`,
          type: 'success'
        });
      } catch (err) {
        console.error(err)
        this.$notify({
          title: 'Error',
          message: 'Error categorizing one or more files, please try again',
          type: 'error'
        })
      }
    },
    addNewCategory (catObject) {
      this.doAddNewCategory(catObject.value.trim())
      this.categoriesString = ''
    },
    categoriesTypeaheadSearch,
    doAddNewCategory (cat) {
      if (this.categories.findIndex(c => c === cat) < 0) {
        this.categories.push(cat)
      }
    },
    handleEnterKey () {
      this.categoriesString.split(',').forEach(s => {
        this.doAddNewCategory(s.trim())
      })
      this.categoriesString = ''
    },
    removeCategory (cat) {
      this.categories = this.categories.filter(c => c !== cat)
    }
  }
}
</script>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.el-autocomplete {
  width: 100%;
}
.tags {
  list-style: none;
  margin: 0;
  padding: 10px 0;
  > li {
    .flex-container-center();
    background-color: @color-disabled;
    color: @color-base;
    font-size: 11px;
    margin: 0 6px 6px 0;
    padding: 4px 6px;
    i {
      color: @color-base;
      cursor: pointer;
      font-size: 11px;
      margin-left: 6px;
    }
  }  
}
</style>
