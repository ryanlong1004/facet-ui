<template>
  <el-autocomplete
    :fetch-suggestions="debouncedQueryPeople"
    :select-when-unmatched="false"
    :trigger-on-focus="false"
    @select="handleSelectPeople"
    class="autocomplete-input"
    popper-class="search-typeahead"
    v-model="peopleTypeahead"
    @keydown.esc.native="cancel"
    @keydown.shift.tab.native.prevent.stop.exact="handleShiftTabKey"
    @keydown.tab.native.prevent.stop.exact="handleTabKey"
  >
    <template slot-scope="{ item }">
      <person-typeahead-entry :person-name="item.person.name" :face-image-url="item.person.faceImageUrl"></person-typeahead-entry>
    </template>
  </el-autocomplete>
</template>

<script>
import { peopleTypeaheadSearch } from 'src/components/search/typeahead-helper'
import PersonTypeaheadEntry from 'src/components/people-faces/PersonTypeaheadEntry.vue'

export default {
  name: 'type-ahead-people',

  components: {
    PersonTypeaheadEntry
  },

  data () {
    return {
      debouncedQueryPeople: _.noop, // to be overwritten
      peopleTypeahead: ''
    }
  },

  created () {
    this.debouncedQueryPeople = _.debounce(peopleTypeaheadSearch, 250)
  },

  methods: {
    handleSelectPeople (item) {
      this.$emit('person-selected', item.person)
      this.peopleTypeahead = ''
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
