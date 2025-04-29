<template>
  <el-autocomplete
    :fetch-suggestions="debouncedQueryTags"
    :select-when-unmatched="false"
    :trigger-on-focus="false"
    @select="handleSelectTag"
    class="autocomplete-input"
    popper-class="search-typeahead"
    v-model="tagsTypeahead"
    @keydown.esc.native.exact="cancel"
    @keydown.shift.tab.native.prevent.stop.exact="handleShiftTabKey"
    @keydown.tab.native.prevent.stop.exact="handleTabKey"
  >
  </el-autocomplete>
</template>

<script>
//import { tagsTypeaheadSearch } from 'src/components/search/typeahead-helper'

export default {
  name: 'type-ahead-tags',

  data () {
    return {
      debouncedQueryTags: _.noop, // to be overwritten
      tagsTypeahead: ''
    }
  },

  // created () {
  //   this.debouncedQueryTags = _.debounce(tagsTypeaheadSearch, 250)
  // },

  methods: {
    handleSelectTag (tag) {
      this.$emit('tag-selected', tag)
      this.tagsTypeahead = ''
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
