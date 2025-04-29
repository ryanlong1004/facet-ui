<template>
  <div class="search-attribute-inputs" v-if="currentAttributeType">
    <div :class="{
        'input-wrapper': currentAttributeType !== ATTRIBUTE_TYPES.CUSTOM_FIELDS.type,
        'custom-fields-wrapper': currentAttributeType === ATTRIBUTE_TYPES.CUSTOM_FIELDS.type
      }">
      <p class="helper-text">{{ currentAttributeConfig.hint }}</p>
      <type-ahead-categories v-if="currentAttributeType === ATTRIBUTE_TYPES.CATEGORIES.type" @category-selected="categorySelected" @cancel="cancelInput" @tab="handleTab" @shift-tab="handleShiftTab"></type-ahead-categories>
      <type-ahead-custom-tags v-else-if="currentAttributeType === ATTRIBUTE_TYPES.CUSTOM_TAGS.type" @custom-tag-selected="customTagSelected" @cancel="cancelInput" @tab="handleTab" @shift-tab="handleShiftTab"></type-ahead-custom-tags>
      <type-ahead-logos v-else-if="currentAttributeType === ATTRIBUTE_TYPES.LOGOS.type" @logo-selected="logoSelected" @cancel="cancelInput" @tab="handleTab" @shift-tab="handleShiftTab"></type-ahead-logos>
      <type-ahead-people v-else-if="currentAttributeType === ATTRIBUTE_TYPES.PEOPLE.type" @person-selected="personSelected" @cancel="cancelInput" @tab="handleTab" @shift-tab="handleShiftTab"></type-ahead-people>
      <!-- <type-ahead-tags v-else-if="currentAttributeType === ATTRIBUTE_TYPES.TAGS.type" @tag-selected="tagSelected" @cancel="cancelInput" @tab="handleTab" @shift-tab="handleShiftTab"></type-ahead-tags> -->
      <custom-fields-search-form v-else-if="currentAttributeType === ATTRIBUTE_TYPES.CUSTOM_FIELDS.type" @tab="handleTab" @shift-tab="handleShiftTab"/>
      <el-input
        v-else-if="currentAttributeType === ATTRIBUTE_TYPES.KEYWORD.type"
        v-model="keyword"
        @keydown.enter.native.exact="executeSearch"
        @keydown.ctrl.enter.native.exact="executeSearch"
        @keydown.meta.enter.native.exact="executeSearch"
        @keydown.esc.native.exact="cancelInput"
        @keydown.shift.tab.native.prevent.stop.exact="handleShiftTab"
        @keydown.tab.native.prevent.stop.exact="handleTab"
        ref="text-input"
      ></el-input>
      <el-input
        v-else
        v-model="inputText"
        @keydown.enter.native.exact="submitInput"
        @keydown.ctrl.enter.native.exact="executeSearch"
        @keydown.meta.enter.native.exact="executeSearch"
        @keydown.esc.native.exact="cancelInput"
        @keydown.shift.tab.native.prevent.stop.exact="handleShiftTab"
        @keydown.tab.native.prevent.stop.exact="handleTab"
        ref="text-input"
      ></el-input>
      <div class="keyword-options" v-if="currentAttributeType === ATTRIBUTE_TYPES.KEYWORD.type">
        <el-radio v-model="keywordType" :label="KEYWORD_TYPES.ANY">Any of these words</el-radio>
        <el-radio v-model="keywordType" :label="KEYWORD_TYPES.ALL">All of these words</el-radio>
        <el-radio v-model="keywordType" :label="KEYWORD_TYPES.PHRASE">This exact phrase</el-radio>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'

import CustomFieldsSearchForm from 'src/components/search/search-form/CustomFieldsSearchForm.vue'
import TypeAheadCategories from 'src/components/global/TypeAheadCategories'
import TypeAheadCustomTags from 'src/components/global/TypeAheadCustomTags'
import TypeAheadLogos from 'src/components/global/TypeAheadLogos'
import TypeAheadPeople from 'src/components/global/TypeAheadPeople'
import TypeAheadTags from 'src/components/global/TypeAheadTags'

