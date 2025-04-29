<template>
  <el-autocomplete
    :fetch-suggestions="debouncedQueryCategories"
    :select-when-unmatched="false"
    :trigger-on-focus="false"
    @select="handleSelectCategories"
    class="autocomplete-input"
    popper-class="search-typeahead"
    v-model="categoriesTypeahead"
    @keydown.esc.native.exact="cancel"
    @keydown.shift.tab.native.prevent.stop.exact="handleShiftTabKey"
    @keydown.tab.native.prevent.stop.exact="handleTabKey"
  >
  </el-autocomplete>
</template>

<script>
import { categoriesTypeaheadSearch } from 'src/components/search/typeahead-helper'

export default {
  name: 'type-ahead-categories',

  data () {
    return {
      debouncedQueryCategories: _.noop, // to be overwritten
      categoriesTypeahead: ''
    }
  },

  created () {
    this.debouncedQueryCategories = _.debounce(categoriesTypeaheadSearch, 250)
  },

  methods: {
    handleSelectCategories (category) {
      this.$emit('category-selected', category)
      this.categoriesTypeahead = ''
    },
    cancel () {
      this.$emit('cancel')
    },
    handleTabKey () {
      this.$emit('tab')
    },
    handleShiftTabKey () {
      this.$emit('shift-tab')
    }
  }
}
</script>
