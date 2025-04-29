<template>
  <div class="search-form">
    <div class="logo-wrapper" v-if="showLogo">
      <logo-image :type="CONSTANTS.LOGOS.APP_LOGO_DARK"></logo-image>
    </div>
    <div class="search-input-wrapper">
      <input
        v-if="showBasicQuery"
        type="text"
        ref="basic-query-input"
        class="basic-query-input"
        v-model="keyword"
        @keydown.enter.stop="executeSearch"
        @keydown.tab.stop.prevent="handleTab"/>
      <search-attribute-pills-list v-else />
      <button v-if="isFormResetable" class="remove-pills" @click="resetSearch">
        <i class="fal fa-times"></i>
      </button>
      <button
        ref="search-button"
        class="search-button"
        @click="executeSearch"
        @keydown.tab.stop.prevent.exact="handleTab"
        @keydown.shift.tab.stop.prevent.exact="handleSubmitShiftTab">
        <i class="fas fa-search"></i>
      </button>
    </div> <!-- search-input-wrapper -->
    <search-attribute-tabs></search-attribute-tabs>
    <div class="attributes-wrapper">
      <search-attribute-inputs @execute-search="executeSearch" @tab-forward="handleTab" @tab-back="handleShiftTab"></search-attribute-inputs>
    </div>
    <advanced-search-form v-if="showAdvanced" @tab-forward="handleTab" @tab-back="handleShiftTab"></advanced-search-form>
  </div>
</template>

<script>
import _ from 'lodash'
import { mapGetters, mapMutations, mapActions } from 'vuex'

import { CONSTANTS } from 'src/constants'
import { SEARCH_CONSTANTS } from 'src/constants-search'
import { RESET_STORE } from 'src/store/store-helpers'

// stores
import { BULK_ACTIONS, SEARCH, SEARCH_RESULTS } from 'src/store/storeModules'
import {
  ATTRIBUTE_TYPES_LIST
} from 'src/store/modules/search/helpers'
import {
  GET_KEYWORD,
  GET_ATTRIBUTES,
  GET_CUSTOM_FIELDS,
  GET_SHOW_ADVANCED,
  ADVANCED_OPTIONS_USED
} from 'src/store/modules/search/getters'
import {
  RESET_SEARCH_STATE,
  ADD_ATTRIBUTE,
  SET_KEYWORD,
  SET_ACTIVE_ATTRIBUTE_TYPE,
  CLEAR_ACTIVE_ATTRIBUTE_TYPE,
  SET_SHOW_ADVANCED,
  SET_PAGE
} from 'src/store/modules/search/mutations'
import {
  DO_SEARCH
} from 'src/store/modules/search/actions'
import {
  CLEAR_ITEMS
} from 'src/store/modules/bulk-actions'

// sub components
import AdvancedSearchForm from 'src/components/search/search-form/AdvancedSearchForm.vue'
import LogoImage from 'src/components/global/LogoImage.vue'
import SearchAttributeInputs from 'src/components/search/search-form/SearchAttributeInputs.vue'
import SearchAttributePillsList from 'src/components/search/search-form/SearchAttributePillsList.vue'
import SearchAttributeTabs from 'src/components/search/search-form/SearchAttributeTabs.vue'