import { SEARCH_CONSTANTS } from 'src/constants-search'
import { SEARCH } from 'src/store/storeModules'
import {
  GET_KEYWORD,
  GET_KEYWORD_TYPE,
  GET_ATTRIBUTES,
  GET_ACTIVE_ATTRIBUTE_TYPE,
  GET_ACTIVE_ATTRIBUTE_CONFIG,
  GET_SHOW_ADVANCED
} from 'src/store/modules/search/getters'
import {
  SET_KEYWORD,
  SET_KEYWORD_TYPE,
  ADD_ATTRIBUTE,
  SET_ACTIVE_ATTRIBUTE_TYPE,
  CLEAR_ACTIVE_ATTRIBUTE_TYPE,
  SET_SHOW_ADVANCED
} from 'src/store/modules/search/mutations'
import {
  ATTRIBUTE_TYPES_LIST
} from 'src/store/modules/search/helpers'

export default {
  name: 'search-attribute-inputs',
  components: {
    CustomFieldsSearchForm,
    TypeAheadCategories,
    TypeAheadCustomTags,
    TypeAheadLogos,
    TypeAheadPeople,
    // TypeAheadTags
  },
  mounted () {
    // watch for attribute type changes and try to focus in the text input
    this.$watch('currentAttributeType', (newVal, oldVal) => {
      if (newVal) {
        this.clearInput()
        this.focusInput()
      }
    })
  },
  data () {
    return {
      inputText: '',
      ATTRIBUTE_TYPES: SEARCH_CONSTANTS.ATTRIBUTE_TYPES,
      KEYWORD_TYPES: SEARCH_CONSTANTS.KEYWORD_TYPES
    }    
  },
  computed: {
    ...mapGetters(SEARCH, {
      currentAttributes: GET_ATTRIBUTES,
      currentAttributeType: GET_ACTIVE_ATTRIBUTE_TYPE,
      currentAttributeConfig: GET_ACTIVE_ATTRIBUTE_CONFIG,
      showAdvanced: GET_SHOW_ADVANCED
    }),
    keyword: {
      get () {
        return this.$store.getters[`${SEARCH}/${GET_KEYWORD}`]
      },
      set (val) {
        this.$store.commit(`${SEARCH}/${SET_KEYWORD}`, val)
      }
    },
    keywordType: {
      get () {
        return this.$store.getters[`${SEARCH}/${GET_KEYWORD_TYPE}`]
      },
      set (type) {
        this.$store.commit(`${SEARCH}/${SET_KEYWORD_TYPE}`, type)
      }
    }
  },
  methods: {
    ...mapMutations(SEARCH, {
      addAttribute: ADD_ATTRIBUTE,
      setActiveAttribute: SET_ACTIVE_ATTRIBUTE_TYPE,
      clearActiveAttributeType: CLEAR_ACTIVE_ATTRIBUTE_TYPE,
      setShowAdvanced: SET_SHOW_ADVANCED
    }),
    cancelInput () {
      this.clearActiveAttributeType()
      this.clearInput()
    },
    clearInput () {
      this.inputText = ''
    },
    executeSearch () {
      this.submitInput()
      this.$nextTick(() => {
        this.$emit('execute-search')
      })      
    },
    focusInput () {
      this.$nextTick(() => {
        // if this ref not found, likely a typeahead...
        let input = this.$refs['text-input'] || this.$el.querySelector('input[type="text"]')
        if (input && input.focus) {
          input.focus()
        }
      })
    },
    handleTab () {
      // tabbing out from advanced form
      if (this.showAdvanced) {
        this.setShowAdvanced(false)
        // if there is a keyword or at least one attr, tab out
        if (this.keyword.length > 0 || this.currentAttributes.length > 0) {
          this.$emit('tab-forward')
        // otherwise cycle through to first attr
        } else {
          this.setActiveAttribute(ATTRIBUTE_TYPES_LIST[0].type)
        }        
      } else if (this.inputText.trim().length === 0) {
        const cindex = ATTRIBUTE_TYPES_LIST.findIndex(a => a.type === this.currentAttributeType)
        let nextIndex = cindex + 1
        if (nextIndex >= ATTRIBUTE_TYPES_LIST.length) {
          this.setShowAdvanced(true)
        } else {
          this.setActiveAttribute(ATTRIBUTE_TYPES_LIST[nextIndex].type)
        }        
      }
    },
    handleShiftTab () {
      // if we're currently in advanced options tab...
      if (this.showAdvanced) {
        this.setShowAdvanced(false)
        this.setActiveAttribute(ATTRIBUTE_TYPES_LIST[ATTRIBUTE_TYPES_LIST.length - 1].type)
      } else if (this.inputText.trim().length === 0) {
        const cindex = ATTRIBUTE_TYPES_LIST.findIndex(a => a.type === this.currentAttributeType)
        const prevIndex = cindex - 1
        if (prevIndex < 0) {
          this.clearActiveAttributeType()
          this.$emit('tab-back')
        } else {
          this.setActiveAttribute(ATTRIBUTE_TYPES_LIST[prevIndex].type)
        }        
      }
    },
    // user wants to persist the typed attribute
    submitInput () {
      if (this.inputText.trim().length) {
        this.addAttribute({ type: this.currentAttributeType, value: this.inputText })
        this.clearInput()
      }
    },
    // selection callbacks from our typeaheads...
    categorySelected (category) {
      this.addAttribute({ type: this.currentAttributeType, value: category.value })
      this.focusInput()
    },
    customTagSelected (tag) {
      this.addAttribute({ type: this.currentAttributeType, value: tag.value })
      this.focusInput()
    },
    logoSelected (logo) {
      this.addAttribute({ type: this.currentAttributeType, value: logo.value })
      this.focusInput()
    },
    personSelected (person) {
      this.addAttribute({ type: this.currentAttributeType, value: person.name })
      this.focusInput()
    },
    // tagSelected (tag) {
    //   this.addAttribute({ type: this.currentAttributeType, value: tag.value })
    //   this.focusInput()
    // },
  }
}
</script>

