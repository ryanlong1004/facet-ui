<template>
  <el-autocomplete
    :fetch-suggestions="debouncedQueryCustomTags"
    :select-when-unmatched="false"
    :trigger-on-focus="false"
    @select="handleSelectTag"
    class="autocomplete-input"
    popper-class="search-typeahead"
    v-model="customTagsTypeahead"
    @keydown.esc.native.exact="cancel"
    @keydown.shift.tab.native.prevent.stop.exact="handleShiftTabKey"
    @keydown.tab.native.prevent.stop.exact="handleTabKey"
  >
  </el-autocomplete>
</template>

<script>
import { customTagsTypeaheadSearch } from 'src/components/search/typeahead-helper'

export default {
  name: 'type-ahead-custom-tags',

  data () {
    return {
      debouncedQueryLogos: _.noop, // to be overwritten
      customTagsTypeahead: ''
    }
  },

  created () {
    this.debouncedQueryCustomTags = _.debounce(customTagsTypeaheadSearch, 250)
  },

  methods: {
    handleSelectTag (tag) {
      this.$emit('custom-tag-selected', tag)
      this.customTagsTypeahead = ''
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
