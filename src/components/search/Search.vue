<template>
  <div class="search">
    <section class="search-form-wrapper" :class="{ 'has-results': searchWasMade }">
      <search-form :show-logo="!searchWasMade"></search-form>
      <save-search v-if="searchWasMade"/>
    </section>
    <section class="search-results-wrapper" :class="{ 'has-results': searchWasMade }">
      <search-results/>
    </section>
  </div>
</template>

<script>
import _ from 'lodash'
import { mapGetters, mapMutations, mapActions } from 'vuex'

// components
import SaveSearch from 'src/components/search/search-form/SaveSearch.vue'
import SearchForm from 'src/components/search/search-form/SearchForm.vue'
import SearchResults from 'src/components/search/search-results/SearchResults.vue'

// stores
import { SEARCH, SEARCH_RESULTS, CUSTOM_DATA_ADMIN } from 'src/store/storeModules'
import {
  GET_SEARCH_HASH
} from 'src/store/modules/search/getters'
import {
  CLEAR_ACTIVE_ATTRIBUTE_TYPE,
  SET_SHOW_ADVANCED
} from 'src/store/modules/search/mutations'
import {
  DO_SEARCH_FROM_KEY
} from 'src/store/modules/search/actions'
import {
  HAS_SEARCH_RESULTS
} from 'src/store/modules/search-results/getters'
import {
  FETCH_CUSTOM_DATA_FIELDS
} from 'src/store/modules/admin/custom-data/actions'

export default {
  name: 'search',
  components: {
    SaveSearch,
    SearchForm,
    SearchResults
  },
  mounted () {
    this.$watch('$route.query.key', async (newVal, oldVal) => {
      if (newVal && newVal !== this.searchHash) {
        await this.fetchCustomDataFields()
        this.doSearchFromKey(newVal)
      }
    }, {immediate: true})
  },
  beforeDestroy () {
    this.clearActiveAttributeType()
    this.setShowAdvanced(false)
  },
  computed: {
    ...mapGetters(SEARCH, {
      searchHash: GET_SEARCH_HASH
    }),
    ...mapGetters(SEARCH_RESULTS, {
      hasSearchResults: HAS_SEARCH_RESULTS
    }),
    searchWasMade () {
      return this.hasSearchResults || _.get(this.$route, 'query.key.length', 0) > 0
    }
  },
  methods: {
    ...mapActions(SEARCH, {
      doSearchFromKey: DO_SEARCH_FROM_KEY
    }),
    ...mapMutations(SEARCH, {
      clearActiveAttributeType: CLEAR_ACTIVE_ATTRIBUTE_TYPE,
      setShowAdvanced: SET_SHOW_ADVANCED
    }),
    ...mapActions(CUSTOM_DATA_ADMIN, {
      fetchCustomDataFields: FETCH_CUSTOM_DATA_FIELDS
    })
  }
}
</script>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables.less';
@import (reference) '~src/styles/_mixins.less';

@appHeaderHeight: 40px;
@formHeaderHeight: 83px;
@sortingToolsHeight: 50px;
@rightColumnWidth: 200px;
@leftColumnWidth: 180px;
@fancyTransition: all 400ms ease-in-out;

.search {
  .flex-container-column();
  .min-max-height(calc(100vh - @appHeaderHeight));
  .min-max-width(calc(100vw - @leftColumnWidth));

  .search-form-wrapper {
    .min-max-height(calc(100vh - @appHeaderHeight));
    .min-max-width(100%);
    .flex-container-center();
    .align-items-start();
    background-color: @color-tone-light;
    border-bottom: 1px solid @color-tone-lighter;
    overflow: visible;
    transition: @fancyTransition;
    z-index: 2;
    .search-form {
      z-index: 50;
    }
    .save-search {
      margin: 22px 0 0 10px;
    }
    &.has-results { // when there are no search results
      .min-max-height(@formHeaderHeight); // when there are search results
      align-items: flex-start;
      .search-form {
        margin-top: 12px;
      }
    }
  }

  .search-results-wrapper {
    .min-max-height(0); // when there are no search results
    .min-max-width(100%);
    background-color: @color-base;
    transition: @fancyTransition;
    &.has-results { // when there are search results
      .min-max-height(calc(100vh - @appHeaderHeight - @formHeaderHeight));
    }
  }
}
</style>