<style lang="less">
@import (reference) '~src/styles/_variables.less';
@import (reference) '~src/styles/_mixins.less';

.search-attribute-inputs {
  background-color: @color-accent;
  padding: 5px;
  width: 100%;

  .input-wrapper {
    background: @color-base;
    padding: 10px 10px 8px 10px;
    width: 100%;

    .helper-text {
      color: @color-tone-darkest;
      font-size: 10px;
      font-style: italic;
      font-weight: 500;
      line-height: 1.1;
      margin: 0 0 4px;
    }

    .el-autocomplete,
    .el-input {
      width: 100%;

      .el-input__inner {
        background: @color-base;
        border: 0;
        border-bottom: 1px dotted @box-border-grey-dark;
        color: @color-darker;
        font-size: 24px ;
        font-weight: 300;
        line-height: 1.17;
        padding: 0;
      }
    }
  }

  .custom-fields-wrapper {
    background: @color-base;
    padding: 10px 10px 8px 10px;
    width: 100%;
  }

  .keyword-options {
    padding-top: 10px;
    .flex-container();
    .el-radio {
      width: auto;
      .el-radio__input .el-radio__inner {
        background-color: @color-base;
        border-color: @color-tone-lightest;
        height: 12px;
        width: 12px;
        &:after {
          height: 6px;
          width: 6px;
        }
      }
      .el-radio__label {
        color: @color-tone-darkest;
        font-size: 11px;
        padding-bottom: 2px;
        padding-left: 5px;
      }
      &.is-checked {
        .el-radio__input .el-radio__inner {
          background-color: @color-base;
          border-color: @color-tone-lightest;
          &:after {
            background-color: @color-accent;
          }
        }
      }
    }
  }
}
</style>
