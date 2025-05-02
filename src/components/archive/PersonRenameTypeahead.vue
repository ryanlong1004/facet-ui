<template>
  <div class="person-rename-typeahead">
    <el-autocomplete
      v-model="newPersonName"
      class="name-input"
      popper-class="person-typeahead alternate"
      :debounce="250"
      :placeholder="inputPlaceholder"
      :disabled="disabled"
      :fetch-suggestions="query"
      :trigger-on-focus="false"
      :select-when-unmatched="true"
      @select="handleTypeaheadSelect"
      @keydown.native="handleKeyup"
      @keydown.native.enter="handleEnterKey"
      @keydown.native.esc="handleEscapeKey"
      ref="new-name-typeahead"
      value-key="label">
      <template slot-scope="{ item }">
        <person-typeahead-entry
          :person-name="item.person.name"
          :face-image-url="item.person.faceImageUrl"
        />
      </template>
    </el-autocomplete>
  </div>
</template>

<script>
import { peopleTypeaheadSearch } from 'src/components/search/typeahead-helper'
import PersonTypeaheadEntry from 'src/components/people-faces/PersonTypeaheadEntry.vue'

export default {
  name: 'person-rename-typeahead',
  props: {
    disabled: {
      type: Boolean,
      default: false
    },
    inputPlaceholder: {
      type: String,
      default: 'Enter person name...'
    },
    personName: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      query: peopleTypeaheadSearch,
      newPersonName: this.personName.slice()
    }
  },
  components: {
    PersonTypeaheadEntry
  },
  methods: {
    handleKeyup ($event) {
      this.$emit('on-change', this.newPersonName)
    },
    handleEscapeKey ($event) {
      this.$emit('on-cancel')
      this.newPersonName = ''
    },
    handleEnterKey ($event) {
      // if the name was changed, submit it
      if (this.newPersonName !== this.personName && this.newPersonName.trim().length > 0) {
        this.$emit('on-submit', this.newPersonName)
        this.newPersonName = ''
      // else cancel edit
      } else {
        this.handleEscapeKey($event)
      }
    },
    handleTypeaheadSelect (selectedPerson) {
      const p = _.get(selectedPerson, 'person')
      if (p) {
        this.$emit('on-select', p)
        this.newPersonName = ''
      }
    }
  }
}
</script>
