<template>
  <div class="search-attribute-tabs">
    <div class="attribute-tabs">
      <search-attribute-tab
        v-for="attr in ATTRIBUTE_TYPES_LIST"
        :key="attr.type"
        :attribute-type="attr.type"
        :icon-class="attr.icon"
        :label="attr.title"
        :number-hint="attributeCounts[attr.type]"
      />
      <div class="more-options-tab" :class="{ active: showAdvanced }" @click.stop="toggleAdvancedOptions">
        <i class="far fa-chevron-right"></i> <span>More options</span><span v-if="advancedOptionsUsed" class="number-hint">!</span>
      </div>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import { mapGetters, mapMutations } from 'vuex'

import SearchAttributeTab from 'src/components/search/search-form/SearchAttributeTab.vue'

import { SEARCH_CONSTANTS } from 'src/constants-search'
import { SEARCH } from 'src/store/storeModules'
import {
  GET_ATTRIBUTES,
  GET_ACTIVE_ATTRIBUTE_TYPE,
  GET_CUSTOM_FIELDS,
  GET_SHOW_ADVANCED,
  ADVANCED_OPTIONS_USED
} from 'src/store/modules/search/getters'
import {
  SET_ACTIVE_ATTRIBUTE_TYPE,
  CLEAR_ACTIVE_ATTRIBUTE_TYPE,
  SET_SHOW_ADVANCED
} from 'src/store/modules/search/mutations'
import {
  ATTRIBUTE_TYPES_LIST
} from 'src/store/modules/search/helpers'

export default {
  name: 'search-attribute-tabs',

  components: {
    SearchAttributeTab
  },

  mounted () {
    this.$watch('currentAttributeType', (newVal, oldVal) => {
      if (newVal) {
        if (this.showAdvanced) {
          this.setShowAdvanced(false)
        }
      }
    })
    this.$watch('showAdvanced', newVal => {
      if (newVal === true) {
        this.clearActiveAttributeType()
      }
    })
  },

  data () {
    return {
      ATTRIBUTE_TYPES_LIST,
      inputText: ''
    }
  },

  computed: {
    ...mapGetters(SEARCH, {
      advancedOptionsUsed: ADVANCED_OPTIONS_USED,
      currentAttributes: GET_ATTRIBUTES,
      currentAttributeType: GET_ACTIVE_ATTRIBUTE_TYPE,
      customFields: GET_CUSTOM_FIELDS,
      showAdvanced: GET_SHOW_ADVANCED
    }),
    attributeCounts () {
      let counts = _.countBy(this.currentAttributes, a => a.type)
      counts[SEARCH_CONSTANTS.ATTRIBUTE_TYPES.CUSTOM_FIELDS.type] = this.customFields.length
      return counts
    }
  },

  methods: {
    ...mapMutations(SEARCH, {
      setActiveAttribute: SET_ACTIVE_ATTRIBUTE_TYPE,
      clearActiveAttributeType: CLEAR_ACTIVE_ATTRIBUTE_TYPE,
      setShowAdvanced: SET_SHOW_ADVANCED
    }),
    toggleAdvancedOptions () {
      if (this.showAdvanced) {
        this.setShowAdvanced(false)
      } else {
        this.setShowAdvanced(true)
      }
    }
  }
}
</script>

<style lang="less">
@import (reference) '~src/styles/_variables.less';
@import (reference) '~src/styles/_mixins.less';

.search-attribute-tabs {
  width: 100%;

  .attribute-tabs {
    .flex-container();
  }

  .more-options-tab {
    .flex-container-center();
    color: @color-tone-darkest;
    cursor: pointer;
    height: 36px;
    padding: 0 10px 0 7px;
    > i {
      font-size: 10px;
      margin-right: 7px;
      transition: transform 50ms ease-out;
    }
    > span {
      font-family: @default-font-family-black;
      font-size: 10px;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .number-hint {
      .flex-container-center();
      background-color: @color-tone-lighter;
      border-radius: 50%;
      color: @color-tone-darker;
      font-family: @default-font-family-medium;
      font-size: 10px;
      font-weight: 800;
      line-height: 0px;
      margin: -6px 0 0 3px;
      height: 12px;
      width: 12px;
    }
    &:hover {
      color: @color-primary;
      .number-hint {
        background-color: @color-tone-lightest;
        color: @color-primary;
      }
    }
    &.active {
      background-color: @color-accent;
      color: @color-base;
      > i {
        transform: rotate(90deg);
      }
      .number-hint {
        background-color: @color-base;
        color: @color-accent;
      }
    }
  }
}
</style>
