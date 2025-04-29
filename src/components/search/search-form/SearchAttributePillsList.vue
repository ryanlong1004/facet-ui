<template>
  <div class="search-attribute-pills-list" ref="pills-list">
    <div
      class="pill-wrapper"
      ref="pill-wrapper"
      :class="{ 'scrolling': showPillScrolling }"
      :style="{ left: `${pillsOffset}px` }">
      <search-attribute-pill
        v-for="pill in pills"
        :key="pill.key"
        :icon="pill.icon"
        :text="pill.text"
        :attribute-key="pill.key"
        :allow-close="pill.type !== KEYWORD_PILL_TYPE"
        @delete-pill="deletePill"/>
      <search-attribute-pill
        v-if="customFields.length > 0"
        :key="'custom-fields'"
        :icon="'fas fa-clipboard-list'"
        :text="'Custom Fields...'"
        :attribute-key="'custom-fields'"
        :allow-close="false"
        @clicked="toggleCustomFields"/>
      <search-attribute-pill
        v-if="advancedOptionsUsed"
        :key="'advanced'"
        :icon="'far fa-chevron-right'"
        :text="'More Options...'"
        :attribute-key="'advanced'"
        :allow-close="false"
        @clicked="toggleAdvancedOptions"/>
    </div>
    <div
      class="pager pager-left"
      v-if="showPillScrolling"
      @click.stop="scrollPillsLeft"
    >
      <i class="fal fa-angle-left"></i>
    </div>
    <div
      class="pager pager-right"
      v-if="showPillScrolling"
      @click.stop="scrollPillsRight"
    >
      <i class="fal fa-angle-right"></i>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import shortid from 'shortid'
import { mapGetters, mapMutations } from 'vuex'

import { SEARCH_CONSTANTS } from 'src/constants-search'
import SearchAttributePill from 'src/components/search/search-form/SearchAttributePill.vue'

import { SEARCH } from 'src/store/storeModules'
import {
  getSearchAttributeByType
} from 'src/store/modules/search/helpers'
import {
  ADVANCED_OPTIONS_USED,
  GET_ATTRIBUTES,
  GET_CUSTOM_FIELDS,
  GET_KEYWORD,
  GET_SHOW_ADVANCED
} from 'src/store/modules/search/getters'
import {
  DELETE_ATTRIBUTE,
  SET_ACTIVE_ATTRIBUTE_TYPE,
  SET_SHOW_ADVANCED
} from 'src/store/modules/search/mutations'

const DEFAULT_PILL_OFFSET = 3

export default {
  name: 'search-attribute-pills-list',

  components: {
    SearchAttributePill
  },

  data () {
    return {
      KEYWORD_PILL_TYPE: SEARCH_CONSTANTS.ATTRIBUTE_TYPES.KEYWORD.type,
      pillsOffset: DEFAULT_PILL_OFFSET,
      showPillScrolling: false
    }
  },
  
  mounted () {
    window.addEventListener('resize', this.checkPillOverflow)
    this.$watch('searchAttributes.length', (newVal, oldVal) => {
      if (newVal !== oldVal) {
        this.$nextTick(this.checkPillOverflow)
      }
    }, { immediate: true })
  },

  destroyed () {
    window.removeEventListener('resize', this.checkPillOverflow)
  },

  computed: {
    ...mapGetters(SEARCH, {
      advancedOptionsUsed: ADVANCED_OPTIONS_USED,
      customFields: GET_CUSTOM_FIELDS,
      keyword: GET_KEYWORD,
      searchAttributes: GET_ATTRIBUTES,
      showAdvanced: GET_SHOW_ADVANCED
    }),
    pills () {
      const attrs = this.searchAttributes.map(a => {
        const attrConfig = getSearchAttributeByType(a.type)
        return _.assign({}, attrConfig, {
          key: a.key,
          text: a.value
        })
      })
      // we want to render a keyword pill even though it's not a 'real' attribute
      if (this.keyword.length > 0) {
        attrs.unshift(_.assign({}, SEARCH_CONSTANTS.ATTRIBUTE_TYPES.KEYWORD, {
          text: this.keyword,
          key: SEARCH_CONSTANTS.ATTRIBUTE_TYPES.KEYWORD.field 
        }))
      }
      return attrs
    }
  },

  methods: {
    ...mapMutations(SEARCH, {
      deletePill: DELETE_ATTRIBUTE,
      setActiveAttribute: SET_ACTIVE_ATTRIBUTE_TYPE,
      setShowAdvanced: SET_SHOW_ADVANCED
    }),
    _getWidths () {
      const inputWrapper = this.$refs['pills-list']
      const pillWrapper = this.$refs['pill-wrapper']
      try {
        const inputWidth = inputWrapper.offsetWidth
        const pillWidth = pillWrapper.offsetWidth
        return {
          inputWidth,
          pillWidth
        }
      } catch (err) {
        return {
          inputWidth: 0,
          pillWidth: 0
        }
      }      
    },
    checkPillOverflow () {
      const { inputWidth, pillWidth } = this._getWidths()
      if (!inputWidth && !pillWidth) {
        return
      }
      this.showPillScrolling = pillWidth > inputWidth
      if (pillWidth <= inputWidth) {
        this.pillsOffset = DEFAULT_PILL_OFFSET
      }
    },
    scrollPillsLeft () {
      this.pillsOffset = Math.min(DEFAULT_PILL_OFFSET, this.pillsOffset + 100)
    },
    scrollPillsRight () {
      const { inputWidth, pillWidth } = this._getWidths()
      this.pillsOffset = Math.max(inputWidth - pillWidth - DEFAULT_PILL_OFFSET, this.pillsOffset - 100 - DEFAULT_PILL_OFFSET)
    },
    toggleAdvancedOptions () {
      if (this.showAdvanced) {
        this.setShowAdvanced(false)
      } else {
        this.setShowAdvanced(true)
      }
    },
    toggleCustomFields () {
      this.setShowAdvanced(false)
      this.setActiveAttribute(SEARCH_CONSTANTS.ATTRIBUTE_TYPES.CUSTOM_FIELDS.type)
    }
  }
}
</script>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables.less';
@import (reference) '~src/styles/_mixins.less';

.search-attribute-pills-list {
  .flex-box();
  .size(620px, 31px);
  background-color: @color-base;
  border: 1px solid @box-border-grey;
  border-right: 0;
  cursor: pointer;
  overflow: hidden;
  position: relative;

  .pill-wrapper {
    .abs-pos(3px, auto, auto, auto);
    .flex-box();
    .vendor-prefix(transition, left ease-out 100ms);
    height: 24px;

    &.scrolling {
      padding-left: 20px;
      padding-right: 20px;
    }
  }

  .pager {
    .abs-pos(0, auto, auto, auto);
    .flex-container-center();
    .size(24px, 31px);
    background-color: @color-base;
    color: @color-tone-darkest;
    cursor: pointer;
    font-size: 15px;

    &.pager-left {
      left: 0;
    }
    &.pager-right {
      right: 0;
    }
    &:hover {
      color: @color-tone;
    }
  }
}
</style>
