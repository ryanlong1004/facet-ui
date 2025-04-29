<template>
  <el-autocomplete
    :fetch-suggestions="debouncedQueryLogos"
    :select-when-unmatched="false"
    :trigger-on-focus="false"
    @select="handleSelectLogos"
    class="autocomplete-input"
    popper-class="search-typeahead"
    v-model="logosTypeahead"
    @keydown.esc.native.exact="cancel"
    @keydown.shift.tab.native.prevent.stop.exact="handleShiftTabKey"
    @keydown.tab.native.prevent.stop.exact="handleTabKey"
  >
  </el-autocomplete>
</template>

<script>
import { logoTypeaheadSearch } from 'src/components/search/typeahead-helper'

export default {
  name: 'type-ahead-logos',

  data () {
    return {
      debouncedQueryLogos: _.noop, // to be overwritten
      logosTypeahead: ''
    }
  },

  created () {
    this.debouncedQueryLogos = _.debounce(logoTypeaheadSearch, 250)
  },

  methods: {
    handleSelectLogos (logo) {
      this.$emit('logo-selected', logo)
      this.logosTypeahead = ''
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