export default {
  name: 'search-form',
  props: {
    showLogo: {
      type: Boolean,
      default: true
    }
  },
  components: {
    AdvancedSearchForm,
    LogoImage,
    SearchAttributeInputs,
    SearchAttributePillsList,
    SearchAttributeTabs
  },
  mounted () {
    if (this.keyword.length > 0 && _.get(this.$route, 'query.key.length', 0) === 0) {
      this.setActiveAttributeType(SEARCH_CONSTANTS.ATTRIBUTE_TYPES.KEYWORD.type)
    } else if (this.searchAttributes.length === 0) {
      const ref = this.$refs['basic-query-input']
      if (ref && ref.focus) {
        ref.focus()
      }
    }
  },
  computed: {
    ...mapGetters(SEARCH, {
      advancedOptionsUsed: ADVANCED_OPTIONS_USED,
      customFields: GET_CUSTOM_FIELDS,
      searchAttributes: GET_ATTRIBUTES,
      showAdvanced: GET_SHOW_ADVANCED
    }),
    isFormResetable () {
      return this.searchAttributes.length > 0 || this.keyword.length > 0 || this.advancedOptionsUsed
    },
    showBasicQuery () {
      return this.searchAttributes.length === 0 && this.advancedOptionsUsed === false && this.customFields.length === 0
    },
    keyword: {
      get () {
        return this.unescapeHTML(this.$store.getters[`${SEARCH}/${GET_KEYWORD}`])
      },
      set (val) {
        this.$store.commit(`${SEARCH}/${SET_KEYWORD}`, this.unescapeHTML(val))
      }
    },
    isNewSearchPage () {
      return (_.get(this.$route, 'name', '') === this.CONSTANTS.ROUTES.SEARCH.NAME) && (_.get(this.$route, 'query.key.length', 0) === 0)
    }
  },
  methods: {
    ...mapActions(BULK_ACTIONS, {
      resetBulkItems: CLEAR_ITEMS
    }),
    ...mapActions(SEARCH, {
      doSearch: DO_SEARCH
    }),
    ...mapMutations(SEARCH, {
      resetSearchState: RESET_SEARCH_STATE,
      addAttribute: ADD_ATTRIBUTE,
      setActiveAttributeType: SET_ACTIVE_ATTRIBUTE_TYPE,
      clearActiveAttributeType: CLEAR_ACTIVE_ATTRIBUTE_TYPE,
      setShowAdvanced: SET_SHOW_ADVANCED,
      setPage: SET_PAGE,
    }),
    ...mapMutations(SEARCH_RESULTS, {
      resetSearchResultsState: RESET_STORE
    }),
    async executeSearch () {
      this.clearActiveAttributeType()
      this.setShowAdvanced(false)
      this.setPage()
      const key = await this.doSearch()
      this.$router.push({ name: this.CONSTANTS.ROUTES.SEARCH.NAME, query: { key }})
    },
    focusSubmitButton () {
      const ref = this.$refs['search-button']
      if (ref && ref.focus) {
        ref.focus()
      }
    },
    handleTab (e) {
      if (this.showAdvanced) {
        this.setShowAdvanced(false)
        this.focusSubmitButton()
      } else if (this.searchAttributes.length === 0) {
        this.setActiveAttributeType(ATTRIBUTE_TYPES_LIST[0].type)
      }
    },
    handleShiftTab (e) {
      if (this.showAdvanced) {
        this.setShowAdvanced(false)
        this.setActiveAttributeType(ATTRIBUTE_TYPES_LIST[ATTRIBUTE_TYPES_LIST.length - 1].type)
      } else if (this.searchAttributes.length === 0) {
        if (this.keyword.trim().length > 0) {
          this.focusSubmitButton()
        } else {
          this.clearActiveAttributeType()
          this.setShowAdvanced(true)
        }
      }
    },
    handleSubmitShiftTab (e) {
      this.setShowAdvanced(true)
    },
    resetSearch () {
      this.resetSearchState()
      this.resetSearchResultsState()
      this.resetBulkItems()
    },
    escapeHTML (html) {
      let escapeEl = document.createElement('textarea')
      escapeEl.textContent = html
      return escapeEl.innerHTML
    },

    unescapeHTML (html) {
      let escapeEl = document.createElement('textarea')
      escapeEl.innerHTML = html
      return escapeEl.textContent
    }
  }
}
</script>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables.less';
@import (reference) '~src/styles/_mixins.less';

.search-form {
  margin-top: 181px;
  width: 652px;

  .logo-wrapper {
    .flex-container-center();
    .app-logo {
      height: 55.9px;
      margin-bottom: 23.1px;
    }
  }

  .basic-query-input {
    .size(620px, 31px);
    background-color: @color-base;
    border: 1px solid @box-border-grey;
    border-right: 0;
    color: @color-primary;
    padding: 0 10px;
  }

  .search-input-wrapper {
    .flex-container();
    position: relative;

    button {
      .size(31px, 31px);
      background-color: @color-tone-light;
      border: 1px solid @color-tone-lighter;
      border-left: 0;

      i {
        color: @color-tone-lighter;
      }

      &:hover {
        background-color: @color-accent;
        cursor: pointer;

        i {
          color: @color-base;
        }
      }

      &.search-button {
        background-color: @color-accent;
        cursor: pointer;
        i {
          color: @color-base;
        }
        &:disabled {
          background-color: @color-tone-lightest;
          cursor: not-allowed;
          &:hover {
            background-color: @color-tone-lightest;
          }
        }
        &:hover, &:focus {
          background-color: @primary-button-color-darken__hover;
        }
        &:focus {
          border-color: @primary-button-color-darken__hover;
        }
      }

      &.remove-pills {
        .size(auto, 31px);
        background-color: @color-base;
        border-left: 0;
        border-right: 0;

        i {
          color: @color-tone-darkest;
          font-size: 11px;
          position: relative;
          top: 1px;
        }

        &:hover {
          background-color: @color-base;
          cursor: pointer;

          i {
            color: @color-tone;
          }
        }
      }
    }
  } // .search-input-wrapper

  .attributes-wrapper {
    position: relative;
    .search-attribute-inputs {
      position: absolute;
    }
  }
}
</style>
